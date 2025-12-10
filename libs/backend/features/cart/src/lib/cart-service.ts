import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@dima-new/data-access-prisma';
import { PriceCalculationService } from '@dima-new/backend/pricing';

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly priceService: PriceCalculationService
  ) {}

  /**
   * Get or create a cart for a customer or guest session
   */
  async getOrCreateCart(customerId?: string, sessionId?: string) {
    if (!customerId && !sessionId) {
      throw new BadRequestException('Either customerId or sessionId is required');
    }

    // Try to find existing cart
    let cart = await this.prisma.cart.findFirst({
      where: customerId ? { customerId } : { sessionId },
      include: {
        items: {
          include: {
            product: true,
            combination: true,
          },
        },
      },
    });

    // Create if not exists
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: customerId ? { customerId } : { sessionId },
        include: {
          items: {
            include: {
              product: true,
              combination: true,
            },
          },
        },
      });
    }

    return cart;
  }

  /**
   * Add product to cart (or increment quantity if exists)
   */
  async addToCart(
    cartId: string,
    productId: string,
    quantity: number = 1,
    combinationId?: string
  ) {
    // Validate product & combination
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { stock: true, combinations: { include: { stock: true } } },
    });

    if (!product || !product.active) {
      throw new NotFoundException('Product not found or not available');
    }

    // Check if combination is required
    if (product.combinations.length > 0 && !combinationId) {
      throw new BadRequestException('This product requires a combination selection');
    }

    // Validate combination
    let combination = null;
    if (combinationId) {
      combination = product.combinations.find(c => c.id === combinationId);
      if (!combination) {
        throw new NotFoundException('Combination not found');
      }
    }

    // Check stock availability
    const stock = combination?.stock || product.stock;
    if (stock && stock.outOfStockBehavior === 'deny' && stock.quantity < quantity) {
      throw new BadRequestException(`Only ${stock.quantity} items available in stock`);
    }

    // Check if item already exists in cart
    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        cartId,
        productId,
        combinationId: combinationId || null,
      },
    });

    if (existingItem) {
      // Update quantity
      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
        include: { product: true, combination: true },
      });
    }

    // Create new cart item
    return this.prisma.cartItem.create({
      data: {
        cartId,
        productId,
        combinationId,
        quantity,
      },
      include: { product: true, combination: true },
    });
  }

  /**
   * Update cart item quantity
   */
  async updateCartItemQuantity(cartItemId: string, quantity: number) {
    if (quantity < 1) {
      throw new BadRequestException('Quantity must be at least 1');
    }

    const item = await this.prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { product: { include: { stock: true } }, combination: { include: { stock: true } } },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    // Check stock
    const stock = item.combination?.stock || item.product.stock;
    if (stock && stock.outOfStockBehavior === 'deny' && stock.quantity < quantity) {
      throw new BadRequestException(`Only ${stock.quantity} items available in stock`);
    }

    return this.prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
      include: { product: true, combination: true },
    });
  }

  /**
   * Remove item from cart
   */
  async removeCartItem(cartItemId: string) {
    const item = await this.prisma.cartItem.findUnique({ where: { id: cartItemId } });
    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    return this.prisma.cartItem.delete({
      where: { id: cartItemId },
      include: { product: true, combination: true },
    });
  }

  /**
   * Clear entire cart
   */
  async clearCart(cartId: string) {
    await this.prisma.cartItem.deleteMany({ where: { cartId } });
    return this.prisma.cart.findUnique({
      where: { id: cartId },
      include: { items: true },
    });
  }

  /**
   * Get cart with calculated totals
   */
  async getCartWithTotals(cartId: string, countryId?: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: {
            product: true,
            combination: true,
          },
        },
        customer: { include: { country: true, group: true } },
      },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    // Get country for tax calculation
    const taxCountryId = countryId || cart.customer?.countryId;
    
    // Default country if none specified
    const defaultCountry = await this.prisma.country.findFirst({
      where: { isoCode: 'FR' },
    });
    const finalCountryId = taxCountryId || defaultCountry?.id;

    // Calculate prices for each item
    const itemsWithPrices = await Promise.all(
      cart.items.map(async item => {
        let priceDetail = null;
        
        if (finalCountryId) {
          priceDetail = await this.priceService.calculatePrice({
            productId: item.productId,
            countryId: finalCountryId,
            combinationId: item.combinationId || undefined,
            customerId: cart.customerId || undefined,
            quantity: item.quantity,
          });
        }

        return {
          ...item,
          priceDetail,
          lineTotal: priceDetail 
            ? Number(priceDetail.priceTTC) * item.quantity 
            : Number(item.product.price) * item.quantity,
        };
      })
    );

    // Calculate totals
    const totalHT = itemsWithPrices.reduce((sum, item) => 
      sum + (item.priceDetail ? Number(item.priceDetail.priceHT) * item.quantity : 0), 0);
    const totalTax = itemsWithPrices.reduce((sum, item) => 
      sum + (item.priceDetail ? Number(item.priceDetail.taxAmount) * item.quantity : 0), 0);
    const totalTTC = itemsWithPrices.reduce((sum, item) => 
      sum + (item.priceDetail ? Number(item.priceDetail.priceTTC) * item.quantity : 0), 0);

    return {
      ...cart,
      items: itemsWithPrices,
      totalHT,
      totalTax,
      totalTTC,
      itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    };
  }

  /**
   * Merge guest cart into customer cart on login
   */
  async mergeGuestCart(sessionId: string, customerId: string) {
    const guestCart = await this.prisma.cart.findUnique({
      where: { sessionId },
      include: { items: true },
    });

    if (!guestCart || guestCart.items.length === 0) {
      return this.getOrCreateCart(customerId);
    }

    // Get or create customer cart
    let customerCart = await this.prisma.cart.findUnique({
      where: { customerId },
    });

    if (!customerCart) {
      // Convert guest cart to customer cart
      return this.prisma.cart.update({
        where: { id: guestCart.id },
        data: { customerId, sessionId: null },
        include: { items: { include: { product: true, combination: true } } },
      });
    }

    // Merge items
    for (const item of guestCart.items) {
      const existing = await this.prisma.cartItem.findFirst({
        where: {
          cartId: customerCart.id,
          productId: item.productId,
          combinationId: item.combinationId,
        },
      });

      if (existing) {
        await this.prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + item.quantity },
        });
      } else {
        await this.prisma.cartItem.create({
          data: {
            cartId: customerCart.id,
            productId: item.productId,
            combinationId: item.combinationId,
            quantity: item.quantity,
          },
        });
      }
    }

    // Delete guest cart
    await this.prisma.cart.delete({ where: { id: guestCart.id } });

    return this.prisma.cart.findUnique({
      where: { id: customerCart.id },
      include: { items: { include: { product: true, combination: true } } },
    });
  }
}
