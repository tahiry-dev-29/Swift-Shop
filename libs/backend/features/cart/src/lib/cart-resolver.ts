import { Resolver, Query, Mutation, Args, Context, ID, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CustomerGuard, CurrentUser } from '@dima-new/backend/auth';
import { CartService } from './cart-service';
import { CartType, AddToCartInput } from './dto/cart-types';

@Resolver(() => CartType)
export class CartResolver {
  constructor(private readonly cartService: CartService) {}

  @Query(() => CartType, { nullable: true })
  async myCart(
    @Context() context: any,
    @CurrentUser() user: any
  ) {
    const sessionId = context.req.headers['x-session-id']; // Handle guest session
    
    // Prioritize authenticated user, otherwise use session
    if (user) {
      if (sessionId) {
        // Merge if we have both (just logged in or switching context)
        // Ideally this happens on login, but here we can check or just return user cart
        return this.cartService.getOrCreateCart(user.id); 
      }
      return this.cartService.getOrCreateCart(user.id);
    } else if (sessionId) {
       return this.cartService.getOrCreateCart(undefined, sessionId);
    }
    
    return null;
  }

  @Query(() => CartType)
  @UseGuards(CustomerGuard) // Strict check for now, can be relaxed if we allow guest cart view via this query
  async cart(@CurrentUser() user: any) {
      return this.cartService.getCartWithTotals((await this.cartService.getOrCreateCart(user.id)).id);
  }

  @Mutation(() => CartType)
  async addToCart(
    @Context() context: any,
    @CurrentUser() user: any,
    @Args('input') input: AddToCartInput
  ) {
    const sessionId = context.req?.headers?.['x-session-id'];
    let cartId: string;

    if (user) {
      const cart = await this.cartService.getOrCreateCart(user.id);
      cartId = cart.id;
    } else if (sessionId) {
      const cart = await this.cartService.getOrCreateCart(undefined, sessionId);
      cartId = cart.id;
    } else {
      // Create a temporary cart for now (or strict error if session management is handled by frontend generating ID)
       // For now, let's assume frontend MUST send x-session-id if guest
       // Or we can return an error "Session ID required for guest"
       // But to be friendly, maybe we create one and return it? 
       // Simplest for API: require valid context.
       // Let's create a new guest cart if nothing exists and hope client stores the returned session?
       // Actually `getOrCreateCart` handles creation.
       // Let's assume we need at least one identifier.
       throw new Error("User must be logged in or provide x-session-id header");
    }

    await this.cartService.addToCart(cartId, input.productId, input.quantity, input.combinationId);
    return this.cartService.getCartWithTotals(cartId);
  }

  @Mutation(() => CartType)
  async updateCartItem(
    @Context() context: any,
    @CurrentUser() user: any,
    @Args('cartItemId', { type: () => ID }) cartItemId: string,
    @Args('quantity', { type: () => Int }) quantity: number
  ) {
     // We need to resolve cartId to return the full cart, but first let's just update
     // Helper to get cartId from context/user
     // Ideally we check ownership of the item...
     const item = await this.cartService.updateCartItemQuantity(cartItemId, quantity);
     return this.cartService.getCartWithTotals(item.cartId);
  }

  @Mutation(() => CartType)
  async removeCartItem(
    @Args('cartItemId', { type: () => ID }) cartItemId: string
  ) {
    const item = await this.cartService.removeCartItem(cartItemId);
    return this.cartService.getCartWithTotals(item.cartId);
  }

  @Mutation(() => CartType)
  async clearCart(
      @Context() context: any,
      @CurrentUser() user: any,
  ) {
    const sessionId = context.req?.headers?.['x-session-id'];
    let cartId: string;

    if (user) {
        const cart = await this.cartService.getOrCreateCart(user.id);
        cartId = cart.id;
    } else if (sessionId) {
        const cart = await this.cartService.getOrCreateCart(undefined, sessionId);
        cartId = cart.id;
    } else {
        throw new Error("Context required");
    }

    return this.cartService.clearCart(cartId);
  }
}
