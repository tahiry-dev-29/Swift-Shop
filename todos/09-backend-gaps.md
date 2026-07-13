# 🧩 BACKEND GAPS — Missing Features & Residual Issues

## 🎯 Objective

Bridge the gaps between existing todos and what's actually implemented in the code.

---

## 🔴 1. Courier Chat

Currently, `LiveChatGateway` only handles customer ↔ support chat. No courier channel.

- [ ] Prisma model `DeliveryChat` or extend `ChatMessage` with `role: 'courier'`
- [ ] `CourierChatGateway` — dedicated courier WebSocket
- [ ] `CourierChatService` — manage courier chat sessions
- [ ] Push notification to courier when a message arrives
- [ ] Associate chat ↔ `Shipment` (tracking number)
- [ ] Tests

---

## 🟡 2. Missing Settings Resolvers

`LanguageService`, `CurrencyService`, `StoreService` exist but **no GraphQL resolvers** expose them to admin.

- [ ] `LanguageResolver` — `languages`, `language(id)`, `createLanguage`, `updateLanguage`, `setDefaultLanguage`
- [ ] `CurrencyResolver` — `currencies`, `currency(id)`, `createCurrency`, `updateCurrency`, `syncExchangeRates`
- [ ] `StoreResolver` — `stores`, `store(id)`, `createStore`, `updateStore` (multi-store management)
- [ ] Input validation (DTO)
- [ ] PermissionGuard + Redis cache

---

## 🟡 3. Order PubSub (Real-time subscription)

The `orderStatusChanged` resolver uses a stub (async generator). No real event is emitted.

- [ ] Install `@nestjs/graphql` with Redis PubSub
- [ ] Configure `RedisPubSub` in order module
- [ ] `publishOrderStatusChanged(orderId, statusId)` in `OrderActionService`
- [ ] Functional `orderStatusChanged` subscription
- [ ] Tests

---

## 🟡 4. Settings — Exposed to Storefront (Public Read)

Values like active currency, default language are needed by the Angular storefront.

- [ ] `PublicSettingsResolver` — `publicSettings`, `activeCurrency`, `activeLanguage`
- [ ] Redis cache with long TTL (5 min)
- [ ] No authentication required

---

## 🟢 5. Critical Tests (Minimum Viable)

Minimum to unblock production:

- [ ] Unit tests `PaymentService` (orchestration with mocks)
- [ ] Unit tests `OrderCreationService` (idempotency, stock rollback)
- [ ] Unit tests `PriceCalculationService`
- [ ] Unit tests `CartService` (add, remove, merge)
- [ ] Integration tests: `createOrder` via GraphQL (supertest)
- [ ] Integration tests: `processPaymentWebhook`
- [ ] Integration tests: `AuthService` (login, refresh, 2FA)

---

## 🟢 6. Enriched Seeds

- [ ] Realistic data: categories (10+), products (50+), combinations
- [ ] Customers with order history
- [ ] Active promotions
- [ ] Store configurations (language MG/FR/EN, currency, taxes)

---

## 🟢 7. Residual DevOps

- [ ] `docker-compose.prod.yml` with healthchecks, volumes, networks
- [ ] GitHub Actions: lint → test (vitest) → build → deploy
- [ ] Migration documentation (rollback, squashing)
- [ ] Nx affected optimization in pipelines

---

## 🔴 8. Refresh Token — Security Bugs

The refresh token mechanism works globally (rotation, Redis blacklist, reuse detection) but several critical bugs have been identified.

### 🔴 Critical Bug — Logout Does Not Blacklist Access Token

`exp` is not included in JWT strategy return → `ctx.req.user.exp = undefined` → guard `if (!jti || !exp) { return; }` skips JTI blacklist → **access token remains valid 15min after logout**.

- [x] Add `exp: payload.exp` in return of `jwt.strategy.ts` (lines 22-32)
- [x] Verify `customerLogout` and `employeeLogout` pass `exp` to service
- [x] Test: after logout, a call with old access token must fail

### 🔴 Critical Bug — `verifyToken()` Does Not Check `tokenType`

Refresh tokens have `purpose: 'access'` (copied from parent payload) so they pass `verifyToken()` check. This field is unusable as a security boundary.

- [x] In `signAndStore()`, set `purpose: 'refresh'` on refresh token payload
- [x] OR remove `purpose` field and rely solely on `tokenType`
- [x] In `verifyToken()`, add check `tokenType !== 'refresh'`
- [x] Test: a refresh token must never be accepted by `verifyToken()`

### 🟡 Medium Bug — Silent Cross-Type Token Swap

An employee refresh token sent to `customerRefreshToken` returns `customer: null` silently (and vice versa). No error, no rejection.

- [x] In `customerRefreshToken`, verify `payload.type === 'customer'` before processing
- [x] In `employeeRefreshToken`, verify `payload.type === 'employee'` before processing
- [x] Throw `UnauthorizedException` if type doesn't match
- [x] Test: employee refresh token → `customerRefreshToken` must fail

### 🟡 Medium Bug — No Rate Limiting on Refresh Mutations

`customerRefreshToken` and `employeeRefreshToken` mutations lack `@UseGuards(AuthRateLimitGuard)`. Brute-force or DoS possible.

- [x] Add `@UseGuards(AuthRateLimitGuard)` on `customerRefreshToken`
- [x] Add `@UseGuards(AuthRateLimitGuard)` on `employeeRefreshToken`
- [x] Test: 10 refreshes in 1 minute → blocked

### 🟡 Medium Bug — No Audit Logging on Refresh

Refresh activity is invisible in audit logs. Login and logout are audited but not refresh.

- [x] Add `authService.audit()` in `refreshToken()` (auth-token.service.ts)
- [x] Record: userId, old jti, new jti, IP, User-Agent, timestamp
- [x] Test: after refresh, an AuditLog entry must exist

### 🟡 Medium Bug — TOCTOU Race Condition

No Redis transaction between `assertRefreshTokenActive` and `blacklistCurrentRefreshToken`. Two concurrent requests can refresh simultaneously → 2 valid token pairs.

- [x] Use Redis distributed lock (`SET NX EX`) before verification
- [x] OR use Redis transaction (MULTI/EXEC)
- [x] OR atomize verification + blacklist in single Redis command
- [x] Test: 2 concurrent requests with same token → 1 must fail

### 🟡 Gap — No Family-Wide Revocation on Reuse

When reuse is detected (stolen token), only the reused token is rejected. Thief can continue with their active token.

- [x] Detect reuse (blacklisted JTI or JTI mismatch)
- [x] Delete `rt_{userId}` from Redis (revoke entire family)
- [x] Force logout of all devices
- [x] Send security notification to customer
- [x] Test: reuse detected → all user tokens revoked

### 🟢 Gap — No Unit Tests for AuthTokenService

Rotation, blacklist, and reuse detection have zero test coverage.

- [x] Unit tests `AuthTokenService`:
  - [x] `generateCustomerToken` / `generateEmployeeToken` — generates a pair
  - [x] `refreshToken` — rotation works (old blacklisted, new issued)
  - [x] `refreshToken` — blacklisted token → error
  - [x] `refreshToken` — Redis-expired token → error
  - [x] `logout` — revokes active refresh token
  - [x] `assertRefreshTokenActive` — 3 cases (active, blacklisted, mismatch)
- [ ] Integration tests: full flow login → refresh → logout → old token invalid
