# 🅰️ FRONTEND — ANGULAR 21 (ZONELESS)

---

## 🏗️ Core & Architecture

- [ ] Configure the `storefront` application
- [ ] Enable ZoneLess mode (`provideZonelessChangeDetection`)
- [ ] Configure Router with `TitleStrategy` and lazy-loaded routes
- [ ] Create Nx UI library (`libs/storefront/ui-kit`)
- [ ] Configure HTTP interceptor (JWT token injection + refresh token retry)
- [ ] Create `SessionService` (Signal Store for User + Cart state)
- [ ] **Apollo Client** setup with normalized in-memory cache
- [ ] **i18n** — `@jsverse/transloco` for multi-language support (FR, EN, MG)
- [ ] **Meta tags service** — dynamic Open Graph + SEO tags per route
- [ ] **WebSocket client** — `socket.io-client` service for real-time events

---

## 👤 User Identity

- [ ] `LoginComponent` — Signal-based form
- [ ] `RegisterComponent` — Typed reactive form
- [ ] `ForgotPasswordComponent` / `ResetPasswordComponent`
- [ ] `MyAccountComponent` — dashboard (orders, profile, wishlist)
- [ ] `AddressBookComponent` — address CRUD via `httpResource`
- [ ] `OrderHistoryComponent` / `OrderDetailComponent`
- [ ] `ProfileEditComponent`
- [ ] `SecuritySettingsComponent` — 2FA setup, active sessions

---

## 🛍️ Product Catalog UI

- [ ] `ProductListComponent` — responsive product grid
- [ ] `ProductFilterComponent` — facet sidebar
- [ ] `ProductCardComponent` — reusable micro-component
- [ ] `ProductDetailComponent`:
  - [ ] `httpResource` integration
  - [ ] `ProductGallery` / `ProductAttributes`
  - [ ] `selectedCombination` signal — reactive updates
  - [ ] Stock badge & "Add to Cart" button
- [ ] `CategoryPageComponent` — SEO with JSON-LD
- [ ] `SearchResultsComponent` / `SearchBarComponent`

---

## 🛒 Checkout Experience

- [ ] `CartSidebarComponent` — offcanvas cart
- [ ] `CartPageComponent` — detailed cart with quantity editor
- [ ] `CheckoutComponent` — multi-step stepper (Identity, Shipping, Carrier, Payment, Review)
- [ ] `PaymentMethodSelectorComponent` (MVola, AirtelMoney, Stripe, COD)
- [ ] `MobileMoneyWaitingComponent` — countdown + polling status
- [ ] `PaymentSuccessComponent` / `PaymentFailureComponent`

---

## 🚚 Delivery Tracking UI

- [ ] `OrderTrackingComponent` — public tracking page
- [ ] `ShipmentTimelineComponent` — vertical event timeline
- [ ] `PickupPointMapComponent` — interactive map for relay points

---

## ⚡ Frontend Performance & Quality

- [ ] **Core Web Vitals budget** — LCP < 2.5s, CLS < 0.1
- [ ] **Image optimization** — `NgOptimizedImage`
- [ ] **Server-Side Rendering (SSR)** — Angular Universal
- [ ] **Prerendering** — static generation for top categories
- [ ] **Cypress E2E tests** — critical journeys
- [ ] **Accessibility (a11y)** — WCAG 2.1 AA compliance
