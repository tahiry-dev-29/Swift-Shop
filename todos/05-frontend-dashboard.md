# 🏢 BACK-OFFICE UI — Admin Panel (Angular 22 + spartan/ui)

---

## 🏗️ Layout & Navigation

gwt-new ../admin-layout feat/admin-layout

- [ ] `AdminLayoutComponent` — sidebar + header + content shell (`hlm-sidebar`, `hlmSidebarInset`)
- [ ] `SidebarComponent` — permission-aware nav menu with section groups (`hlmSidebarMenu`, `hlmSidebarMenuButton`)
- [ ] `SidebarGroupComponent` — collapsible group header with expand/collapse, section badge counter
- [ ] `SidebarSearchComponent` — filter menu items by typing (`hlmInput icon="search"`)
- [ ] `HeaderComponent` — search bar, dark mode toggle, notification bell, user avatar dropdown (`hlmInput`, `hlmBtn`, `hlmAvatar`, `hlmDropdownMenu`)
- [ ] `HeaderBreadcrumbComponent` — dynamic breadcrumb based on route (`hlm-breadcrumb`)
- [ ] Collapsible sidebar (icon mode) — `hlm-sidebar collapsible="icon"`, smooth transition
- [ ] Responsive layout — mobile sheet sidebar (`hlm-sheet`), hamburger toggle
- [ ] Dark mode toggle persisted to localStorage (`.dark` class on `html`), system preference detect
- [ ] `PageHeaderComponent` — reusable page title + subtitle + action buttons (`hlmBtn`, `hlm-input search`)
- [ ] `GlobalSearchCommandComponent` — `Cmd+K` palette to search all entities (`hlm-command`)
- [ ] **Keyboard shortcuts** — `?` to show shortcuts dialog (`hlm-dialog`)
- [ ] **Full-page loading state** — skeleton shell during lazy route loading (`hlmSkeleton`)

---

## 📊 Dashboard — KPI & Analytics

gwt-new ../admin-dashboard feat/admin-dashboard

- [ ] `DashboardComponent` — responsive KPI widget grid (2-3-4 columns) (`hlmCard`, `hlmBadge`)
- [ ] KPI cards: Total Revenue (MTD), Orders, Active Products, New Customers, Conversion Rate
- [ ] `KpiCardComponent` — reusable metric card with trend arrow, period comparison, sparkline chart
- [ ] `SalesOverviewChartComponent` — monthly revenue bar/line chart (Chart.js / ngx-charts)
- [ ] `OrdersChartComponent` — orders per day/week with moving average
- [ ] `TopProductsChartComponent` — top 10 selling products by revenue pie/donut chart
- [ ] `GeoMapSalesComponent` — sales by region heatmap (leaflet + choropleth)
- [ ] `RecentOrdersWidgetComponent` — top 5 latest orders with inline status badge (`hlmTable`, `hlmBadge`)
- [ ] `PendingTasksWidgetComponent` — pending shipments, low stock alerts, open tickets (`hlmCard`, `hlmBadge`)
- [ ] `LowStockAlertWidgetComponent` — products below threshold with quick-reorder link (`hlmTable`)
- [ ] `CustomerActivityWidgetComponent` — recently registered + most active customers
- [ ] `AnalyticsDashboardComponent` — full analytics view with date range picker
- [ ] `SalesChartComponent` — date range filter, daily/weekly/monthly/quarterly aggregation
- [ ] `RevenueBreakdownComponent` — by payment method, by category, by carrier (stacked bar)
- [ ] `CustomerCohortComponent` — retention by cohort (weekly/monthly)
- [ ] `AbandonedCartAnalyticsComponent` — count, total value, recovery rate
- [ ] `ReportExportComponent` — CSV/XLSX/PDF export button with column selector (`hlm-dialog`, `hlm-select`)
- [ ] `ScheduledReportComponent` — set up automated email reports (daily/weekly/monthly)
- [ ] Dashboard widget customizable grid — add/remove/reorder widgets, persist preference (`hlm-dialog`)

---

## 📦 Orders Management

gwt-new ../admin-orders feat/admin-orders

- [ ] `OrderListComponent` — sortable, filterable, paginated table (`hlmTable`, `hlmInput`, `hlmSelect`, `hlmPagination`)
- [ ] `OrderListFiltersComponent` — status, date range, customer, payment method, carrier (`hlmSheet` advanced filters)
- [ ] `OrderDetailComponent` — order info card, items table, status timeline, customer info, payment log
- [ ] `OrderStatusChangerComponent` — dropdown with confirmation dialog, validate transitions (`hlm-dialog`, `hlm-alert-dialog`)
- [ ] `OrderTimelineComponent` — vertical event feed with icons, timestamps, user attribution (`hlm-separator`, badges)
- [ ] `OrderNotesComponent` — internal notes + customer-visible notes (`hlmTextarea`, `hlmBadge`)
- [ ] `InvoicePreviewComponent` — printable invoice layout in dialog (`hlm-dialog`, print CSS)
- [ ] `InvoiceDownloadButtonComponent` — download PDF invoice (`hlmBtn`)
- [ ] `OrderHistoryLogComponent` — full history of status changes with timing (`hlmTable`)
- [ ] `RefundModalComponent` — process refund (full/partial), select items, reason (`hlm-dialog`, `hlmInput`)
- [ ] `CancelOrderComponent` — cancel with reason, stock restitution confirmation (`hlm-alert-dialog`)
- [ ] `OrderBulkActionsComponent` — bulk status change, bulk print invoices, bulk export (`hlm-dropdown-menu`)
- [ ] `OrderExportComponent` — CSV/XLSX add google sheat export with column selector in list view (`hlm-dialog`)
- [ ] `DraftOrdersComponent` — create order manually for customer (phone order) (`hlm-sheet side="right"`)

---

## 🔄 Returns & Refunds (RMA)

gwt-new ../admin-returns feat/admin-returns

- [ ] `ReturnListComponent` — table of RMA requests with status, reason, date (`hlmTable`, `hlmBadge`)
- [ ] `ReturnDetailComponent` — return items, reason, condition photos, timeline (`hlmCard`, `hlm-dialog`)
- [ ] `ReturnApprovalComponent` — approve/reject, select refund method, add notes (`hlm-alert-dialog`)
- [ ] `RefundProcessingComponent` — process refund to original payment method (`hlmCard`, `hlmBtn`)
- [ ] `ReplacementOrderComponent` — create replacement order for approved return (`hlm-dialog`)
- [ ] `ReturnAnalyticsComponent` — return rate by product, reason breakdown (`hlmCard`, chart)

---

## 📦 Products Management

gwt-new ../admin-products feat/admin-products

- [ ] `ProductListComponent` — product grid/table with search + advanced filters (`hlmTable`, `hlmInput`)
- [ ] `ProductListFiltersComponent` — category, brand, price range, stock status, active/inactive
- [ ] `ProductBulkActionsComponent` — bulk status toggle, bulk category assign, bulk delete (`hlm-dropdown-menu`)
- [ ] `ProductFormComponent` — multi-tab form:
  - [ ] Tab 1: General info (name, description, short desc, slug, tags) — `hlm-tabs`, `hlmField`, `hlmInput`, `hlmTextarea`
  - [ ] Tab 2: Pricing (base price, wholesale price, tax rule, currency) — `hlmInput`, `hlmSelect`
  - [ ] Tab 3: Stock (quantity, low stock threshold, out-of-stock behavior, location/warehouse) — `hlmInput`, `hlmSwitch`
  - [ ] Tab 4: Images (media gallery upload, drag-reorder, set cover, alt text) — dropzone + `hlm-dialog`
  - [ ] Tab 5: SEO (meta title, meta description, canonical URL, social preview, focus keyword)
  - [ ] Tab 6: Attributes (assign attribute groups, values per product) — `hlm-combobox`, `hlm-badge`
  - [ ] Tab 7: Shipping (weight, dimensions, additional shipping fees, carrier exclusions) — `hlmInput`, `hlmSelect`
  - [ ] Tab 8: Related products (cross-sell, up-sell) — search + multi-select (`hlm-combobox`)
  - [ ] Tab 9: Suppliers (assign suppliers, reference, price) — `hlmTable`, `hlm-dialog`
- [ ] Product combinations editor (variant matrix — generate all combinations, per-variant price/stock/image)
- [ ] `VariantCombinationTableComponent` — editable grid of all variants (`hlmTable`, inline inputs)
- [ ] Category selector with expandable tree (`hlm-combobox` / `hlm-popover tree`)
- [ ] `SupplierSelectorComponent` — searchable supplier dropdown with ref + price (`hlm-command`)
- [ ] `BulkProductImportDialogComponent` — CSV/XLSX import wizard, column mapping, preview, validation errors
- [ ] `BulkProductExportDialogComponent` — export with column selector and filter criteria
- [ ] `ProductDuplicateComponent` — duplicate product with all attributes (`hlmBtn`, confirmation)
- [ ] `ProductPreviewComponent` — render product detail as it appears on storefront (`hlm-sheet` side="right" iframe)

---

## 👥 Customers Management

gwt-new ../admin-customers feat/admin-customers

- [ ] `CustomerListComponent` — searchable, paginated table with filters (`hlmTable`, `hlmInput`)
- [ ] `CustomerListFiltersComponent` — registration date, order count, total spent, group, active/inactive
- [ ] `CustomerDetailComponent` — profile card, order history, addresses map, notes, login activity
- [ ] `CustomerOrderHistoryComponent` — embed order list for specific customer (`hlmTable`, `hlmBadge`)
- [ ] `CustomerCartContentsComponent` — view current abandoned cart items (`hlmCard`, `hlmBtn` email reminder)
- [ ] `CustomerAddressVerificationComponent` — validate address with map preview (`hlmCard`, leaflet)
- [ ] `CustomerNotesComponent` — internal notes with timestamps, admin attribution (`hlmTextarea`, `hlmCard`)
- [ ] `CustomerLoginActivityComponent` — last login, IP, device, session list with force-logout (`hlmTable`, `hlmBtn`)
- [ ] `ImpersonateButtonComponent` — one-click login as customer (with confirmation dialog, audit log entry)
- [ ] `CustomerGroupAssignmentComponent` — assign groups with multi-select tags (`hlm-select`, tags)
- [ ] `CustomerMergeComponent` — merge duplicate customer accounts (`hlm-dialog`, conflict resolution)
- [ ] `BulkEmailSenderComponent` — select customers by filter, compose + send email (`hlm-dialog`, `hlmTextarea`)
- [ ] `CustomerSegmentBuilderComponent` — build segments by criteria (orders, spend, date) (`hlmCard`, condition builder)
- [ ] **Abandoned cart recovery UI** — list abandoned carts, send recovery email, track conversions

---

## 📂 Catalog & Categories

gwt-new ../admin-catalog feat/admin-catalog

- [ ] `CategoryTreeComponent` — expandable tree with drag-drop reorder, right-click context menu (`hlm-tree`, sortablejs)
- [ ] `CategoryFormComponent` — name, slug, parent, description, image/icon, cover, SEO fields (`hlm-dialog` or `hlm-sheet`)
- [ ] `CategorySeoSettingsComponent` — meta title, description, focus keyword, social preview
- [ ] `CategoryProductsAssignmentComponent` — search + multi-select products to assign (`hlm-combobox`, `hlm-badge`)
- [ ] `AttributeGroupsComponent` — list of attribute groups, reorder (`hlmTable`, `hlm-dialog`)
- [ ] `AttributeGroupFormComponent` — group name, public label, display type (select/color/swatch) (`hlm-dialog`)
- [ ] `AttributesComponent` — values within a group, editable list (`hlmTable`, inline edit)
- [ ] `AttributeColorSwatchComponent` — color picker for visual attributes (`hlm-popover`, color palette)
- [ ] `FeaturesComponent` — manage product features (brand, material, etc.) (`hlmCard`, `hlm-dialog`)
- [ ] `BrandsComponent` — brand list + form (name, logo, description, website) (`hlmTable`, `hlm-dialog`)
- [ ] `CategoryDragDropService` — persistence for drag-drop reorder of categories
- [ ] `CategoryImportExportComponent` — import/export categories via CSV with parent mapping (`hlm-dialog`)

---

## 🏷️ Promotions & Discounts

gwt-new ../admin-promotions feat/admin-promotions

- [ ] `SpecificPricesComponent` — list of product-specific discount rules (`hlmTable`)
- [ ] `SpecificPriceFormComponent` — rule editor (customer group, quantity, date range, discount type: fixed/percentage)
- [ ] `CatalogPriceRulesComponent` — global catalog price rules (category, brand, attribute conditions) (`hlmTable`)
- [ ] `CatalogPriceRuleFormComponent` — condition builder with AND/OR groups, action (apply discount)
- [ ] `CouponsComponent` — voucher code management (`hlmTable`, `hlmBadge`)
- [ ] `CouponFormComponent` — code generator (random/prefix), discount config, usage limits, min cart, customer groups
- [ ] `CouponUsageReportComponent` — view redemptions by coupon, total discount given (`hlmTable`, chart)
- [ ] `FlashSalesComponent` — time-limited deal management (`hlmTable`, calendar date picker)
- [ ] `FlashSaleFormComponent` — select products, discount %, start/end datetime, max quantity per customer
- [ ] `FlashSaleCountdownPreviewComponent` — live countdown preview as storefront renders it
- [ ] `FreeGiftPromotionComponent` — buy X get Y free rule editor (`hlm-dialog`, product selector)
- [ ] `CartRuleComponent` — cart-level rules (free shipping over X, % discount on cart total)
- [ ] Active/pending/expired/scheduled status badges with color coding

---

## 🚚 Shipping & Carriers

gwt-new ../admin-shipping feat/admin-shipping

- [ ] `CarrierListComponent` — carriers list with toggle active/inactive (`hlmTable`, `hlmSwitch`)
- [ ] `CarrierFormComponent` — carrier config (name, logo, shipping rates, zones, tracking URL template) — `hlm-dialog`
- [ ] `ShippingZoneEditorComponent` — zone + rate matrix by weight/price (`hlmCard`, `hlmTable`)
- [ ] `WeightRangeRateComponent` — per-weight-band pricing table (`hlmTable`, inline inputs)
- [ ] `PriceRangeRateComponent` — per-price-band free shipping threshold (`hlmTable`, inline inputs)
- [ ] `ShipmentQueueComponent` — pending shipments table with batch actions (`hlmTable`, `hlmBadge`)
- [ ] `ShipmentDetailComponent` — shipment info, carrier, tracking link, picklist (`hlmCard`, `hlmBtn`)
- [ ] `ShipmentTimelineComponent` — carrier tracking events timeline (`hlmCard`, `hlm-separator`)
- [ ] `ShipmentLabelComponent` — download/print shipping label (`hlmBtn`)
- [ ] `PickListComponent` — warehouse picklist for an order/shipment (`hlmTable`, printable)
- [ ] `ShippingTrackingSyncComponent` — manually sync tracking status from carrier API (`hlmBtn`, refresh icon)
- [ ] `ParcelProgressComponent` — status progression (Picked → Packed → Labeled → Picked Up → In Transit → Delivered)

---

## ⚙️ Settings

gwt-new ../admin-settings feat/admin-settings

- [ ] `GeneralSettingsComponent` — store name, logo, favicon, contact info, locale, timezone (`hlmField`, `hlmInput`, image upload)
- [ ] `StoreContactComponent` — address, phone, email, social media links (`hlmField`, `hlmInput`)
- [ ] `PaymentSettingsComponent` — toggle gateways (Stripe, MVola, AirtelMoney, PayPal, COD), configure API keys (`hlmCard`, `hlmSwitch`, `hlmBtn` test connection)
- [ ] `ShippingSettingsComponent` — default carrier, origin address, units (kg/lb), dimensions (`hlmCard`, `hlmSelect`)
- [ ] `TaxSettingsComponent` — default tax rule, display prices with/without tax (`hlmCard`, `hlmSelect`)
- [ ] `TaxRulesComponent` — list of tax rules (name, rate, country/zone) (`hlmTable`, `hlm-dialog`)
- [ ] `TaxRuleFormComponent` — tax rule editor (name, rate %, zone, compound) (`hlm-dialog`)
- [ ] `SecuritySettingsComponent` — password policy, 2FA enforcement, session timeout, rate limiting (`hlmCard`, `hlmSwitch`)
- [ ] `LanguageManagementComponent` — add/remove/set default, translation status (`hlmTable`, `hlm-dialog`)
- [ ] `TranslationEditorComponent` — key-value editor per language with search, missing translations filter (`hlmTable`, `hlmInput`)
- [ ] `CurrencyManagementComponent` — add, set default, auto-sync exchange rates from API (`hlmTable`, `hlmBtn`, `hlmSwitch`)
- [ ] `CurrencyFormComponent` — name, code, symbol, exchange rate, format pattern (`hlm-dialog`)
- [ ] `EmailSettingsComponent` — SMTP config, sender name/email, test send (`hlmCard`, `hlmField`, `hlmBtn`)
- [ ] `EmailTemplatesComponent` — list of email templates (order confirmation, welcome, password reset) (`hlmTable`)
- [ ] `EmailTemplateEditorComponent` — edit subject + body with variable placeholders (`hlmTextarea`, variable picker)
- [ ] `ThemeSettingsComponent` — upload logo, favicon, primary/accent colors, custom CSS (`hlmCard`, color input)
- [ ] `MaintenanceModeComponent` — toggle maintenance, custom message, allow IPs (`hlmSwitch`, `hlmTextarea`, `hlmInput`)

---

## 🔐 RBAC — Roles & Permissions

gwt-new ../admin-rbac feat/admin-rbac

- [ ] `RoleListComponent` — roles table with member count, description, clone action (`hlmTable`, `hlmBadge`)
- [ ] `RoleFormComponent` — create/edit role (name, description, clone permissions from existing) — `hlm-dialog`
- [ ] `PermissionsMatrixComponent` — permission grid (resource × action checkboxes, check/uncheck all per row) — `hlmTable` + `hlmCheckbox`
- [ ] `PermissionGuardDirective` — `*hlmPermission="'product.create'"` structural directive to hide/show elements
- [ ] `EmployeeListComponent` — employees table with search, avatar, role badges, last login (`hlmTable`, `hlmAvatar`)
- [ ] `EmployeeFormComponent` — create/edit employee (name, email, role, active/inactive) (`hlm-dialog`)
- [ ] `EmployeeActivityLogComponent` — per-employee audit trail (login, actions, IP) (`hlmTable`)
- [ ] `ApiKeyManagementComponent` — list of API keys, generate/revoke, last used (`hlmTable`, `hlmBtn`, `hlm-dialog`)

---

## 📄 CMS — Content Management

gwt-new ../admin-cms feat/admin-cms

- [ ] `CmsPagesComponent` — static pages list with status, updated date (`hlmTable`, `hlmBadge`)
- [ ] `CmsPageFormComponent` — page editor (title, slug, content, meta, publish date, status) — `hlmField` + rich text editor (TipTap / Quill)
- [ ] `CmsPageHistoryComponent` — version history with diff view, restore (`hlmTable`, `hlmBtn`)
- [ ] `BannersComponent` — banner list with schedule, active status, click count (`hlmTable`, calendar date picker)
- [ ] `BannerFormComponent` — image upload, link, date range, display position (homepage, category, product) — `hlm-dialog`
- [ ] `HomepageBuilderComponent` — drag-drop block reorder grid (hero, featured, categories, brands, banners) (`hlmCard`, sortable)
- [ ] `HomepageBlockComponent` — configure each block (section title, number of items, layout) (`hlm-dialog`)
- [ ] `MenuBuilderComponent` — visual menu tree editor (add/remove/reorder items, link to page/category/URL) (`hlm-tree`, `hlm-dialog`)
- [ ] `RedirectManagerComponent` — manage 301 redirects (from → to, status code) (`hlmTable`, `hlmBtn`)

---

## 🧩 Modules & Addons

gwt-new ../admin-modules feat/admin-modules

- [ ] `ModuleManagerComponent` — list of installed modules with enable/disable toggle (`hlmTable`, `hlmSwitch`)
- [ ] `ModuleUploadComponent` — upload module zip, validate signature, install (`hlm-dialog`, file upload)
- [ ] `ModuleMarketplaceComponent` — browse available modules in the marketplace (`hlmCard`, `hlmBtn`)

---

## 🧠 SEO & System Tools

gwt-new ../admin-seo feat/admin-seo

- [ ] `SeoDashboardComponent` — sitemap status, robots.txt preview, canonical URLs health check (`hlmCard`)
- [ ] `SitemapGeneratorComponent` — regenerate sitemap, configure frequency/priority per content type (`hlmBtn`, `hlmCard`)
- [ ] `RobotsTxtEditorComponent` — edit robots.txt content with preview (`hlmTextarea`, `hlmBtn` save)
- [ ] `SeoAuditComponent` — scan products/pages for missing meta, duplicate titles, broken links (`hlmTable`, `hlmBadge`)
- [ ] `WebhookManagerComponent` — list webhooks, test endpoint, view delivery logs (`hlmTable`, `hlmBtn`, `hlm-dialog`)
- [ ] `WebhookFormComponent` — create/edit webhook (URL, events, secret, active) (`hlm-dialog`)
- [ ] `CacheManagerComponent` — clear cache by type (product, category, page, API), view stats (`hlmCard`, `hlmBtn`)
- [ ] `ScheduledTasksComponent` — cron job list, last run, next run, manual trigger (`hlmTable`, `hlmBtn`)
- [ ] `SystemLogsViewerComponent` — tail application logs with level filter, date range, search (`hlmTable`, `hlmInput`, `hlmSelect`)
- [ ] `SystemHealthComponent` — server status, DB connection, queue health, cache hit rate (`hlmCard`, status indicators)
- [ ] `BackupManagerComponent` — manual/automated backup, restore, download (`hlmCard`, `hlmBtn`, `hlm-progress`)

---

## 📱 Social Publisher

gwt-new ../admin-social feat/admin-social

- [ ] `SocialPublisherComponent` — Facebook & Instagram post composer, schedule publishing (`hlmCard`, `hlm-dialog`, `hlmTextarea`)
- [ ] `SocialPostListComponent` — history of published posts with engagement stats (`hlmTable`, `hlmBadge`)
- [ ] `SocialMediaConnectComponent` — OAuth connect/disconnect Facebook, Instagram, X/Twitter (`hlmCard`, `hlmBtn`)
- [ ] `AutoPostRuleComponent` — auto-publish new products to social channels (`hlmSwitch`, `hlm-dialog`)
- [ ] `SocialAnalyticsComponent` — post reach, likes, shares, click-through (`hlmCard`, chart)

---

## 💬 Notifications & Messaging

gwt-new ../admin-notifications feat/admin-notifications

- [ ] `NotificationBellComponent` — header bell icon with unread count badge + popover list (`hlmBtn`, `hlmBadge`, `hlmPopover`)
- [ ] `NotificationCenterComponent` — full notification list with read/unread filter, mark-all-read (`hlmCard`, `hlmBtn`)
- [ ] `NotificationPreferencesComponent` — configure which events trigger email/push/in-app (`hlmCard`, `hlmSwitch`, `hlmCheckbox`)
- [ ] `NotificationToastComponent` — real-time toast notifications with auto-dismiss (`hlm-sonner` / toaster)
- [ ] `MailboxComponent` — email inbox with thread list, search, labels/folders (`hlmTable`)
- [ ] `ThreadDetailComponent` — email thread view (messages, reply, forward) (`hlmCard`)
- [ ] `ComposeModalComponent` — new email dialog (TO, CC, subject, body, attachments) (`hlm-dialog`, `hlmField`, `hlmTextarea`, file upload)
- [ ] `InboxSidebarComponent` — folder list (inbox, sent, drafts, trash), unread counts (`hlm-nav`)

---

## 📦 Stock & Inventory Management

gwt-new ../admin-stock feat/admin-stock

- [ ] `StockListComponent` — all products stock view, search, low stock filter (`hlmTable`, `hlmBadge`)
- [ ] `StockMovementLogComponent` — transaction log (in/out, adjustment, reason) (`hlmTable`, `hlmBadge`)
- [ ] `StockAdjustmentFormComponent` — manual stock adjustment ± with reason (`hlm-dialog`, `hlmInput`)
- [ ] `BulkStockUpdateComponent` — CSV import or inline edit for stock quantities (`hlm-dialog`, `hlmTable`)
- [ ] `WarehouseListComponent` — multi-warehouse management (`hlmTable`, `hlm-dialog`)
- [ ] `WarehouseFormComponent` — warehouse name, address, contact, active (`hlm-dialog`)
- [ ] `StockTransferComponent` — transfer stock between warehouses (`hlm-dialog`, quantity selector)
- [ ] `ReorderPointComponent` — set min/max stock levels, auto-reorder suggestions (`hlmTable`, `hlmInput`)
- [ ] `SupplierOrderComponent` — create purchase order to supplier based on reorder needs (`hlm-dialog`, `hlmTable`)

---

## 🎨 UI Kit — Design System (spartan/ui + Helm)

gwt-new ../admin-ui-kit feat/admin-ui-kit

- [ ] **Buttons** — `hlmBtn` with all variants: `default | destructive | outline | secondary | ghost | link` + loading state (`hlm-spinner`)
- [ ] **Forms** — `hlmField` composition (label, control, description, error) with consistent spacing
- [ ] **Inputs** — `hlmInput`, `hlmTextarea`, `hlmSelect`, `hlmSwitch`, `hlmCheckbox`, `hlmRadioGroup`
- [ ] **Data Table** — `hlm-table` with `<hlm-th>`, `<hlm-td>`, sortable headers, row actions, responsive scroll
- [ ] **Dialogs** — `hlm-dialog` for confirmations, forms, detail views + `hlmAlertDialog` for dangerous actions
- [ ] **Sheet** — `hlm-sheet` for side panels (side: left/right), responsive sizing
- [ ] **Dropdown Menu** — `hlm-dropdown-menu` for action menus, user menu, bulk actions
- [ ] **Context Menu** — `hlm-context-menu` for right-click actions on table rows, tree items
- [ ] **Command Palette** — `hlm-command` for searchable command lists (global search, selectors)
- [ ] **Badges** — `hlmBadge` for statuses: `default | secondary | destructive | outline | success | warning`
- [ ] **Toasts** — `hlm-toaster` + `toast()` from `@spartan-ng/brain/sonner`
- [ ] **Alerts** — `hlmAlert` with variants: `default | destructive | success | warning`
- [ ] **Skeleton** — `hlmSkeleton` for loading states (card, table row, detail page variants)
- [ ] **Avatar** — `hlm-avatar` with image + fallback initials + status dot
- [ ] **Tabs** — `hlm-tabs` for multi-section forms and views
- [ ] **Pagination** — `hlm-pagination` or `hlm-numbered-pagination` with page size selector
- [ ] **Popover** — `hlm-popover` for quick actions, filters, color pickers
- [ ] **Tooltip** — `hlm-tooltip` with configurable position and delay
- [ ] **Progress** — `hlm-progress` for loading bars, stock levels, completion status
- [ ] **Carousel** — `hlm-carousel` for banner sliders, image galleries
- [ ] **Empty states** — `hlm-empty` for no-data views with illustration + action CTA
- [ ] **Spinner** — `hlm-spinner` for loading indicators (size variants)
- [ ] **Tree** — `hlm-tree` for category tree, menu builder, permission tree
- [ ] **Sonner** — `hlm-sonner` for rich toast notifications with actions
- [ ] **Resizable** — `hlm-resizable` for resizable panels (sidebar, code editors)
- [ ] **Separator** — `hlm-separator` for visual section dividers
- [ ] **Icons** — `ng-icon` with Lucide icons, registered via `provideIcons()`, consistent sizing

---

## 🧪 Testing & Quality

gwt-new ../admin-testing feat/admin-testing

- [ ] Unit tests for each component (`vitest` + `@angular/core/testing`)
- [ ] Component smoke tests (renders without error for each state: loading, empty, error, populated)
- [ ] Integration tests for critical feature flows (order CRUD, product create, RBAC assign)
- [ ] Accessibility — keyboard nav, focus management, ARIA labels, role attributes, landmarks
- [ ] Storybook integration for visual regression testing of UI kit components
- [ ] Axe-core a11y audit in CI (accessibility violations fail build)
- [ ] Lighthouse audit target — Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95
- [ ] E2E tests with Cypress — order management flow, product CRUD, customer management
- [ ] Mock API service workers (`msw`) for frontend test isolation
- [ ] Bundle size budget per lazy chunk — warn on > 50KB, fail on > 100KB
