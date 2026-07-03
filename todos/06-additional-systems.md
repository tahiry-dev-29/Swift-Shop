# 💬 ADDITIONAL SYSTEMS & INTEGRATIONS

---

## 🔔 Notifications System

- [x] Prisma models: `Notification`, `NotificationPreference`, `PushSubscription`
- [x] `NotificationService` (core dispatcher): `send`, `markAsRead`, `getUnreadCount`
- [x] `PushNotificationService`: Web Push (VAPID) + FCM
- [x] `SmsNotificationService`: Twilio / Africa's Talking
- [x] **Real-Time Transport**: WebSocket Gateway + SSE fallback
- [x] **Frontend**: `NotificationBellComponent`, `NotificationCenterComponent`, `NotificationToastComponent`

---

## 💬 Customer Support & Live Chat

- [x] Prisma models: `SupportTicket`, `TicketMessage`, `LiveChatSession`, `ChatMessage`
- [x] `SupportTicketService`: `createTicket`, `replyToTicket`, `assignTicket`
- [x] `LiveChatGateway` (WebSocket): `joinChat`, `sendMessage`, `agentTyping`
- [ ] **Frontend**: `SupportTicketListComponent`, `LiveChatWidgetComponent`

---

## 📬 Email Messaging System (Inbox & Compose)

- [x] Prisma models: `EmailMessage`, `EmailThread`, `EmailTemplate`, `EmailAttachment`
- [x] `MessagingService`: `sendMessage`, `replyToThread`, `getInbox`, `getThread`
- [x] `EmailTemplateService`: CRUD for admin templates
- [ ] **Frontend**: `MailboxComponent`, `ThreadDetailComponent`, `ComposeModalComponent`

---

## 🧩 CMS — Content Management

- [ ] Prisma models: `CmsPage`, `Banner`, `HomepageBlock`
- [ ] `CmsPageService` — CRUD + slug uniqueness
- [ ] `BannerService` — scheduling (active between dates)
- [ ] `HomepageService` — block reordering

---

## 📊 Analytics & Reports

- [ ] Prisma models: `DailySalesSnapshot`, `ProductViewEvent`
- [ ] `AnalyticsService`: `getDashboardStats`, `getSalesChart`, `getTopProducts`
- [ ] **Frontend**: `AnalyticsDashboardComponent`, `SalesChartComponent`, `ReportExportComponent
- [x] Prisma models: `DailySalesSnapshot`, `ProductViewEvent`
- [x] `AnalyticsService`: `getDashboardStats`, `getSalesChart`, `getTopProducts`
- [ ] **Frontend**: `AnalyticsDashboardComponent`, `SalesChartComponent`, `ReportExportComponent`

---

## 📱 Social Sharing — Facebook & Instagram

- [x] `SocialPost` model & scheduled publishing
- [x] **Facebook Integration**: Graph API, Page Access Tokens, Facebook Pixel
- [x] **Facebook Catalog**: Product Feed XML sync
- [x] **Instagram Integration**: Product tagging, Stories publishing
- [ ] **Frontend**: `ShareButtonComponent`, `SocialPublisherComponent` (Admin)
