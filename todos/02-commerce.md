# 🛒 COMMERCE — Catalog, Products, Cart, Orders, Shipping & Payment

---

## 📂 Catalog — Categories & Features

- [x] Prisma model `Category` (hierarchy via `parentId`)
- [x] Prisma models `Feature` + `FeatureValue`
- [x] Prisma models `AttributeGroup` + `AttributeValue`
- [x] CRUD Service `CategoryService` (with parent/child tree management)
- [x] CRUD Service `FeatureService`
- [x] CRUD Service `AttributeService`
- [x] Admin endpoints to manage categories and attributes

### 📂 Catalog — Advanced Robustness

- [x] **Cursor Pagination** (Relay-style) for large category trees
- [x] **Redis cache** on `categories` and `features` queries
- [x] **N+1 queries optimization** via GraphQL DataLoader
- [x] **Nested Set / Materialized Path** for ultra-fast hierarchical category reads
- [x] **Slug auto-generation** + uniqueness enforcement
- [x] **Soft Delete** on categories
- [x] **Category position drag-and-drop**
- [x] **Category SEO fields** — `metaTitle`, `metaDescription`, `metaKeywords`
- [x] **Category image** — upload with auto-resize

---

## 📦 Products Core

- [x] Prisma model `Product` (base fields + dimensions)
- [x] Prisma model `ProductCombination` (variants with `priceImpact`, `weightImpact`)
- [x] Prisma model `Stock` (linked to product OR combination)
- [x] Prisma model `ProductImage` (media management)
- [x] DTO `CreateProductInput` (complex info)
- [x] Service `ProductService`: simple product creation
- [x] Service `ProductService`: combination management
- [x] Service `ProductService`: stock management (`updateStock`, `incrementStock`, `decrementStock`)
- [x] GraphQL Endpoint: `products` (filters and pagination)
- [x] GraphQL Endpoint: `product(id)`
- [x] GraphQL Endpoint: full CRUD for Products, Images, Combinations, Stock

### 📦 Products Core — Advanced Robustness

- [x] **MeiliSearch / Elasticsearch** integration
- [x] **Image processing pipeline**: automatic resizing + WebP/AVIF
- [x] **Price history auditing**
- [x] **Product duplication** endpoint
- [x] **Bulk import/export** — CSV/XLSX
- [x] **Low stock alerts**
- [x] **Virtual & Downloadable products**
- [x] **Product bundles**
- [x] **Related products**
- [x] **Product reviews & ratings**
- [x] **Product labels**
- [x] **SEO fields** — `metaTitle`, `metaDescription`, `canonicalUrl`

---

## 💰 Pricing Engine

- [x] Prisma model `SpecificPrice` (discount rules)
- [x] Prisma model `TaxRule` (VAT by country) + `Country`
- [x] Service `PriceCalculationService`
  - [x] Logic: Base Price + Combination impact
  - [x] Logic: CustomerGroup discount application
  - [x] Logic: `SpecificPrice` lookup (Date, Quantity, Country)
  - [x] Logic: Tax-inclusive calculation
- [x] GraphQL Query `calculatePrice` (returns `priceHT`, `taxAmount`, `priceTTC`)
- [x] CRUD SpecificPrice (Create, Update, Delete)

### 💰 Pricing Engine — Advanced Robustnes

- [x] **Tiered pricing** — price breaks by quantity
- [x] **Coupon / Voucher system** — discount codes
- [x] **Flash sales** — time-limited deals
- [x] **Currency support** — multi-currency with FX rate sync
- [x] **B2B pricing** — hidden prices for guests
- [x] **Price rounding rules**
- [x] **Loyalty points**
- [x] **Bundle pricing**

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

---

## 🧪 Tests — Commerce

gwt-new ../commerce-tests feat/commerce-tests

### Category — Unit Tests

- [ ] `CategoryService` — create (materialized path), find tree, soft delete, reorder
- [ ] `CategoryCacheService` — cache hit/miss/invalidation on write
- [ ] Slug generation — auto-slug, uniqueness enforcement, manual override
- [ ] Cursor pagination — Relay-style, forward, backward

### Feature & Attribute — Unit Tests

- [ ] `FeatureService` — CRUD, Redis cache invalidation
- [ ] `AttributeService` — CRUD groups + values

### Product — Unit Tests

- [ ] `ProductService` — create (slug gen), update (price audit), find with filters
- [ ] `ProductCombinationService` — add, update, delete, default handling
- [ ] `ProductStockService` — update, increment, decrement, availability check
- [ ] `ProductImageService` — add, remove, set cover
- [ ] `ProductDuplicateService` — full duplication with images + combinations
- [ ] `ProductBulkService` — CSV import validation, error reporting
- [ ] `StockAlertService` — threshold check, alert creation
- [ ] `ProductSearchService` — MeiliSearch sync on create/update/delete

### Pricing Engine — Unit Tests

- [ ] `PriceCalculationService` — base + combination impact
- [ ] `PriceCalculationService` — customer group discount
- [ ] `PriceCalculationService` — specific price lookup (date, qty, country)
- [ ] `PriceCalculationService` — tax-inclusive calculation
- [ ] `PriceCalculationService` — tiered pricing (quantity breaks)
- [ ] `PriceCalculationService` — coupon/voucher reduction
- [ ] `PriceCalculationService` — flash sale time-limited deals
- [ ] `PriceCalculationService` — multi-currency exchange rate
- [ ] `PriceCalculationService` — B2B hidden prices for guests
- [ ] `PriceCalculationService` — loyalty points deduction

### Pricing Engine — Integration Tests

- [ ] `calculatePrice` GraphQL query — various inputs, correct priceTTC
- [ ] `specificPrices` CRUD — create, update, delete

### Category — Integration Tests

- [ ] `categories` query — tree, paginated
- [ ] `createCategory`, `updateCategory`, `deleteCategory`
- [ ] `reorderCategories` — drag-drop positions

### Product — Integration Tests

- [ ] `products` query — filters + pagination
- [ ] `product(id)` — single product with combinations
- [ ] `createProduct` — full input, slug auto-gen
- [ ] `addProductImage`, `removeProductImage`, `setProductCoverImage`
- [ ] `addProductCombination`, `updateProductCombination`, `deleteProductCombination`
- [ ] `updateStock`, `incrementStock`, `decrementStock`
- [ ] `duplicateProduct` — verifies all relations copied
- [ ] `checkProductAvailability` — in stock, out of stock

### Cart — Unit Tests

- [ ] `CartService.getOrCreateCart` — new guest, existing customer
- [ ] `CartService.addToCart` — new item, existing item (qty increment), stock validation
- [ ] `CartService.updateCartItemQuantity` — valid, zero (removes), over stock
- [ ] `CartService.removeFromCart` — item exists, item not in cart
- [ ] `CartService.clearCart` — empty cart, items present
- [ ] `CartPricingService.getCartWithTotals` — item prices, subtotal, tax, total
- [ ] `CartCouponService.applyCoupon` — valid code, invalid code, expired, max usage
- [ ] `CartCouponService.removeCoupon` — coupon applied, no coupon
- [ ] `CartMergeService.mergeGuestCart` — guest has items, guest is empty
- [ ] `CartStockReservationService` — reserve, release, TTL expiry

### Cart — Integration Tests

- [ ] `myCart` query — authenticated, unauthenticated (error)
- [ ] `addToCart` mutation — success, out of stock, combination required
- [ ] `updateCartItem`, `removeCartItem`, `clearCart`
- [ ] `applyCoupon`, `removeCoupon`
- [ ] `reserveCartStock` — stock reserved, released after order

### Order — Unit Tests

- [ ] `OrderCreationService.createOrderFromCart` — success, idempotency key
- [ ] `OrderCreationService.createGuestOrderFromCart` — guest checkout
- [ ] `OrderActionService.cancelOrder` — stock rollback verification
- [ ] `OrderActionService.requestReturn` — valid state, invalid state
- [ ] `OrderService.updateOrderStatus` — valid transition, invalid transition
- [ ] `OrderService.generateInvoicePDF` — PDF content, reference number
- [ ] `OrderService.reorderToCart` — all items re-added
- [ ] `OrderService.addOrderNote` — internal, customer-visible
- [ ] `OrderExportService` — CSV format, XLSX format, column mapping
- [ ] `OrderAddressSnapshotService` — snapshot content, address update

### Order — Integration Tests

- [ ] `createOrder` — cart → order, stock decremented
- [ ] `createGuestOrder` — guest identity, address creation
- [ ] `myOrders` — customer's orders only
- [ ] `cancelOrder` — status change, stock restored
- [ ] `generateInvoice` — PDF header, items, totals
- [ ] `reorder` — new cart populated from order items
- [ ] `exportMyOrders` — CSV download
- [ ] Order state machine — illegal transition rejected (e.g. shipped → pending)

### Shipping — Unit Tests

- [ ] `ShippingCalculationService.getAvailableCarriers` — by country + weight
- [ ] `ShippingCalculationService.calculateShippingCost` — rate selection
- [ ] `ShipmentService.createShipment` — carrier, tracking number
- [ ] `ShipmentService.updateShipmentStatus` — valid events
- [ ] `CarrierAdapterRegistry` — register, get, adapter not found error

### Shipping — Integration Tests

- [ ] `availableCarriers` query — returns carriers for given address
- [ ] `createShipment` mutation — creates shipment + shipment event
- [ ] `updateShipmentStatus` — status update with event log
- [ ] `syncShipmentTracking` — external carrier sync

### Payment — Unit Tests

- [ ] `PaymentService.initiatePayment` — MVola, Airtel, Stripe, COD, Manual
- [ ] `PaymentService.verifyPayment` — success, pending, failed
- [ ] `PaymentService.processRefund` — full, partial, invalid amount
- [ ] `PaymentWebhookSecurityService` — HMAC validation, replay detection
- [ ] `PaymentAdapterRegistry` — register, get, fallback to manual
- [ ] Stripe adapter — create intent, confirm, webhook handling
- [ ] MVola adapter — initiate, status polls, callback HMAC
- [ ] Airtel adapter — initiate, status, callback

### Payment — Integration Tests

- [ ] `initiatePayment` mutation — COD (instant success), Manual (pending)
- [ ] `verifyPayment` mutation — status check
- [ ] `processRefund` mutation — refund recorded, linked to payment
- [ ] `processPaymentWebhook` — Stripe event, MVola event, replay rejected
