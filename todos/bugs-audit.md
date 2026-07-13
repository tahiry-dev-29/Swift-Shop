# Bug Audit Report — swift-shop

> Generated: 2026-07-13T11:36:40.568586
> Scanner: thr-scan-be-bugs v1.0
> Skills used: thr-scan-be-bugs (built-in)

## Summary

| Severity  | Count  |
| --------- | ------ |
| CRITICAL  | 9      |
| HIGH      | 17     |
| MEDIUM    | 8      |
| LOW       | 0      |
| **Total** | **34** |

## CRITICAL (9)

### H1 — No depthLimit/complexityLimit on GraphQLModule [GraphQL DoS]

**File:** `/home/tahiry/Projects/Angular/swift-shop-workspace/swift-shop/apps/api/src/app.module.ts` (lines: GraphQLModule.forRoot)
**Pattern:** GraphQLModule.forRoot
**Description:** Apollo accepts infinite query depth => stack overflow, billion laughs attack
**Fix:** Add depthLimit: 10, complexityLimit: 1000 to GraphQLModule config
**Skill:** thr-scan-be-bugs

### H2 — FileInterceptor without size limits [File Upload DoS]

**File:** `/home/tahiry/Projects/Angular/swift-shop-workspace/swift-shop/libs/backend/core/media/src/lib/media.controller.ts` (lines: FileInterceptor('file'))
**Pattern:** FileInterceptor('file')
**Description:** Attacker can upload 10GB+ files => disk full, OOM in Sharp
**Fix:** Add limits: { fileSize: 5*1024*1024 } to FileInterceptor options
**Skill:** thr-scan-be-bugs

### O4 — Refund doesn't check cumulative refunded amount [Financial]

**File:** `/home/tahiry/Projects/Angular/swift-shop-workspace/swift-shop/libs/backend/features/payment/src/lib/payment.service.ts` (lines: processRefund)
**Pattern:** processRefund
**Description:** Multiple partial refunds can exceed original payment
**Fix:** Sum existing refunds before allowing new one
**Skill:** thr-scan-be-bugs

### O5 — Webhook uses create (not upsert) => retry = unique constraint error [Payment Security]

**File:** `/home/tahiry/Projects/Angular/swift-shop-workspace/swift-shop/libs/backend/features/payment/src/lib/payment.service.ts` (lines: paymentWebhookEvent.create)
**Pattern:** paymentWebhookEvent.create
**Description:** Provider retries webhook => 500 => infinite retry loop
**Fix:** Use upsert with where: { provider_eventId: { provider, eventId } }
**Skill:** thr-scan-be-bugs

### O6 — Webhook overwrites payment status without transition validation [Payment Security]

**File:** `/home/tahiry/Projects/Angular/swift-shop-workspace/swift-shop/libs/backend/features/payment/src/lib/payment.service.ts` (lines: payment.updateMany)
**Pattern:** payment.updateMany
**Description:** Malicious webhook can set FAILED->COMPLETED, REFUNDED->PENDING
**Fix:** Validate legal state transitions before update
**Skill:** thr-scan-be-bugs

### O1 — finally block runs releaseReservedStock after successful order => masks release errors [Error Handling]

**File:** `/home/tahiry/Projects/Angular/swift-shop-workspace/swift-shop/libs/backend/features/order/src/lib/order-creation.service.ts` (lines: finally {)
**Pattern:** finally {
**Description:** If release fails, original return value lost => caller sees failure despite order created
**Fix:** Store release error separately, log but don't throw
**Skill:** thr-scan-be-bugs

### O2 — Order reference uses Math.random() 5 chars => collision risk [Data Integrity]

**File:** `/home/tahiry/Projects/Angular/swift-shop-workspace/swift-shop/libs/backend/features/order/src/lib/order-creation.service.ts` (lines: Math.random())
**Pattern:** Math.random()
**Description:** ~60M combos/day => birthday paradox collision => unique constraint 500
**Fix:** Use crypto.randomUUID() or sequence + date prefix with retry loop
**Skill:** thr-scan-be-bugs

### N1 — LiveChatGateway allows any origin, no auth on connection [Auth Bypass]

**File:** `/home/tahiry/Projects/Angular/swift-shop-workspace/swift-shop/libs/backend/features/support/src/lib/live-chat.gateway.ts` (lines: cors: { origin: '_' })
**Pattern:** cors: { origin: '_' }
**Description:** Any website can connect => impersonate users, send messages, DoS
**Fix:** Add JWT auth in handleConnection, validate origin against allowed list
**Skill:** thr-scan-be-bugs

### O2b — Order reference uses Math.random() in order-creation.service.ts [Data Integrity]

**File:** `/home/tahiry/Projects/Angular/swift-shop-workspace/swift-shop/libs/backend/features/order/src/lib/order-creation.service.ts` (lines: Math.random())
**Pattern:** Math.random()
**Description:** Collision risk under load
**Fix:** Use crypto.randomUUID() or sequence
**Skill:** thr-scan-be-bugs

## HIGH (17)

### H3 — Prisma pool only closes on 'beforeExit', not SIGTERM/SIGINT [Resource Leak]

**File:** `/home/tahiry/Projects/Angular/swift-shop-workspace/swift-shop/libs/data-access-prisma/src/lib/prisma.service.ts` (lines: beforeExit)
**Pattern:** beforeExit
**Description:** Docker/K8s sends SIGTERM => connections leak => DB connection exhaustion
**Fix:** Add handlers for SIGTERM, SIGINT, uncaughtException, unhandledRejection
**Skill:** thr-scan-be-bugs

### H6 — Redis client without error handler [Redis Reliability]

**File:** `/home/tahiry/Projects/Angular/swift-shop-workspace/swift-shop/libs/backend/core/auth/src/lib/infrastructure/storage/redis.service.ts` (lines: new Redis()
**Pattern:** new Redis(
**Description:** Connection errors emit 'error' event => unhandled => process crash
**Fix:** Add .on('error', (err) => logger.error('Redis error', err))
**Skill:** thr-scan-be-bugs

### H6 — Redis client without error handler [Redis Reliability]

**File:** `/home/tahiry/Projects/Angular/swift-shop-workspace/swift-shop/libs/backend/core/auth/src/lib/infrastructure/rate-limiting/redis-throttler-storage.ts` (lines: new Redis()
**Pattern:** new Redis(
**Description:** Connection errors emit 'error' event => unhandled => process crash
**Fix:** Add .on('error', (err) => logger.error('Redis error', err))
**Skill:** thr-scan-be-bugs

### H4 — BullMQ jobs without removeOnComplete/removeOnFail [Queue Reliability]

**File:** `/home/tahiry/Projects/Angular/swift-shop-workspace/swift-shop/libs/backend/core/media/src/lib/queue/video-queue.service.ts` (lines: queue.add()
**Pattern:** queue.add(
**Description:** Completed/failed jobs accumulate forever => Redis OOM
**Fix:** Add removeOnComplete: 100, removeOnFail: 50 to queue.add options
**Skill:** thr-scan-be-bugs

### H4 — BullMQ jobs without removeOnComplete/removeOnFail [Queue Reliability]

**File:** `/home/tahiry/Projects/Angular/swift-shop-workspace/swift-shop/libs/backend/features/notifications/src/lib/queue/notification-queue.service.ts` (lines: queue.add()
**Pattern:** queue.add(
**Description:** Completed/failed jobs accumulate forever => Redis OOM
**Fix:** Add removeOnComplete: 100, removeOnFail: 50 to queue.add options
**Skill:** thr-scan-be-bugs

### O11 — addToCart: findFirst => create (race = duplicate unique constraint crash) [Race Condition]

**File:** `/home/tahiry/Projects/Angular/swift-shop-workspace/swift-shop/libs/backend/features/cart/src/lib/cart-service.ts` (lines: findFirst.*create)
**Pattern:** findFirst.*create
**Description:** Two concurrent adds => both see null => both create => unique constraint crash
**Fix:** Use upsert with where: { cartId_productId_combinationId }
**Skill:** thr-scan-be-bugs

### O12 — Stock check and cart write not atomic [Race Condition]

**File:** `/home/tahiry/Projects/Angular/swift-shop-workspace/swift-shop/libs/backend/features/cart/src/lib/cart-service.ts` (lines: stock.quantity < quantity)
**Pattern:** stock.quantity < quantity
**Description:** Stock depleted between check and write => oversell
**Fix:** Move stock check inside transaction with SELECT FOR UPDATE or atomic decrement
**Skill:** thr-scan-be-bugs

### H2c — Sharp processes images without dimension limits [File Upload]

**File:** `/home/tahiry/Projects/Angular/swift-shop-workspace/swift-shop/libs/backend/core/media/src/lib/media.service.ts` (lines: sharp(file.buffer))
**Pattern:** sharp(file.buffer)
**Description:** 50000x50000px image => OOM crash
**Fix:** Add .resize({ width: 2000, height: 2000, fit: 'inside' })
**Skill:** thr-scan-be-bugs

### N4 — joinChat accepts arbitrary customerId without verification [Auth Bypass]

**File:** `/home/tahiry/Projects/Angular/swift-shop-workspace/swift-shop/libs/backend/features/support/src/lib/live-chat.gateway.ts` (lines: joinChat)
**Pattern:** joinChat
**Description:** Attacker joins as any customerId => reads messages, impersonates
**Fix:** Verify socket user matches customerId before joining room
**Skill:** thr-scan-be-bugs

### H7 — X-Forwarded-For used without proxy trust config [Rate Limiting Bypass]

**File:** `/home/tahiry/Projects/Angular/swift-shop-workspace/swift-shop/libs/backend/core/auth/src/lib/guards/auth-rate-limit.guard.ts` (lines: x-forwarded-for)
**Pattern:** x-forwarded-for
**Description:** Attacker sends X-Forwarded-For: 1.2.3.4 => bypasses IP rate limit
**Fix:** Configure app.set('trust proxy', true) or use request.ip with trusted proxy
**Skill:** thr-scan-be-bugs

### H10 — Notification transport Redis clients lack error handlers [Redis Reliability]

**File:** `/home/tahiry/Projects/Angular/swift-shop-workspace/swift-shop/libs/backend/features/notifications/src/lib/notification-transport.service.ts` (lines: new Redis()
**Pattern:** new Redis(
**Description:** Redis restart => pub/sub silently dead => no real-time notifications
**Fix:** Add .on('error', ...) and .on('reconnecting', ...) handlers
**Skill:** thr-scan-be-bugs

### H8 — Guest checkout: findUnique email => create customer (race = duplicate email crash) [Race Condition]

**File:** `/home/tahiry/Projects/Angular/swift-shop-workspace/swift-shop/libs/backend/features/order/src/lib/guest-checkout.service.ts` (lines: findUnique.*create)
**Pattern:** findUnique.*create
**Description:** Two concurrent guest orders same email => both pass findUnique => duplicate key crash
**Fix:** Use upsert with where: { email } or wrap in transaction with retry
**Skill:** thr-scan-be-bugs

### H9 — Cart merge: copy items => delete guest cart (no transaction) [Data Loss]

**File:** `/home/tahiry/Projects/Angular/swift-shop-workspace/swift-shop/libs/backend/features/cart/src/lib/cart-merge.service.ts` (lines: copyGuestItems)
**Pattern:** copyGuestItems
**Description:** Partial copy succeeds, delete runs, then crash => uncopied items lost forever
**Fix:** Wrap entire merge in prisma.$transaction
**Skill:** thr-scan-be-bugs

### H9b — Cart merge doesn't validate stock availability [Business Logic]

**File:** `/home/tahiry/Projects/Angular/swift-shop-workspace/swift-shop/libs/backend/features/cart/src/lib/cart-merge.service.ts` (lines: mergeGuestCart)
**Pattern:** mergeGuestCart
**Description:** Guest cart with 100 units merges into customer cart with 5 available => oversell
**Fix:** Validate stock before merging, reject or adjust quantities
**Skill:** thr-scan-be-bugs

### C1 — decrementStock: read-then-write non-atomic [Race Condition]

**File:** `/home/tahiry/Projects/Angular/swift-shop-workspace/swift-shop/libs/backend/features/catalog/src/lib/product/product-stock.service.ts` (lines: stock.quantity - quantity)
**Pattern:** stock.quantity - quantity
**Description:** Two concurrent decrements read same qty => both write same result => double sell
**Fix:** Use atomic updateMany with where: { quantity: { gte: N }}, data: { quantity: { decrement: N }}
**Skill:** thr-scan-be-bugs

### C2 — updateStock: findFirst => create (race = duplicate stock record) [Race Condition]

**File:** `/home/tahiry/Projects/Angular/swift-shop-workspace/swift-shop/libs/backend/features/catalog/src/lib/product/product-stock.service.ts` (lines: findFirst.*create)
**Pattern:** findFirst.*create
**Description:** Two concurrent calls for same product => both create stock
**Fix:** Use upsert with where: { productId_combinationId }
**Skill:** thr-scan-be-bugs

### C3 — Stock lookup OR filter matches wrong record when one ID undefined [Logic Error]

**File:** `/home/tahiry/Projects/Angular/swift-shop-workspace/swift-shop/libs/backend/features/catalog/src/lib/product/product-stock.service.ts` (lines: OR: [)
**Pattern:** OR: [
**Description:** productId=undefined, combinationId=X => matches first stock in DB
**Fix:** Build where clause conditionally instead of relying on Prisma undefined stripping
**Skill:** thr-scan-be-bugs

## MEDIUM (8)

### H3b — PostgreSQL pool without SSL config [Database Security]

**File:** `/home/tahiry/Projects/Angular/swift-shop-workspace/swift-shop/libs/data-access-prisma/src/lib/prisma.service.ts` (lines: new Pool)
**Pattern:** new Pool
**Description:** Production DB connections unencrypted
**Fix:** Add ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
**Skill:** thr-scan-be-bugs

### H6b — lazyConnect: true but no explicit connect() [Redis Reliability]

**File:** `/home/tahiry/Projects/Angular/swift-shop-workspace/swift-shop/libs/backend/core/auth/src/lib/infrastructure/rate-limiting/redis-throttler-storage.ts` (lines: lazyConnect: true)
**Pattern:** lazyConnect: true
**Description:** First request after Redis restart hangs/fails
**Fix:** Call await redis.connect() on module init or set lazyConnect: false
**Skill:** thr-scan-be-bugs

### C8 — MeiliSearch sync errors silently swallowed [Search Reliability]

**File:** `/home/tahiry/Projects/Angular/swift-shop-workspace/swift-shop/libs/backend/features/catalog/src/lib/product/product-search.service.ts` (lines: catch)
**Pattern:** catch
**Description:** MeiliSearch down => products created but not searchable => revenue loss
**Fix:** Add retry with backoff, dead-letter queue, alerting on sync failure
**Skill:** thr-scan-be-bugs

### H11 — Health check pings external docs.nestjs.com [Monitoring]

**File:** `/home/tahiry/Projects/Angular/swift-shop-workspace/swift-shop/apps/api/src/health/health.controller.ts` (lines: docs.nestjs.com)
**Pattern:** docs.nestjs.com
**Description:** If NestJS docs down => your health check fails => false alerts
**Fix:** Remove external ping; check only DB, Redis, memory
**Skill:** thr-scan-be-bugs

### H15 — Missing required production env vars: REDIS_URL, MEILISEARCH_HOST, MEILISEARCH_API_KEY [Config]

**File:** `/home/tahiry/Projects/Angular/swift-shop-workspace/swift-shop/apps/api/src/config/env.validation.ts` (lines: requireProductionValues)
**Pattern:** requireProductionValues
**Description:** App starts with localhost defaults in production => misconfig
**Fix:** Add REDIS_URL, MEILISEARCH_HOST, MEILISEARCH_API_KEY to requireProductionValues array
**Skill:** thr-scan-be-bugs

### H15b — JWT_SECRET validated but no entropy check [Security]

**File:** `/home/tahiry/Projects/Angular/swift-shop-workspace/swift-shop/apps/api/src/config/env.validation.ts` (lines: JWT_SECRET)
**Pattern:** JWT_SECRET
**Description:** Weak secret (e.g., 'secret') accepted => token forgeable
**Fix:** Add min length check (>= 32 chars) and entropy validation
**Skill:** thr-scan-be-bugs

### C9 — decrementStock silently floors at 0 instead of erroring [Business Logic]

**File:** `/home/tahiry/Projects/Angular/swift-shop-workspace/swift-shop/libs/backend/features/catalog/src/lib/product/product-stock.service.ts` (lines: Math.max(0,)
**Pattern:** Math.max(0,
**Description:** Request to decrement 10 from stock of 3 => sets to 0, no error
**Fix:** Throw if stock.quantity < quantity before decrement
**Skill:** thr-scan-be-bugs

### C12 — duplicateProduct: multiple creates without transaction [Data Integrity]

**File:** `/home/tahiry/Projects/Angular/swift-shop-workspace/swift-shop/libs/backend/features/catalog/src/lib/product/product-duplicate.service.ts` (lines: create()
**Pattern:** create(
**Description:** Partial failure => orphaned images/combinations/stock
**Fix:** Wrap all creates in prisma.$transaction
**Skill:** thr-scan-be-bugs

_Audit completed: 2026-07-13T11:36:40.568746_
