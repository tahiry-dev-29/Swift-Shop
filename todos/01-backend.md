# 🏗️ BACKEND — Core, Auth, RBAC, Settings & Additional Systems

---

## 🛠️ Setup & Infrastructure

gwt-new ../setup-infra feat/setup-infra

- [x] Initialize Nx Monorepo (`npx create-nx-workspace`)
- [x] Configure the NestJS application `api-store`
- [x] Create the shared library `libs/shared/db-schema`
- [x] Install and configure Prisma with PostgreSQL (`provider = "prisma-client-js"`)
- [x] Configure Docker Compose for PostgreSQL + Redis
- [x] Set up ConfigService (environment variables management)
- [ ] **Vault / Doppler** integration for secrets management in production
- [ ] **Infrastructure as Code**: optimized multi-stage Dockerfiles + `docker-compose.prod.yml`
- [x] **CI/CD Pipeline**: GitHub Actions (lint → test → build → deploy)
- [x] **Database Seeding**: realistic seed script for dev/staging environments
- [ ] **Nx affected** optimization: only rebuild/retest changed libs on each push
- [ ] **Database migrations strategy**: versioned migration files, rollback procedure documented
- [x] **Connection pooling**: PgBouncer or Prisma Accelerate for production DB connections
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

## 🔔 Notifications System

- [x] Prisma models: `Notification`, `NotificationPreference`, `PushSubscription`
- [x] `NotificationService` (core dispatcher): `send`, `markAsRead`, `getUnreadCount`
- [x] `PushNotificationService`: Web Push (VAPID) + FCM
- [x] `SmsNotificationService`: Twilio / Africa's Talking
- [x] **Real-Time Transport**: WebSocket Gateway + SSE fallback

---

## 💬 Customer Support & Live Chat

- [x] Prisma models: `SupportTicket`, `TicketMessage`, `LiveChatSession`, `ChatMessage`
- [x] `SupportTicketService`: `createTicket`, `replyToTicket`, `assignTicket`
- [x] `LiveChatGateway` (WebSocket): `joinChat`, `sendMessage`, `agentTyping`

---

## 📬 Email Messaging System (Inbox & Compose)

- [x] Prisma models: `EmailMessage`, `EmailThread`, `EmailTemplate`, `EmailAttachment`
- [x] `MessagingService`: `sendMessage`, `replyToThread`, `getInbox`, `getThread`
- [x] `EmailTemplateService`: CRUD for admin templates

---

## 🧩 CMS — Content Management

- [x] Prisma models: `CmsPage`, `Banner`, `HomepageBlock`
- [x] `CmsPageService` — CRUD + slug uniqueness
- [x] `BannerService` — scheduling (active between dates)
- [x] `HomepageService` — block reordering

---

## 📊 Analytics & Reports

- [x] Prisma models: `DailySalesSnapshot`, `ProductViewEvent`
- [x] `AnalyticsService`: `getDashboardStats`, `getSalesChart`, `getTopProducts`

---

## 📱 Social Sharing — Facebook & Instagram

- [x] `SocialPost` model & scheduled publishing
- [x] **Facebook Integration**: Graph API, Page Access Tokens, Facebook Pixel
- [x] **Facebook Catalog**: Product Feed XML sync
- [x] **Instagram Integration**: Product tagging, Stories publishing

---

## 🧪 Tests — Backend Core

gwt-new ../backend-tests feat/backend-tests

### Auth — Unit Tests

- [x] `AuthService` — login, register, refresh token, magic link, OAuth2 flow
- [x] `AuthTokenService` — access + refresh token generation, rotation, blacklisting
- [x] `AuthCredentialsService` — validation, account lockout (5 failed → 15min lock)
- [x] `AuthOAuthService` — Google/Facebook PKCE flow, profile fetch, account linking
- [x] `AuthRecoveryService` — magic link generation, TTL expiry, forced reset
- [x] `TwoFactorService` — TOTP secret, QR code, token verification
- [x] `PasswordSecurityService` — Argon2 hash/verify, HIBP check, policy enforcement
- [x] `TrustedDeviceService` — device token hash, 30-day trust, rotation
- [x] `AuthAuditService` — audit log recording, session anomaly detection
- [x] `AuthMailService` — email sending for magic link, lockout, reset, welcome

### Auth — Token Security Tests

- [x] Refresh token rotation — old blacklisted, new pair valid
- [x] Refresh token reuse — already used token → rejected
- [x] Refresh token reuse detection — family-wide revocation
- [x] Cross-type swap — employee token → customerRefreshToken → rejected
- [x] Logout — access token JTI blacklisted, refresh token revoked
- [x] Race condition — 2 concurrent refreshes → 1 fails
- [x] `verifyToken()` — reject refresh tokens (tokenType check)
- [x] Audit logging — each refresh generates an AuditLog entry

### Auth — Integration Tests

- [x] `auth/employee/login` — success, wrong password, locked account, 2FA required
- [x] `auth/customer/register` — success, duplicate email, invalid password
- [x] `auth/customer/login` — success, magic link, OAuth2 callback
- [x] Refresh token flow — rotation, blacklist after use
- [x] Rate limiting — N requests in window → blocked

### Auth — Guards & Decorators

- [x] `JwtAuthGuard` — valid token, expired token, malformed token
- [x] `CustomerGuard` — customer token, employee token rejected
- [x] `EmployeeGuard` — employee token, customer token rejected
- [x] `SuperAdminGuard` — super admin, non-super admin rejected
- [x] `OptionalCustomerGuard` — authenticated, unauthenticated both allowed
- [x] `PermissionGuard` — user with permission, user without, @RequirePermission()

### RBAC — Unit Tests

- [x] `RoleService` — create, update, delete (soft), clone, system role protection
- [x] `RolePermissionService` — assign/revoke permissions, matrix, effective permissions
- [x] `EmployeeRoleAssignmentService` — multi-role assignment, cache invalidation
- [x] `Permission caching` — Redis get/set/invalidate on permission change
- [x] `StoreBranchScopeGuard` — employee with branch, employee without
- [x] `TemporaryRoleElevationService` — grant, expiry, revoke

### Settings — Unit Tests

- [x] `SettingService` — get, set, getGroup, getPublicSettings, type parsing
- [x] `LanguageService` — CRUD, set default, uniqueness
- [x] `CurrencyService` — CRUD, exchange rate sync

### Settings — Integration Tests

- [x] `LanguageResolver` — queries + mutations
- [x] `CurrencyResolver` — queries + mutations
- [x] `StoreResolver` — queries + mutations
- [x] `PublicSettingsResolver` — unauthenticated access

### Health — Integration Tests

- [x] `GET /api/health` — returns UP when DB + Redis + memory OK
- [x] `GET /api/health` — returns DOWN when DB unavailable

### Notifications — Unit Tests

- [x] `NotificationService.send` — multi-channel dispatch (in-app, push, SMS)
- [x] `NotificationService.markAsRead` — single, bulk
- [x] `NotificationService.getUnreadCount` — count accuracy
- [x] `NotificationService.registerPushSubscription` — VAPID, FCM
- [x] `NotificationTransportService` — SSE events, connection management
- [x] `PushNotificationService` — Web Push payload, FCM message
- [x] `SmsNotificationService` — Twilio/Africa's Talking (mocked)
- [x] `NotificationQueueService` — BullMQ job creation
- [x] `NotificationProcessor` — queue processing

### Notifications — Integration Tests

- [x] `myNotifications` query — paginated, ordered by date
- [x] `notificationUnreadCount` — accurate count
- [x] `sendNotification` mutation — notification created
- [x] `markNotificationAsRead` — field updated
- [x] SSE endpoint — real-time event stream

### Support — Unit Tests

- [x] `SupportTicketService.createTicket` — new ticket, auto-assign
- [x] `SupportTicketService.replyToTicket` — customer reply, agent reply
- [x] `SupportTicketService.assignTicket` — assign, reassign, unassign

### Support — Integration Tests

- [x] Live Chat WebSocket — `joinChat`, `sendMessage`, `agentTyping`
- [x] `SupportTicketResolver` — create, reply, assign mutations

### Messaging — Unit Tests

- [x] `MessagingService.sendMessage` — new thread, existing thread
- [x] `MessagingService.replyToThread` — append to thread
- [x] `MessagingService.getInbox` — paginated, ordered
- [x] `EmailTemplateService` — CRUD, render with variables
- [x] `EmailProcessor` — queue processing, SMTP send

### Messaging — Integration Tests

- [x] `MessagingResolver` — inbox, thread detail, send, reply
- [x] `EmailTemplateResolver` — template CRUD

### Analytics — Unit Tests

- [x] `AnalyticsService.getDashboardStats` — totals, counts, averages
- [x] `AnalyticsService.getSalesChart` — daily/weekly/monthly aggregation
- [x] `AnalyticsService.getTopProducts` — by revenue, by qty
- [x] `AnalyticsService.trackProductView` — IP anonymization, dedup
- [x] `AnalyticsRepository` — raw SQL queries correctness

### Analytics — Integration Tests

- [x] `dashboardStats` query — correct KPI values
- [x] `salesChart` query — date range filtering
- [x] `topProducts` query — correct ranking
- [x] `trackProductView` mutation — event recorded

### Social Media — Unit Tests

- [x] `SocialMediaService.createPost` — draft, scheduled, published
- [x] `SocialMediaService.schedulePost` — future date scheduling
- [x] `SocialMediaService.publishNow` — immediate publishing
- [x] `FacebookService` — Graph API call, page token refresh
- [x] `InstagramService` — media upload, story publish
- [x] `SocialMediaProcessor` — queue-based publishing

### Social Media — Integration Tests

- [x] `SocialMediaResolver` — mutations for create, schedule, delete
- [x] Facebook catalog XML feed generation

### CMS — Unit Tests

- [x] `CmsPageService` — CRUD, slug uniqueness
- [x] `BannerService` — scheduling (active between dates)
- [x] `HomepageService` — block reordering

### CMS — Integration Tests

- [x] `CmsPageResolver` — CRUD mutations + queries
- [x] `BannerResolver` — CRUD with date validation
- [x] `HomePageResolver` — block order consistency

## 🛡️ DevOps & Quality

gwt-new ../devops-benchmarks feat/devops-benchmarks

- [x] **Strict DTO Validation**: `whitelist: true`, `forbidNonWhitelisted: true`
- [x] **Observability**: structured logs (Pino), distributed tracing (OpenTelemetry)
- [x] **Health Checks**: Terminus (Database, Redis, Memory)
- [ ] **Performance benchmarks**: k6 load tests
- [x] **OpenAPI / Swagger**: auto-generated documentation
