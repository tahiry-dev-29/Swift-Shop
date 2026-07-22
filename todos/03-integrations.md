# 🔌 INTEGRATIONS & INFRA — Payment Adapters, Shipping Adapters, Production Readiness, Serverless DB

---

## 💳 Payment Adapters — Real Integrations

gwt-new ../payment-adapters feat/payment-adapters

Replace `LocalPaymentAdapter` stubs with real API integrations for each payment gateway.

### 🔴 Stripe — Credit Card

- [ ] `StripePaymentAdapter` — implements `PaymentAdapter`
- [ ] `createPaymentIntent` — create payment intent
- [ ] `confirmPayment` — client-side confirmation
- [ ] `webhookHandler` — listen to `payment_intent.succeeded`, `payment_intent.failed`
- [ ] Refund management via Stripe API
- [ ] Stripe Checkout Session for simplified payments
- [ ] Error and timeout handling
- [ ] Unit tests + sandbox mode

### 🔴 MVola — Mobile Money Madagascar

- [ ] `MvolaPaymentAdapter` — implements `PaymentAdapter`
- [ ] MVola API: `POST /mvola/api/1.0/transactions/request` (initiate payment)
- [ ] MVola API: `GET /mvola/api/1.0/transactions/status/{serverCorrelationId}` (check status)
- [ ] HMAC signature validation for MVola callbacks
- [ ] Handle MVola callbacks (webhook)
- [ ] Transaction status polling (callback + fallback polling)
- [ ] Refund via MVola API
- [ ] MVola sandbox tests

### 🟠 AirtelMoney — Mobile Money Madagascar

- [ ] `AirtelPaymentAdapter` — implements `PaymentAdapter`
- [ ] Airtel Money API: Cash In / Payment request
- [ ] Airtel Money API: Transaction status query
- [ ] Webhook handler Airtel
- [ ] HMAC/Basic Auth for callbacks
- [ ] Status polling (fallback)
- [ ] Refund via Airtel API
- [ ] Airtel sandbox tests

### ⚪ PayPal — International Complement

- [ ] `PayPalPaymentAdapter` — implements `PaymentAdapter`
- [ ] PayPal Orders API v2
- [ ] Webhook handler PayPal
- [ ] Refund via PayPal

### 🟢 COD & Manual

- [ ] `CodPaymentAdapter` — already stub, verify functionality
- [ ] `ManualPaymentAdapter` — already stub, verify functionality

### 🧪 Payment Tests & Validation

- [ ] Unit tests for each adapter
- [ ] Sandbox integration tests (Stripe test keys, MVola sandbox, Airtel sandbox)
- [ ] E2E: complete payment flow → confirmed order
- [ ] Network error handling (retry, timeout, fallback)

### 📦 Payment Dependencies

- [x] `stripe` SDK — already installed
- [ ] `axios` for MVola/Airtel HTTP calls
- [ ] Environment variables: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `MVOLA_API_KEY`, `MVOLA_CONSUMER_KEY`, `AIRTEL_API_KEY`, `AIRTEL_API_SECRET`

---

## 🚚 Shipping Adapters — Real Integrations

gwt-new ../shipping-adapters feat/shipping-adapters

Replace `ManualCarrierAdapter` stubs with real API integrations for tracking and shipping.

### 📦 Existing Architecture

- [x] `CarrierAdapter` interface
- [x] `CarrierAdapterRegistry`
- [x] `ManualCarrierAdapter` — base stub
- [ ] Replace each stub with its real adapter

### 🇫🇷 Colissimo — La Poste France

- [ ] `ColissimoAdapter` — implements `CarrierAdapter`
- [ ] `generateLabel` — label generation via Colissimo API
- [ ] `trackShipment` — tracking via Colissimo API (status + events)
- [ ] `cancelShipment` — shipment cancellation
- [ ] Map Colissimo statuses → internal system statuses
- [ ] API error handling (timeout, rejection, etc.)
- [ ] Sandbox tests

### 🌍 DHL — International

- [ ] `DhlAdapter` — implements `CarrierAdapter`
- [ ] `createShipment` — shipment creation via DHL API
- [ ] `trackShipment` — tracking via DHL API
- [ ] `getRates` — real-time rate retrieval
- [ ] `cancelShipment` — cancellation
- [ ] DHL Developer Portal sandbox tests

### 🌍 FedEx — International

- [ ] `FedExAdapter` — implements `CarrierAdapter`
- [ ] `createShipment` — shipment creation via FedEx API
- [ ] `trackShipment` — tracking via FedEx API
- [ ] `getRates` — real-time rates
- [ ] `cancelShipment`
- [ ] FedEx sandbox tests

### 🇲🇬 Sodiat — Madagascar (Parcels & Express)

- [ ] `SodiatAdapter` — implements `CarrierAdapter`
- [ ] Sodiat API: waybill creation / tracking
- [ ] `trackShipment` — local status
- [ ] Sodiat tracking number handling
- [ ] Tests (Demo mode / staging if sandbox available)

### 🇲🇬 Espace Logistique — Madagascar

- [ ] `EspaceLogistiqueAdapter` — implements `CarrierAdapter`
- [ ] Espace Logistique API: drop-off / tracking
- [ ] `trackShipment` — local status
- [ ] Tests

### 🧩 Cross-Cutting Improvements

- [ ] `CarrierAdapter` — add `getRates()` method to interface
- [ ] `ShippingCalculationService` — call real-time rates if available
- [ ] `ShipmentEvent` — enrich events with carrier data
- [ ] Redis cache for rates (1h expiration)
- [ ] Webhook / callback for tracking updates
- [ ] Fallback: if carrier API unavailable, use `ManualCarrierAdapter`

### 🧪 Shipping Tests & Validation

- [ ] Unit tests for each adapter
- [ ] Sandbox integration tests (Colissimo testing, DHL sandbox, FedEx test)
- [ ] Resilience tests (timeout, API down → fallback manual)
- [ ] Mock HTTP calls for CI tests

### 🔐 Shipping Environment Variables

```env
COLISSIMO_API_KEY=
COLISSIMO_ACCOUNT_NUMBER=
DHL_API_KEY=
DHL_ACCOUNT_NUMBER=
FEDEX_API_KEY=
FEDEX_ACCOUNT_NUMBER=
SODIAT_API_KEY=
ESPACE_LOGISTIQUE_API_KEY=

---

## 🚀 Production Readiness

### 🔴 High Priority

#### 1. Externalize Coupon System

gwt-new ../coupon-system feat/coupon-system

Coupons `WELCOME10` (10%) and `FREESHIP` (5€ fixed) are hardcoded in `CartCouponService`. Impossible to add new ones without code changes.

- [ ] Prisma model `Coupon` (code, type: percent/fixed, value, usageLimit, usageCount, minCartTotal, validFrom, validTo, active)
- [ ] Prisma model `CouponUsage` (couponId, customerId, orderId, usedAt)
- [ ] `CouponService` — full CRUD + validation (expiration, max usage, minimum cart)
- [ ] Replace `COUPON_RULES` map in `CartCouponService` with DB query
- [ ] Migrate existing coupons (WELCOME10, FREESHIP) to DB
- [ ] Admin UI: `CouponFormComponent` with code generator, usage limits
- [ ] Unit + integration tests

#### 2. APM Metrics (Prometheus/Grafana)

gwt-new ../apm-metrics feat/apm-metrics

Health check `/api/health` exists but no application performance metrics.

- [ ] Install `@willsoto/nestjs-prometheus` or `prom-client`
- [ ] HTTP metrics: requests per route, latency (p50/p95/p99), 4xx/5xx errors
- [ ] GraphQL metrics: queries per operation, latency per resolver, errors
- [ ] Business metrics: orders/hour, abandoned carts, failed payments
- [ ] Infra metrics: DB connections, BullMQ queues (pending/active/failed jobs)
- [ ] Endpoint `GET /api/metrics` (Prometheus format)
- [ ] Pre-configured Grafana dashboard (importable)
- [ ] Alerts: latency > 2s, error rate > 5%, queue backlog > 1000

#### 3. Rate Limiting on GraphQL Mutations

gwt-new ../gql-rate-limit feat/gql-rate-limit

Rate limiting exists on auth endpoints (`AuthRateLimitGuard`) but not on other GraphQL mutations.

- [ ] Create `GqlThrottlerGuard` — global rate limiting for all GraphQL mutations
- [ ] Configure limits by scope:
  - Public mutations (cart, pricing): 30/minute
  - Authenticated mutations (orders, addresses): 60/minute
  - Admin mutations (CRUD products, employees): 120/minute
- [ ] Apply guard globally on `GraphQLModule`
- [ ] Exclude queries (reads) from rate limiting
- [ ] Log rate limiting violations

### 🟡 Medium Priority

#### 4. Backend E2E Tests (Playwright / Supertest)

gwt-new ../backend-e2e feat/backend-e2e

- [ ] Setup Playwright or Supertest for backend E2E tests
- [ ] E2E flow: register → login → add to cart → order → payment → invoice
- [ ] E2E flow: employee login → create product → manage order
- [ ] E2E flow: guest cart → guest checkout → account creation
- [ ] E2E flow: order cancellation → stock rollback verified
- [ ] E2E flow: support ticket → agent reply → resolution
- [ ] CI: run E2E on every PR

#### 5. Conversion Tracking Analytics

gwt-new ../conversion-tracking feat/conversion-tracking

`trackProductView` exists but no conversion funnel (view → cart → checkout → purchase).

- [ ] Prisma model `ConversionEvent` (sessionId, customerId, productId, eventType: VIEW/ADD_TO_CART/CHECKOUT_START/CHECKOUT_COMPLETE, timestamp, source)
- [ ] `ConversionTrackingService` — record each funnel step
- [ ] GraphQL: `trackConversion(input)` mutation
- [ ] Analytics: conversion rate per step, cart abandonment rate, checkout abandonment rate
- [ ] Dashboard: funnel visualization (view → cart → checkout → purchase)
- [ ] Correlate with acquisition sources (utm_source, utm_medium)

#### 6. Optimize Prisma Schema

gwt-new ../prisma-optimize feat/prisma-optimize

Schema is ~1392 lines with 40+ models. Migrations becoming complex.

- [ ] Audit models: identify unused or redundant models
- [ ] Group related models in commented blocks (Auth, Catalog, Commerce, etc.)
- [ ] Add frequent composite indexes (e.g., `Product + Category + Active`)
- [ ] Verify missing or overly deep relations
- [ ] Document migration strategy (versioning, rollback)
- [ ] Consider `prisma migrate diff` before each release

### 🟢 Low Priority

#### 7. Document Payment Webhooks for Integrators

gwt-new ../webhook-docs feat/webhook-docs

- [ ] Create `docs/webhooks.md` with:
  - Payload format per provider (Stripe, MVola, Airtel, PayPal)
  - HMAC signature: how to verify
  - Error codes and retry policy
  - curl examples for testing
  - Sandbox guide (test keys, test endpoints)
- [ ] Swagger/OpenAPI: document `processPaymentWebhook`
- [ ] Admin help page: webhook status, error logs

#### 8. Redis Cache for GraphQL Responses

gwt-new ../graphql-cache feat/graphql-cache

- [ ] Install `@nestjs/cache-manager` + `cache-manager-redis-store`
- [ ] Cache public queries:
  - `products`: TTL 5 min, invalidation on update
  - `product(id)`: TTL 5 min
  - `categories`: TTL 10 min
  - `calculatePrice`: TTL 1 min
- [ ] Targeted invalidation: `@CacheEvict` on corresponding mutations
- [ ] Monitoring: hit/miss ratio in Prometheus metrics

#### 9. DB Performance Indexes

gwt-new ../db-indexes feat/db-indexes

- [ ] `Product(categoryId, active)` — catalog search
- [ ] `Order(customerId, createdAt)` — order history
- [ ] `Cart(sessionId)` — guest cart
- [ ] `CartItem(cartId)` — cart items
- [ ] `Payment(orderId)` — payment lookup
- [ ] `Notification(recipientId, read)` — unread notifications
- [ ] `SupportTicket(customerId, status)` — customer tickets
- [ ] `AuditLog(userId, createdAt)` — audit history

---

## ☁️ Serverless DB — Neon Migration

gwt-new ../neon-migration feat/neon-migration

### 🎯 Objective

Remplacer PostgreSQL local (Docker) par **Neon** (serverless PostgreSQL) pour tous les environnements.

### Étape 1 — Login & Setup Neon CLI

- [ ] `npm install -g @neondatabase/cli` ou `pnpm add -g @neondatabase/cli`
- [ ] `neonctl auth` — login interactif browser
- [ ] Configurer le token API pour usage headless

### Étape 2 — Projet & Branches

- [ ] Créer le projet Neon
- [ ] Créer la branche `staging`
- [ ] Lier API key à un fichier `.env.neon`

### Étape 3 — Connection Strings

- [ ] Récupérer les pooled URLs avec PGBouncer
- [ ] Stocker dans `.env.neon`
- [ ] Copier l'URL `main` dans `.env.local` et `.env.production`

### Étape 4 — Packages

- [ ] `pnpm add @prisma/adapter-neon @neondatabase/serverless`
- [ ] `pnpm remove @prisma/adapter-pg` (si plus utilisé ailleurs)

### Étape 5 — Modifier PrismaService

- [ ] `libs/data-access-prisma/src/lib/prisma.service.ts`: remplacer `PrismaPg` + `pg.Pool` par `PrismaNeon` + `Pool` de `@neondatabase/serverless`
- [ ] Simplifier/supprimer `enableShutdownHooks`

### Étape 6 — Modifier Seed

- [ ] `prisma/seed.ts`: adapter pour Neon

### Étape 7 — Docker Compose

- [ ] Supprimer ou profiler le service `postgres`

### Étape 8 — Migration & Seed

- [ ] `bunx prisma migrate deploy` sur branche `main` Neon
- [ ] `bunx prisma db seed`
- [ ] Vérifier avec Prisma Studio

### Étape 9 — Webpack

- [ ] Vérifier `apps/api/webpack.config.js`: mettre à jour les `externals`

### Étape 10 — Documentation

- [ ] Ajouter section Neon dans README
- [ ] Procédure rollback (point-in-time restore Neon)
```
