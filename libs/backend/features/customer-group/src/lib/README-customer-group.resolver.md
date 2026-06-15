# GraphQL API - customer-group.resolver.ts

Ce document contient les exemples d'appels API GraphQL pour les opérations définies dans `customer-group.resolver.ts` qu'on peut copier et coller pour tester.

### customerGroup

```graphql
query CustomerGroup($id: ID!) {
  customerGroup(id: $id) {
    id
    name
    reduction
    showPrices
  }
}
```

**Variables:**

```json
{
  "id": "uuid-string"
}
```

### customerGroups

```graphql
query CustomerGroups {
  customerGroups {
    id
    name
    reduction
    showPrices
  }
}
```

**Variables:**

```json
{}
```

### createCustomerGroup

```graphql
mutation CreateCustomerGroup($input: CreateCustomerGroupInput!) {
  createCustomerGroup(input: $input) {
    id
    name
    reduction
    showPrices
  }
}
```

**Variables:**

```json
{
  "input": {
    "name": "string",
    "reduction": 1.5,
    "showPrices": true
  }
}
```

### deleteCustomerGroup

```graphql
mutation DeleteCustomerGroup($id: ID!) {
  deleteCustomerGroup(id: $id) {
    id
    name
    reduction
    showPrices
  }
}
```

**Variables:**

```json
{
  "id": "uuid-string"
}
```

### updateCustomerGroup

```graphql
mutation UpdateCustomerGroup($id: ID!, $input: UpdateCustomerGroupInput!) {
  updateCustomerGroup(id: $id, input: $input) {
    id
    name
    reduction
    showPrices
  }
}
```

**Variables:**

```json
{
  "id": "uuid-string",
  "input": {
    "name": "string",
    "reduction": 1.5,
    "showPrices": true
  }
}
```
