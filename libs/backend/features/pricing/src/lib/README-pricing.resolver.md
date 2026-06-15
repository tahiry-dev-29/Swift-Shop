# GraphQL API - pricing.resolver.ts

Ce document contient les exemples d'appels API GraphQL pour les opérations définies dans `pricing.resolver.ts` qu'on peut copier et coller pour tester.

### calculatePrice

```graphql
query CalculatePrice($combinationId: ID, $countryId: ID!, $customerId: ID, $productId: ID!, $quantity: Int) {
  calculatePrice(combinationId: $combinationId, countryId: $countryId, customerId: $customerId, productId: $productId, quantity: $quantity) {
    basePrice
    combinationImpact
    customerGroupReduction
    priceHT
    priceTTC
    specificPriceReduction
    taxAmount
    taxRate
  }
}
```

**Variables:**

```json
{
  "combinationId": "uuid-string",
  "countryId": "uuid-string",
  "customerId": "uuid-string",
  "productId": "uuid-string",
  "quantity": 1
}
```

### specificPrices

```graphql
query SpecificPrices($customerId: ID, $productId: ID) {
  specificPrices(customerId: $customerId, productId: $productId) {
    active
    combinationId
    countryId
    customerGroupId
    customerId
    dateAdd
    dateFrom
    dateTo
    fromQuantity
    id
    priority
    productId
    reduction
    reductionType
  }
}
```

**Variables:**

```json
{
  "customerId": "uuid-string",
  "productId": "uuid-string"
}
```

### createSpecificPrice

```graphql
mutation CreateSpecificPrice($input: CreateSpecificPriceInput!) {
  createSpecificPrice(input: $input) {
    active
    combinationId
    countryId
    customerGroupId
    customerId
    dateAdd
    dateFrom
    dateTo
    fromQuantity
    id
    priority
    productId
    reduction
    reductionType
  }
}
```

**Variables:**

```json
{
  "input": {
    "active": true,
    "combinationId": "uuid-string",
    "countryId": "uuid-string",
    "customerGroupId": "uuid-string",
    "customerId": "uuid-string",
    "dateFrom": "2023-01-01T00:00:00Z",
    "dateTo": "2023-01-01T00:00:00Z",
    "fromQuantity": 1,
    "priority": 1,
    "productId": "uuid-string",
    "reduction": 1.5,
    "reductionType": "string"
  }
}
```

### deleteSpecificPrice

```graphql
mutation DeleteSpecificPrice($id: ID!) {
  deleteSpecificPrice(id: $id) {
    active
    combinationId
    countryId
    customerGroupId
    customerId
    dateAdd
    dateFrom
    dateTo
    fromQuantity
    id
    priority
    productId
    reduction
    reductionType
  }
}
```

**Variables:**

```json
{
  "id": "uuid-string"
}
```

### updateSpecificPrice

```graphql
mutation UpdateSpecificPrice($id: ID!, $input: UpdateSpecificPriceInput!) {
  updateSpecificPrice(id: $id, input: $input) {
    active
    combinationId
    countryId
    customerGroupId
    customerId
    dateAdd
    dateFrom
    dateTo
    fromQuantity
    id
    priority
    productId
    reduction
    reductionType
  }
}
```

**Variables:**

```json
{
  "id": "uuid-string",
  "input": {
    "active": true,
    "dateFrom": "2023-01-01T00:00:00Z",
    "dateTo": "2023-01-01T00:00:00Z",
    "fromQuantity": 1,
    "priority": 1,
    "reduction": 1.5,
    "reductionType": "string"
  }
}
```
