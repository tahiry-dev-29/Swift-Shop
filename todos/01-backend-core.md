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

## 🛡️ Backend Quality, Testing & DevOps

- [ ] **Unit Tests**: coverage > 80% on all Services (Vitest)
- [ ] **Integration Tests**: full GraphQL endpoint scenarios
- [ ] **E2E Tests**: critical user journeys
- [x] **Strict DTO Validation**: `whitelist: true`, `forbidNonWhitelisted: true`
- [x] **Observability**: structured logs (Pino), distributed tracing (OpenTelemetry)
- [x] **Health Checks**: Terminus (Database, Redis, Memory)
- [ ] **Performance benchmarks**: k6 load tests
- [x] **OpenAPI / Swagger**: auto-generated documentation
