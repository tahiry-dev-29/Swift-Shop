# 📦 Products API

> Complete product management with variants, images, and stock

## 📍 GraphQL Playground

`http://localhost:3000/graphql`

## 🔑 Authentication

- **Public**: `products`, `product`, `checkProductAvailability`
- **SuperAdmin Only**: All mutations (create, update, delete)

---

## 📋 Query Operations

### List Products (with Filters)

```graphql
query {
  products(filter: { active: true, categoryId: 1, search: "shirt", take: 10, skip: 0 }) {
    items {
      id
      reference
      name
      price
      images {
        path
        cover
      }
      combinations {
        id
        priceImpact
        attributes {
          attributeValue {
            name
          }
        }
        stock {
          quantity
        }
      }
    }
    total
  }
}
```

---

### Get One Product

```graphql
query {
  product(id: 1) {
    id
    reference
    name
    description
    price
    wholesalePrice
    active
    metaTitle
    metaDescription
    weight
    images {
      id
      path
      cover
      originalName
    }
    combinations {
      id
      reference
      priceImpact
      isDefault
      attributes {
        attributeValue {
          id
          name
          group {
            name
          }
        }
      }
      stock {
        quantity
        outOfStockBehavior
      }
    }
    stock {
      quantity
    }
    category {
      id
      name
    }
  }
}
```

---

### Check Availability

```graphql
query {
  checkProductAvailability(productId: 1, quantity: 5)
}
# or
query {
  checkProductAvailability(combinationId: 1, quantity: 5)
}
```

---

## ✏️ Mutation Operations (SuperAdmin Only)

> ⚠️ **All mutations require SuperAdmin authentication**

**Header:**

```json
{ "Authorization": "Bearer <superAdminToken>" }
```

### Create Product

```graphql
mutation {
  createProduct(input: { reference: "TSHIRT-001", name: "T-Shirt Classic", description: "Premium cotton t-shirt", descriptionShort: "Classic fit", price: 29.99, wholesalePrice: 12.00, weight: 0.2, categoryId: 1, metaTitle: "Buy T-Shirt Classic", linkRewrite: "tshirt-classic" }) {
    id
    reference
    name
  }
}
```

---

### Update Product

```graphql
mutation {
  updateProduct(id: 1, input: { name: "T-Shirt Classic v2", price: 34.99, active: true }) {
    id
    name
    price
  }
}
```

---

### Delete Product

```graphql
mutation {
  deleteProduct(id: 1) {
    id
    name
  }
}
```

---

## 🖼️ Product Images

Images are stored in: `uploads/products/{productId}/{name}_{date}_{randomId}.{ext}`

### Add Image

```graphql
mutation {
  addProductImage(productId: 1, input: { filename: "tshirt-blue_20251209_abc123.jpg", originalName: "tshirt-blue.jpg", path: "uploads/products/1/tshirt-blue_20251209_abc123.jpg", mimeType: "image/jpeg", size: 45000, alt: "Blue T-Shirt Front", cover: true }) {
    id
    path
    cover
  }
}
```

---

### Set Cover Image

```graphql
mutation {
  setProductCoverImage(imageId: 1) {
    id
    cover
  }
}
```

---

### Remove Image

```graphql
mutation {
  removeProductImage(id: 1) {
    id
  }
}
```

---

## 🎨 Product Combinations (Variants)

Combinations link products to attribute values (size L + color red = 1 combination)

### Add Combination

```graphql
mutation {
  addProductCombination(
    productId: 1
    input: {
      reference: "TSHIRT-001-L-RED"
      attributeValueIds: [1, 5] # Size L (id:1), Red (id:5)
      priceImpact: 5.00
      weightImpact: 0.05
      isDefault: true
    }
  ) {
    id
    reference
    priceImpact
    attributes {
      attributeValue {
        name
      }
    }
  }
}
```

---

### Update Combination

```graphql
mutation {
  updateProductCombination(id: 1, input: { priceImpact: 7.00, active: true }) {
    id
    priceImpact
  }
}
```

---

### Delete Combination

```graphql
mutation {
  deleteProductCombination(id: 1) {
    id
  }
}
```

---

## 📊 Stock Management

Stock can be attached to a product (simple product) OR a combination (variant)

### Update Stock

```graphql
# For simple product
mutation {
  updateStock(
    input: {
      productId: 1
      quantity: 100
      minQuantity: 5
      outOfStockBehavior: "deny" # "deny", "allow", "default"
    }
  ) {
    id
    quantity
  }
}

# For combination
mutation {
  updateStock(input: { combinationId: 1, quantity: 50 }) {
    id
    quantity
  }
}
```

---

### Increment Stock

```graphql
mutation {
  incrementStock(stockId: 1, quantity: 10) {
    id
    quantity
  }
}
```

---

### Decrement Stock

```graphql
mutation {
  decrementStock(stockId: 1, quantity: 5) {
    id
    quantity
  }
}
```

---

## 📊 Complete Workflow Example

```graphql
# 1. Create Product
mutation {
  createProduct(input: { reference: "JEANS-001", name: "Slim Fit Jeans", price: 59.99, categoryId: 2 }) {
    id
  }
}

# 2. Add Image
mutation {
  addProductImage(productId: 1, input: { filename: "jeans_20251209_xyz.jpg", originalName: "jeans.jpg", path: "uploads/products/1/jeans_20251209_xyz.jpg", mimeType: "image/jpeg", size: 80000, cover: true }) {
    id
  }
}

# 3. Add Combinations (Size 32 + Blue)
mutation {
  addProductCombination(productId: 1, input: { attributeValueIds: [10, 15], priceImpact: 0, isDefault: true }) {
    id
  }
}

# 4. Set Stock for Combination
mutation {
  updateStock(input: { combinationId: 1, quantity: 25 }) {
    id
  }
}

# 5. Fetch Complete Product
query {
  product(id: 1) {
    name
    price
    images {
      path
      cover
    }
    combinations {
      attributes {
        attributeValue {
          name
        }
      }
      stock {
        quantity
      }
    }
  }
}
```

---

## ⚙️ Features

✅ **Full CRUD** - Products, Images, Combinations  
✅ **Stock Management** - Increment, Decrement, Availability Check  
✅ **Filtering & Pagination** - Search, Category, Active status  
✅ **SEO Fields** - Meta title, description, URL slug  
✅ **Image Naming** - `{name}_{date}_{randomId}.{ext}`  
✅ **Protected Mutations** - SuperAdmin only
