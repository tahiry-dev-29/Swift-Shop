# GraphQL API - customer-group

Ce document contient les exemples d'appels API GraphQL pour les opérations définies dans ce resolver.

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
