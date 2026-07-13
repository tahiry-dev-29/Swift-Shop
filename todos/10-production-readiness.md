# 🚀 PRODUCTION READINESS — Score & Recommendations

> Extracted from Production Maturity Score (82/100). These items are not covered by other todo files.

---

## 📊 Score by Category

| Category       | Score  | Status                                                               |
| -------------- | ------ | -------------------------------------------------------------------- |
| Authentication | 95/100 | ✅ Covered in [01-backend-core.md](./01-backend-core.md)             |
| Authorization  | 90/100 | ✅ Covered in [01-backend-core.md](./01-backend-core.md)             |
| Catalog        | 85/100 | ✅ Covered in [02-catalog-products.md](./02-catalog-products.md)     |
| Pricing        | 80/100 | ⚠️ Hardcoded coupons — see below                                     |
| Cart           | 85/100 | ✅ Covered in [03-commerce.md](./03-commerce.md)                     |
| Orders         | 90/100 | ✅ Covered in [03-commerce.md](./03-commerce.md)                     |
| Payments       | 75/100 | ✅ Covered in [07-payment-adapters.md](./07-payment-adapters.md)     |
| Shipping       | 75/100 | ✅ Covered in [08-shipping-adapters.md](./08-shipping-adapters.md)   |
| Notifications  | 85/100 | ✅ Covered in [06-additional-systems.md](./06-additional-systems.md) |
| Security       | 90/100 | ✅ Covered in [01-backend-core.md](./01-backend-core.md)             |
| Async/Queue    | 80/100 | ✅ Covered in [09-backend-gaps.md](./09-backend-gaps.md)             |
| Monitoring     | 70/100 | ❌ To implement — see below                                          |

**Global Score: 82/100**

---

## 🔴 High Priority

### 1. Externalize Coupon System

Coupons `WELCOME10` (10%) and `FREESHIP` (5€ fixed) are hardcoded in `CartCouponService`. Impossible to add new ones without code changes.

- [ ] Prisma model `Coupon` (code, type: percent/fixed, value, usageLimit, usageCount, minCartTotal, validFrom, validTo, active)
- [ ] Prisma model `CouponUsage` (couponId, customerId, orderId, usedAt)
- [ ] `CouponService` — full CRUD + validation (expiration, max usage, minimum cart)
- [ ] Replace `COUPON_RULES` map in `CartCouponService` with DB query
- [ ] Migrate existing coupons (WELCOME10, FREESHIP) to DB
- [ ] Admin UI: `CouponFormComponent` with code generator, usage limits
- [ ] Unit + integration tests

### 2. APM Metrics (Prometheus/Grafana)

Health check `/api/health` exists but no application performance metrics.

- [ ] Install `@willsoto/nestjs-prometheus` or `prom-client`
- [ ] HTTP metrics: requests per route, latency (p50/p95/p99), 4xx/5xx errors
- [ ] GraphQL metrics: queries per operation, latency per resolver, errors
- [ ] Business metrics: orders/hour, abandoned carts, failed payments
- [ ] Infra metrics: DB connections, BullMQ queues (pending/active/failed jobs)
- [ ] Endpoint `GET /api/metrics` (Prometheus format)
- [ ] Pre-configured Grafana dashboard (importable)
- [ ] Alerts: latency > 2s, error rate > 5%, queue backlog > 1000

### 3. Rate Limiting on GraphQL Mutations

Rate limiting exists on auth endpoints (`AuthRateLimitGuard`) but not on other GraphQL mutations. A client could spam `createProduct`, `addToCart`, etc.

- [ ] Create `GqlThrottlerGuard` — global rate limiting for all GraphQL mutations
- [ ] Configure limits by scope:
  - Public mutations (cart, pricing): 30/minute
  - Authenticated mutations (orders, addresses): 60/minute
  - Admin mutations (CRUD products, employees): 120/minute
- [ ] Apply guard globally on `GraphQLModule`
- [ ] Exclude queries (reads) from rate limiting
- [ ] Log rate limiting violations

---

## 🟡 Medium Priority

### 4. Backend E2E Tests (Playwright / Supertest)

Unit and integration tests exist in todos but no E2E tests covering full flows.

- [ ] Setup Playwright or Supertest for backend E2E tests
- [ ] E2E flow: register → login → add to cart → order → payment → invoice
- [ ] E2E flow: employee login → create product → manage order
- [ ] E2E flow: guest cart → guest checkout → account creation
- [ ] E2E flow: order cancellation → stock rollback verified
- [ ] E2E flow: support ticket → agent reply → resolution
- [ ] CI: run E2E on every PR

### 5. Conversion Tracking Analytics

`trackProductView` exists but no conversion funnel (view → cart → checkout → purchase).

- [ ] Prisma model `ConversionEvent` (sessionId, customerId, productId, eventType: VIEW/ADD_TO_CART/CHECKOUT_START/CHECKOUT_COMPLETE, timestamp, source)
- [ ] `ConversionTrackingService` — record each funnel step
- [ ] GraphQL: `trackConversion(input)` mutation
- [ ] Analytics: conversion rate per step, cart abandonment rate, checkout abandonment rate
- [ ] Dashboard: funnel visualization (view → cart → checkout → purchase)
- [ ] Correlate with acquisition sources (utm_source, utm_medium)

### 6. Optimize Prisma Schema

Schema is ~1392 lines with 40+ models. Migrations becoming complex.

- [ ] Audit models: identify unused or redundant models
- [ ] Group related models in commented blocks (Auth, Catalog, Commerce, etc.)
- [ ] Add frequent composite indexes (e.g., `Product + Category + Active`)
- [ ] Verify missing or overly deep relations
- [ ] Document migration strategy (versioning, rollback)
- [ ] Consider `prisma migrate diff` before each release

---

## 🟢 Low Priority

### 7. Document Payment Webhooks for Integrators

Webhooks are implemented but no documentation for third-party integrators.

- [ ] Create `docs/webhooks.md` with:
  - Payload format per provider (Stripe, MVola, Airtel, PayPal)
  - HMAC signature: how to verify
  - Error codes and retry policy
  - curl examples for testing
  - Sandbox guide (test keys, test endpoints)
- [ ] Swagger/OpenAPI: document `processPaymentWebhook`
- [ ] Admin help page: webhook status, error logs

### 8. Redis Cache for GraphQL Responses

Frequent queries (catalog, pricing, categories) not cached at GraphQL level.

- [ ] Install `@nestjs/cache-manager` + `cache-manager-redis-store`
- [ ] Cache public queries:
  - `products`: TTL 5 min, invalidation on update
  - `product(id)`: TTL 5 min
  - `categories`: TTL 10 min
  - `calculatePrice`: TTL 1 min
- [ ] Targeted invalidation: `@CacheEvict` on corresponding mutations
- [ ] Monitoring: hit/miss ratio in Prometheus metrics

### 9. DB Performance Indexes

Add missing indexes for most frequent queries.

- [ ] `Product(categoryId, active)` — catalog search
- [ ] `Order(customerId, createdAt)` — order history
- [ ] `Cart(sessionId)` — guest cart
- [ ] `CartItem(cartId)` — cart items
- [ ] `Payment(orderId)` — payment lookup
- [ ] `Notification(recipientId, read)` — unread notifications
- [ ] `SupportTicket(customerId, status)` — customer tickets
- [ ] `AuditLog(userId, createdAt)` — audit history

---

## 📈 Score Evolution

| Version | Score  | Changes                                                       |
| ------- | ------ | ------------------------------------------------------------- |
| v1.0    | 82/100 | Initial score                                                 |
| v1.1    | 85/100 | +Externalize coupons, +Rate limiting GraphQL                  |
| v1.2    | 88/100 | +APM Prometheus/Grafana, +E2E Tests                           |
| v1.3    | 91/100 | +Conversion tracking, +Redis Cache                            |
| v2.0    | 95/100 | +Webhook documentation, +DB Indexes, +Optimized Prisma Schema |

---

_File linked to [BACKEND_FEATURES.md](../BACKEND_FEATURES.md) — Section 23_
