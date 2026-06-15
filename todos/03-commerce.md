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
- [ ] `applyCoupon(cartId, code)` — validate and apply discount code
- [ ] `removeCoupon(cartId)` — remove applied coupon
- [x] `OrderService`: `createOrderFromCart`, `calculateOrderTotals`, `getMyOrders`, `getOrderDetails`
- [x] `OrderActionService`: `cancelOrder` (stock rollback), `requestReturn`
- [x] `updateOrderStatus(orderId, statusId)` — with state machine validation
- [x] `generateInvoicePDF(orderId)`
- [x] `addOrderNote(orderId, note, isInternal)`

### Advanced Robustness

- [ ] **Idempotency** on `createOrder`
- [ ] **Soft stock lock** — temporary reservation during checkout (Redis)
- [ ] **Abandoned cart recovery** — BullMQ scheduler
- [ ] **Payment webhooks** — Stripe / PayPal / MVola / AirtelMoney
- [ ] **PDF invoice generation** — Puppeteer / PDFKit
- [ ] **Strict order state machine** — prevent illegal transitions
- [ ] **Multi-address checkout**
- [ ] **Guest checkout**
- [ ] **Re-order** — one-click re-add past order to cart
- [ ] **Order export** — CSV/XLSX

---

## 🚚 Delivery & Shipping System

- [ ] `Carrier` — shipping carrier definition
- [ ] `ShippingZone` — geographic zone
- [ ] `ShippingRate` — rate per carrier/zone/weight range
- [ ] `ShipmentEvent` — tracking event log
- [ ] `DeliverySlot` — time-slot delivery option
- [ ] `PickupPoint` — relay/pickup point locations
- [ ] **Carrier Adapters**: Colissimo, DHL, FedEx, Local Madagascar (Sodiat, Espace Logistique)
- [ ] `ShippingCalculationService`: `getAvailableCarriers`, `calculateShippingCost`
- [ ] `ShipmentService`: `createShipment`, `updateShipmentStatus`, `syncTrackingFromCarrier`

---

## 💳 Payment Gateways

- [ ] `Payment` — unified payment record
- [ ] `Refund` — refund record linked to `Payment`
- [ ] `MvolaTransaction` — MVola-specific fields
- [ ] `AirtelTransaction` — AirtelMoney-specific fields
- [ ] **Payment Adapters**: MVola, AirtelMoney, Stripe, PayPal, COD, Manual
- [ ] `PaymentService` (orchestrator): `initiatePayment`, `verifyPayment`, `processRefund`
- [ ] **Security**: HMAC signature verification, Webhook replay protection
