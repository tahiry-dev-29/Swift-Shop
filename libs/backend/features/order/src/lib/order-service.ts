import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@dima-new/data-access-prisma';
import { CartService } from '@dima-new/backend/cart';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService
  ) {}

    private generateReference(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `DO-${date}-${random}`;
  }

  /**
   * Create an order from a cart
   */
  async createOrderFromCart(
    cartId: string, 
    customerId: string,
    deliveryAddressId: string, 
    billingAddressId?: string
  ) {
    // 1. Get Cart with calculated totals
    const cart = await this.cartService.getCartWithTotals(cartId);
    
    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    if (cart.customerId !== customerId) {
       throw new BadRequestException('Cart does not belong to this customer');
    }

    
    const deliveryAddress = await this.prisma.address.findUnique({ where: { id: deliveryAddressId } });
    const billingAddress = billingAddressId 
      ? await this.prisma.address.findUnique({ where: { id: billingAddressId } })
      : deliveryAddress;

    if (!deliveryAddress || !billingAddress) {
      throw new NotFoundException('Address not found');
    }

    
    let state = await this.prisma.orderState.findUnique({ where: { name: 'PENDING' } });
    if (!state) {
        
        state = await this.prisma.orderState.create({ 
            data: { name: 'PENDING', color: '#fbbf24', position: 0 } 
        });
    }

    
    
    return this.prisma.$transaction(async (tx) => {
        
        
        const order = await tx.order.create({
            data: {
                reference: this.generateReference(),
                customerId,
                stateId: state.id,
                totalHT: cart.totalHT ?? 0,
                totalTax: cart.totalTax ?? 0,
                totalTTC: cart.totalTTC ?? 0,
            },
            include: { state: true }
        });

        await tx.orderAddress.create({
            data: {
                orderId: order.id,
                type: 'delivery',
                firstname: deliveryAddress.firstname,
                lastname: deliveryAddress.lastname,
                company: deliveryAddress.company,
                address1: deliveryAddress.address1,
                address2: deliveryAddress.address2,
                postcode: deliveryAddress.postcode,
                city: deliveryAddress.city,
                country: deliveryAddress.countryId, 
                phone: deliveryAddress.phone || deliveryAddress.phoneMobile,
            } 
        });

        await tx.orderAddress.create({
            data: {
                orderId: order.id,
                type: 'billing',
                firstname: billingAddress.firstname,
                lastname: billingAddress.lastname,
                company: billingAddress.company,
                address1: billingAddress.address1,
                address2: billingAddress.address2,
                postcode: billingAddress.postcode,
                city: billingAddress.city,
                country: billingAddress.countryId, 
                phone: billingAddress.phone || billingAddress.phoneMobile,
            } 
        });
        
        
        
        
        
        
        
        for (const item of cart.items) {
             const priceDetail = item.priceDetail;
             const unitHT = priceDetail ? priceDetail.priceHT : item.product.price; 
             const taxRate = priceDetail ? priceDetail.taxRate : 0;
             const lineHT = priceDetail ? Number(priceDetail.priceHT) * item.quantity : Number(item.product.price) * item.quantity;
             const lineTTC = priceDetail ? Number(priceDetail.priceTTC) * item.quantity : Number(item.product.price) * item.quantity;

             await tx.orderItem.create({
                 data: {
                     orderId: order.id,
                     productId: item.productId,
                     combinationId: item.combinationId || null,
                     productName: item.product.name,
                     productRef: item.combination?.reference || `REF-${item.product.id.substring(0,8)}`, 
                     quantity: item.quantity,
                     unitPriceHT: Number(unitHT || 0),
                     taxRate: Number(taxRate || 0),
                     totalHT: lineHT,
                     totalTTC: lineTTC
                 }
             });

             
             const stock = item.combination?.stock || item.product.stock;
             if (stock) {
                 await tx.stock.update({
                     where: { id: stock.id },
                     data: { quantity: { decrement: item.quantity } }
                 });
             }
        }
        
        
        await tx.cartItem.deleteMany({ where: { cartId } });
        
        
        

        return order;
    });
  }

  
  

  async getMyOrders(customerId: string) {
      return this.prisma.order.findMany({
          where: { customerId },
          include: { 
              state: true, 
              items: true,
              addresses: true
          },
          orderBy: { dateAdd: 'desc' }
      });
  }
  
  async getOrder(orderId: string, customerId?: string) {
      const order = await this.prisma.order.findUnique({
          where: { id: orderId },
          include: {
              customer: true,
              state: true,
              items: true,
              addresses: true
          }
      });
      
      if (!order) throw new NotFoundException('Order not found');
      if (customerId && order.customerId !== customerId) {
          throw new NotFoundException('Order not found'); 
      }
      
      return order;
  }
  
  async getOrderStates() {
      return this.prisma.orderState.findMany({ orderBy: { position: 'asc' } });
  }
}
