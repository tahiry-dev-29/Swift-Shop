# GraphQL API - customer.resolver.ts

Ce document contient les exemples d'appels API GraphQL pour les opérations définies dans `customer.resolver.ts` qu'on peut copier et coller pour tester.

### customerMe

```graphql
query CustomerMe {
  customerMe {
    active
    birthday
    company
    email
    firstname
    group {
      id
      name
      reduction
      showPrices
    }
    id
    lastname
  }
}
```

**Variables:**

```json
{}
```

### customers

```graphql
query Customers {
  customers {
    active
    birthday
    company
    email
    firstname
    group {
      id
      name
      reduction
      showPrices
    }
    id
    lastname
  }
}
```

**Variables:**

```json
{}
```

### customerLogout

```graphql
mutation CustomerLogout {
  customerLogout
}
```

**Variables:**

```json
{}
```

### customerRefreshToken

```graphql
mutation CustomerRefreshToken($token: String!) {
  customerRefreshToken(token: $token) {
    accessToken
    customer {
      active
      birthday
      company
      email
      firstname
      id
      lastname
    }
    refreshToken
  }
}
```

**Variables:**

```json
{
  "token": "string"
}
```
