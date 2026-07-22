# 🅰️ FRONTEND — STOREFRONT (Angular 22 + spartan/ui)

---

## 🏗️ Core & Architecture

gwt-new ../storefront-core feat/storefront-core

- [ ] Configure the `store` application (`apps/store`)
- [ ] Configure Router with `TitleStrategy` and lazy-loaded routes
- [ ] Create Nx UI library (`libs/storefront/ui-kit`) or reuse `libs/ui/` (spartan)
- [ ] Configure HTTP interceptor (JWT token injection + refresh token retry)
- [ ] Create `SessionService` (Signal Store for User + Cart state)
- [ ] **Apollo Client** setup with normalized in-memory cache
- [ ] **i18n** — `@jsverse/transloco` for multi-language support (FR, EN, MG)
- [ ] **Meta tags service** — dynamic Open Graph + SEO tags per route
- [ ] **WebSocket client** — `socket.io-client` service for real-time events (verified backend is socket.io-client is working on frontend)
- [ ] **Dark mode** — `hlm` semantic tokens auto-flip, toggle via `.dark` class can use bg-default or similar for dynamic theme
- [ ] **PWA** — angular service worker with install prompt + offline fallback page
- [ ] **Cookie consent banner** — GDPR compliance (`hlm-alert`, `hlm-btn`, local storage consent)
- [ ] **Feature flags service** — toggle new features via backend config
- [ ] **Error boundary** — global error handler with user-friendly fallback UI (`hlm-alert` `variant="destructive"`)
- [ ] **Analytics** — page view tracking (GA4 / Plausible) via router events

---

## 👤 User Identity & Account

gwt-new ../storefront-auth feat/storefront-auth

- [ ] `LoginComponent` — Signal-based form (`hlmField`, `hlmInput`, `hlmBtn`), remember-me checkbox
- [ ] `RegisterComponent` — Typed reactive form with email + password strength meter (`hlm-progress`)
- [ ] `EmailVerificationComponent` — verify email after registration (token from route param)
- [ ] `ResendVerificationComponent` — resend verification email
- [ ] `ForgotPasswordComponent` / `ResetPasswordComponent` — token validation, new password
- [ ] `MyAccountComponent` — customer dashboard hub (orders, profile, wishlist, addresses)
- [ ] `AddressBookComponent` — address CRUD via `httpResource` (`hlmCard`, `hlm-dialog`), set default address
- [ ] `OrderHistoryComponent` / `OrderDetailComponent` (`hlmTable`, `hlmBadge`, printable invoice)
- [ ] `ProfileEditComponent` (`hlmField`, `hlmInput`, `hlmBtn`, avatar upload)
- [ ] `SecuritySettingsComponent` — 2FA setup (QR code, backup codes), active sessions (`hlmSwitch`, `hlmCard`)
- [ ] `DeleteAccountComponent` — self-deletion with confirmation flow (`hlm-alert-dialog`)
- [ ] `NewsletterPreferencesComponent` — email subscription toggle, frequency (`hlmSwitch`, `hlmSelect`)
- [ ] `AccountSidebarComponent` — persistent left nav for account pages (`hlm-nav`, `hlm-avatar`)
- [ ] **Guest checkout support** — collect email + create account after order

---

## ❤️ Wishlist & Favorites

gwt-new ../storefront-wishlist feat/storefront-wishlist

- [ ] `WishlistService` — Signal store, add/remove/toggle, persisted to backend
- [ ] `WishlistButtonComponent` — heart icon toggle on product card + detail (`hlmBtn ghost`, `ng-icon heart`)
- [ ] `WishlistPageComponent` — grid of saved items with add-to-cart action (`hlmCard`, `hlmBtn`)
- [ ] **Wishlist share** — generate public link to share wishlist
- [ ] **Wishlist counter badge** — header icon with item count (`hlmBadge`)

---

## 🔄 Recently Viewed & Product Comparison

gwt-new ../storefront-browsing feat/storefront-browsing

- [ ] `RecentlyViewedService` — local storage signal store (last 20 products)
- [ ] `RecentlyViewedComponent` — horizontal scroll strip on homepage/sidebar (`hlmCard`, horizontal scroll)
- [ ] `ProductComparisonService` — signal store, max 4 products
- [ ] `ComparisonFloatingBarComponent` — sticky bottom bar when items selected (`hlmBtn`, count badge)
- [ ] `ComparePageComponent` — side-by-side attribute table (`hlmTable`, highlight differences)

---

## ⭐ Product Reviews & Ratings

gwt-new ../storefront-reviews feat/storefront-reviews

- [ ] `ReviewListComponent` — paginated reviews with sort (newest, highest, lowest) (`hlmCard`, `hlmBadge`)
- [ ] `ReviewFormComponent` — star rating + textarea + image upload (`hlmInput`, `ng-icon star`)
- [ ] `ReviewSummaryComponent` — aggregate rating distribution bar chart (`hlm-progress` per star)
- [ ] `ReviewHelpfulnessComponent` — was this review helpful? thumbs up/down
- [ ] `VerifiedPurchaseBadgeComponent` — badge for verified buyer reviews
- [ ] `ReviewModerationFlagComponent` — report inappropriate review (for users)

---

## 🛍️ Product Catalog UI

gwt-new ../storefront-catalog feat/storefront-catalog

- [ ] `ProductListComponent` — responsive product grid (2-3-4 columns) (`hlmCard`, `hlmBtn`)
- [ ] `ProductListToolbarComponent` — sort by (price, name, newest), items per page switcher (`hlmSelect`)
- [ ] `ProductFilterComponent` — facet sidebar with active filter chips (`hlm-sheet` on mobile, sidebar on desktop)
- [ ] `ActiveFiltersChipsComponent` — removable filter chips row above results (`hlmBadge` with close)
- [ ] `ProductCardComponent` — reusable micro-component (`hlmCard`, `hlmBadge`, wishlist heart, quick-add btn)
- [ ] `ProductCardSkeletonComponent` — shimmer loading placeholder (`hlmSkeleton`)
- [ ] `ProductDetailComponent`:
  - [ ] `httpResource` integration for data fetching
  - [ ] `ProductGalleryComponent` — main image + thumbnail strip with zoom on hover (`hlm-tabs`)
  - [ ] `ProductAttributesComponent` — variant selectors (color swatches, size buttons) (`hlmBtn group`, selected state)
  - [ ] `selectedCombination` signal — reactive variant update (price, stock, image)
  - [ ] Stock badge & "Add to Cart" button (`hlmBadge`, `hlmBtn`), quantity stepper (`hlmInput number`)
  - [ ] `PriceDisplayComponent` — base price, discount badge, tax info (`hlmBadge`, strikethrough)
  - [ ] `SocialShareButtonsComponent` — share via Facebook, Instagram, WhatsApp, copy link
  - [ ] `RelatedProductsComponent` — horizontal scroll of related items (`hlmCard`, `hlmBtn`)
  - [ ] `CrossSellSectionComponent` — "frequently bought together" with add-all-to-cart button
- [ ] `CategoryPageComponent` — SEO with JSON-LD, category description banner (`hlm-breadcrumb`)
- [ ] `SubcategoryNavigationComponent` — horizontal subcategory chips (`hlmBtn outline`, scrollable)
- [ ] `SearchResultsComponent` / `SearchBarComponent` (`hlmInput`, `hlm-command`)
- [ ] `SearchAutocompleteComponent` — dropdown with suggestions, recent searches, top results
- [ ] `EmptySearchStateComponent` — no results illustration + suggestions (`hlm-empty`)
- [ ] `QuickViewSheetComponent` — preview product in side sheet (`hlm-sheet side="right"`, add to cart)
- [ ] `StockAlertFormComponent` — notify me when back in stock (`hlm-dialog`, `hlm-input` email)
- [ ] **JSON-LD structured data** — schema.org Product, Offer, BreadcrumbList, Review

---

## 🛒 Cart & Checkout Experience

gwt-new ../storefront-checkout feat/storefront-checkout

- [ ] `CartService` — Signal store, optimistic updates, localStorage persistence for guest
- [ ] `CartIconComponent` — header cart icon with quantity badge + subtotal tooltip (`hlmBtn`, `hlmBadge`, `hlmPopover`)
- [ ] `CartSidebarComponent` — offcanvas cart (`hlm-sheet side="right"`), item list, subtotal, checkout CTA
- [ ] `CartPageComponent` — detailed cart with quantity editor (+/-), remove, promo code (`hlmTable`, `hlmInput`)
- [ ] `PromoCodeInputComponent` — coupon code input with apply/remove, show discount line (`hlmInput`, `hlmBtn`, `hlmBadge`)
- [ ] `CheckoutComponent` — multi-step stepper (Identity, Shipping, Carrier, Payment, Review)
- [ ] `CheckoutStepperComponent` — step progress indicator with completed/active/upcoming states (`hlmNav`)
- [ ] `ShippingAddressFormComponent` — address form with toggle "same as billing" (`hlmField`, `hlmCheckbox`)
- [ ] `CarrierSelectorComponent` — choose carrier with logo, price, estimated delivery (`hlm-radio-group`, `hlmCard`)
- [ ] `PickupPointSelectorComponent` — choose relay point from list/map (`hlm-radio-group`, leaflet map)
- [ ] `PaymentMethodSelectorComponent` — MVola, AirtelMoney, Stripe, COD, PayPal (`hlm-radio-group`, icons)
- [ ] `OrderSummaryComponent` — review sidebar with item list, totals, promo discount, tax (`hlmCard`)
- [ ] `OrderNotesComponent` — optional textarea for order notes (`hlmTextarea`)
- [ ] `PlaceOrderButtonComponent` — final submit with loading state, double-click prevention
- [ ] `MobileMoneyWaitingComponent` — countdown + polling status (`hlm-progress`, `hlm-spinner`, animated)
- [ ] `StripePaymentFormComponent` — embedded Stripe Elements (card number, expiry, CVC)
- [ ] `PaymentSuccessComponent` — confirmation with order number, email sent message (`hlm-alert variant="success"`, confetti)
- [ ] `PaymentFailureComponent` — error message, retry/choose other method (`hlm-alert variant="destructive"`, `hlmBtn`)
- [ ] `OrderConfirmationComponent` — full order receipt (items, shipping, billing, payment method)
- [ ] **Abandoned cart recovery** — email capture modal on exit intent (`hlm-dialog`)

---

## 🚚 Delivery Tracking UI

gwt-new ../storefront-tracking feat/storefront-tracking

- [ ] `OrderTrackingComponent` — public tracking page (order ref + email form) (`hlm-card`, `hlm-input`)
- [ ] `ShipmentTimelineComponent` — vertical event timeline with icons (`hlm-separator`, `hlm-badge`, `ng-icon`)
- [ ] `TrackingMapComponent` — live courier position on map (leaflet + socket.io)
- [ ] `DeliveryEstimateComponent` — estimated delivery date with countdown (`hlmBadge`, `hlmCard`)
- [ ] `PickupPointMapComponent` — interactive map for relay points (leaflet, marker clustering)
- [ ] `DeliveryInstructionsComponent` — leave-at-door / neighbor options (`hlmTextarea`, `hlmCheckbox`)
- [ ] `RateDeliveryComponent` — after delivery, rate the experience (stars) (`ng-icon`, `hlmBtn`)
- [ ] `ReturnRequestComponent` — initiate return, select items + reason (`hlm-dialog`, `hlmSelect`)
- [ ] `ReturnStatusComponent` — track return progress, label download (`hlmBadge`, `hlmBtn`)

---

## 💬 Support & Chat UI

gwt-new ../storefront-support feat/storefront-support

- [ ] `HelpCenterComponent` — FAQ categories with expandable answers (`hlm-accordion`)
- [ ] `ContactFormComponent` — subject, message, attachment (`hlmField`, `hlmTextarea`, file upload)
- [ ] `SupportTicketListComponent` — customer ticket history with status badge (`hlmTable`, `hlmBadge`)
- [ ] `SupportTicketDetailComponent` — thread view, admin replies, add message (`hlmCard`, `hlmTextarea`)
- [ ] `LiveChatWidgetComponent` — floating chat bubble, expandable popover (`hlm-popover`, `hlm-dialog`)
- [ ] `ChatMessageComponent` — message bubble (sent/received), timestamp, read receipt
- [ ] `ChatTypingIndicatorComponent` — "agent is typing..." animated dots
- [ ] `ChatFileAttachmentComponent` — send image/file in chat, preview before send
- [ ] `CourierChatWidgetComponent` — shipment delivery chat with courier (`hlm-card`, live messages)
- [ ] `ShareButtonComponent` — social sharing (Facebook, Instagram, WhatsApp, Telegram, copy link)

---

## 🏠 Homepage & Common Layout

gwt-new ../storefront-homepage feat/storefront-homepage

- [ ] `HeaderComponent` — logo, search bar, nav links, language switcher, currency, cart, auth buttons
- [ ] `LanguageSwitcherComponent` — dropdown with flag icons, persist choice (`hlm-dropdown-menu`)
- [ ] `CurrencySwitcherComponent` — dropdown with currency codes + symbols (`hlm-dropdown-menu`)
- [ ] `MobileBottomNavComponent` — sticky bottom nav bar (Home, Categories, Cart, Account, More)
- [ ] `FooterComponent` — links, newsletter signup, contact info, social icons, payment method icons
- [ ] `NewsletterSignupComponent` — inline email form with consent checkbox (`hlmInput`, `hlmBtn`, `hlmCheckbox`)
- [ ] `HeroBannerComponent` — full-width carousel with promo slides (`hlm-carousel`, CTA button)
- [ ] `FeaturedProductsComponent` — horizontal product strip on homepage (`hlmCard`)
- [ ] `CategoriesShowcaseComponent` — category grid with images on homepage (`hlmCard`, overlay)
- [ ] `BrandSliderComponent` — infinite scroll logo strip for brands/partners
- [ ] `PromoBannerComponent` — top announcement bar (dismissible) (`hlm-alert`)
- [ ] `BackToTopComponent` — floating scroll-to-top button (`hlmBtn`, `ng-icon arrow-up`)

---

## ⚡ Frontend Performance & Quality

gwt-new ../storefront-performance feat/storefront-performance

- [ ] **Core Web Vitals budget** — LCP < 2.5s, CLS < 0.1, FID < 100ms
- [ ] **Image optimization** — `NgOptimizedImage` with `priority`, lazy loading, responsive sizes
- [ ] **Server-Side Rendering (SSR)** — `@angular/ssr` with hydration, TransferState for API calls
- [ ] **Prerendering** — static generation for top categories, CMS pages, product pages
- [ ] **@defer blocks** — defer non-critical components (footer, chat, recently viewed)
- [ ] **Font optimization** — preload custom fonts, subset for latin + mg (Malagasy)
- [ ] **Critical CSS extraction** — inline above-fold styles for instant paint
- [ ] **Cypress E2E tests** — critical journeys (login, browse, search, add to cart, checkout, tracking)
- [ ] **Component unit tests** — `vitest` with `@angular/core/testing` for all components
- [ ] **Accessibility (a11y)** — WCAG 2.1 AA compliance (keyboard nav, focus trapping, ARIA labels, landmarks)
- [ ] **Screen reader announcements** — `@angular/cdk/a11y` live announcer for dynamic updates
- [ ] **Bundle analysis** — `source-map-explorer` for JS size budgets, enforce via CI
- [ ] **Lighthouse budget** — Performance ≥ 95 for desktop, Accessibility ≥ 95, SEO ≥ 100
- [ ] **Tree-shakable imports** — import from secondary entry points, not barrel files
- [ ] **Prefetch product detail pages** — `<link rel="prefetch">` on product card hover
