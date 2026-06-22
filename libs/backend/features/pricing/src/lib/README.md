# GraphQL API - pricing

Ce document contient les exemples d'appels API GraphQL pour les opérations définies dans ce resolver.

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
