import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { CartResolver } from './cart-resolver';
import { CartService } from './cart-service';

describe('CartResolver (Integration / Unit)', () => {
  let resolver: CartResolver;
  let cartService: Mocked<CartService>;

  const mockCart = {
    id: 'cart-1',
    items: [],
    totals: { subtotal: 0, tax: 0, total: 0 },
  };

  beforeEach(() => {
    cartService = {
      mergeGuestCart: vi.fn(),
      getOrCreateCart: vi.fn(),
      getCartWithTotals: vi.fn(),
      addToCart: vi.fn(),
      updateCartItemQuantity: vi.fn(),
      removeCartItem: vi.fn(),
      clearCart: vi.fn(),
      applyCoupon: vi.fn(),
      removeCoupon: vi.fn(),
      reserveStock: vi.fn(),
    } as any;

    resolver = new CartResolver(cartService);
  });

  describe('myCart query', () => {
    it('should return cart with totals for logged in user', async () => {
      cartService.getOrCreateCart.mockResolvedValue({ id: 'cart-1' } as any);
      cartService.getCartWithTotals.mockResolvedValue(mockCart as any);

      const ctx = { req: { headers: {} } };
      const res = await resolver.myCart(ctx as any, { id: 'user-1' });

      expect(cartService.getOrCreateCart).toHaveBeenCalledWith('user-1');
      expect(cartService.getCartWithTotals).toHaveBeenCalledWith('cart-1');
      expect(res).toEqual(mockCart);
    });

    it('should merge guest cart if session id header is present for logged in user', async () => {
      cartService.getOrCreateCart.mockResolvedValue({ id: 'cart-1' } as any);
      cartService.getCartWithTotals.mockResolvedValue(mockCart as any);

      const ctx = { req: { headers: { 'x-session-id': 'sess-123' } } };
      await resolver.myCart(ctx as any, { id: 'user-1' });

      expect(cartService.mergeGuestCart).toHaveBeenCalledWith(
        'sess-123',
        'user-1',
      );
    });

    it('should return guest cart if unauthenticated but session header present', async () => {
      cartService.getOrCreateCart.mockResolvedValue({
        id: 'cart-guest',
      } as any);
      cartService.getCartWithTotals.mockResolvedValue({
        ...mockCart,
        id: 'cart-guest',
      } as any);

      const ctx = { req: { headers: { 'x-session-id': 'sess-123' } } };
      const res = await resolver.myCart(ctx as any, null);

      expect(cartService.getOrCreateCart).toHaveBeenCalledWith(
        undefined,
        'sess-123',
      );
      expect(res.id).toBe('cart-guest');
    });
  });

  describe('addToCart mutation', () => {
    it('should add product item to cart and return updated totals', async () => {
      cartService.getOrCreateCart.mockResolvedValue({ id: 'cart-1' } as any);
      cartService.getCartWithTotals.mockResolvedValue(mockCart as any);

      const ctx = { req: { headers: {} } };
      const input = {
        productId: 'prod-1',
        quantity: 2,
        combinationId: 'combo-1',
      };

      const res = await resolver.addToCart(ctx as any, { id: 'user-1' }, input);
      expect(cartService.addToCart).toHaveBeenCalledWith(
        'cart-1',
        'prod-1',
        2,
        'combo-1',
      );
      expect(res).toEqual(mockCart);
    });
  });

  describe('updateCartItem & removeCartItem & clearCart mutations', () => {
    it('should update cart item quantity', async () => {
      cartService.updateCartItemQuantity.mockResolvedValue({
        id: 'item-1',
        cartId: 'cart-1',
      } as any);
      cartService.getCartWithTotals.mockResolvedValue(mockCart as any);

      const res = await resolver.updateCartItem('item-1', 5);
      expect(cartService.updateCartItemQuantity).toHaveBeenCalledWith(
        'item-1',
        5,
      );
      expect(res).toEqual(mockCart);
    });

    it('should remove cart item', async () => {
      cartService.removeCartItem.mockResolvedValue({
        id: 'item-1',
        cartId: 'cart-1',
      } as any);
      cartService.getCartWithTotals.mockResolvedValue(mockCart as any);

      const res = await resolver.removeCartItem('item-1');
      expect(cartService.removeCartItem).toHaveBeenCalledWith('item-1');
      expect(res).toEqual(mockCart);
    });

    it('should clear cart', async () => {
      cartService.getOrCreateCart.mockResolvedValue({ id: 'cart-1' } as any);
      cartService.getCartWithTotals.mockResolvedValue(mockCart as any);

      const ctx = { req: { headers: {} } };
      const res = await resolver.clearCart(ctx as any, { id: 'user-1' });
      expect(cartService.clearCart).toHaveBeenCalledWith('cart-1');
      expect(res).toEqual(mockCart);
    });
  });

  describe('applyCoupon & removeCoupon & reserveCartStock mutations', () => {
    it('should apply and remove coupon from cart', async () => {
      cartService.applyCoupon.mockResolvedValue(mockCart as any);
      cartService.removeCoupon.mockResolvedValue(mockCart as any);

      await resolver.applyCoupon({ cartId: 'cart-1', code: 'PROMO10' });
      expect(cartService.applyCoupon).toHaveBeenCalledWith('cart-1', 'PROMO10');

      await resolver.removeCoupon('cart-1');
      expect(cartService.removeCoupon).toHaveBeenCalledWith('cart-1');
    });

    it('should reserve stock for cart items', async () => {
      const reservation = { cartId: 'cart-1', expiresAt: new Date() };
      cartService.reserveStock.mockResolvedValue(reservation as any);

      const res = await resolver.reserveCartStock('cart-1');
      expect(cartService.reserveStock).toHaveBeenCalledWith('cart-1');
      expect(res).toEqual(reservation);
    });
  });
});
