# 🏗️ BACKEND CORE & INFRASTRUCTURE

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
- [x] **2FA (TOTP)** for `Employee` accounts (`otplib`, QR Code generation via `qrcode`)
- [x] **Rate Limiting** on login/register routes (`@nestjs/throttler` + Redis store)
- [x] **Magic Link** — Passwordless login for customers
- [x] **Session Fingerprinting** — Anomaly detection (IP change, User-Agent mismatch)
- [x] **Audit Log** — Full traceability of logins and sensitive actions
- [x] **OAuth2 PKCE** — Social login (Google, Facebook)
- [x] **Device Trust** — Remember device for 30 days
- [x] **Account Lockout Policy** — Auto-lock after N failed login attempts
- [x] **Password policy enforcement** — min length, complexity
- [x] **Forced password reset** — Admin can force employee to reset on next login

---

## 👥 Roles & Permissions — RBAC System

- [x] `Role` — named role
- [x] `Permission` — atomic permission unit
- [x] `RolePermission` — many-to-many join
- [x] `EmployeeRole` — many-to-many join
- [x] **Built-in System Roles**: `SuperAdmin`, `Admin`, `StoreManager`, `OrderManager`, `ContentManager`, `SupportAgent`, `Analyst`
- [x] `RoleService`: `createRole`, `updateRole`, `deleteRole`, `cloneRole`, `getRoleWithPermissions`, `listRoles`
- [x] `PermissionService`: `assignPermissionsToRole`, `revokePermissionsFromRole`, `getPermissionsMatrix`
- [x] `EmployeeRoleService`: `assignRolesToEmployee`, `revokeRolesFromEmployee`, `getEffectivePermissions`
- [x] `PermissionGuard` — decorator-based `@RequirePermission('products:create')`

### Advanced Robustness

- [x] **Permission caching** — Redis cache of resolved permissions per employee
- [x] **Row-level security** — employees can only see/edit their assigned store branches
- [x] **Permission audit trail** — log every permission grant/revoke with actor + timestamp
- [x] **Temporary role elevation** — grant extra permissions for a time-limited period
- [x] **Permission check middleware** — auto-applied on all back-office resolvers

---

## ⚙️ Settings & Configuration

- [x] `Setting` — key-value store for shop configuration
- [x] `Language` — supported store languages
- [x] `Currency` — supported currencies
- [x] `Store` — multi-store support
- [x] `SettingService`: `get`, `set`, `getGroup`, `getPublicSettings`
- [x] `LanguageService` — CRUD + set default
- [x] `CurrencyService` — CRUD + sync exchange rates

---

## 🧪 Tests — Backend Core

### Auth — Unit Tests

- [ ] `AuthService` — login, register, refresh token, magic link, OAuth2 flow
- [ ] `AuthTokenService` — access + refresh token generation, rotation, blacklisting
- [ ] `AuthCredentialsService` — validation, account lockout (5 failed → 15min lock)
- [ ] `AuthOAuthService` — Google/Facebook PKCE flow, profile fetch, account linking
- [ ] `AuthRecoveryService` — magic link generation, TTL expiry, forced reset
- [ ] `TwoFactorService` — TOTP secret, QR code, token verification
- [ ] `PasswordSecurityService` — Argon2 hash/verify, HIBP check, policy enforcement
- [ ] `TrustedDeviceService` — device token hash, 30-day trust, rotation
- [ ] `AuthAuditService` — audit log recording, session anomaly detection
- [ ] `AuthMailService` — email sending for magic link, lockout, reset, welcome

### Auth — Token Security Tests (→ see also [09-backend-gaps.md](./09-backend-gaps.md#-8-refresh-token--security-bugs))

- [ ] Refresh token rotation — old blacklisted, new pair valid
- [ ] Refresh token reuse — already used token → rejected
- [ ] Refresh token reuse detection — family-wide revocation
- [ ] Cross-type swap — employee token → customerRefreshToken → rejected
- [ ] Logout — access token JTI blacklisted, refresh token revoked
- [ ] Race condition — 2 concurrent refreshes → 1 fails
- [ ] `verifyToken()` — reject refresh tokens (tokenType check)
- [ ] Audit logging — each refresh generates an AuditLog entry

### Auth — Integration Tests

- [ ] `auth/employee/login` — success, wrong password, locked account, 2FA required
- [ ] `auth/customer/register` — success, duplicate email, invalid password
- [ ] `auth/customer/login` — success, magic link, OAuth2 callback
- [ ] Refresh token flow — rotation, blacklist after use
- [ ] Rate limiting — N requests in window → blocked

### Auth — Guards & Decorators

- [ ] `JwtAuthGuard` — valid token, expired token, malformed token
- [ ] `CustomerGuard` — customer token, employee token rejected
- [ ] `EmployeeGuard` — employee token, customer token rejected
- [ ] `SuperAdminGuard` — super admin, non-super admin rejected
- [ ] `OptionalCustomerGuard` — authenticated, unauthenticated both allowed
- [ ] `PermissionGuard` — user with permission, user without, @RequirePermission()

### RBAC — Unit Tests

- [ ] `RoleService` — create, update, delete (soft), clone, system role protection
- [ ] `RolePermissionService` — assign/revoke permissions, matrix, effective permissions
- [ ] `EmployeeRoleAssignmentService` — multi-role assignment, cache invalidation
- [ ] `Permission caching` — Redis get/set/invalidate on permission change
- [ ] `StoreBranchScopeGuard` — employee with branch, employee without
- [ ] `TemporaryRoleElevationService` — grant, expiry, revoke

### Settings — Unit Tests

- [ ] `SettingService` — get, set, getGroup, getPublicSettings, type parsing
- [ ] `LanguageService` — CRUD, set default, uniqueness
- [ ] `CurrencyService` — CRUD, exchange rate sync

### Settings — Integration Tests

- [ ] `LanguageResolver` — queries + mutations
- [ ] `CurrencyResolver` — queries + mutations
- [ ] `StoreResolver` — queries + mutations
- [ ] `PublicSettingsResolver` — unauthenticated access

### Health — Integration Tests

- [ ] `GET /api/health` — returns UP when DB + Redis + memory OK
- [ ] `GET /api/health` — returns DOWN when DB unavailable

## 🛡️ DevOps & Quality

- [x] **Strict DTO Validation**: `whitelist: true`, `forbidNonWhitelisted: true`
- [x] **Observability**: structured logs (Pino), distributed tracing (OpenTelemetry)
- [x] **Health Checks**: Terminus (Database, Redis, Memory)
- [ ] **Performance benchmarks**: k6 load tests
- [x] **OpenAPI / Swagger**: auto-generated documentation
