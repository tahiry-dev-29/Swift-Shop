# 📂 CATALOG & PRODUCTS

---

## 📂 Catalog — Categories & Features

- [x] Prisma model `Category` (hierarchy via `parentId`)
- [x] Prisma models `Feature` + `FeatureValue`
- [x] Prisma models `AttributeGroup` + `AttributeValue`
- [x] CRUD Service `CategoryService` (with parent/child tree management)
- [x] CRUD Service `FeatureService`
- [x] CRUD Service `AttributeService`
- [x] Admin endpoints to manage categories and attributes

### 📂 Catalog — Advanced Robustness

- [x] **Cursor Pagination** (Relay-style) for large category trees
- [x] **Redis cache** on `categories` and `features` queries
- [x] **N+1 queries optimization** via GraphQL DataLoader
- [x] **Nested Set / Materialized Path** for ultra-fast hierarchical category reads
- [x] **Slug auto-generation** + uniqueness enforcement
- [x] **Soft Delete** on categories
- [x] **Category position drag-and-drop**
- [x] **Category SEO fields** — `metaTitle`, `metaDescription`, `metaKeywords`
- [x] **Category image** — upload with auto-resize

---

## 📦 Products Core

- [x] Prisma model `Product` (base fields + dimensions)
- [x] Prisma model `ProductCombination` (variants with `priceImpact`, `weightImpact`)
- [x] Prisma model `Stock` (linked to product OR combination)
- [x] Prisma model `ProductImage` (media management)
- [x] DTO `CreateProductInput` (complex info)
- [x] Service `ProductService`: simple product creation
- [x] Service `ProductService`: combination management
- [x] Service `ProductService`: stock management (`updateStock`, `incrementStock`, `decrementStock`)
- [x] GraphQL Endpoint: `products` (filters and pagination)
- [x] GraphQL Endpoint: `product(id)`
- [x] GraphQL Endpoint: full CRUD for Products, Images, Combinations, Stock

### 📦 Products Core — Advanced Robustness

- [x] **MeiliSearch / Elasticsearch** integration
- [x] **Image processing pipeline**: automatic resizing + WebP/AVIF
- [x] **Price history auditing**
- [x] **Product duplication** endpoint
- [x] **Bulk import/export** — CSV/XLSX
- [x] **Low stock alerts**
- [x] **Virtual & Downloadable products**
- [x] **Product bundles**
- [x] **Related products**
- [x] **Product reviews & ratings**
- [x] **Product labels**
- [x] **SEO fields** — `metaTitle`, `metaDescription`, `canonicalUrl`

---

## 💰 Pricing Engine

- [x] Prisma model `SpecificPrice` (discount rules)
- [x] Prisma model `TaxRule` (VAT by country) + `Country`
- [x] Service `PriceCalculationService`
  - [x] Logic: Base Price + Combination impact
  - [x] Logic: CustomerGroup discount application
  - [x] Logic: `SpecificPrice` lookup (Date, Quantity, Country)
  - [x] Logic: Tax-inclusive calculation
- [x] GraphQL Query `calculatePrice` (returns `priceHT`, `taxAmount`, `priceTTC`)
- [x] CRUD SpecificPrice (Create, Update, Delete)

### 💰 Pricing Engine — Advanced Robustness

- [ ] **Tiered pricing** — price breaks by quantity
- [ ] **Coupon / Voucher system** — discount codes
- [ ] **Flash sales** — time-limited deals
- [ ] **Currency support** — multi-currency with FX rate sync
- [ ] **B2B pricing** — hidden prices for guests
- [ ] **Price rounding rules**
- [ ] **Loyalty points**
- [ ] **Bundle pricing**
