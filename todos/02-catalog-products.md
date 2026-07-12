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

### 💰 Pricing Engine — Advanced Robustnes

- [x] **Tiered pricing** — price breaks by quantity
- [x] **Coupon / Voucher system** — discount codes
- [x] **Flash sales** — time-limited deals
- [x] **Currency support** — multi-currency with FX rate sync
- [x] **B2B pricing** — hidden prices for guests
- [x] **Price rounding rules**
- [x] **Loyalty points**
- [x] **Bundle pricing**

---

## 🧪 Tests — Catalog & Products

### Category — Unit Tests

- [ ] `CategoryService` — create (materialized path), find tree, soft delete, reorder
- [ ] `CategoryCacheService` — cache hit/miss/invalidation on write
- [ ] Slug generation — auto-slug, uniqueness enforcement, manual override
- [ ] Cursor pagination — Relay-style, forward, backward

### Feature & Attribute — Unit Tests

- [ ] `FeatureService` — CRUD, Redis cache invalidation
- [ ] `AttributeService` — CRUD groups + values

### Product — Unit Tests

- [ ] `ProductService` — create (slug gen), update (price audit), find with filters
- [ ] `ProductCombinationService` — add, update, delete, default handling
- [ ] `ProductStockService` — update, increment, decrement, availability check
- [ ] `ProductImageService` — add, remove, set cover
- [ ] `ProductDuplicateService` — full duplication with images + combinations
- [ ] `ProductBulkService` — CSV import validation, error reporting
- [ ] `StockAlertService` — threshold check, alert creation
- [ ] `ProductSearchService` — MeiliSearch sync on create/update/delete

### Pricing Engine — Unit Tests

- [ ] `PriceCalculationService` — base + combination impact
- [ ] `PriceCalculationService` — customer group discount
- [ ] `PriceCalculationService` — specific price lookup (date, qty, country)
- [ ] `PriceCalculationService` — tax-inclusive calculation
- [ ] `PriceCalculationService` — tiered pricing (quantity breaks)
- [ ] `PriceCalculationService` — coupon/voucher reduction
- [ ] `PriceCalculationService` — flash sale time-limited deals
- [ ] `PriceCalculationService` — multi-currency exchange rate
- [ ] `PriceCalculationService` — B2B hidden prices for guests
- [ ] `PriceCalculationService` — loyalty points deduction

### Pricing Engine — Integration Tests

- [ ] `calculatePrice` GraphQL query — various inputs, correct priceTTC
- [ ] `specificPrices` CRUD — create, update, delete

### Category — Integration Tests

- [ ] `categories` query — tree, paginated
- [ ] `createCategory`, `updateCategory`, `deleteCategory`
- [ ] `reorderCategories` — drag-drop positions

### Product — Integration Tests

- [ ] `products` query — filters + pagination
- [ ] `product(id)` — single product with combinations
- [ ] `createProduct` — full input, slug auto-gen
- [ ] `addProductImage`, `removeProductImage`, `setProductCoverImage`
- [ ] `addProductCombination`, `updateProductCombination`, `deleteProductCombination`
- [ ] `updateStock`, `incrementStock`, `decrementStock`
- [ ] `duplicateProduct` — verifies all relations copied
- [ ] `checkProductAvailability` — in stock, out of stock
