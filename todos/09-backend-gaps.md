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

- [ ] Add `exp: payload.exp` in return of `jwt.strategy.ts` (lines 22-32)
- [ ] Verify `customerLogout` and `employeeLogout` pass `exp` to service
- [ ] Test: after logout, a call with old access token must fail

### 🔴 Critical Bug — `verifyToken()` Does Not Check `tokenType`

Refresh tokens have `purpose: 'access'` (copied from parent payload) so they pass `verifyToken()` check. This field is unusable as a security boundary.

- [ ] In `signAndStore()`, set `purpose: 'refresh'` on refresh token payload
- [ ] OR remove `purpose` field and rely solely on `tokenType`
- [ ] In `verifyToken()`, add check `tokenType !== 'refresh'`
- [ ] Test: a refresh token must never be accepted by `verifyToken()`

### 🟡 Medium Bug — Silent Cross-Type Token Swap

An employee refresh token sent to `customerRefreshToken` returns `customer: null` silently (and vice versa). No error, no rejection.

- [ ] In `customerRefreshToken`, verify `payload.type === 'customer'` before processing
- [ ] In `employeeRefreshToken`, verify `payload.type === 'employee'` before processing
- [ ] Throw `UnauthorizedException` if type doesn't match
- [ ] Test: employee refresh token → `customerRefreshToken` must fail

### 🟡 Medium Bug — No Rate Limiting on Refresh Mutations

`customerRefreshToken` and `employeeRefreshToken` mutations lack `@UseGuards(AuthRateLimitGuard)`. Brute-force or DoS possible.

- [ ] Add `@UseGuards(AuthRateLimitGuard)` on `customerRefreshToken`
- [ ] Add `@UseGuards(AuthRateLimitGuard)` on `employeeRefreshToken`
- [ ] Test: 10 refreshes in 1 minute → blocked

### 🟡 Medium Bug — No Audit Logging on Refresh

Refresh activity is invisible in audit logs. Login and logout are audited but not refresh.

- [ ] Add `authService.audit()` in `refreshToken()` (auth-token.service.ts)
- [ ] Record: userId, old jti, new jti, IP, User-Agent, timestamp
- [ ] Test: after refresh, an AuditLog entry must exist

### 🟡 Medium Bug — TOCTOU Race Condition

No Redis transaction between `assertRefreshTokenActive` and `blacklistCurrentRefreshToken`. Two concurrent requests can refresh simultaneously → 2 valid token pairs.

- [ ] Use Redis distributed lock (`SET NX EX`) before verification
- [ ] OR use Redis transaction (MULTI/EXEC)
- [ ] OR atomize verification + blacklist in single Redis command
- [ ] Test: 2 concurrent requests with same token → 1 must fail

### 🟡 Gap — No Family-Wide Revocation on Reuse

When reuse is detected (stolen token), only the reused token is rejected. Thief can continue with their active token.

- [ ] Detect reuse (blacklisted JTI or JTI mismatch)
- [ ] Delete `rt_{userId}` from Redis (revoke entire family)
- [ ] Force logout of all devices
- [ ] Send security notification to customer
- [ ] Test: reuse detected → all user tokens revoked

### 🟢 Gap — No Unit Tests for AuthTokenService

Rotation, blacklist, and reuse detection have zero test coverage.

- [ ] Unit tests `AuthTokenService`:
  - [ ] `generateCustomerToken` / `generateEmployeeToken` — generates a pair
  - [ ] `refreshToken` — rotation works (old blacklisted, new issued)
  - [ ] `refreshToken` — blacklisted token → error
  - [ ] `refreshToken` — Redis-expired token → error
  - [ ] `logout` — revokes active refresh token
  - [ ] `assertRefreshTokenActive` — 3 cases (active, blacklisted, mismatch)
- [ ] Integration tests: full flow login → refresh → logout → old token invalid
