import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { CartService } from '@swift-shop/backend/cart';
import { randomUUID } from 'crypto';

export type GuestCheckoutData = {
  cartId: string;
  email: string;
  firstname: string;
  lastname: string;
};

/**
 * Prepares guest checkout by creating a guest customer and attaching the cart.
 */
@Injectable()
export class GuestCheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
  ) {}

  async prepareGuestCheckout(data: GuestCheckoutData) {
    const customer = await this.getOrCreateGuestCustomer(
      data.email,
      data.firstname,
      data.lastname,
    );
    const cartId = await this.attachCartToCustomer(data.cartId, customer.id);

    return { cartId, customerId: customer.id };
  }

  private async getOrCreateGuestCustomer(
    email: string,
    firstname: string,
    lastname: string,
  ) {
    const group = await this.prisma.customerGroup.findFirst({
      orderBy: { name: 'asc' },
    });
    if (!group) {
      throw new BadRequestException('Default customer group is missing');
    }

    try {
      return await this.prisma.customer.create({
        data: {
          email,
          firstname,
          lastname,
          password: `guest:${randomUUID()}`,
          isGuest: true,
          groupId: group.id,
        },
      });
    } catch (e: unknown) {
      if (
        typeof e === 'object' &&
        e !== null &&
        'code' in e &&
        (e as { code: string }).code === 'P2002'
      ) {
        const existingCustomer = await this.prisma.customer.findUnique({
          where: { email },
        });
        if (existingCustomer) {
          return existingCustomer;
        }
      }
      throw e;
    }
  }

  private async attachCartToCustomer(cartId: string, customerId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      include: { items: true },
    });
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }
    if (cart.customerId === customerId) {
      return cart.id;
    }

    const customerCart = await this.prisma.cart.findUnique({
      where: { customerId },
    });
    if (customerCart && customerCart.id !== cart.id) {
      for (const item of cart.items) {
        await this.cartService.addToCart(
          customerCart.id,
          item.productId,
          item.quantity,
          item.combinationId ?? undefined,
        );
      }
      await this.prisma.cart.delete({ where: { id: cart.id } });
      return customerCart.id;
    }

    await this.prisma.cart.update({
      where: { id: cart.id },
      data: { customerId },
    });
    return cart.id;
  }
}
