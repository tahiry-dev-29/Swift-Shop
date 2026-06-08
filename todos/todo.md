> [!IMPORTANT]
> **⚠️ STRICT RULES (`.agents/`, `AGENT.MD`, `GEMINI.MD`)**
> - **TypeScript**: 100% Type-Safe — total ban on `any`, `as`, `!`, `ts-ignore`
> - **Backend (NestJS)**: Strict modular architecture, DTOs, Prisma validation
> - **Frontend (Angular)**: 100% ZoneLess, Signals (`resource`, `computed`), `OnPush`
> - **Tooling**: Exclusive execution via `bun` / `bunx`
> - **UI/UX**: PrimeNG 20 + Design System TailwindCSS 4 (Zero native CSS)

---

# 🗺️ ROADMAP — PrestaShop Clone (Full-Stack Production-Grade)

---

# BACKEND — NestJS + Prisma + PostgreSQL

---

## 🛠️ Setup & Infrastructure

- [x] Initialize Nx Monorepo (`npx create-nx-workspace`)
- [x] Configure the NestJS application `api-store`
- [x] Create the shared library `libs/shared/db-schema`
- [x] Install and configure Prisma with PostgreSQL (`provider = "prisma-client-js"`)
- [x] Configure Docker Compose for PostgreSQL + Redis
- [x] Set up ConfigService (environment variables management)
- [ ] **Vault / Doppler** integration for secrets management in production
- [ ] **Infrastructure as Code**: optimized multi-stage Dockerfiles + `docker-compose.prod.yml`
- [ ] **CI/CD Pipeline**: GitHub Actions (lint → test → build → deploy)
- [ ] **Database Seeding**: realistic seed script for dev/staging environments
- [ ] **Nx affected** optimization: only rebuild/retest changed libs on each push
- [ ] **Database migrations strategy**: versioned migration files, rollback procedure documented
- [ ] **Connection pooling**: PgBouncer or Prisma Accelerate for production DB connections
- [ ] **Backup strategy**: automated daily pg_dump to S3/Backblaze with 30-day retention

---

## 🔐 Auth & ACL — Employee & Customer

- [x] Prisma model `Profile` (Admin Roles) + `Employee`
- [x] Prisma model `Customer` + `CustomerGroup`
- [x] NestJS library `libs/api/auth`
- [x] Hashing service (Argon2)
- [x] JWT Passport strategy — `Employee` (Back-Office)
- [x] JWT Passport strategy — `Customer` (Front-Office)
- [x] Guards: `JwtAuthGuard`, `RolesGuard`
- [x] `@CurrentUser()` decorator to extract user from Request
- [x] Endpoint: `auth/employee/login`
- [x] Endpoint: `auth/customer/register` (with default group assignment)
- [x] Endpoint: `auth/customer/login`

### 🔐 Auth & ACL — Advanced Robustness

- [x] **Refresh Tokens** with rotation + Blacklisting via Redis
- [ ] **2FA (TOTP)** for `Employee` accounts (`otplib`, QR Code generation via `qrcode`) and can use app authenticator
- [ ] **Rate Limiting** on login/register routes (`@nestjs/throttler` + Redis store) normal for e-commerce
- [ ] **Magic Link** — Passwordless login for customers (signed email token, TTL 15min)
- [ ] **Session Fingerprinting** — Anomaly detection (IP change, User-Agent mismatch)
- [x] **Audit Log** — Full traceability of logins and sensitive actions (`AuditLog` Prisma model)
- [x] **OAuth2 PKCE** — Social login (Google, Facebook) via `passport-google-oauth20`
- [x] **Device Trust** — Remember device for 30 days (signed cookie + Redis)
- [x] **Account Lockout Policy** — Auto-lock after N failed login attempts + email alert
- [x] **Password policy enforcement** — min length, complexity, no common passwords (HaveIBeenPwned API)
- [x] **Forced password reset** — Admin can force employee to reset on next login

> Status prod hardening applique: Magic Link branche sur provider email configurable, OAuth env vars validees en production, Device Trust stocke en cookie secure/httpOnly, lockout alerte par email, password policy branchee sur HaveIBeenPwned, tests unitaires dedies ajoutes. Session Fingerprinting reste volontairement hors scope.

---

## 👥 Roles & Permissions — RBAC System

### Prisma Models

- [ ] `Role` — named role (`id`, `name`, `slug`, `description`, `isSystem`, `dateAdd`)
- [ ] `Permission` — atomic permission unit (`id`, `slug`, `resource`, `action`, `description`)
  - Actions: `create`, `read`, `update`, `delete`, `export`, `impersonate`
  - Resources: `products`, `orders`, `customers`, `catalog`, `pricing`, `settings`, `reports`, `roles`
- [ ] `RolePermission` — many-to-many join (`roleId`, `permissionId`)
- [ ] `EmployeeRole` — many-to-many join (`employeeId`, `roleId`)

### Built-in System Roles (seeded, non-deletable)

- [ ] `SuperAdmin` — all permissions, cannot be modified
- [ ] `Admin` — all permissions except role management
- [ ] `StoreManager` — products, catalog, orders, customers (no settings)
- [ ] `OrderManager` — orders and shipments only
- [ ] `ContentManager` — catalog, products, CMS pages only
- [ ] `SupportAgent` — customers read + orders read (no edit)
- [ ] `Analyst` — read-only access to reports and dashboard

### Backend Services

- [ ] `RoleService`:
  - [ ] `createRole(input)` — custom role creation
  - [ ] `updateRole(id, input)` — rename + update description (system roles immutable)
  - [ ] `deleteRole(id)` — soft delete (reassign employees first)
  - [ ] `cloneRole(id, newName)` — duplicate role with all permissions
  - [ ] `getRoleWithPermissions(id)` — full role detail
  - [ ] `listRoles()` — paginated, filterable
- [ ] `PermissionService`:
  - [ ] `assignPermissionsToRole(roleId, permissionIds[])`
  - [ ] `revokePermissionsFromRole(roleId, permissionIds[])`
  - [ ] `getPermissionsMatrix()` — full permission grid (resource × action)
- [ ] `EmployeeRoleService`:
  - [ ] `assignRolesToEmployee(employeeId, roleIds[])`
  - [ ] `revokeRolesFromEmployee(employeeId, roleIds[])`
  - [ ] `getEffectivePermissions(employeeId)` — merged permissions from all roles
- [ ] `PermissionGuard` — decorator-based `@RequirePermission('products:create')`

### GraphQL Endpoints

- [ ] Query: `roles` — list all roles with permission count
- [ ] Query: `role(id)` — role detail with full permission list
- [ ] Query: `permissionsMatrix` — full resource/action grid
- [ ] Query: `myPermissions` — current employee's effective permissions
- [ ] Mutation: `createRole(input)`
- [ ] Mutation: `updateRole(id, input)`
- [ ] Mutation: `deleteRole(id)`
- [ ] Mutation: `cloneRole(id, newName)`
- [ ] Mutation: `assignPermissionsToRole(roleId, permissionIds[])`
- [ ] Mutation: `assignRolesToEmployee(employeeId, roleIds[])`

### Advanced Robustness

- [ ] **Permission caching** — Redis cache of resolved permissions per employee (TTL 5min, invalidated on role change)
- [ ] **Row-level security** — employees can only see/edit their assigned store branches
- [ ] **Permission audit trail** — log every permission grant/revoke with actor + timestamp
- [ ] **Temporary role elevation** — grant extra permissions for a time-limited period (break-glass)
- [ ] **Permission check middleware** — auto-applied on all back-office resolvers

---

## 📂 Catalog — Categories & Features

- [x] Prisma model `Category` (hierarchy via `parentId`)
- [x] Prisma models `Feature` + `FeatureValue` (e.g.: Material → Cotton)
- [x] Prisma models `AttributeGroup` + `AttributeValue` (e.g.: Size → L, XL)
- [x] CRUD Service `CategoryService` (with parent/child tree management)
- [x] CRUD Service `FeatureService`
- [x] CRUD Service `AttributeService`
- [x] Admin endpoints to manage categories and attributes

### 📂 Catalog — Advanced Robustness

- [ ] **Cursor Pagination** (Relay-style) for large category trees
- [ ] **Redis cache** on `categories` and `features` queries (TTL-based invalidation)
- [ ] **N+1 queries optimization** via GraphQL DataLoader for attributes and child categories
- [ ] **Nested Set / Materialized Path** for ultra-fast hierarchical category reads
- [ ] **Slug auto-generation** + uniqueness enforcement on category and product names
- [ ] **Soft Delete** on categories with cascading visibility rules on child nodes
- [ ] **Category position drag-and-drop** (reorder via `position` field + bulk update endpoint)
- [ ] **Category SEO fields** — `metaTitle`, `metaDescription`, `metaKeywords` per category
- [ ] **Category image** — banner and thumbnail upload with auto-resize

---

## 📦 Products Core ✅ COMPLETED

- [x] Prisma model `Product` (base fields + dimensions: width, height, depth, weight)
- [x] Prisma model `ProductCombination` (variants with `priceImpact`, `weightImpact`)
- [x] Prisma model `Stock` (linked to product OR combination)
- [x] Prisma model `ProductImage` (media management with cover flag)
- [x] DTO `CreateProductInput` (complex: all base info included)
- [x] Service `ProductService`: simple product creation
- [x] Service `ProductService`: combination management (customizable attributes)
- [x] Service `ProductService`: stock management (`updateStock`, `incrementStock`, `decrementStock`)
- [x] GraphQL Endpoint: `products` (with filters and pagination)
- [x] GraphQL Endpoint: `product(id)` (images, combinations, stock, attributes)
- [x] GraphQL Endpoint: full CRUD for Products, Images, Combinations, Stock
- [x] HTML API Tester with improved interface (collapsible sections, 35 operations)
- [x] Automated tests (36/36 — 100% success)

### 📦 Products Core — Advanced Robustness

- [ ] **MeiliSearch / Elasticsearch** integration for full-text search and facets
- [ ] **Image processing pipeline**: automatic resizing + WebP/AVIF conversion (Sharp)
- [ ] **Price history auditing** — track every price change with timestamp + actor
- [ ] **Product duplication** endpoint (clone product with all variants and images)
- [ ] **Bulk import/export** — CSV/XLSX product import with validation report
- [ ] **Low stock alerts** — webhook/email/notification trigger when stock drops below threshold
- [ ] **Virtual & Downloadable products** — digital product delivery (signed URL, download limit)
- [ ] **Product bundles** — composite products made of multiple SKUs
- [ ] **Related products** — manual + automatic (based on same category/attributes)
- [ ] **Product reviews & ratings** — `ProductReview` model with moderation workflow
- [ ] **Product labels** — custom labels (New, Sale, Hot, Out of Stock) with display rules
- [ ] **SEO fields** — `metaTitle`, `metaDescription`, `canonicalUrl` per product

---

## 💰 Pricing Engine ✅ COMPLETED

- [x] Prisma model `SpecificPrice` (discount rules)
- [x] Prisma model `TaxRule` (VAT by country) + `Country`
- [x] Service `PriceCalculationService`
  - [x] Logic: Base Price + Combination impact
  - [x] Logic: CustomerGroup discount application
  - [x] Logic: `SpecificPrice` lookup (Date, Quantity, Country)
  - [x] Logic: Tax-inclusive calculation
- [x] GraphQL Query `calculatePrice` (returns `priceHT`, `taxAmount`, `priceTTC`)
- [x] CRUD SpecificPrice (Create, Update, Delete)
- [x] Automated tests (53/53 — 100% success)

### 💰 Pricing Engine — Advanced Robustness

- [ ] **Tiered pricing** — price breaks by quantity (buy 10+ → unit price drops)
- [ ] **Coupon / Voucher system** — single-use or multi-use discount codes with expiry
- [ ] **Flash sales** — time-limited deals with countdown visibility on storefront
- [ ] **Currency support** — multi-currency with real-time FX rate sync (via external API)
- [ ] **B2B pricing** — hidden prices for guests, custom negotiated prices per account
- [ ] **Price rounding rules** — configurable rounding strategy per currency/country
- [ ] **Loyalty points** — earn points on purchase, redeem as discount on next order
- [ ] **Bundle pricing** — special price when buying a configured product bundle

---

## 🛒 Cart & Orders

### Prisma Models

- [x] `Cart` — cart linked to Customer or guest session (`customerId?`, `sessionId?`)
- [x] `CartItem` — cart lines (`productId`, `combinationId?`, `quantity`, `price` snapshot)
- [x] `Order` — validated order (`reference` format: `DO-YYYYMMDD-XXXXX`, `status`, totals)
- [x] `OrderItem` — order lines (`productName`, `reference`, `unitPriceHT`, `taxRate`)
- [x] `OrderAddress` — shipping/billing address snapshot
- [x] `OrderState` — order states (Pending, Processing, Shipped, Delivered, Cancelled)
- [ ] `Shipment` — tracking number, carrier, estimated delivery date, `trackingEvents` (Json)
- [ ] `Return` / `ReturnItem` — RMA (Return Merchandise Authorization) flow
- [ ] `Invoice` — linked PDF storage reference + invoice number sequence
- [ ] `OrderNote` — internal (back-office only) and customer-visible notes per order
- [ ] `OrderHistory` — state change log (who changed what, when, with optional message)

### Backend Services

- [x] `CartService`:
  - [x] `getOrCreateCart(customerId | sessionId)`
  - [x] `addToCart(productId, combinationId?, quantity)` — with stock verification
  - [x] `updateQuantity(cartItemId, quantity)` — with validation
  - [x] `removeFromCart(cartItemId)`
  - [x] `getCartWithTotals()` — full cart with calculated prices
  - [x] `clearCart()`
  - [ ] `mergeGuestCart(sessionId, customerId)` — merge on login
  - [ ] `applyCoupon(cartId, code)` — validate and apply discount code
  - [ ] `removeCoupon(cartId)` — remove applied coupon
- [x] `OrderService`:
  - [x] `createOrderFromCart(cartId, deliveryAddressId, billingAddressId?)`
  - [x] `calculateOrderTotals()` — totals with taxes
  - [ ] `updateOrderStatus(orderId, statusId)` — with state machine validation
  - [x] `getMyOrders()` — paginated customer orders list
  - [x] `getOrderDetails(orderId)`
  - [ ] `cancelOrder(orderId)` — with stock rollback + notification
  - [ ] `generateInvoicePDF(orderId)` — Puppeteer / PDFKit
  - [ ] `requestReturn(orderId, items[])` — RMA initiation
  - [ ] `addOrderNote(orderId, note, isInternal)` — back-office notes

### GraphQL Endpoints

- [x] Query: `myCart`
- [x] Query: `myOrders`
- [x] Query: `order(id)`
- [x] Mutation: `addToCart(input)`
- [x] Mutation: `updateCartItem(id, quantity)`
- [x] Mutation: `removeCartItem(id)`
- [x] Mutation: `clearCart`
- [x] Mutation: `createOrder(input)`
- [ ] Mutation: `cancelOrder(id)`
- [ ] Mutation: `requestReturn(input)`
- [ ] Mutation: `addOrderNote(orderId, note, isInternal)`
- [ ] Subscription: `orderStatusChanged(orderId)` — real-time WebSocket update

### 🛒 Cart & Orders — Advanced Robustness

- [ ] **Idempotency** on `createOrder` — prevent duplicate orders/payments
- [ ] **Soft stock lock** — temporary reservation during checkout tunnel (TTL via Redis)
- [ ] **Abandoned cart recovery** — cron job + email reminder (BullMQ scheduler)
- [ ] **Payment webhooks** — Stripe / PayPal / MVola / AirtelMoney with HMAC signature verification
- [ ] **PDF invoice generation** — Puppeteer / PDFKit with branded template
- [ ] **Strict order state machine** — prevent illegal transitions (e.g. Delivered → Pending)
- [ ] **Multi-address checkout** — ship items to different addresses in one order
- [ ] **Guest checkout** — full purchase flow without registration
- [ ] **Re-order** — one-click re-add all items from a past order to cart
- [ ] **Order export** — CSV/XLSX export for accounting and logistics

---

## 🔔 Real-Time Notifications System

### Prisma Models

- [ ] `Notification` — unified notification record
  ```
  id, recipientId, recipientType (EMPLOYEE | CUSTOMER),
  type (NotificationType), title, body, data (Json),
  channel (IN_APP | PUSH | EMAIL | SMS),
  isRead, readAt, createdAt
  ```
- [ ] `NotificationType` — enum of all notification types (see list below)
- [ ] `NotificationPreference` — per-user channel preferences per notification type
  ```
  id, userId, userType, notificationType,
  inApp (bool), push (bool), email (bool), sms (bool)
  ```
- [ ] `PushSubscription` — Web Push / FCM device tokens
  ```
  id, userId, userType, token, platform (WEB | IOS | ANDROID), dateAdd
  ```

### Notification Types (Enum)

- [ ] **Customer-facing**:
  - `ORDER_CONFIRMED` — order successfully placed
  - `ORDER_STATUS_CHANGED` — status update (Processing, Shipped, Delivered, Cancelled)
  - `ORDER_SHIPPED` — shipment dispatched with tracking link
  - `ORDER_DELIVERED` — package delivered
  - `ORDER_CANCELLED` — order cancelled (with reason)
  - `RETURN_STATUS_CHANGED` — return request approved/rejected
  - `PAYMENT_RECEIVED` — payment confirmed
  - `PAYMENT_FAILED` — payment failed, retry prompt
  - `MOBILE_MONEY_PUSH_SENT` — USSD push sent to phone (MVola/Airtel)
  - `PRICE_DROP` — wishlist item price dropped
  - `BACK_IN_STOCK` — out-of-stock item is available again
  - `CART_ABANDONED` — abandoned cart reminder
  - `MAGIC_LINK` — passwordless login link
  - `ACCOUNT_CREATED` — welcome notification
  - `PASSWORD_CHANGED` — security alert on password change
  - `NEW_MESSAGE` — support chat message received
- [ ] **Employee-facing**:
  - `NEW_ORDER` — new order placed (with amount)
  - `ORDER_PAID` — payment confirmed for an order
  - `LOW_STOCK` — product stock below threshold
  - `OUT_OF_STOCK` — product/combination stock = 0
  - `NEW_CUSTOMER` — new customer registered
  - `NEW_REVIEW` — new product review pending moderation
  - `RETURN_REQUESTED` — customer requested a return
  - `PAYMENT_ISSUE` — payment failure or dispute alert
  - `SYSTEM_ALERT` — health check failure, high error rate, etc.
  - `REPORT_READY` — async report generation completed
  - `ROLE_CHANGED` — employee role was modified

### Backend Services

- [ ] `NotificationService` (core dispatcher):
  - [ ] `send(recipientId, type, data)` — dispatches to all enabled channels
  - [ ] `sendBulk(recipientIds[], type, data)` — bulk send (e.g. all admins)
  - [ ] `markAsRead(notificationId)` — mark single notification read
  - [ ] `markAllAsRead(userId)` — mark all as read
  - [ ] `getMyNotifications(userId, filters)` — paginated notification feed
  - [ ] `getUnreadCount(userId)` — badge counter
  - [ ] `deleteNotification(id)` — soft delete
- [ ] `NotificationPreferenceService`:
  - [ ] `getPreferences(userId)` — full channel preference matrix
  - [ ] `updatePreference(userId, type, channels)` — per-type channel toggle
  - [ ] `muteAll(userId, duration?)` — global do-not-disturb
- [ ] `PushNotificationService`:
  - [ ] Web Push via `web-push` library (VAPID keys)
  - [ ] Firebase Cloud Messaging (FCM) for mobile (iOS/Android)
  - [ ] `registerDevice(userId, token, platform)` — save push token
  - [ ] `unregisterDevice(token)` — remove on logout
  - [ ] `sendPush(token, title, body, data)` — single device push
  - [ ] `sendPushToUser(userId, payload)` — all user devices
- [ ] `SmsNotificationService`:
  - [ ] SMS via Twilio or Africa's Talking (Madagascar coverage)
  - [ ] `sendSms(msisdn, message)` — single SMS
  - [ ] Template-based SMS (order status, OTP)

### Real-Time Transport (WebSocket + SSE)

- [ ] **NestJS WebSocket Gateway** (`@WebSocketGateway`):
  - [ ] `notification` event — push notification payload to connected client
  - [ ] `unread_count` event — real-time badge counter update
  - [ ] Per-user rooms (namespace by `userId`)
  - [ ] JWT authentication on WebSocket handshake
  - [ ] Redis adapter (`@socket.io/redis-adapter`) for multi-instance support
- [ ] **Server-Sent Events (SSE)** fallback for clients that don't support WebSocket:
  - [ ] `GET /notifications/stream` — EventSource endpoint
  - [ ] Auth via Bearer token query param
- [ ] **BullMQ notification queue**:
  - [ ] `notification-delivery` queue — async processing with retry
  - [ ] Dead letter queue for failed deliveries
  - [ ] Rate limiting per user (max N notifications/min)

### GraphQL Endpoints

- [ ] Query: `myNotifications(pagination, filter)` — paginated feed
- [ ] Query: `unreadNotificationsCount` — badge number
- [ ] Query: `notificationPreferences` — my channel preferences
- [ ] Mutation: `markNotificationRead(id)`
- [ ] Mutation: `markAllNotificationsRead`
- [ ] Mutation: `deleteNotification(id)`
- [ ] Mutation: `updateNotificationPreference(type, channels)`
- [ ] Mutation: `muteNotifications(duration?)`
- [ ] Mutation: `registerPushDevice(token, platform)`
- [ ] Mutation: `unregisterPushDevice(token)`
- [ ] Subscription: `notificationReceived` — real-time WebSocket notification
- [ ] Subscription: `unreadCountChanged` — real-time badge counter

### Advanced Robustness

- [ ] **Notification deduplication** — prevent duplicate notifications within 60s window
- [ ] **Batching** — group multiple low-priority notifications into digest (e.g. daily summary email)
- [ ] **Priority levels** — CRITICAL (instant), HIGH (real-time), NORMAL (queue), LOW (digest)
- [ ] **Delivery tracking** — track sent/delivered/read per channel per notification
- [ ] **Notification templates** — versioned, multi-language notification templates in DB
- [ ] **Admin broadcast** — send announcement to all customers or all employees
- [ ] **In-app notification center** — bell icon with full history, filter by type

---

## 🚚 Delivery & Shipping System

### Prisma Models

- [ ] `Carrier` — shipping carrier definition
  ```
  id, name, slug, logo, trackingUrl, isFree,
  freeShippingThreshold, isActive, position, dateAdd
  ```
- [ ] `ShippingZone` — geographic zone
  ```
  id, name, countries (CountryCode[]), regions (String[])
  ```
- [ ] `ShippingRate` — rate per carrier/zone/weight range
  ```
  id, carrierId, zoneId, minWeight, maxWeight,
  price, currency, handlingFee, estimatedDays
  ```
- [ ] `Shipment` — actual shipment for an order
  ```
  id, orderId, carrierId, trackingNumber, trackingUrl,
  status (ShipmentStatus), estimatedDeliveryDate,
  shippedAt, deliveredAt, dateAdd
  ```
- [ ] `ShipmentEvent` — tracking event log
  ```
  id, shipmentId, status, location, description,
  timestamp, source (CARRIER | MANUAL | WEBHOOK)
  ```
- [ ] `DeliverySlot` — time-slot delivery option
  ```
  id, carrierId, dayOfWeek, startTime, endTime,
  maxOrders, isActive
  ```
- [ ] `PickupPoint` — relay/pickup point locations
  ```
  id, carrierId, name, address1, city, postalCode,
  countryCode, lat, lng, openingHours (Json), isActive
  ```

### Carrier Integrations

- [ ] **Abstract Carrier Adapter** — `ICarrierAdapter` interface:
  ```typescript
  interface ICarrierAdapter {
    getRates(cart: Cart, address: Address): Promise<CarrierRate[]>
    createShipment(order: Order): Promise<ShipmentLabel>
    trackShipment(trackingNumber: string): Promise<TrackingEvent[]>
    cancelShipment(trackingNumber: string): Promise<void>
  }
  ```
- [ ] **Manual/Standard carrier** — basic flat-rate and weight-based adapter
- [ ] **Colissimo** (La Poste) — France + DOM-TOM delivery adapter
- [ ] **DHL Express** — international adapter with live rate calculation
- [ ] **FedEx** — international adapter
- [ ] **Local Madagascar carriers**:
  - [ ] **Sodiat** adapter (Madagascar domestic)
  - [ ] **Espace Logistique** adapter
  - [ ] **Chronopost Madagascar** adapter
- [ ] **Pickup Point** integration (relay points map + selection)

### Backend Services

- [ ] `ShippingCalculationService`:
  - [ ] `getAvailableCarriers(cartId, addressId)` — returns sorted carrier list with prices
  - [ ] `calculateShippingCost(carrierId, weight, zoneId)` — rate matrix lookup
  - [ ] `isFreeShipping(cartTotal, carrierId)` — threshold check
  - [ ] `estimateDeliveryDate(carrierId, origin, destination)` — business days calculation
- [ ] `ShipmentService`:
  - [ ] `createShipment(orderId, carrierId, trackingNumber?)` — create shipment record
  - [ ] `updateShipmentStatus(shipmentId, status, event?)` — manual update
  - [ ] `addTrackingEvent(shipmentId, event)` — add tracking milestone
  - [ ] `syncTrackingFromCarrier(shipmentId)` — pull live tracking from carrier API
  - [ ] `getShipmentTracking(shipmentId)` — full event timeline
  - [ ] `generateShippingLabel(orderId)` — call carrier API, return PDF label
- [ ] `PickupPointService`:
  - [ ] `findNearbyPickupPoints(lat, lng, radius)` — geo search
  - [ ] `getPickupPointDetails(id)` — hours, location, availability

### GraphQL Endpoints

- [ ] Query: `availableCarriers(cartId, addressId)` — sorted carrier options with prices
- [ ] Query: `shipmentTracking(shipmentId)` — full tracking timeline
- [ ] Query: `nearbyPickupPoints(lat, lng, radius)` — pickup point map data
- [ ] Query: `myShipments` — all shipments for current customer
- [ ] Mutation: `createShipment(orderId, carrierId, trackingNumber?)`
- [ ] Mutation: `updateShipmentStatus(shipmentId, status)`
- [ ] Mutation: `addTrackingEvent(shipmentId, event)`
- [ ] Mutation: `syncTracking(shipmentId)` — trigger live carrier sync
- [ ] Subscription: `shipmentStatusChanged(shipmentId)` — real-time tracking update

### Advanced Robustness

- [ ] **Tracking poller** — BullMQ cron job to sync active shipments every 30 min
- [ ] **Carrier webhook receiver** — ingest carrier callbacks and update tracking
- [ ] **Delivery confirmation** — auto-mark order as Delivered after carrier confirms
- [ ] **Shipping label generation** — PDF label printable from back-office
- [ ] **Return label** — generate return shipping label for RMA orders
- [ ] **Shipping manifest** — daily carrier manifest export for batch pickups
- [ ] **Delivery time estimation** — display estimated date on product page + checkout
- [ ] **Signature required** flag — per carrier, per order value threshold
- [ ] **International customs declaration** — auto-fill HS codes and declared values

---

## 💳 Payment Gateways

### Prisma Models

- [ ] `Payment` — unified payment record across all providers
  ```
  id, orderId, provider (STRIPE | PAYPAL | MVOLA | AIRTEL_MONEY | COD | MANUAL),
  externalId, amount, currency, status (PENDING | SUCCESS | FAILED | REFUNDED | DISPUTED),
  metadata (Json), dateAdd, dateUpd
  ```
- [ ] `Refund` — refund record linked to `Payment`
  ```
  id, paymentId, amount, reason, status (PENDING | APPROVED | PROCESSED | REJECTED), dateAdd
  ```
- [ ] `MvolaTransaction` — MVola-specific fields
  ```
  id, paymentId, msisdn, transactionId, serverCorrelationId,
  status, amount, currency, callbackReceived, dateAdd
  ```
- [ ] `AirtelTransaction` — AirtelMoney-specific fields
  ```
  id, paymentId, msisdn, transactionId, reference,
  status, amount, currency, callbackReceived, dateAdd
  ```

### Payment Abstraction Layer

- [ ] `IPaymentAdapter` interface:
  ```typescript
  interface IPaymentAdapter {
    initiatePayment(order: Order, payer: PayerInfo): Promise<PaymentInitResult>
    verifyPayment(externalId: string): Promise<PaymentStatus>
    refundPayment(externalId: string, amount?: number): Promise<RefundResult>
    handleWebhook(payload: unknown, signature: string): Promise<WebhookResult>
  }
  ```
- [ ] `PaymentService` (orchestrator):
  - [ ] `initiatePayment(orderId, method, payerInfo)` — route to correct adapter
  - [ ] `confirmPayment(transactionId, provider)` — manual/polling confirmation
  - [ ] `processRefund(paymentId, amount?)` — partial or full refund
  - [ ] `getPaymentStatus(transactionId)` — polling endpoint
  - [ ] `handleProviderWebhook(provider, payload, signature)` — verify + process

### MVola (Telma Madagascar)

- [ ] `MvolaAdapter` implementing `IPaymentAdapter`
- [ ] OAuth2 `client_credentials` token refresh (cached in Redis, auto-renewed)
- [ ] `initiatePayment(msisdn, amount, orderId)` — USSD Push to customer phone
- [ ] `pollTransactionStatus(serverCorrelationId)` — polling with exponential backoff
- [ ] `handleWebhook(payload)` — verify callback, update `MvolaTransaction`
- [ ] Environment config: `MVOLA_BASE_URL`, `MVOLA_CONSUMER_KEY`, `MVOLA_CONSUMER_SECRET`
- [ ] Sandbox/Production environment toggle
- [ ] Phone validation: must start with `034` or `038` (Telma Madagascar)
- [ ] BullMQ job: retry if webhook not received within 3 minutes
- [ ] Idempotency key per transaction — prevent double charge

### AirtelMoney (Airtel Madagascar)

- [ ] `AirtelMoneyAdapter` implementing `IPaymentAdapter`
- [ ] OAuth2 `client_credentials` token refresh (cached in Redis, auto-renewed)
- [ ] `initiatePayment(msisdn, amount, orderId)` — trigger payment request
- [ ] `getTransactionStatus(transactionId)` — check result
- [ ] `handleCallback(payload)` — process Airtel callback notification
- [ ] Environment config: `AIRTEL_BASE_URL`, `AIRTEL_CLIENT_ID`, `AIRTEL_CLIENT_SECRET`
- [ ] Sandbox/Production environment toggle
- [ ] Phone validation: must start with `033` (Airtel Madagascar)
- [ ] BullMQ job: retry if callback not received within 5 minutes
- [ ] Idempotency key per transaction — prevent double charge

### Stripe

- [ ] `StripeAdapter` implementing `IPaymentAdapter`
- [ ] Payment Intents API (3DS2 compliant)
- [ ] Saved cards (Stripe Customer + PaymentMethod storage)
- [ ] Stripe Elements frontend integration
- [ ] Webhook handling (`payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.dispute.created`)
- [ ] Refund via Stripe API

### PayPal

- [ ] `PayPalAdapter` implementing `IPaymentAdapter`
- [ ] Orders API v2
- [ ] Webhook handling (`PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`)
- [ ] Refund via PayPal API

### Other Payment Methods

- [ ] **Cash on Delivery (COD)** — `CodAdapter`, order confirmed pending physical payment
- [ ] **Manual/Bank Transfer** — mark as paid manually by admin with reference number
- [ ] **Loyalty Points** — redeem earned points as payment (partial or full)

### GraphQL Endpoints

- [ ] Mutation: `initiatePayment(orderId, method, payerInfo)` — returns `paymentUrl` or `mobileMoneyPending`
- [ ] Mutation: `confirmPayment(transactionId)` — manual confirmation fallback
- [ ] Mutation: `refundPayment(paymentId, amount?)` — partial or full refund
- [ ] Query: `paymentStatus(transactionId)` — polling endpoint
- [ ] Query: `myPayments` — paginated payment history
- [ ] Subscription: `paymentConfirmed(orderId)` — real-time confirmation via WebSocket

### Security & Compliance

- [ ] **HMAC signature verification** on all incoming webhooks
- [ ] **Webhook replay protection** — store processed event IDs in Redis (TTL 24h)
- [ ] **Sensitive data masking** — never log full MSISDN or card details
- [ ] **Payment timeout** — auto-cancel pending order after 15 min with stock rollback
- [ ] **Reconciliation cron** — daily job to match DB payments vs provider dashboard

### Advanced Robustness

- [ ] **Multi-provider failover** — fallback to secondary provider if primary is down
- [ ] **BullMQ payment queue** — async processing with dead letter queue
- [ ] **Admin payment dashboard** — list all transactions, filter by provider/status/date
- [ ] **Dispute management** — track chargebacks and disputes per payment

---

## 📬 Notifications & Transactional Emails

- [ ] **Email service abstraction** — provider-agnostic (`IEmailProvider` interface)
- [ ] **Provider implementations**: Resend, SendGrid, Mailgun, SMTP fallback
- [ ] **React Email** templates — pixel-perfect, responsive HTML emails

### Email Templates

- [ ] `welcome` — customer registration confirmation
- [ ] `order-confirmation` — order summary with items, totals, shipping address
- [ ] `order-status-changed` — status update with next steps
- [ ] `order-shipped` — tracking number + carrier link
- [ ] `order-delivered` — delivery confirmation + review prompt
- [ ] `order-cancelled` — cancellation with reason + refund timeline
- [ ] `payment-confirmation` — payment receipt
- [ ] `payment-failed` — failure alert + retry link
- [ ] `mobile-money-push` — USSD push sent confirmation (MVola/Airtel)
- [ ] `invoice` — PDF invoice attached
- [ ] `magic-link` — passwordless login link
- [ ] `password-reset` — reset link with expiry
- [ ] `password-changed` — security alert
- [ ] `abandoned-cart` — cart reminder with product images
- [ ] `back-in-stock` — product availability alert
- [ ] `price-drop` — wishlist item price reduced
- [ ] `return-confirmation` — RMA initiated confirmation
- [ ] `employee-invite` — invite new team member
- [ ] `low-stock-alert` — internal employee email for low/zero stock

### Advanced Robustness

- [ ] **BullMQ email queue** — async delivery with retry logic (3 attempts, exponential backoff)
- [ ] **Email preview** — admin UI to preview any template with sample data
- [ ] **Unsubscribe management** — one-click unsubscribe link in all marketing emails
- [ ] **Email delivery tracking** — track sent/delivered/bounced/opened via provider webhooks
- [ ] **Email logs** — store all sent emails in DB for support and debugging

---

## ⚙️ Settings & Configuration

### Prisma Models

- [ ] `Setting` — key-value store for shop configuration
  ```
  id, key, value (String), type (STRING | INT | BOOL | JSON | SECRET),
  group (GENERAL | SEO | PAYMENT | SHIPPING | EMAIL | SECURITY | ADVANCED),
  isPublic (exposed to frontend), updatedBy, updatedAt
  ```
- [ ] `Language` — supported store languages
  ```
  id, code (ISO 639-1), name, isDefault, isActive, flag, dateAdd
  ```
- [ ] `Currency` — supported currencies
  ```
  id, code (ISO 4217), symbol, name, exchangeRate, isDefault, isActive, position
  ```
- [ ] `Store` — multi-store support (future)
  ```
  id, name, domain, timezone, defaultLanguageId, defaultCurrencyId, isActive
  ```

### Settings Groups

- [ ] **General Settings**:
  - [ ] Shop name, tagline, logo, favicon
  - [ ] Default language, timezone, date format
  - [ ] Maintenance mode (with whitelist IPs)
  - [ ] Contact email, support phone
- [ ] **SEO Settings**:
  - [ ] Default meta title, meta description
  - [ ] robots.txt content
  - [ ] Sitemap auto-generation (product, category, CMS pages)
  - [ ] Google Analytics ID, Facebook Pixel ID
- [ ] **Email Settings**:
  - [ ] SMTP credentials or API key
  - [ ] From name, from email
  - [ ] Email header/footer branding
- [ ] **Payment Settings**:
  - [ ] Enable/disable payment methods
  - [ ] Stripe public/secret keys
  - [ ] PayPal client ID/secret
  - [ ] MVola consumer key/secret
  - [ ] AirtelMoney client ID/secret
  - [ ] COD availability toggle + conditions
- [ ] **Shipping Settings**:
  - [ ] Default origin address
  - [ ] Free shipping threshold
  - [ ] Carrier API credentials per carrier
  - [ ] Default carrier for new orders
- [ ] **Security Settings**:
  - [ ] Password policy (min length, complexity)
  - [ ] Session timeout duration
  - [ ] Max login attempts before lockout
  - [ ] 2FA requirement for admins (force-enable)
  - [ ] Allowed IP ranges for back-office
- [ ] **Checkout Settings**:
  - [ ] Guest checkout toggle
  - [ ] Required fields (phone, company, etc.)
  - [ ] Terms and conditions URL
  - [ ] Order reference prefix
- [ ] **Notification Settings**:
  - [ ] Default notification preferences for new users
  - [ ] Global notification cooldown rules
  - [ ] Admin alert email recipients

### Backend Services

- [ ] `SettingService`:
  - [ ] `get(key)` — typed value retrieval
  - [ ] `set(key, value)` — update with audit log
  - [ ] `getGroup(group)` — all settings in a group
  - [ ] `getPublicSettings()` — only `isPublic: true` settings (safe for frontend)
  - [ ] `resetToDefault(key)` — restore factory default
  - [ ] Redis cache on all settings reads (TTL 10min, invalidated on write)
- [ ] `LanguageService` — CRUD + set default
- [ ] `CurrencyService` — CRUD + sync exchange rates + set default

### GraphQL Endpoints

- [ ] Query: `settings(group?)` — admin: all settings by group
- [ ] Query: `publicSettings` — frontend: public settings only
- [ ] Query: `languages` — active languages
- [ ] Query: `currencies` — active currencies with exchange rates
- [ ] Mutation: `updateSetting(key, value)`
- [ ] Mutation: `updateSettingsGroup(group, settings[])` — bulk update
- [ ] Mutation: `resetSetting(key)`
- [ ] Mutation: `setDefaultLanguage(id)`
- [ ] Mutation: `setDefaultCurrency(id)`
- [ ] Mutation: `syncCurrencyRates` — trigger live FX rate sync

---

## 💬 Customer Support & Live Chat

### Prisma Models

- [ ] `SupportTicket` — support request
  ```
  id, reference, customerId, employeeId?, subject, status
  (OPEN | IN_PROGRESS | WAITING_CUSTOMER | RESOLVED | CLOSED),
  priority (LOW | MEDIUM | HIGH | URGENT), orderId?, category, dateAdd, dateUpd
  ```
- [ ] `TicketMessage` — conversation messages
  ```
  id, ticketId, senderId, senderType (CUSTOMER | EMPLOYEE),
  body, attachments (Json), isInternal, dateAdd
  ```
- [ ] `LiveChatSession` — real-time chat sessions
  ```
  id, customerId?, visitorId, employeeId?, status
  (WAITING | ACTIVE | CLOSED), startedAt, endedAt
  ```
- [ ] `ChatMessage` — live chat messages
  ```
  id, sessionId, senderId, senderType, body, isRead, dateAdd
  ```

### Backend Services

- [ ] `SupportTicketService`:
  - [ ] `createTicket(customerId, input)` — with auto-reference generation
  - [ ] `replyToTicket(ticketId, message, senderId, isInternal?)` — add message
  - [ ] `updateTicketStatus(ticketId, status)` — with notification trigger
  - [ ] `assignTicket(ticketId, employeeId)` — assign to support agent
  - [ ] `closeTicket(ticketId)` — mark resolved
  - [ ] `getMyTickets(customerId)` — customer ticket list
  - [ ] `getTicketQueue(filters)` — admin: all open tickets
- [ ] `LiveChatGateway` (WebSocket):
  - [ ] `joinChat(sessionId)` — subscribe to session room
  - [ ] `sendMessage(sessionId, body)` — real-time message delivery
  - [ ] `agentTyping(sessionId)` — typing indicator
  - [ ] `endSession(sessionId)` — close chat session
  - [ ] Queue management — waiting visitors assigned to available agents

### GraphQL & WebSocket Endpoints

- [ ] Query: `myTickets` — customer ticket history
- [ ] Query: `ticket(id)` — full ticket with messages
- [ ] Query: `ticketQueue` — admin: open tickets
- [ ] Mutation: `createTicket(input)`
- [ ] Mutation: `replyToTicket(ticketId, message)`
- [ ] Mutation: `closeTicket(ticketId)`
- [ ] Subscription: `ticketUpdated(ticketId)` — real-time reply notification
- [ ] WebSocket: `chat:message` — live chat message
- [ ] WebSocket: `chat:typing` — typing indicator
- [ ] WebSocket: `chat:status` — session status change

---

## 📊 Analytics & Reports

### Prisma Models

- [ ] `DailySalesSnapshot` — aggregated daily stats (cron-populated)
  ```
  id, date, revenue, ordersCount, avgOrderValue,
  newCustomers, returningCustomers, topProductId, dateAdd
  ```
- [ ] `ProductViewEvent` — product page view tracking (lightweight)
  ```
  id, productId, customerId?, sessionId, source, dateAdd
  ```

### Backend Services

- [ ] `AnalyticsService`:
  - [ ] `getDashboardStats(period)` — revenue, orders, customers (daily/weekly/monthly)
  - [ ] `getSalesChart(from, to, granularity)` — time-series revenue data
  - [ ] `getTopProducts(limit, period)` — best sellers by revenue/quantity
  - [ ] `getTopCategories(limit, period)` — best performing categories
  - [ ] `getCustomerRetentionRate(period)` — new vs returning ratio
  - [ ] `getAverageOrderValue(period)` — AOV trend
  - [ ] `getConversionRate(period)` — cart-to-order ratio
  - [ ] `getStockReport()` — products with low/zero stock
  - [ ] `getSalesReport(from, to)` — full exportable sales report
  - [ ] `generateReport(type, params)` — async report via BullMQ + email when ready

### GraphQL Endpoints

- [ ] Query: `dashboardStats(period)` — summary metrics
- [ ] Query: `salesChart(from, to, granularity)` — chart data
- [ ] Query: `topProducts(limit, period)` — best sellers
- [ ] Query: `topCategories(limit, period)`
- [ ] Query: `stockReport` — inventory health
- [ ] Mutation: `exportSalesReport(from, to, format)` — async CSV/XLSX export
- [ ] Subscription: `dashboardUpdated` — real-time dashboard refresh

---

## 🧩 CMS — Content Management

### Prisma Models

- [ ] `CmsPage` — static pages (About, FAQ, T&C, Privacy Policy)
  ```
  id, slug, title, content (Html), metaTitle, metaDescription,
  isActive, position, dateAdd, dateUpd
  ```
- [ ] `Banner` — homepage/category banners
  ```
  id, title, subtitle, imageUrl, linkUrl, position,
  targetPage, isActive, startsAt?, endsAt?, dateAdd
  ```
- [ ] `HomepageBlock` — configurable homepage sections
  ```
  id, type (FEATURED_PRODUCTS | BANNER | CATEGORY_GRID | HTML_BLOCK),
  config (Json), position, isActive
  ```

### Backend Services

- [ ] `CmsPageService` — CRUD + slug uniqueness
- [ ] `BannerService` — CRUD + schedule management (active between dates)
- [ ] `HomepageService` — block management + position reordering

### GraphQL Endpoints

- [ ] Query: `cmsPages` — list active pages
- [ ] Query: `cmsPage(slug)` — page detail
- [ ] Query: `banners(position?)` — active banners
- [ ] Query: `homepageBlocks` — ordered homepage configuration
- [ ] Mutation: CRUD for CmsPage, Banner, HomepageBlock

---

## 🛡️ Backend Quality, Testing & DevOps

- [ ] **Unit Tests**: coverage > 80% on all Services (Vitest)
- [ ] **Integration Tests**: full GraphQL endpoint scenarios (Supertest + Apollo Client)
- [ ] **E2E Tests**: critical user journeys (register → browse → cart → checkout → payment)
- [ ] **Strict DTO Validation**: `whitelist: true`, `forbidNonWhitelisted: true` on all DTOs
- [ ] **Observability**: structured logs (Pino), distributed tracing (OpenTelemetry + Jaeger)
- [ ] **Health Checks**: Terminus (Database, Redis, Memory, External services)
- [ ] **Performance benchmarks**: k6 load tests on critical endpoints (catalog, cart, checkout)
- [ ] **Dependency scanning**: Snyk or Dependabot for CVE alerts on npm packages
- [ ] **OpenAPI / Swagger**: auto-generated and always up-to-date documentation
- [ ] **GraphQL Schema introspection disabled** in production
- [ ] **Input sanitization** — strip XSS payloads from all string inputs

---

---

# FRONTEND — Angular 21 (ZoneLess)

---

## 🏗️ Core & Architecture

- [ ] Configure the `storefront` application
- [ ] Enable ZoneLess mode (`provideZonelessChangeDetection`)
- [ ] Configure Router with `TitleStrategy` and lazy-loaded routes
- [ ] Create Nx UI library (`libs/storefront/ui-kit`)
- [ ] Configure HTTP interceptor (JWT token injection + refresh token retry)
- [ ] Create `SessionService` (Signal Store for User + Cart state)
- [ ] **Apollo Client** setup with normalized in-memory cache for GraphQL
- [ ] **Error boundary** — global error handler with user-friendly fallback UI
- [ ] **PWA support** — `@angular/pwa` with offline cache strategy (stale-while-revalidate)
- [ ] **i18n** — `@jsverse/transloco` for multi-language support (FR, EN, MG)
- [ ] **Meta tags service** — dynamic Open Graph + SEO tags per route
- [ ] **WebSocket client** — `socket.io-client` service for real-time events
- [ ] **Toast service** — global notification dispatcher using PrimeNG Toast

---

## 👤 User Identity

- [ ] `LoginComponent` — Signal-based form with inline validation
- [ ] `RegisterComponent` — Typed reactive form with password strength indicator
- [ ] `ForgotPasswordComponent` — email input + success state
- [ ] `ResetPasswordComponent` — token-validated new password form
- [ ] `MagicLinkComponent` — passwordless login confirmation page
- [ ] `MyAccountComponent` — customer dashboard (orders, profile, wishlist)
- [ ] `AddressBookComponent` — address CRUD via `httpResource`
- [ ] `OrderHistoryComponent` — paginated order list with status badges
- [ ] `OrderDetailComponent` — full order breakdown with re-order button
- [ ] `WishlistComponent` — saved products (persisted in DB)
- [ ] `ProfileEditComponent` — update name, email, password
- [ ] `NotificationPreferencesComponent` — channel toggles per notification type
- [ ] `SecuritySettingsComponent` — 2FA setup, active sessions, device list
- [ ] **Auth guards** — protect account routes, redirect to login with `returnUrl`

---

## 🔔 Real-Time Notification UI

- [ ] `NotificationBellComponent` — header bell icon with animated unread badge
  - [ ] Real-time badge count via WebSocket subscription `unreadCountChanged`
  - [ ] Dropdown panel showing last 5 notifications
  - [ ] "Mark all as read" button
  - [ ] "View all" link to notification center
- [ ] `NotificationCenterComponent` — full-page notification history
  - [ ] Paginated notification list with infinite scroll
  - [ ] Filter by type (orders, payments, stock, system)
  - [ ] Per-notification read/unread toggle
  - [ ] Bulk delete selected notifications
  - [ ] Empty state illustration when all read
- [ ] `NotificationItemComponent` — single notification card
  - [ ] Icon per notification type
  - [ ] Relative timestamp (2 min ago, 3 hours ago)
  - [ ] Clickable — navigates to relevant resource (order, product, etc.)
  - [ ] Unread dot indicator
- [ ] `NotificationToastComponent` — auto-dismissible toast for real-time pushes
  - [ ] Slide-in animation from top-right
  - [ ] Auto-dismiss after 5 seconds
  - [ ] Stacked (max 3 visible at once)
  - [ ] Click to navigate to relevant page
- [ ] `NotificationPreferencesComponent` — settings matrix
  - [ ] Per-type toggles for: In-App, Email, Push, SMS channels
  - [ ] Global mute toggle with duration selector
  - [ ] Preview notification button per type
- [ ] `PushPermissionPromptComponent` — browser push permission request UI
  - [ ] Shown after 3rd visit (non-intrusive)
  - [ ] "Later" option (re-prompt after 7 days)
  - [ ] VAPID key registration on approval
- [ ] `WebSocketService` — manages socket connection lifecycle
  - [ ] Auto-reconnect with exponential backoff
  - [ ] Per-event RxJS Subject bus
  - [ ] Connection status signal (`connected`, `reconnecting`, `disconnected`)

---

## 🛍️ Product Catalog UI

- [ ] `ProductListComponent` — responsive product grid
- [ ] `ProductFilterComponent` — facet sidebar (category, attributes, price range, stock)
- [ ] `ProductCardComponent` — reusable micro-component with hover quick-view
- [ ] `ProductDetailComponent`:
  - [ ] `httpResource` integration to fetch product by slug
  - [ ] `ProductGallery` — zoomable image gallery with thumbnail strip
  - [ ] `ProductAttributes` — size/color selector with unavailable variant dimming
  - [ ] `selectedCombination` signal — reactive price + image update on selection
  - [ ] Stock badge — "In Stock", "Low Stock (3 left)", "Out of Stock"
  - [ ] "Add to Cart" button — loading / success / error states
  - [ ] Wishlist toggle button (heart icon)
  - [ ] "Notify me when available" — out-of-stock subscription
  - [ ] Breadcrumb — category path navigation
  - [ ] Related products carousel
  - [ ] Product reviews section with rating breakdown
  - [ ] Share buttons (native Web Share API)
- [ ] `CategoryPageComponent` — SEO with JSON-LD structured data
- [ ] `SearchResultsComponent` — full-text search results with highlighted matches
- [ ] `SearchBarComponent` — debounced live search with dropdown suggestions
- [ ] `ProductReviewComponent` — write + read reviews with star rating

---

## 🛒 Checkout Experience

- [ ] `CartSidebarComponent` — offcanvas slide-in cart with real-time totals
- [ ] `CartPageComponent` — detailed cart with quantity editor + coupon input
- [ ] `CheckoutComponent` — multi-step stepper:
  - [ ] Step 1: Personal information (or guest / login prompt)
  - [ ] Step 2: Shipping address (saved addresses + add new inline)
  - [ ] Step 3: Carrier selection (list with price + estimated delivery date)
  - [ ] Step 4: Payment method selection
  - [ ] Step 5: Order review + place order
  - [ ] Step 6: Confirmation page (order reference + email notice)
- [ ] `PaymentMethodSelectorComponent`:
  - [ ] MVola logo + phone input (format: `034XXXXXXX` / `038XXXXXXX`)
  - [ ] AirtelMoney logo + phone input (format: `033XXXXXXX`)
  - [ ] Card (Stripe Elements) — for international customers
  - [ ] Cash on Delivery — with conditions text
  - [ ] Bank Transfer — with IBAN details
- [ ] `MobileMoneyWaitingComponent`:
  - [ ] "Check your phone and confirm" animated instruction
  - [ ] 15-minute countdown timer with progress bar
  - [ ] Auto-polling `paymentStatus` every 5 seconds
  - [ ] WebSocket subscription `paymentConfirmed` for instant redirect
  - [ ] "I already confirmed" manual retry button
  - [ ] Cancel payment link
- [ ] `PaymentSuccessComponent` — confirmation with order reference + download invoice
- [ ] `PaymentFailureComponent` — error page with retry + support link
- [ ] **Order summary sidebar** — sticky, live-updated as user steps through checkout
- [ ] **Coupon input** — apply discount code with animated success/error feedback
- [ ] **Address auto-complete** — Geoapify or Google Places integration

---

## 🚚 Delivery Tracking UI

- [ ] `OrderTrackingComponent` — public tracking page (accessible without login via reference)
- [ ] `ShipmentTimelineComponent` — vertical event timeline
  - [ ] Status icons per milestone (Confirmed, Packed, In Transit, Out for Delivery, Delivered)
  - [ ] Timestamps per event
  - [ ] Carrier logo + tracking number display
  - [ ] "Track on carrier website" external link
  - [ ] Real-time updates via WebSocket subscription
- [ ] `DeliveryEstimateComponent` — ETA display on product page + cart
- [ ] `PickupPointMapComponent` — interactive map to select relay/pickup point
  - [ ] Leaflet or Google Maps integration
  - [ ] Nearby pickup points as pins
  - [ ] Opening hours popup on pin click
  - [ ] Select pickup point → updates delivery address
- [ ] `CarrierSelectorComponent` (in checkout Step 3):
  - [ ] List with logo, price, ETA, free shipping badge
  - [ ] Selection triggers real-time cart total update

---

## 💬 Customer Support UI

- [ ] `SupportTicketListComponent` — customer's ticket history
- [ ] `SupportTicketDetailComponent` — conversation thread + reply form
- [ ] `CreateTicketComponent` — new ticket form (subject, category, message, attachments)
- [ ] `LiveChatWidgetComponent` — floating chat button (bottom-right)
  - [ ] Chat window with message history
  - [ ] Typing indicator ("Agent is typing...")
  - [ ] File attachment upload
  - [ ] Pre-chat form (name + email for guests)
  - [ ] Queue waiting indicator ("You are #2 in queue")
  - [ ] Sound notification on new agent message
  - [ ] Minimize / close / reopen chat

---

## ⚙️ Settings UI (Customer Account)

- [ ] `AccountSettingsComponent` — tabbed settings hub:
  - [ ] Personal Info tab — name, email, phone, birthday
  - [ ] Password tab — change password form
  - [ ] Notifications tab — `NotificationPreferencesComponent`
  - [ ] Security tab — 2FA setup, active sessions list, revoke session
  - [ ] Privacy tab — data export request, delete account request
  - [ ] Addresses tab — `AddressBookComponent`
  - [ ] Payment Methods tab — saved cards management (Stripe)

---

## 🏢 Back-Office UI (Admin Panel)

### Core Layout

- [ ] `AdminLayoutComponent` — sidebar navigation + header + breadcrumb
- [ ] `SidebarComponent` — collapsible menu with permission-aware items
- [ ] `DashboardComponent` — real-time KPI widgets + sales chart
  - [ ] Today's revenue, orders, new customers (with live Socket update)
  - [ ] Hourly sales line chart (recharts / ngx-charts)
  - [ ] Top 5 products of the day
  - [ ] Recent orders table
  - [ ] Low stock alerts widget
  - [ ] Notification feed panel

### Orders Management

- [ ] `OrderListComponent` — filterable, sortable, paginated table
- [ ] `OrderDetailComponent` — full order view with:
  - [ ] Status changer (state machine aware — invalid transitions disabled)
  - [ ] Customer info + address + payment method
  - [ ] Order items with images
  - [ ] Payment status + history
  - [ ] Shipment tracking + tracking number input
  - [ ] Invoice download / re-generate
  - [ ] Internal notes panel
  - [ ] Order history timeline (who changed what)
- [ ] `OrderBulkActionsComponent` — change status / export selected orders

### Product Management

- [ ] `ProductListComponent` — admin product table with stock indicators
- [ ] `ProductFormComponent` — complex product creation/edit form:
  - [ ] General info tab (name, reference, description, categories)
  - [ ] Pricing tab (base price, tax rule, specific prices)
  - [ ] Combinations tab (attribute matrix, variant prices/stock)
  - [ ] Images tab (drag-drop multi-upload, cover selection, reorder)
  - [ ] SEO tab (meta title, description, URL slug)
  - [ ] Features tab (product feature assignment)
  - [ ] Shipping tab (dimensions, weight, carrier restrictions)
- [ ] `StockManagementComponent` — bulk stock update table

### Customer Management

- [ ] `CustomerListComponent` — filterable customer table
- [ ] `CustomerDetailComponent` — profile, order history, addresses, notes, account status
- [ ] `CustomerGroupsComponent` — manage groups and discount rules
- [ ] `ImpersonateButton` — support agent login-as-customer

### Catalog Management

- [ ] `CategoryTreeComponent` — drag-drop sortable tree
- [ ] `CategoryFormComponent` — create/edit with image upload
- [ ] `AttributeGroupsComponent` — manage attributes and values
- [ ] `FeaturesComponent` — manage feature keys and values

### Pricing & Promotions

- [ ] `SpecificPricesComponent` — list and manage all discount rules
- [ ] `CouponsComponent` — coupon management table + create form
- [ ] `FlashSalesComponent` — time-limited sales dashboard

### Shipping Management

- [ ] `CarrierListComponent` — list/enable/disable carriers
- [ ] `CarrierFormComponent` — create/edit carrier with zone+rate matrix
- [ ] `ShipmentQueueComponent` — orders awaiting shipment dispatch
- [ ] `ShipmentDetailComponent` — tracking input + label print

### Payment Management

- [ ] `PaymentDashboardComponent` — all transactions with provider filter
- [ ] `RefundFormComponent` — initiate full or partial refund
- [ ] `ReconciliationComponent` — daily payment reconciliation view

### Roles & Permissions Management

- [ ] `RoleListComponent` — all roles with employee count
- [ ] `RoleFormComponent` — create/edit role
- [ ] `PermissionsMatrixComponent` — interactive grid (resource × action checkboxes)
- [ ] `EmployeeListComponent` — all employees with role badges
- [ ] `EmployeeFormComponent` — create/edit employee + assign roles

### Settings Panel

- [ ] `SettingsLayoutComponent` — grouped settings navigation
- [ ] `GeneralSettingsComponent` — shop name, logo, timezone, maintenance mode
- [ ] `PaymentSettingsComponent` — per-provider credentials form
- [ ] `ShippingSettingsComponent` — origin address, default carrier, free shipping rules
- [ ] `EmailSettingsComponent` — SMTP/API config + test email button
- [ ] `SecuritySettingsComponent` — password policy, session timeout, IP whitelist
- [ ] `NotificationSettingsComponent` — default preferences, admin alert recipients
- [ ] `LanguageCurrencyComponent` — manage languages and currencies

### Analytics & Reports

- [ ] `AnalyticsDashboardComponent` — date-range picker + KPI grid
- [ ] `SalesChartComponent` — interactive time-series chart (line/bar toggle)
- [ ] `TopProductsComponent` — best sellers table with trend arrows
- [ ] `CustomerInsightsComponent` — new vs returning, retention curve
- [ ] `ReportExportComponent` — select date range + format → async download

### CMS Management

- [ ] `CmsPagesComponent` — list + CRUD for static pages
- [ ] `RichTextEditorComponent` — WYSIWYG wrapper (Quill or TipTap)
- [ ] `BannersComponent` — banner management with preview
- [ ] `HomepageBuilderComponent` — drag-drop block reordering

### Support Ticket Management (Admin)

- [ ] `TicketQueueComponent` — open tickets sorted by priority
- [ ] `TicketDetailComponent` — full thread + assign + status change
- [ ] `LiveChatDashboardComponent` — active/waiting chat sessions + agent assignment

---

## 🎨 UI Kit — Design System (`libs/storefront/ui-kit`)

- [ ] `ButtonComponent` — variants: Primary, Secondary, Ghost, Danger + loading state + icon support
- [ ] `InputComponent` — Text, Number, Password with label, hint, error message, prefix/suffix
- [ ] `SelectComponent` — searchable dropdown wrapping PrimeNG Select
- [ ] `MultiSelectComponent` — PrimeNG MultiSelect with chip display
- [ ] `DatePickerComponent` — range-capable date picker (PrimeNG Calendar)
- [ ] `TextareaComponent` — auto-resize + character counter
- [ ] `CheckboxComponent` — with indeterminate state
- [ ] `RadioGroupComponent` — styled radio button group
- [ ] `ToggleSwitchComponent` — on/off toggle with label
- [ ] `SliderComponent` — price range slider (min/max handles)
- [ ] `BadgeComponent` — stock status, order status, promo label (semantic colors)
- [ ] `ChipComponent` — removable tag/filter chip
- [ ] `AlertComponent` — info, success, warning, error banners with icon + dismiss
- [ ] `ToastService` — global toast notifications (top-right, auto-dismiss, stacked)
- [ ] `SkeletonComponent` — content placeholder with shimmer animation
- [ ] `ModalComponent` — accessible dialog wrapper (focus trap, ESC close, backdrop click)
- [ ] `DrawerComponent` — side panel (left/right) for filters, cart, chat
- [ ] `PaginatorComponent` — page navigation with page size selector
- [ ] `InfiniteScrollDirective` — intersection observer-based infinite loading
- [ ] `RatingComponent` — star rating display + interactive input
- [ ] `BreadcrumbComponent` — dynamic route-aware breadcrumb
- [ ] `EmptyStateComponent` — zero-data illustration + CTA
- [ ] `AvatarComponent` — user initials + fallback image
- [ ] `StepperComponent` — checkout/wizard step indicator
- [ ] `TabsComponent` — accessible tab panel
- [ ] `AccordionComponent` — FAQ / expandable sections
- [ ] `DataTableComponent` — sortable, filterable, paginated table wrapper
- [ ] `CountdownTimerComponent` — flash sale / payment expiry countdown
- [ ] `ProgressBarComponent` — stock level / upload progress
- [ ] `CopyToClipboardDirective` — copy order ref, tracking number, etc.
- [ ] **Dark mode** — CSS custom properties + theme toggle persisted in localStorage
- [ ] **Storybook** — isolated component documentation + visual regression tests (Chromatic)

---

## ⚡ Frontend Performance & Quality

- [ ] **Core Web Vitals budget** — LCP < 2.5s, CLS < 0.1, INP < 200ms (monitored via Lighthouse CI)
- [ ] **Image optimization** — `NgOptimizedImage` + `loading="lazy"` + srcset for WebP/AVIF
- [ ] **Route-level code splitting** — every feature module lazy-loaded
- [ ] **Server-Side Rendering (SSR)** — Angular Universal for SEO-critical pages (category, product, CMS)
- [ ] **Prerendering** — static generation for top category and bestseller product pages
- [ ] **Apollo cache persistence** — restore GraphQL cache from IndexedDB on page load
- [ ] **Service Worker** — offline product browsing, background sync for cart
- [ ] **Cypress E2E tests** — critical journeys: search → PDP → cart → checkout → payment
- [ ] **Unit Tests** — Vitest + Angular Testing Library, coverage > 75%
- [ ] **Accessibility (a11y)** — WCAG 2.1 AA compliance audit (axe-core integration)
- [ ] **Bundle analysis** — `source-map-explorer` on each release, alert on regressions
- [ ] **Error tracking** — Sentry integration for both frontend runtime errors and performance
- [ ] **Feature flags** — LaunchDarkly or local flag service for gradual rollouts

---

---

---

# 📧 Email Messaging System (Inbox & Compose)

---

## Backend — Email Messaging

### Prisma Models

- [ ] `EmailMessage` — internal message between customer and store
  ```
  id, threadId, senderId, senderType (CUSTOMER | EMPLOYEE | SYSTEM),
  recipientId, recipientType, subject, body (Html), isRead,
  readAt, isStarred, isArchived, isDeleted, attachments (Json),
  sentAt, dateAdd
  ```
- [ ] `EmailThread` — conversation grouping
  ```
  id, subject, participantIds (Json), lastMessageAt,
  status (OPEN | CLOSED | SPAM), category, dateAdd
  ```
- [ ] `EmailDraft` — saved unsent drafts
  ```
  id, authorId, authorType, recipientId, recipientType,
  subject, body, attachments (Json), savedAt
  ```
- [ ] `EmailTemplate` — reusable admin message templates
  ```
  id, name, subject, body (Html), variables (Json),
  category, isActive, dateAdd
  ```
- [ ] `EmailAttachment` — file attachments metadata
  ```
  id, messageId, filename, mimeType, size, storageKey, dateAdd
  ```
- [ ] `EmailLabel` — custom labels/folders per user
  ```
  id, userId, userType, name, color, position
  ```

### Backend Services

- [ ] `MessagingService`:
  - [ ] `sendMessage(senderId, recipientId, subject, body, attachments?)` — create thread + first message
  - [ ] `replyToThread(threadId, senderId, body, attachments?)` — append to thread
  - [ ] `getInbox(userId, filters, pagination)` — paginated inbox with unread count
  - [ ] `getThread(threadId)` — full conversation with all messages
  - [ ] `markAsRead(messageId)` — mark single message read
  - [ ] `markThreadAsRead(threadId)` — mark all messages in thread read
  - [ ] `starMessage(messageId)` — toggle star
  - [ ] `archiveThread(threadId)` — move to archive
  - [ ] `deleteMessage(messageId)` — soft delete
  - [ ] `saveDraft(input)` — save draft with auto-save support
  - [ ] `sendDraft(draftId)` — finalize and send a saved draft
  - [ ] `searchMessages(query, userId)` — full-text search in subject + body (MeiliSearch)
  - [ ] `getUnreadCount(userId)` — badge count
  - [ ] `applyLabel(messageId, labelId)` — organize with custom labels
  - [ ] `reportSpam(threadId)` — mark as spam + auto-block sender
- [ ] `EmailAttachmentService`:
  - [ ] `uploadAttachment(file, messageId)` — upload to S3/R2 + return key
  - [ ] `getSignedUrl(attachmentId)` — generate short-lived download URL
  - [ ] `deleteAttachment(id)` — remove from storage + DB
- [ ] `EmailTemplateService`:
  - [ ] `getTemplates(category?)` — list available templates
  - [ ] `applyTemplate(templateId, variables)` — interpolate and return composed body
  - [ ] CRUD for email templates (admin only)

### Real-Time Inbox Updates

- [ ] **WebSocket event** `new_message` — push to recipient on message send
- [ ] **WebSocket event** `message_read` — sync read status across tabs/devices
- [ ] **WebSocket event** `typing_indicator` — show "... is typing" in thread view
- [ ] **BullMQ queue** — async email notification dispatch on new message

### GraphQL Endpoints

- [ ] Query: `myInbox(filters, pagination)` — paginated thread list
- [ ] Query: `thread(id)` — full thread with messages
- [ ] Query: `myDrafts` — saved drafts
- [ ] Query: `searchMessages(query)` — full-text search
- [ ] Query: `unreadMessagesCount` — badge counter
- [ ] Query: `emailTemplates(category?)` — admin templates list
- [ ] Mutation: `sendMessage(input)` — compose and send
- [ ] Mutation: `replyToThread(threadId, body, attachments?)`
- [ ] Mutation: `saveDraft(input)`
- [ ] Mutation: `sendDraft(draftId)`
- [ ] Mutation: `markAsRead(messageId)`
- [ ] Mutation: `markThreadAsRead(threadId)`
- [ ] Mutation: `starMessage(messageId)`
- [ ] Mutation: `archiveThread(threadId)`
- [ ] Mutation: `deleteMessage(messageId)`
- [ ] Mutation: `applyLabel(messageId, labelId)`
- [ ] Mutation: `createEmailLabel(name, color)`
- [ ] Mutation: `createEmailTemplate(input)` — admin
- [ ] Subscription: `newMessageReceived` — real-time inbox push
- [ ] Subscription: `threadUpdated(threadId)` — live reply sync

### Advanced Robustness

- [ ] **Auto-reply** — configurable out-of-office or welcome auto-reply per recipient
- [ ] **Message quoting** — inline reply with quoted original message
- [ ] **Read receipts** — optional sender notification when message is read
- [ ] **Message retention policy** — auto-archive/delete messages older than N days
- [ ] **Spam filtering** — keyword blacklist + sender block list
- [ ] **Attachment virus scan** — ClamAV scan before storing attachment
- [ ] **Max attachment size** — configurable per role (e.g. 10MB customer, 25MB employee)
- [ ] **Priority flag** — mark message as URGENT for admin queue sorting
- [ ] **Message export** — download full thread as PDF (admin)

---

## Frontend — Email Messaging UI

- [ ] `MailboxComponent` — Gmail-style two-panel layout
  - [ ] Left sidebar: Inbox, Sent, Drafts, Starred, Archive, Spam, custom labels
  - [ ] Thread list panel with unread count badges
  - [ ] Thread detail panel with full conversation
- [ ] `ThreadListComponent` — sortable, filterable list
  - [ ] Unread threads highlighted in bold
  - [ ] Star toggle per row
  - [ ] Multi-select + bulk actions (mark read, archive, delete)
  - [ ] Infinite scroll loading
- [ ] `ThreadDetailComponent` — full conversation view
  - [ ] Stacked message bubbles (customer vs employee color-coded)
  - [ ] "Reply" inline compose form at bottom
  - [ ] Attachment download chips per message
  - [ ] Typing indicator ("Store is typing...")
  - [ ] Collapse older messages (show only last 3)
  - [ ] Print thread button
- [ ] `ComposeModalComponent` — full compose overlay
  - [ ] Rich text editor (TipTap / Quill) with formatting toolbar
  - [ ] Recipient autocomplete from customer list
  - [ ] Subject line input
  - [ ] Attachment drag-and-drop upload zone with progress bars
  - [ ] Template selector dropdown
  - [ ] "Save Draft" auto-trigger every 30 seconds
  - [ ] Send button with loading state
- [ ] `MessageBubbleComponent` — single message display
  - [ ] Avatar + name + timestamp
  - [ ] Read receipt indicator (double checkmark)
  - [ ] Inline image preview in body
  - [ ] Attachment list with file type icons
- [ ] `InboxBadgeComponent` — header icon with unread count (real-time via WebSocket)
- [ ] `EmailLabelManagerComponent` — create/rename/delete/recolor custom labels
- [ ] `EmailSearchComponent` — full-text search input with highlighted results

---

---

# 💬 In-App Chat System (Customer ↔ Store)

---

## Backend — In-App Chat

### Prisma Models

- [ ] `ChatRoom` — chat room between customer and store
  ```
  id, customerId, assignedEmployeeId?, status
  (WAITING | ACTIVE | IDLE | CLOSED), topic?,
  waitingSince, lastActivityAt, closedAt, dateAdd
  ```
- [ ] `ChatMessage` — individual chat message
  ```
  id, roomId, senderId, senderType (CUSTOMER | EMPLOYEE | BOT),
  type (TEXT | IMAGE | FILE | SYSTEM | QUICK_REPLY),
  body, fileUrl?, fileName?, fileMime?, fileSize?,
  isRead, readAt, replyToId?, reactions (Json), dateAdd
  ```
- [ ] `ChatQuickReply` — predefined quick-reply buttons
  ```
  id, label, value, category, position, isActive
  ```
- [ ] `ChatbotFlow` — simple rule-based chatbot flows
  ```
  id, trigger (keyword/pattern), responseType (TEXT | QUICK_REPLIES | HANDOFF),
  response (Json), isActive, priority
  ```
- [ ] `AgentStatus` — real-time agent availability
  ```
  id, employeeId, status (ONLINE | BUSY | AWAY | OFFLINE),
  maxConcurrentChats, currentChatCount, updatedAt
  ```
- [ ] `ChatCannedResponse` — saved responses for agents
  ```
  id, employeeId?, shortcut, title, body, isGlobal, dateAdd
  ```
- [ ] `ChatSatisfactionRating` — post-chat CSAT survey
  ```
  id, roomId, customerId, score (1-5), comment?, dateAdd
  ```

### Backend Services

- [ ] `ChatService`:
  - [ ] `openRoom(customerId, topic?)` — create or reopen room
  - [ ] `sendMessage(roomId, senderId, senderType, message)` — deliver message
  - [ ] `sendFileMessage(roomId, senderId, file)` — upload + send file
  - [ ] `getRoomHistory(roomId, pagination)` — paginated message history
  - [ ] `markMessagesRead(roomId, userId)` — mark all unread as read
  - [ ] `closeRoom(roomId, agentId)` — close + trigger CSAT survey
  - [ ] `addReaction(messageId, emoji, userId)` — emoji reaction
  - [ ] `deleteMessage(messageId)` — soft delete (agent only)
  - [ ] `editMessage(messageId, newBody)` — edit within 5min window
- [ ] `AgentQueueService`:
  - [ ] `getWaitingRooms()` — rooms waiting for agent assignment
  - [ ] `assignAgent(roomId, employeeId)` — manual assignment
  - [ ] `autoAssign(roomId)` — round-robin to least-busy available agent
  - [ ] `transferChat(roomId, newEmployeeId)` — transfer + notify
  - [ ] `setAgentStatus(employeeId, status)` — update availability
  - [ ] `getAgentStats(employeeId)` — chats handled, avg response time
- [ ] `ChatbotService`:
  - [ ] `processMessage(roomId, message)` — match trigger → auto-reply
  - [ ] `triggerHandoff(roomId)` — bot → human escalation
  - [ ] `sendQuickReplies(roomId, options[])` — interactive option buttons
- [ ] `CannedResponseService`:
  - [ ] `search(query, agentId)` — search by shortcut or keyword
  - [ ] CRUD for personal + global canned responses

### WebSocket Gateway — Chat

- [ ] `ChatGateway` (`@WebSocketGateway('/chat')`):
  - [ ] `chat:join(roomId)` — subscribe to room events
  - [ ] `chat:message` — real-time message delivery
  - [ ] `chat:typing_start` / `chat:typing_stop` — typing indicator
  - [ ] `chat:read` — read receipt broadcast
  - [ ] `chat:reaction` — emoji reaction update
  - [ ] `chat:agent_joined` — agent assignment notification
  - [ ] `chat:room_closed` — close event with CSAT survey trigger
  - [ ] `chat:status_changed` — agent online/offline broadcast
  - [ ] Per-room namespacing via Socket.IO rooms
  - [ ] Redis adapter for multi-instance support

### GraphQL Endpoints

- [ ] Query: `myChatRoom` — customer's active room
- [ ] Query: `chatHistory(roomId, pagination)` — paginated messages
- [ ] Query: `waitingQueue` — admin: rooms waiting for agent
- [ ] Query: `myCannedResponses` — agent's saved responses
- [ ] Query: `quickReplies(category?)` — available quick reply options
- [ ] Mutation: `openChatRoom(topic?)`
- [ ] Mutation: `sendChatMessage(roomId, input)`
- [ ] Mutation: `closeChatRoom(roomId)`
- [ ] Mutation: `assignAgent(roomId, employeeId)`
- [ ] Mutation: `transferChat(roomId, newEmployeeId)`
- [ ] Mutation: `setAgentStatus(status)`
- [ ] Mutation: `submitChatRating(roomId, score, comment?)`
- [ ] Mutation: `createCannedResponse(input)`
- [ ] Subscription: `chatMessageReceived(roomId)` — real-time message
- [ ] Subscription: `agentQueueUpdated` — admin: waiting rooms count

### Advanced Robustness

- [ ] **Chatbot first contact** — auto-greet + FAQ options before agent pickup
- [ ] **SLA monitoring** — alert if no agent responds within N minutes
- [ ] **Chat transcript** — email full conversation to customer on close
- [ ] **File type whitelist** — only allow images/PDF in chat uploads
- [ ] **Message encryption** — at-rest encryption for sensitive chat content
- [ ] **Chat analytics** — avg wait time, resolution time, CSAT score trend
- [ ] **Proactive chat trigger** — auto-open chat widget after N seconds on checkout page
- [ ] **Visitor tracking** — show agent what page customer is currently viewing

---

## Frontend — In-App Chat UI

- [ ] `ChatWidgetComponent` — floating launcher (bottom-right)
  - [ ] Animated bubble with unread badge
  - [ ] Click to open/minimize chat window
  - [ ] Proactive pop-up after 30s idle on checkout (configurable)
- [ ] `ChatWindowComponent` — main chat interface
  - [ ] Header: agent avatar + name + online status dot
  - [ ] Message list with auto-scroll to latest
  - [ ] Date separators between message groups
  - [ ] Typing indicator (`...` animated dots)
  - [ ] Scroll-to-bottom FAB when scrolled up
  - [ ] Footer: text input + emoji picker + file attach + send button
- [ ] `ChatMessageComponent` — single message bubble
  - [ ] Left (agent/bot) vs right (customer) alignment
  - [ ] Avatar + timestamp
  - [ ] Text with clickable links auto-detected
  - [ ] Image preview with lightbox
  - [ ] File attachment download chip
  - [ ] Reply-to quote block
  - [ ] Emoji reactions row + add reaction picker
  - [ ] Read receipt tick (✓ sent, ✓✓ read)
  - [ ] Edit / Delete context menu (agent, within 5 min)
- [ ] `QuickReplyChipsComponent` — horizontal scrollable action buttons
- [ ] `ChatFileUploadComponent` — drag-and-drop or clip icon
  - [ ] Upload progress bar
  - [ ] Preview before send (image thumbnail)
  - [ ] File size / type validation with inline error
- [ ] `ChatPreFormComponent` — pre-chat info form for guests (name + email)
- [ ] `ChatRatingComponent` — post-close CSAT modal (1-5 stars + optional comment)
- [ ] **Admin Chat Dashboard**:
  - [ ] `ChatQueueComponent` — real-time waiting rooms list with wait time
  - [ ] `ActiveChatsComponent` — agent's current open conversations
  - [ ] `ChatRoomComponent` — full admin chat view with customer context panel
  - [ ] `CannedResponsePanelComponent` — `/shortcut` trigger inline search
  - [ ] `AgentStatusToggleComponent` — Online / Busy / Away selector in header
  - [ ] `ChatTransferModalComponent` — pick available agent to transfer to

---

---

# 📱 Social Sharing — Facebook & Instagram

---

## Backend — Social Sharing

### Prisma Models

- [ ] `SocialShare` — track share events for analytics
  ```
  id, productId?, pageId?, platform (FACEBOOK | INSTAGRAM | TWITTER | WHATSAPP | COPY_LINK),
  customerId?, sessionId, sharedUrl, shareCount, dateAdd
  ```
- [ ] `SocialConfig` — OAuth app credentials per platform
  ```
  id, platform, appId, appSecret, accessToken, tokenExpiresAt,
  pageId?, instagramAccountId?, isActive, dateAdd
  ```
- [ ] `SocialPost` — posts published to store's social pages
  ```
  id, platform, externalPostId, type (PRODUCT | PROMOTION | ANNOUNCEMENT | FLASH_SALE),
  caption, imageUrl, linkUrl, productId?, status (DRAFT | SCHEDULED | PUBLISHED | FAILED),
  scheduledAt?, publishedAt, engagements (Json), dateAdd
  ```

### Facebook Integration

- [ ] **Facebook App setup** — App ID, App Secret, OAuth redirect URI
- [ ] **Page Access Token** management — long-lived token refresh via cron
- [ ] `FacebookService`:
  - [ ] `publishProductPost(productId, caption?)` — post product with image to FB Page
  - [ ] `publishPromoPost(content, imageUrl, linkUrl)` — promotional post
  - [ ] `schedulePost(content, scheduledAt)` — schedule via Graph API
  - [ ] `deletePost(externalPostId)` — remove published post
  - [ ] `getPostInsights(externalPostId)` — reach, likes, shares, clicks
  - [ ] `getPageInsights(period)` — page-level analytics
  - [ ] `generateShareUrl(productId)` — OG-optimized shareable URL
- [ ] **Facebook Pixel** — server-side event tracking (ViewContent, AddToCart, Purchase)
- [ ] **Facebook Catalog** — auto-sync product catalog via Product Feed XML/JSON
  - [ ] `generateProductFeedXml()` — full catalog feed for FB Commerce Manager
  - [ ] Scheduled daily regeneration (BullMQ cron)
  - [ ] Feed available at `GET /feeds/facebook-catalog.xml`

### Instagram Integration

- [ ] **Instagram Basic Display / Graph API** — via Facebook Business account
- [ ] `InstagramService`:
  - [ ] `publishProductImage(productId, caption)` — post product image to IG feed
  - [ ] `publishCarousel(productIds[], caption)` — multi-image carousel post
  - [ ] `publishStory(imageUrl, linkUrl?)` — story post (Business account)
  - [ ] `addProductTag(postId, productId, coordinates)` — shopping product tag
  - [ ] `getPostInsights(externalPostId)` — reach, impressions, likes, saves
  - [ ] `schedulePost(content, scheduledAt)` — schedule via Creator Studio API
- [ ] **Instagram Shopping** — link store catalog to Instagram Shop
  - [ ] Product catalog sync for Instagram Product Tags
  - [ ] `GET /feeds/instagram-catalog.json` — Instagram-format feed

### Social Share Tracking

- [ ] `SocialShareService`:
  - [ ] `trackShare(platform, resourceType, resourceId, userId?)` — analytics event
  - [ ] `getShareStats(productId)` — total shares per platform
  - [ ] `getTopSharedProducts(period, limit)` — analytics report

### Open Graph & Meta Tags

- [ ] `OgTagsService`:
  - [ ] `generateProductOgTags(productId)` — `og:title`, `og:description`, `og:image`, `og:price:amount`
  - [ ] `generateCategoryOgTags(categoryId)` — category share preview
  - [ ] `generatePromotionOgTags(promotionId)` — flash sale share card
- [ ] **Dynamic OG image generation** — Satori or Puppeteer screenshot for product cards
  - [ ] `GET /og/product/:id.png` — auto-generated OG image with product photo + name + price
  - [ ] Cached in Redis (TTL 1h) + served as static image

### GraphQL Endpoints

- [ ] Mutation: `publishToFacebook(input)` — post product/promo to FB Page
- [ ] Mutation: `publishToInstagram(input)` — post to IG feed
- [ ] Mutation: `schedulePost(platform, input, scheduledAt)`
- [ ] Mutation: `deletePost(platform, externalPostId)`
- [ ] Mutation: `trackSocialShare(platform, resourceType, resourceId)`
- [ ] Query: `postInsights(platform, externalPostId)` — engagement data
- [ ] Query: `pageInsights(platform, period)` — page analytics
- [ ] Query: `topSharedProducts(period, limit)` — analytics

### Advanced Robustness

- [ ] **Token auto-refresh** — BullMQ cron to renew expiring access tokens
- [ ] **Webhook receiver** — Facebook webhooks for post comments, messages
- [ ] **Rate limit handling** — retry queue when hitting Graph API limits
- [ ] **Post scheduling queue** — BullMQ delayed jobs for scheduled posts
- [ ] **Multi-page support** — manage multiple FB/IG accounts per store
- [ ] **Content moderation** — flag/hide negative comments via webhook

---

## Frontend — Social Sharing UI

- [ ] `ShareButtonComponent` — universal share button with platform selector
  - [ ] Facebook share (Web Share API or `fb-share-dialog` URL)
  - [ ] Instagram share (copy link + open Instagram app on mobile)
  - [ ] WhatsApp share (deep link with pre-filled message)
  - [ ] Twitter/X share (tweet compose with OG preview)
  - [ ] Copy link button with clipboard feedback
  - [ ] Native Share API for mobile (`navigator.share`)
- [ ] `ProductShareCardComponent` — floating share panel on product detail
  - [ ] OG image preview of what will be shared
  - [ ] Editable caption before posting to Facebook/Instagram
  - [ ] Platform icons with share count badges
- [ ] `SocialPublisherComponent` — admin tool to post to social media
  - [ ] Select platform (Facebook / Instagram)
  - [ ] Select product(s) or write custom content
  - [ ] Image selector (product images or upload custom)
  - [ ] Caption editor with character counter per platform
  - [ ] Schedule toggle + datetime picker
  - [ ] Preview how post will look on each platform
  - [ ] Post history table with engagement metrics
- [ ] `SocialInsightsDashboardComponent` — admin analytics
  - [ ] Reach, impressions, clicks per post
  - [ ] Top performing posts grid
  - [ ] Share events heatmap per product
- [ ] `FacebookCatalogStatusComponent` — last sync time + product count + errors
- [ ] **OG preview on share** — dynamically rendered product card when link pasted in Facebook/WhatsApp

---

---

# 🔐 Advanced Authentication System

---

## OAuth2 Social Login (Google, Facebook, Apple)

### Backend

- [ ] **Passport.js strategies**:
  - [ ] `passport-google-oauth20` — Google Sign-In (PKCE flow)
  - [ ] `passport-facebook` — Facebook Login
  - [ ] `passport-apple` — Sign in with Apple (JWT-based)
- [ ] Prisma model `OAuthConnection`
  ```
  id, customerId, provider (GOOGLE | FACEBOOK | APPLE),
  providerId, email, accessToken, refreshToken,
  tokenExpiresAt, profileData (Json), dateAdd
  ```
- [ ] `OAuthService`:
  - [ ] `handleCallback(provider, profile, tokens)` — find or create customer
  - [ ] `linkAccount(customerId, provider, tokens)` — link new OAuth to existing account
  - [ ] `unlinkAccount(customerId, provider)` — disconnect OAuth provider
  - [ ] `getLinkedProviders(customerId)` — list connected social accounts
- [ ] Endpoints:
  - [ ] `GET /auth/google` — redirect to Google consent
  - [ ] `GET /auth/google/callback` — handle callback, issue JWT
  - [ ] `GET /auth/facebook` — redirect to Facebook consent
  - [ ] `GET /auth/facebook/callback` — handle callback, issue JWT
  - [ ] `GET /auth/apple` — redirect to Apple consent
  - [ ] `POST /auth/apple/callback` — handle Apple POST callback
- [ ] **Account merging** — if OAuth email matches existing account, auto-link
- [ ] **Conflict resolution** — if email used by multiple providers, prompt merge

### Frontend

- [ ] `SocialLoginButtonsComponent`:
  - [ ] "Continue with Google" button (official brand style)
  - [ ] "Continue with Facebook" button (official brand style)
  - [ ] "Sign in with Apple" button (official Apple guidelines)
  - [ ] Divider "— or —" between social and email login
- [ ] `LinkedAccountsComponent` — in account settings:
  - [ ] List connected providers with "Connect" / "Disconnect" toggle
  - [ ] Warning if disconnecting last login method
- [ ] `OAuthCallbackComponent` — handle redirect, extract JWT, redirect to `returnUrl`

---

## 2FA — Two-Factor Authentication (TOTP + Authenticator App)

### Backend

- [ ] Prisma model `TwoFactorAuth`
  ```
  id, userId, userType (EMPLOYEE | CUSTOMER),
  secret (encrypted), isEnabled, enabledAt,
  backupCodes (encrypted Json), lastUsedAt
  ```
- [ ] `TwoFactorService`:
  - [ ] `generateSecret(userId)` — create TOTP secret + return QR Code URI
  - [ ] `getQrCodeUri(secret, label)` — `otpauth://totp/...` URI for authenticator apps
  - [ ] `generateQrCodeImage(uri)` — base64 PNG QR code via `qrcode` library
  - [ ] `verifyToken(userId, token)` — validate 6-digit TOTP code (30s window + 1 drift)
  - [ ] `enableTwoFactor(userId, token)` — confirm setup with first valid code
  - [ ] `disableTwoFactor(userId, token)` — disable with confirmation code
  - [ ] `generateBackupCodes(userId)` — 10 single-use recovery codes (hashed in DB)
  - [ ] `verifyBackupCode(userId, code)` — consume a backup code (mark used)
  - [ ] `regenerateBackupCodes(userId)` — invalidate old + generate fresh 10 codes
  - [ ] `isTwoFactorRequired(userId)` — check if 2FA enforced by role/policy
- [ ] **Login flow with 2FA**:
  - [ ] Step 1: `POST /auth/login` → if 2FA enabled, return `{ requires2FA: true, tempToken }`
  - [ ] Step 2: `POST /auth/2fa/verify` → validate TOTP + exchange tempToken for full JWT
  - [ ] Temp token: short-lived JWT (5min), scoped only to 2FA verification
- [ ] **Force 2FA policy** — `SuperAdmin` can mandate 2FA for all `Employee` accounts
- [ ] **2FA grace period** — N-day grace before enforcement kicks in after policy change
- [ ] **Trusted devices** — skip 2FA for 30 days on trusted device (cookie + Redis)
- [ ] **Recovery flow** — if authenticator lost, use backup code to disable 2FA

### Supported Authenticator Apps

- [ ] ✅ Google Authenticator
- [ ] ✅ Microsoft Authenticator
- [ ] ✅ Authy
- [ ] ✅ 1Password
- [ ] ✅ Bitwarden Authenticator
- [ ] ✅ Any TOTP-compatible app (RFC 6238 standard)

### GraphQL Endpoints

- [ ] Query: `twoFactorStatus` — is 2FA enabled? backup codes count remaining?
- [ ] Mutation: `initTwoFactorSetup` — returns secret + QR code image (base64)
- [ ] Mutation: `confirmTwoFactorSetup(token)` — enable 2FA after scanning QR
- [ ] Mutation: `disableTwoFactor(token)` — disable with current TOTP code
- [ ] Mutation: `generateBackupCodes` — returns fresh backup codes (shown once)
- [ ] Mutation: `verifyTwoFactor(tempToken, totpCode)` — step 2 of login
- [ ] Mutation: `verifyBackupCode(tempToken, backupCode)` — recovery login

### Frontend — 2FA Setup Flow

- [ ] `TwoFactorSetupComponent` — guided setup wizard:
  - [ ] Step 1: Intro screen — "Secure your account" explanation + why it matters
  - [ ] Step 2: QR Code display
    - [ ] Large scannable QR code image
    - [ ] Manual entry code (formatted: `XXXX XXXX XXXX XXXX`)
    - [ ] Links: "Open Google Authenticator", "Open Microsoft Authenticator", "Open Authy"
    - [ ] App download links (iOS + Android) if no app installed
  - [ ] Step 3: Verification
    - [ ] 6-digit OTP input (auto-advance on 6th digit)
    - [ ] 30-second countdown visual (TOTP refresh indicator)
    - [ ] "Code doesn't work?" hint text
    - [ ] Resend / regenerate secret button
  - [ ] Step 4: Backup codes
    - [ ] Grid of 10 backup codes (copy-all button + download as .txt)
    - [ ] Confirmation checkbox: "I have saved my backup codes"
    - [ ] Warning: "These codes will only be shown once"
  - [ ] Step 5: Success confirmation
- [ ] `TwoFactorLoginComponent` — login step 2:
  - [ ] "Enter the 6-digit code from your authenticator app" prompt
  - [ ] Auto-submitting OTP input (submit on 6th character)
  - [ ] TOTP refresh ring animation (30-second countdown)
  - [ ] "Use a backup code instead" link
  - [ ] "Trust this device for 30 days" checkbox
  - [ ] Resend not applicable (TOTP is time-based — show refresh hint)
- [ ] `BackupCodeLoginComponent` — recovery:
  - [ ] Single input for 8-character backup code
  - [ ] Warning: "This code will be invalidated after use"
  - [ ] Link to contact support if all codes lost
- [ ] `TwoFactorManagementComponent` — in security settings:
  - [ ] Enabled/disabled status badge
  - [ ] "Disable 2FA" button (requires current TOTP confirmation)
  - [ ] Backup codes section: remaining count + "Regenerate" button
  - [ ] Trusted devices list with revoke option
  - [ ] Last 2FA verification timestamp

### Advanced Robustness

- [ ] **TOTP secret encryption** — encrypt secret at rest using AES-256-GCM (app-level encryption key)
- [ ] **Replay attack prevention** — store last used TOTP timestamp in Redis, reject reuse
- [ ] **Brute force protection** — lockout after 5 failed TOTP attempts (5min cooldown)
- [ ] **Audit log** — log every 2FA enable/disable/verify event with IP + User-Agent
- [ ] **Admin override** — SuperAdmin can reset 2FA for locked-out employee (with audit trail)
- [ ] **SMS fallback** — optional SMS OTP if authenticator app unavailable (lower security, opt-in)

---

## Auth Confirmation Code (Email / SMS OTP)

### Use Cases

- [ ] Email verification on registration (6-digit OTP, TTL 15min)
- [ ] Phone number verification for MVola/AirtelMoney (6-digit SMS OTP)
- [ ] Sensitive action confirmation (delete account, large order, address change)
- [ ] Password reset via OTP (alternative to magic link)
- [ ] Employee invite acceptance

### Backend

- [ ] Prisma model `OtpCode`
  ```
  id, userId, userType, purpose (VERIFY_EMAIL | VERIFY_PHONE |
  RESET_PASSWORD | CONFIRM_ACTION | INVITE),
  code (hashed), expiresAt, usedAt, attempts, dateAdd
  ```
- [ ] `OtpService`:
  - [ ] `generate(userId, purpose)` — create + store hashed OTP (6-digit numeric)
  - [ ] `send(userId, purpose, channel)` — dispatch via email or SMS
  - [ ] `verify(userId, purpose, code)` — validate + consume (one-time use)
  - [ ] `resend(userId, purpose)` — regenerate + resend (cooldown 60s)
  - [ ] `invalidateAll(userId, purpose)` — invalidate on password change
- [ ] Rate limiting: max 3 sends per hour per user per purpose
- [ ] Max 5 verification attempts before code is invalidated

### Frontend

- [ ] `OtpInputComponent` — 6-box split digit input
  - [ ] Auto-advance focus on each digit entry
  - [ ] Paste support (auto-split pasted 6-digit string)
  - [ ] Backspace navigates to previous box
  - [ ] Shake animation on wrong code
  - [ ] Auto-submit on last digit
- [ ] `OtpVerificationComponent` — wrapper screen:
  - [ ] "We sent a code to [email/phone]" message
  - [ ] `OtpInputComponent` centered
  - [ ] 60-second resend countdown + "Resend code" link
  - [ ] "Change email/phone" link
  - [ ] Remaining attempts indicator (shown after 1st failure)
- [ ] `EmailVerificationBannerComponent` — top-of-page banner for unverified email
  - [ ] "Please verify your email address" + resend button
  - [ ] Dismissible (but reappears on next session)

---

---

# 📊 Complete Analytics & Social Performance

---

## Backend — Social & Share Analytics

- [ ] `SocialAnalyticsService`:
  - [ ] `getShareHeatmap(productId)` — shares per platform per day
  - [ ] `getTopSharedProducts(period, limit)`
  - [ ] `getSocialTrafficConversion(platform)` — social visits that converted to orders
  - [ ] `getPostPerformance(platform, period)` — reach + clicks + conversions per post
  - [ ] `comparePostPerformance(postIds[])` — A/B style comparison

## Frontend — Unified Analytics Dashboard

- [ ] `SocialAnalyticsComponent` — admin analytics panel
  - [ ] Share volume chart per platform (stacked bar)
  - [ ] Top 10 most shared products
  - [ ] Post engagement table (reach, clicks, orders attributed)
  - [ ] Revenue attributed to social traffic
  - [ ] Facebook vs Instagram comparison chart

---

*Last updated: May 2026 — v4.0.0*
