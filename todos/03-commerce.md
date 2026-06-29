# 🛒 COMMERCE, SHIPPING & PAYMENT

---

## 🛒 Cart & Orders

### Prisma Models

- [x] `Cart` — cart linked to Customer or guest session
- [x] `CartItem` — cart lines
- [x] `Order` — validated order (`reference` format: `DO-YYYYMMDD-XXXXX`)
- [x] `OrderItem` — order lines
- [x] `OrderAddress` — shipping/billing address snapshot
- [x] `OrderState` — order states (Pending, Processing, Shipped, etc.)
- [x] `Shipment` — tracking number, carrier
- [x] `Return` / `ReturnItem` — RMA flow
- [x] `Invoice` — linked PDF storage reference
- [x] `OrderNote` — internal and customer-visible notes
- [x] `OrderHistory` — state change log

### Backend Services

- [x] `CartService`: `getOrCreateCart`, `addToCart`, `updateQuantity`, `removeFromCart`, `getCartWithTotals`, `clearCart`
- [x] `CartMergeService`: `mergeGuestCart(sessionId, customerId)`
- [x] `applyCoupon(cartId, code)` — validate and apply discount code
- [x] `removeCoupon(cartId)` — remove applied coupon
- [x] `OrderService`: `createOrderFromCart`, `calculateOrderTotals`, `getMyOrders`, `getOrderDetails`
- [x] `OrderActionService`: `cancelOrder` (stock rollback), `requestReturn`
- [x] `updateOrderStatus(orderId, statusId)` — with state machine validation
- [x] `generateInvoicePDF(orderId)`
- [x] `addOrderNote(orderId, note, isInternal)`

### Advanced Robustness

- [x] **Idempotency** on `createOrder`
- [x] **Soft stock lock** — temporary reservation during checkout (Redis)
- [x] **Abandoned cart recovery** — Nest scheduler with Redis dedup queue
- [x] **Payment webhooks** — Stripe / PayPal / MVola / AirtelMoney
- [x] **PDF invoice generation** — local PDF writer
- [x] **Strict order state machine** — prevent illegal transitions
- [x] **Multi-address checkout**
- [x] **Guest checkout**
- [x] **Re-order** — one-click re-add past order to cart
- [x] **Order export** — CSV/XLSX

---

## 🚚 Delivery & Shipping System

- [x] `Carrier` — shipping carrier definition
- [x] `ShippingZone` — geographic zone
- [x] `ShippingRate` — rate per carrier/zone/weight range
- [x] `ShipmentEvent` — tracking event log
- [x] `DeliverySlot` — time-slot delivery option
- [x] `PickupPoint` — relay/pickup point locations
- [x] **Carrier Adapters**: Colissimo, DHL, FedEx, Local Madagascar (Sodiat, Espace Logistique)
- [x] `ShippingCalculationService`: `getAvailableCarriers`, `calculateShippingCost`
- [x] `ShipmentService`: `createShipment`, `updateShipmentStatus`, `syncTrackingFromCarrier`

---

## 💳 Payment Gateways

- [x] `Payment` — unified payment record
- [x] `Refund` — refund record linked to `Payment`
- [x] `MvolaTransaction` — MVola-specific fields
- [x] `AirtelTransaction` — AirtelMoney-specific fields
- [x] **Payment Adapters**: MVola, AirtelMoney, Stripe, PayPal, COD, Manual
- [x] `PaymentService` (orchestrator): `initiatePayment`, `verifyPayment`, `processRefund`
- [x] **Security**: HMAC signature verification, Webhook replay protection
