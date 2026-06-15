# GraphQL API - product.resolver.ts

Ce document contient les exemples d'appels API GraphQL pour les opérations définies dans `product.resolver.ts` qu'on peut copier et coller pour tester.

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

### addProductCombination

```graphql
mutation AddProductCombination($input: CreateProductCombinationInput!, $productId: ID!) {
  addProductCombination(input: $input, productId: $productId) {
    active
    attributes {
      attributeValueId
      combinationId
      id
    }
    id
    isDefault
    priceImpact
    productId
    reference
    stock {
      combinationId
      id
      minQuantity
      outOfStockBehavior
      productId
      quantity
    }
    weightImpact
  }
}
```

**Variables:**

```json
{
  "input": {
    "active": true,
    "attributeValueIds": ["uuid-string"],
    "isDefault": true,
    "priceImpact": 1.5,
    "reference": "string",
    "weightImpact": 1.5
  },
  "productId": "uuid-string"
}
```

### addProductImage

```graphql
mutation AddProductImage($input: CreateProductImageInput!, $productId: ID!) {
  addProductImage(input: $input, productId: $productId) {
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
}
```

**Variables:**

```json
{
  "input": {
    "alt": "string",
    "cover": true,
    "filename": "string",
    "mimeType": "string",
    "originalName": "string",
    "path": "string",
    "position": 1,
    "size": 1
  },
  "productId": "uuid-string"
}
```

### createProduct

```graphql
mutation CreateProduct($input: CreateProductInput!) {
  createProduct(input: $input) {
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
  "input": {
    "active": true,
    "availableForOrder": true,
    "categoryId": "uuid-string",
    "depth": 1.5,
    "description": "string",
    "descriptionShort": "string",
    "height": 1.5,
    "linkRewrite": "string",
    "metaDescription": "string",
    "metaTitle": "string",
    "name": "string",
    "price": 1.5,
    "reference": "string",
    "showPrice": true,
    "weight": 1.5,
    "wholesalePrice": 1.5,
    "width": 1.5
  }
}
```

### decrementStock

```graphql
mutation DecrementStock($quantity: Int!, $stockId: ID!) {
  decrementStock(quantity: $quantity, stockId: $stockId) {
    combinationId
    id
    minQuantity
    outOfStockBehavior
    productId
    quantity
  }
}
```

**Variables:**

```json
{
  "quantity": 1,
  "stockId": "uuid-string"
}
```

### deleteProduct

```graphql
mutation DeleteProduct($id: ID!) {
  deleteProduct(id: $id) {
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

### deleteProductCombination

```graphql
mutation DeleteProductCombination($id: ID!) {
  deleteProductCombination(id: $id) {
    active
    attributes {
      attributeValueId
      combinationId
      id
    }
    id
    isDefault
    priceImpact
    productId
    reference
    stock {
      combinationId
      id
      minQuantity
      outOfStockBehavior
      productId
      quantity
    }
    weightImpact
  }
}
```

**Variables:**

```json
{
  "id": "uuid-string"
}
```

### incrementStock

```graphql
mutation IncrementStock($quantity: Int!, $stockId: ID!) {
  incrementStock(quantity: $quantity, stockId: $stockId) {
    combinationId
    id
    minQuantity
    outOfStockBehavior
    productId
    quantity
  }
}
```

**Variables:**

```json
{
  "quantity": 1,
  "stockId": "uuid-string"
}
```

### removeProductImage

```graphql
mutation RemoveProductImage($id: ID!) {
  removeProductImage(id: $id) {
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
}
```

**Variables:**

```json
{
  "id": "uuid-string"
}
```

### setProductCoverImage

```graphql
mutation SetProductCoverImage($imageId: ID!) {
  setProductCoverImage(imageId: $imageId) {
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
}
```

**Variables:**

```json
{
  "imageId": "uuid-string"
}
```

### updateProduct

```graphql
mutation UpdateProduct($id: ID!, $input: UpdateProductInput!) {
  updateProduct(id: $id, input: $input) {
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
  "id": "uuid-string",
  "input": {
    "active": true,
    "availableForOrder": true,
    "categoryId": "uuid-string",
    "depth": 1.5,
    "description": "string",
    "descriptionShort": "string",
    "height": 1.5,
    "linkRewrite": "string",
    "metaDescription": "string",
    "metaTitle": "string",
    "name": "string",
    "price": 1.5,
    "reference": "string",
    "showPrice": true,
    "weight": 1.5,
    "wholesalePrice": 1.5,
    "width": 1.5
  }
}
```

### updateProductCombination

```graphql
mutation UpdateProductCombination($id: ID!, $input: UpdateProductCombinationInput!) {
  updateProductCombination(id: $id, input: $input) {
    active
    attributes {
      attributeValueId
      combinationId
      id
    }
    id
    isDefault
    priceImpact
    productId
    reference
    stock {
      combinationId
      id
      minQuantity
      outOfStockBehavior
      productId
      quantity
    }
    weightImpact
  }
}
```

**Variables:**

```json
{
  "id": "uuid-string",
  "input": {
    "active": true,
    "isDefault": true,
    "priceImpact": 1.5,
    "reference": "string",
    "weightImpact": 1.5
  }
}
```

### updateStock

```graphql
mutation UpdateStock($input: UpdateStockInput!) {
  updateStock(input: $input) {
    combinationId
    id
    minQuantity
    outOfStockBehavior
    productId
    quantity
  }
}
```

**Variables:**

```json
{
  "input": {
    "combinationId": "uuid-string",
    "minQuantity": 1,
    "outOfStockBehavior": "string",
    "productId": "uuid-string",
    "quantity": 1
  }
}
```
