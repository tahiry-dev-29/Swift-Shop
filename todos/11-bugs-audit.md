# 🐛 BUGS AUDIT — Complete Backend Review

> Code audit performed across all backend modules. Bugs classified by module and severity.
> Refresh token bugs are already in [09-backend-gaps.md](./09-backend-gaps.md#-8-refresh-token--security-bugs).

---

## 📊 Summary

| Module                              | 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low | Total   |
| ----------------------------------- | ----------- | ------- | --------- | ------ | ------- |
| Auth                                | 4           | 6       | 9         | 7      | 26      |
| Catalog (Stock)                     | 0           | 4       | 10        | 8      | 22      |
| Order / Cart / Payment              | 7           | 9       | 7         | 3      | 26      |
| Notifications / Messaging / Support | 1           | 7       | 11        | 3      | 22      |
| **Infrastructure / Config (New)**   | **2**       | **9**   | **6**     | **2**  | **19**  |
| **Total**                           | **14**      | **35**  | **43**    | **23** | **115** |

---

## 🔐 MODULE AUTH

### 🔴 Critical

| #   | Bug                                                                                                                                           | File                          | Lines   |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ------- |
| A1  | **Lockout bypass** — `=== LOCKOUT_THRESHOLD` instead of `>=` : after lockout expires, counter exceeds threshold and account never locks again | `auth-credentials.service.ts` | 81, 100 |
| A2  | **Race condition lockout** — 2 concurrent requests can increment counter beyond threshold without triggering lockout                          | `auth-credentials.service.ts` | 76-111  |
| A3  | **OAuth race condition** — `upsert` customer + `create` oAuthAccount non-transactional : duplicate key crash                                  | `auth-oauth.service.ts`       | 61-92   |
| A4  | **Reset token validated after policy** — `assertPasswordPolicy` runs BEFORE JWT verification : info leak if token invalid                     | `auth-recovery.service.ts`    | 83-104  |

### 🟠 High

| #   | Bug                                                                                                                               | File                          | Lines  |
| --- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ------ |
| A5  | **2FA not checked** in `validateCustomer`/`validateEmployee` — 2FA can be bypassed                                                | `auth-credentials.service.ts` | 18-66  |
| A6  | **Magic link/reset tokens non-revocable** — no server-side blacklist, valid 15min even after use                                  | `auth-recovery.service.ts`    | 31-104 |
| A7  | **Reset password doesn't check if employee active** — deactivated employee can reset password                                     | `auth-recovery.service.ts`    | 83-104 |
| A8  | **Permission cache exceeds expiry** of temporary elevations — elevated permissions cached 300s even if elevation expires after 1s | `permission-guard.ts`         | 85-107 |
| A9  | **X-Forwarded-For spoofing** — rate limiting IP bypassable by spoofing header                                                     | `auth-rate-limit.guard.ts`    | 72-83  |
| A10 | **Redis without error handler** — process crash if Redis temporarily unavailable                                                  | `redis.service.ts`            | 11-17  |

### 🟡 Medium

| #   | Bug                                                                                  | File                           | Lines  |
| --- | ------------------------------------------------------------------------------------ | ------------------------------ | ------ |
| A11 | **Role cache 5 min** — role revocation delayed until cache expiry                    | `role.guard.ts`                | 72-104 |
| A12 | **Permission cache not invalidated** on role/permission change                       | `permission-guard.ts`          | 78-108 |
| A13 | **`getJson` crash** on corrupted data (no try-catch on JSON.parse)                   | `redis.service.ts`             | 44-47  |
| A14 | **JwtAuthGuard breaks for HTTP** — always uses GraphQL context                       | `jwt-auth-guard.ts`            | 7-10   |
| A15 | **StoreBranchScopeGuard** — hardcoded role names inconsistent with RoleGuard (slugs) | `store-branch-scope.guard.ts`  | 56     |
| A16 | **`argon2.verify` crash** on corrupted hash instead of returning false               | `password-security.service.ts` | 21-23  |
| A17 | **Audit log failure crashes** main operation — should be non-blocking                | `auth-audit.service.ts`        | 13-26  |
| A18 | **Lockout email error** loses stack trace                                            | `password-security.service.ts` | 38-41  |
| A19 | **Rate limit guard** breaks for HTTP — always GraphQL context                        | `auth-rate-limit.guard.ts`     | 36-38  |

### 🟢 Low

| #   | Bug                                                                     | File                        | Lines   |
| --- | ----------------------------------------------------------------------- | --------------------------- | ------- |
| A20 | **`del(...keys)` spread** can exceed Redis argument limit               | `redis.service.ts`          | 57-64   |
| A21 | **Refresh token single-key** — 2nd device login overwrites 1st silently | `redis.service.ts`          | 32-38   |
| A22 | **Trusted devices not revoked** when employee deactivated               | `trusted-device.service.ts` | 10-45   |
| A23 | **No limit** on trusted devices per employee                            | `trusted-device.service.ts` | 10-24   |
| A24 | **`verifySync` crash** on malformed token/secret                        | `two-factor.service.ts`     | 21-23   |
| A25 | **Redirect URI not validated** server-side                              | `auth-oauth.service.ts`     | 16-31   |
| A26 | **Raw OAuth errors** can leak to clients                                | `auth-oauth.service.ts`     | 140-172 |

---

## 📦 MODULE CATALOG (Stock)

### 🟠 High

| #   | Bug                                                                                                      | File                       | Lines |
| --- | -------------------------------------------------------------------------------------------------------- | -------------------------- | ----- |
| C1  | **Race condition `decrementStock`** — read-then-write non-atomic : 2 concurrent decrements = double sell | `product-stock.service.ts` | 43-55 |
| C2  | **Race condition `updateStock`** — find-then-create-or-update : 2 concurrent creates = duplicate         | `product-stock.service.ts` | 9-34  |
| C3  | **Ambiguous stock lookup** — when productId AND combinationId undefined, OR filter matches any record    | `product-stock.service.ts` | 11-18 |
| C4  | **`checkAvailability` ambiguous** — same bug as C3 for availability check                                | `product-stock.service.ts` | 62-69 |

### 🟡 Medium

| #   | Bug                                                                                  | File                           | Lines   |
| --- | ------------------------------------------------------------------------------------ | ------------------------------ | ------- |
| C5  | **Product slugs no uniqueness** — collision possible with 4-char random suffix       | `product.service.ts`           | 56-81   |
| C6  | **Category slugs no uniqueness** — same problem                                      | `category.service.ts`          | 118-156 |
| C7  | **N+1 query `getPath`** — DB query per ancestor in tree                              | `category.service.ts`          | 101-116 |
| C8  | **Search sync silent errors** — MeiliSearch down = stale index without alert         | `product-search.service.ts`    | 32-50   |
| C9  | **`decrementStock` silent floor** — sets to 0 instead of throwing error              | `product-stock.service.ts`     | 43-55   |
| C10 | **FeatureService Redis leak** — Redis connection not closed (no OnModuleDestroy)     | `feature.service.ts`           | 13-15   |
| C11 | **`deleteGroup`/`deleteValue` without cascade check** — FK constraint crash possible | `attribute.service.ts`         | 50-82   |
| C12 | **`duplicateProduct` without transaction** — partial state if failure mid-way        | `product-duplicate.service.ts` | 27-147  |
| C13 | **OR filter logic broken** — single ID provided = matches any record                 | `product-stock.service.ts`     | 11-18   |
| C14 | **`decrementStock` silent** — floors to 0 instead of error when stock insufficient   | `product-stock.service.ts`     | 43-55   |

### 🟢 Low

| #   | Bug                                                                         | File                       | Lines   |
| --- | --------------------------------------------------------------------------- | -------------------------- | ------- |
| C15 | **Slug update edge case** — input.slug null overwrites generated slug       | `category.service.ts`      | 142-156 |
| C16 | **`findById` null check** missing in some cases                             | `category.service.ts`      | 91-99   |
| C17 | **Search index stale** after category change                                | `category.service.ts`      | 118-188 |
| C18 | **`delete` product** — search delete failure = ghost entry                  | `product.service.ts`       | 124-131 |
| C19 | **Input search not sanitized** — special chars in filter                    | `product.service.ts`       | 25-30   |
| C20 | **`incrementStock` without validation** — no upper-bound, negative possible | `product-stock.service.ts` | 36-41   |
| C21 | **`getPath` infinite loop** possible if circular parentId                   | `category.service.ts`      | 101-116 |
| C22 | **Pagination no cap** — take: 999999 possible                               | `product.service.ts`       | 32-42   |

---

## 🛒 MODULE ORDER / CART / PAYMENT

### 🔴 Critical

| #   | Bug                                                                                                                              | File                          | Lines       |
| --- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ----------- |
| O1  | **`finally` masks errors** — if `releaseReservedStock` fails after order creation, order is lost (no idempotencyKey = duplicate) | `order-creation.service.ts`   | 53, 155-157 |
| O2  | **Order reference collision** — `Math.random()` 5 chars = ~60M values/day, no retry on unique constraint                         | `order-creation.service.ts`   | 16-19       |
| O3  | **Under-amount payment** — client can send `amount: 0.01` for a 1000€ order                                                      | `payment.service.ts`          | 19-45       |
| O4  | **Multiplied refund** — 3 refunds of 100€ on a 100€ payment = 300€ refunded                                                      | `payment.service.ts`          | 98-131      |
| O5  | **Non-idempotent webhook** — webhook retry = unique constraint error → infinite error loop                                       | `payment.service.ts`          | 148-157     |
| O6  | **Webhook overwrites status** — payload status written directly without transition validation                                    | `payment.service.ts`          | 168-173     |
| O7  | **Unknown provider → manual fallback** — `provider: "hacked"` = auto-approved payment                                            | `payment-adapter.registry.ts` | 13-23       |

### 🟠 High

| #   | Bug                                                                                        | File                        | Lines     |
| --- | ------------------------------------------------------------------------------------------ | --------------------------- | --------- |
| O8  | **Idempotency key outside transaction** — 2 concurrent requests both pass check            | `order-creation.service.ts` | 33-41     |
| O9  | **TOCTOU cancel order** — state check outside transaction, race condition with fulfillment | `order-action.service.ts`   | 13-26, 37 |
| O10 | **N+1 query cancel** — 1 product query per item in transaction                             | `order-action.service.ts`   | 54-72     |
| O11 | **Race condition `addToCart`** — 2 concurrent adds = unique constraint crash               | `cart-service.ts`           | 80-94     |
| O12 | **Non-atomic stock check** — stock verification and cart write not transactional           | `cart-service.ts`           | 69-94     |
| O13 | **Cart merge without transaction** — partial failure = lost data                           | `cart-merge.service.ts`     | 29-34     |
| O14 | **Merge without stock validation** — guest cart with 100 units merges without control      | `cart-merge.service.ts`     | 46-71     |
| O15 | **Coupons without limits** — WELCOME10 usable unlimited times, no tracking                 | `cart-coupon.service.ts`    | 9-15      |
| O16 | **Frozen discount snapshot** — coupon amount calculated 1x, never recalculated             | `cart-coupon.service.ts`    | 45-57     |

### 🟡 Medium

| #   | Bug                                                                                     | File                                | Lines  |
| --- | --------------------------------------------------------------------------------------- | ----------------------------------- | ------ |
| O17 | **Stock reservation race condition** — check-then-set non-atomic                        | `cart-stock-reservation.service.ts` | 49-79  |
| O18 | **Redis KEYS blocking** — scan整个键空间 = cascade latency                              | `cart-stock-reservation.service.ts` | 94-111 |
| O19 | **Cancel without re-check state** in transaction — unconditional update                 | `order-action.service.ts`           | 37-42  |
| O20 | **Duplicate return** — no existing returns check                                        | `order-action.service.ts`           | 79-132 |
| O21 | **Payment orphan** — adapter failure = PENDING record without externalId, never cleaned | `payment.service.ts`                | 47-74  |
| O22 | **CSV injection** — product names with `=`, `+`, `-` interpreted as Excel formulas      | `order-export.service.ts`           | 70-86  |
| O23 | **Discount HT/tax inconsistent** — reduction not proportional HT and tax                | `cart-pricing.service.ts`           | 74-105 |

### 🟢 Low

| #   | Bug                                                                          | File                                 | Lines |
| --- | ---------------------------------------------------------------------------- | ------------------------------------ | ----- |
| O24 | **PDF stream length off-by-one** — `\n` not counted in /Length               | `order-invoice.service.ts`           | 59    |
| O25 | **N+1 Redis queries** — abandoned cart recovery = 100 sequential Redis calls | `abandoned-cart-recovery.service.ts` | 53-59 |
| O26 | **Zero weight accepted** — weightGrams = 0 not validated                     | `shipping-calculation.service.ts`    | 9     |

---

## 🔔 MODULE NOTIFICATIONS / MESSAGING / SUPPORT

### 🔴 Critical

| #   | Bug                                                                                                      | File                   | Lines     |
| --- | -------------------------------------------------------------------------------------------------------- | ---------------------- | --------- |
| N1  | **Live Chat without authentication** — WebSocket gateway = full access, impersonation possible, CORS `*` | `live-chat.gateway.ts` | 15, 26-93 |

### 🟠 High

| #   | Bug                                                                                           | File                        | Lines   |
| --- | --------------------------------------------------------------------------------------------- | --------------------------- | ------- |
| N2  | **Notification DB + queue non-atomic** — crash between 2 = orphan record never delivered      | `notification.service.ts`   | 44-75   |
| N3  | **Push/SMS stubs mark "delivered"** — nothing sent but `deliveredAt` set                      | `notification.service.ts`   | 170-183 |
| N4  | **Live Chat session creation** — arbitrary customerId, impersonation, DoS                     | `live-chat.gateway.ts`      | 48-56   |
| N5  | **Messaging thread non-transactional** — message created but email never sent = inconsistency | `messaging.service.ts`      | 41-58   |
| N6  | **Social post DRAFT during publish** — status not updated before job                          | `social-media.service.ts`   | 31-44   |
| N7  | **Email template without auth** — any user can modify system templates                        | `email-template.service.ts` | 20-35   |
| N8  | **Support findAll without pagination** — OOM risk with many tickets                           | `support-ticket.service.ts` | 83-86   |

### 🟡 Medium

| #   | Bug                                                                            | File                        | Lines      |
| --- | ------------------------------------------------------------------------------ | --------------------------- | ---------- |
| N9  | **SSE duplicates** on BullMQ retry — IN_APP pub 2x if publish fails            | `notification.service.ts`   | 156-168    |
| N10 | **Push/SMS duplicates** — retry sends same SMS/push 2x                         | `notification.service.ts`   | 170-183    |
| N11 | **Live Chat message unsanitized** — stored XSS possible, no max length         | `live-chat.gateway.ts`      | 82-88      |
| N12 | **`agentTyping` without validation** — anyone can send typing indicator        | `live-chat.gateway.ts`      | 96-102     |
| N13 | **Participant check O(n)** — scans all messages instead of dedicated table     | `messaging.service.ts`      | 74-76, 128 |
| N14 | **Reply recipient undefined** — email never sent silently                      | `messaging.service.ts`      | 83-89      |
| N15 | **Email processor marked "SENT"** when no recipient (should be "SKIPPED")      | `email.processor.ts`        | 38-44      |
| N16 | **`assignTicket` without state validation** — CLOSED ticket can be assigned    | `support-ticket.service.ts` | 75-81      |
| N17 | **Reply reopens resolved ticket** — status forced to IN_PROGRESS without check | `support-ticket.service.ts` | 67-69      |
| N18 | **Social cron error array empty** — errors silently lost                       | `social-media.service.ts`   | 87-97      |
| N19 | **Social cron overwrite** — can restore status changed by admin                | `social-media.service.ts`   | 106-113    |

### 🟢 Low

| #   | Bug                                                                    | File                        | Lines   |
| --- | ---------------------------------------------------------------------- | --------------------------- | ------- |
| N20 | **Ticket reference collision** — `Math.random()` 4 chars = low entropy | `support-ticket.service.ts` | 25-26   |
| N21 | **`anonymizeIp` raw IP** for unrecognized formats (IPv4-mapped IPv6)   | `analytics.service.ts`      | 100-102 |
| N22 | **GraphQL subscription stale context** — revoked user still receives   | `notification.resolver.ts`  | 112-140 |

---

## 🎯 Top 17 — Most Critical Bugs to Fix (Updated)

| #   | Bug                                    | Impact                      | Module   |
| --- | -------------------------------------- | --------------------------- | -------- |
| 1   | **O3** — Under-amount payment          | Direct financial loss       | Payment  |
| 2   | **O4** — Multiplied refund             | Direct financial loss       | Payment  |
| 3   | **O7** — Unknown provider → manual     | Free payment                | Payment  |
| 4   | **H1** — GraphQL DoS (no depth limit)  | Server crash, DoS           | GraphQL  |
| 5   | **H2** — Upload DoS (no size limit)    | OOM, server crash           | Media    |
| 6   | **N1** — Live Chat without auth        | Takeover any chat           | Support  |
| 7   | **H3** — Prisma pool leak SIGTERM      | DB connections exhausted    | Infra    |
| 8   | **C1** — Race condition decrementStock | Double sell                 | Catalog  |
| 9   | **O11** — Race condition addToCart     | 500 crash                   | Cart     |
| 10  | **A1** — Lockout bypass                | Brute-force possible        | Auth     |
| 11  | **H4** — BullMQ jobs accumulating      | Redis OOM, performance down | Queue    |
| 12  | **H5** — MeiliSearch unhealthy used    | Stale index, broken search  | Search   |
| 13  | **O6** — Webhook overwrites status     | State machine bypass        | Payment  |
| 14  | **O5** — Non-idempotent webhook        | Infinite error loop         | Payment  |
| 15  | **O2** — Order reference collision     | 500 error on order          | Order    |
| 16  | **H8** — Guest checkout race           | Duplicate customer, 500     | Checkout |
| 17  | **H9** — Cart merge data loss          | Items lost silently         | Cart     |

---

_Audit performed on swift-shop backend codebase — July 2026_

---

## 🕵️ HIDDEN BUGS — Infrastructure & Configuration (Discovered in Deep Dive)

These bugs were in infrastructure layers (GraphQL setup, upload, health checks, shutdown hooks, Redis clients) and missed by previous audits focused on business logic.

### 🔴 Critical

| #   | Bug                                                                                                      | File                  | Lines |
| --- | -------------------------------------------------------------------------------------------------------- | --------------------- | ----- |
| H1  | **GraphQL DoS — No depth/complexity limits** — infinite queries possible, stack overflow, billion laughs | `app.module.ts`       | 53-63 |
| H2  | **File Upload DoS — No size/type limits** — 10GB+ possible, OOM on Sharp, no magic bytes validation      | `media.controller.ts` | 16-24 |

### 🟠 High

| #   | Bug                                                                                                            | File                            | Lines   |
| --- | -------------------------------------------------------------------------------------------------------------- | ------------------------------- | ------- |
| H3  | **Prisma pool leak on SIGTERM** — only `beforeExit` handled, Docker/K8s sends SIGTERM → connections not closed | `prisma.service.ts`             | 27-32   |
| H4  | **BullMQ failed jobs accumulate** — no `removeOnComplete/fail`, no DLQ, no alerting                            | `notification-queue.service.ts` | 28-37   |
| H5  | **MeiliSearch client unhealthy used** — if down at startup, client defined but invalid, silent errors          | `search.service.ts`             | 12-33   |
| H6  | **Redis throttler without error handler** — process crash if Redis restarts, lazyConnect delays failure        | `redis-throttler-storage.ts`    | 28-37   |
| H7  | **Rate limit IP spoofing via X-Forwarded-For** — header unvalidated, attacker bypasses throttling              | `auth-rate-limit.guard.ts`      | 72-84   |
| H8  | **Guest checkout race condition** — 2 requests same email = duplicate customer, no upsert                      | `guest-checkout.service.ts`     | 38-67   |
| H9  | **Cart merge silent data loss** — 3 steps without transaction, partial failure = lost items                    | `cart-merge.service.ts`         | 29-34   |
| H10 | **Payment webhook non-idempotent** — provider retry = unique constraint error → infinite 500 loop              | `payment.service.ts`            | 148-157 |

### 🟡 Medium

| #   | Bug                                                                                            | File                                | Lines |
| --- | ---------------------------------------------------------------------------------------------- | ----------------------------------- | ----- |
| H11 | **Health check external dependency** — ping docs.nestjs.com = app unhealthy if their site down | `health.controller.ts`              | 25    |
| H12 | **Cart getOrCreate race condition** — 2 requests same customer = 2 carts created, no upsert    | `cart-service.ts`                   | 22-40 |
| H13 | **Search sync silent failures** — MeiliSearch down = stale index without retry/alert/DLQ       | `product-search.service.ts`         | 32-50 |
| H14 | **Order reference collision** — Math.random() 5 chars = ~60M/day, unique constraint 500        | `order-creation.service.ts`         | 16-19 |
| H15 | **Env validation missing vars** — REDIS*URL, MEILISEARCH*\*, JWT_SECRET entropy check          | `env.validation.ts`                 | 47-56 |
| H16 | **Notification transport no reconnection** — Redis restart = SSE/subscriptions silently dead   | `notification-transport.service.ts` | 20-38 |

### 🟢 Low

| #   | Bug                                                                                 | File                      | Lines |
| --- | ----------------------------------------------------------------------------------- | ------------------------- | ----- |
| H17 | **WebSocket Live Chat no heartbeat** — dead connections stay in rooms = memory leak | `live-chat.gateway.ts`    | 15-28 |
| H18 | **Social media cron error array empty** — catch without push = silent errors        | `social-media.service.ts` | 87-97 |

---

## 🎯 Top 10 — Most Critical Bugs to Fix (Updated)

| #   | Bug                                    | Impact                     | Module   |
| --- | -------------------------------------- | -------------------------- | -------- |
| 1   | **O3** — Under-amount payment          | Direct financial loss      | Payment  |
| 2   | **O4** — Multiplied refund             | Direct financial loss      | Payment  |
| 3   | **O7** — Unknown provider → manual     | Free payment               | Payment  |
| 4   | **H1** — GraphQL DoS (no depth limit)  | Server crash, DoS          | GraphQL  |
| 5   | **H2** — Upload DoS (no max size)      | OOM, server crash          | Media    |
| 6   | **N1** — Live Chat no auth             | Takeover any chat          | Support  |
| 7   | **H3** — Prisma pool leak SIGTERM      | DB connections exhausted   | Infra    |
| 8   | **C1** — Race condition decrementStock | Double sell                | Catalog  |
| 9   | **O11** — Race condition addToCart     | 500 crash                  | Cart     |
| 10  | **A1** — Lockout bypass                | Brute-force possible       | Auth     |
| 11  | **H4** — BullMQ jobs accumulating      | Redis OOM, perf down       | Queue    |
| 12  | **H5** — MeiliSearch unhealthy used    | Stale index, broken search | Search   |
| 13  | **O6** — Webhook overwrites status     | State machine bypass       | Payment  |
| 14  | **O5** — Non-idempotent webhook        | Infinite error loop        | Payment  |
| 15  | **O2** — Order reference collision     | 500 error on order         | Order    |
| 16  | **H8** — Guest checkout race           | Duplicate customer, 500    | Checkout |
| 17  | **H9** — Cart merge data loss          | Items lost silently        | Cart     |

---

_Audit performed on swift-shop backend codebase — July 2026_
