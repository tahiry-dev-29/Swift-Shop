# 🗺️ ROADMAP INDEX — PrestaShop Clone

This roadmap has been split into multiple files for better readability and module-based management.

## 📂 Backend & Core

- [01-backend-core.md](./01-backend-core.md) — Infrastructure, Auth, RBAC, Settings, Quality/DevOps.
- [02-catalog-products.md](./02-catalog-products.md) — Catalog, Products, Pricing Engine.

## 🛒 Commerce & Logistic

- [03-commerce.md](./03-commerce.md) — Cart, Orders, Shipping, Payment.

## 🅰️ Frontend (Angular 22 + spartan/ui)

- [04-frontend.md](./04-frontend.md) — Storefront (catalog, cart, checkout, tracking, support).
- [05-frontend-dashboard.md](./05-frontend-dashboard.md) — Back-Office Admin Panel (layout, management, analytics, UI Kit).

## 💬 Systems & Integrations

- [06-additional-systems.md](./06-additional-systems.md) — Notifications, Support, Chat, Messaging, Analytics, CMS, Social.

## 🔴 Real Integrations — Functional Blocks

- [07-payment-adapters.md](./07-payment-adapters.md) — Real payments (Stripe, MVola, AirtelMoney, PayPal).
- [08-shipping-adapters.md](./08-shipping-adapters.md) — Real shipping (Colissimo, DHL, FedEx, Sodiat, Espace Logistique).

## 🧩 Residual Gaps

- [09-backend-gaps.md](./09-backend-gaps.md) — Courier chat, missing Settings resolvers, Order PubSub, Tests, Seeds, DevOps.

## 🚀 Production Readiness

- [10-production-readiness.md](./10-production-readiness.md) — Maturity score (82/100), coupons externalization, APM, rate limiting, E2E tests, Redis cache, webhook documentation.

## 🐛 Bugs Audit

- [11-bugs-audit.md](./11-bugs-audit.md) — 120 bugs identified (14 critical, 37 high), top 17 priority fixes.

---

🚀 **Next Priority Steps:**

1. **Backend** — Implement Payment Trio Stripe/MVola/AirtelMoney (→ [07](./07-payment-adapters.md))
2. **Backend** — Finalize Real Shipping Adapters (→ [08](./08-shipping-adapters.md))
3. **Backend** — Close Gaps: Courier chat, resolvers, PubSub, tests (→ [09](./09-backend-gaps.md))
4. **Backend** — Production Readiness: coupons, APM, rate limiting (→ [10](./10-production-readiness.md))
5. **Frontend Dashboard** — Start admin layout (sidebar, header, routing) (→ [05](./05-frontend-dashboard.md))
6. **Frontend Storefront** — Start storefront (layout, auth) (→ [04](./04-frontend.md))
