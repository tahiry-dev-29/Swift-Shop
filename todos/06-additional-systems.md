# 💬 ADDITIONAL SYSTEMS & INTEGRATIONS

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

## 🧪 Tests — Additional Systems

### Notifications — Unit Tests

- [ ] `NotificationService.send` — multi-channel dispatch (in-app, push, SMS)
- [ ] `NotificationService.markAsRead` — single, bulk
- [ ] `NotificationService.getUnreadCount` — count accuracy
- [ ] `NotificationService.registerPushSubscription` — VAPID, FCM
- [ ] `NotificationTransportService` — SSE events, connection management
- [ ] `PushNotificationService` — Web Push payload, FCM message
- [ ] `SmsNotificationService` — Twilio/Africa's Talking (mocked)
- [ ] `NotificationQueueService` — BullMQ job creation
- [ ] `NotificationProcessor` — queue processing

### Notifications — Integration Tests

- [ ] `myNotifications` query — paginated, ordered by date
- [ ] `notificationUnreadCount` — accurate count
- [ ] `sendNotification` mutation — notification created
- [ ] `markNotificationAsRead` — field updated
- [ ] SSE endpoint — real-time event stream

### Support — Unit Tests

- [ ] `SupportTicketService.createTicket` — new ticket, auto-assign
- [ ] `SupportTicketService.replyToTicket` — customer reply, agent reply
- [ ] `SupportTicketService.assignTicket` — assign, reassign, unassign

### Support — Integration Tests

- [ ] Live Chat WebSocket — `joinChat`, `sendMessage`, `agentTyping`
- [ ] `SupportTicketResolver` — create, reply, assign mutations

### Messaging — Unit Tests

- [ ] `MessagingService.sendMessage` — new thread, existing thread
- [ ] `MessagingService.replyToThread` — append to thread
- [ ] `MessagingService.getInbox` — paginated, ordered
- [ ] `EmailTemplateService` — CRUD, render with variables
- [ ] `EmailProcessor` — queue processing, SMTP send

### Messaging — Integration Tests

- [ ] `MessagingResolver` — inbox, thread detail, send, reply
- [ ] `EmailTemplateResolver` — template CRUD

### Analytics — Unit Tests

- [ ] `AnalyticsService.getDashboardStats` — totals, counts, averages
- [ ] `AnalyticsService.getSalesChart` — daily/weekly/monthly aggregation
- [ ] `AnalyticsService.getTopProducts` — by revenue, by qty
- [ ] `AnalyticsService.trackProductView` — IP anonymization, dedup
- [ ] `AnalyticsRepository` — raw SQL queries correctness

### Analytics — Integration Tests

- [ ] `dashboardStats` query — correct KPI values
- [ ] `salesChart` query — date range filtering
- [ ] `topProducts` query — correct ranking
- [ ] `trackProductView` mutation — event recorded

### Social Media — Unit Tests

- [ ] `SocialMediaService.createPost` — draft, scheduled, published
- [ ] `SocialMediaService.schedulePost` — future date scheduling
- [ ] `SocialMediaService.publishNow` — immediate publishing
- [ ] `FacebookService` — Graph API call, page token refresh
- [ ] `InstagramService` — media upload, story publish
- [ ] `SocialMediaProcessor` — queue-based publishing

### Social Media — Integration Tests

- [ ] `SocialMediaResolver` — mutations for create, schedule, delete
- [ ] Facebook catalog XML feed generation

### CMS — Unit Tests

- [x] `CmsPageService` — CRUD, slug uniqueness
- [x] `BannerService` — scheduling (active between dates)
- [x] `HomepageService` — block reordering

### CMS — Integration Tests

- [x] `CmsPageResolver` — CRUD mutations + queries
- [x] `BannerResolver` — CRUD with date validation
- [x] `HomePageResolver` — block order consistency
