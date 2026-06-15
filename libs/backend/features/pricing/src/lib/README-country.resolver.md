# GraphQL API - country.resolver.ts

Ce document contient les exemples d'appels API GraphQL pour les opérations définies dans `country.resolver.ts` qu'on peut copier et coller pour tester.

### countries

```graphql
query Countries {
  countries {
    active
    id
    isoCode
    name
    taxRate
  }
}
```

**Variables:**

```json
{}
```

### country

```graphql
query Country($id: ID!) {
  country(id: $id) {
    active
    id
    isoCode
    name
    taxRate
  }
}
```

**Variables:**

```json
{
  "id": "uuid-string"
}
```

### createCountry

```graphql
mutation CreateCountry($input: CreateCountryInput!) {
  createCountry(input: $input) {
    active
    id
    isoCode
    name
    taxRate
  }
}
```

**Variables:**

```json
{
  "input": {
    "active": true,
    "isoCode": "string",
    "name": "string",
    "taxRate": 1.5
  }
}
```

### deleteCountry

```graphql
mutation DeleteCountry($id: ID!) {
  deleteCountry(id: $id) {
    active
    id
    isoCode
    name
    taxRate
  }
}
```

**Variables:**

```json
{
  "id": "uuid-string"
}
```

### updateCountry

```graphql
mutation UpdateCountry($id: ID!, $input: UpdateCountryInput!) {
  updateCountry(id: $id, input: $input) {
    active
    id
    isoCode
    name
    taxRate
  }
}
```

**Variables:**

```json
{
  "id": "uuid-string",
  "input": {
    "active": true,
    "name": "string",
    "taxRate": 1.5
  }
}
```
