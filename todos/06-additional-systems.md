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

- [x] Prisma models: `DailySalesSnapshot`, `ProductViewEvent`
- [x] `AnalyticsService`: `getDashboardStats`, `getSalesChart`, `getTopProducts`
- [ ] **Frontend**: `AnalyticsDashboardComponent`, `SalesChartComponent`, `ReportExportComponent`

---

## 📱 Social Sharing — Facebook & Instagram

- [ ] `SocialPost` model & scheduled publishing
- [ ] **Facebook Integration**: Graph API, Page Access Tokens, Facebook Pixel
- [ ] **Facebook Catalog**: Product Feed XML sync
- [ ] **Instagram Integration**: Product tagging, Stories publishing
- [ ] **Frontend**: `ShareButtonComponent`, `SocialPublisherComponent` (Admin)
