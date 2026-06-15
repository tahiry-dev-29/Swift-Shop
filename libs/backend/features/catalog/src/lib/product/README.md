# GraphQL API - product

Ce document contient les exemples d'appels API GraphQL pour les opérations définies dans ce resolver.

### products

```graphql
query Products($filter: ProductFilterInput) {
  products(filter: $filter) {
    items {
      active
      availableForOrder
      categoryId
      dateAdd
      dateUpd
      depth
      description
      descriptionShort
      height
      id
      linkRewrite
      metaDescription
      metaTitle
      name
      price
      reference
      showPrice
      weight
      wholesalePrice
      width
    }
    total
  }
}
```

**Variables:**

```json
{
  "filter": {
    "active": true,
    "categoryId": "uuid-string",
    "search": "string",
    "skip": 1,
    "take": 1
  }
}
```

### product

```graphql
query Product($id: ID!) {
  product(id: $id) {
    active
    availableForOrder
    categoryId
    combinations {
      active
      id
      isDefault
      priceImpact
      productId
      reference
      weightImpact
    }
    dateAdd
    dateUpd
    depth
    description
    descriptionShort
    height
    id
    images {
      alt
      cover
      dateAdd
      filename
      id
      mimeType
      originalName
      path
      position
      productId
      size
    }
    linkRewrite
    metaDescription
    metaTitle
    name
    price
    reference
    showPrice
    stock {
      combinationId
      id
      minQuantity
      outOfStockBehavior
      productId
      quantity
    }
    weight
    wholesalePrice
    width
  }
}
```

**Variables:**

```json
{
  "id": "uuid-string"
}
```

### checkProductAvailability

```graphql
query CheckProductAvailability($combinationId: ID, $productId: ID, $quantity: Int) {
  checkProductAvailability(combinationId: $combinationId, productId: $productId, quantity: $quantity)
}
```

**Variables:**

```json
{
  "combinationId": "uuid-string",
  "productId": "uuid-string",
  "quantity": 1
}
```
