import {
  Resolver,
  Query,
  Mutation,
  Args,
  Context,
  ID,
  Int,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import {
  CustomerGuard,
  CurrentUser,
  OptionalCustomerGuard,
} from '@dima-new/backend/auth';
import { CartService } from './cart-service';
import { ApplyCouponInput, CartType, AddToCartInput } from './dto/cart-types';

interface CurrentUserType {
  id: string;
}

interface GraphQLContext {
  req: {
    headers: Record<string, string | string[] | undefined>;
  };
}

@Resolver(() => CartType)
export class CartResolver {
  constructor(private readonly cartService: CartService) {}

  @Query(() => CartType, { nullable: true })
  @UseGuards(OptionalCustomerGuard)
  async myCart(
    @Context() context: GraphQLContext,
    @CurrentUser() user: CurrentUserType | null,
  ) {
    const sessionId = context.req.headers['x-session-id'];

    let cartId: string | undefined;

    if (user) {
      if (sessionId) {
        await this.cartService.mergeGuestCart(
          Array.isArray(sessionId) ? sessionId[0] : sessionId,
          user.id,
        );
      }
      const cart = await this.cartService.getOrCreateCart(user.id);
      cartId = cart.id;
    } else if (sessionId) {
      const cart = await this.cartService.getOrCreateCart(
        undefined,
        Array.isArray(sessionId) ? sessionId[0] : sessionId,
      );
      cartId = cart.id;
    }

    if (cartId) {
      return this.cartService.getCartWithTotals(cartId);
    }

    return null;
  }

  @Query(() => CartType)
  @UseGuards(CustomerGuard)
  async cart(@CurrentUser() user: CurrentUserType) {
    return this.cartService.getCartWithTotals(
      (await this.cartService.getOrCreateCart(user.id)).id,
    );
  }

  @Mutation(() => CartType)
  @UseGuards(OptionalCustomerGuard)
  async addToCart(
    @Context() context: GraphQLContext,
    @CurrentUser() user: CurrentUserType | null,
    @Args('input') input: AddToCartInput,
  ) {
    const sessionId = context.req?.headers?.['x-session-id'];
    let cartId: string;

    if (user) {
      const cart = await this.cartService.getOrCreateCart(user.id);
      cartId = cart.id;
    } else if (sessionId) {
      const cart = await this.cartService.getOrCreateCart(
        undefined,
        Array.isArray(sessionId) ? sessionId[0] : sessionId,
      );
      cartId = cart.id;
    } else {
      throw new Error('User must be logged in or provide x-session-id header');
    }

    await this.cartService.addToCart(
      cartId,
      input.productId,
      input.quantity,
      input.combinationId,
    );
    return this.cartService.getCartWithTotals(cartId);
  }

  @Mutation(() => CartType)
  @UseGuards(OptionalCustomerGuard)
  async updateCartItem(
    @Args('cartItemId', { type: () => ID }) cartItemId: string,
    @Args('quantity', { type: () => Int }) quantity: number,
  ) {
    const item = await this.cartService.updateCartItemQuantity(
      cartItemId,
      quantity,
    );
    return this.cartService.getCartWithTotals(item.cartId);
  }

  @Mutation(() => CartType)
  @UseGuards(OptionalCustomerGuard)
  async removeCartItem(
    @Args('cartItemId', { type: () => ID }) cartItemId: string,
  ) {
    const item = await this.cartService.removeCartItem(cartItemId);
    return this.cartService.getCartWithTotals(item.cartId);
  }

  @Mutation(() => CartType)
  @UseGuards(OptionalCustomerGuard)
  async clearCart(
    @Context() context: GraphQLContext,
    @CurrentUser() user: CurrentUserType | null,
  ) {
    const sessionId = context.req?.headers?.['x-session-id'];
    let cartId: string;

    if (user) {
      const cart = await this.cartService.getOrCreateCart(user.id);
      cartId = cart.id;
    } else if (sessionId) {
      const cart = await this.cartService.getOrCreateCart(
        undefined,
        Array.isArray(sessionId) ? sessionId[0] : sessionId,
      );
      cartId = cart.id;
    } else {
      throw new Error('Context required');
    }

    await this.cartService.clearCart(cartId);
    return this.cartService.getCartWithTotals(cartId);
  }

  @Mutation(() => CartType)
  @UseGuards(OptionalCustomerGuard)
  async applyCoupon(@Args('input') input: ApplyCouponInput) {
    return this.cartService.applyCoupon(input.cartId, input.code);
  }

  @Mutation(() => CartType)
  @UseGuards(OptionalCustomerGuard)
  async removeCoupon(@Args('cartId', { type: () => ID }) cartId: string) {
    return this.cartService.removeCoupon(cartId);
  }
}
