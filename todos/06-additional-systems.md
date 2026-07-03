# 💬 ADDITIONAL SYSTEMS & INTEGRATIONS

---

## 🔔 Notifications System

- [ ] Prisma models: `Notification`, `NotificationPreference`, `PushSubscription`
- [ ] `NotificationService` (core dispatcher): `send`, `markAsRead`, `getUnreadCount`
- [ ] `PushNotificationService`: Web Push (VAPID) + FCM
- [ ] `SmsNotificationService`: Twilio / Africa's Talking
- [ ] **Real-Time Transport**: WebSocket Gateway + SSE fallback
- [ ] **Frontend**: `NotificationBellComponent`, `NotificationCenterComponent`, `NotificationToastComponent`

---

## 💬 Customer Support & Live Chat

- [ ] Prisma models: `SupportTicket`, `TicketMessage`, `LiveChatSession`, `ChatMessage`
- [ ] `SupportTicketService`: `createTicket`, `replyToTicket`, `assignTicket`
- [ ] `LiveChatGateway` (WebSocket): `joinChat`, `sendMessage`, `agentTyping`
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
- [ ] **Frontend**: `AnalyticsDashboardComponent`, `SalesChartComponent`, `ReportExportComponent`

---

## 📱 Social Sharing — Facebook & Instagram

- [ ] `SocialPost` model & scheduled publishing
- [ ] **Facebook Integration**: Graph API, Page Access Tokens, Facebook Pixel
- [ ] **Facebook Catalog**: Product Feed XML sync
- [ ] **Instagram Integration**: Product tagging, Stories publishing
- [ ] **Frontend**: `ShareButtonComponent`, `SocialPublisherComponent` (Admin)
