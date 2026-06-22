# GraphQL API - customer

Ce document contient les exemples d'appels API GraphQL pour les opérations définies dans ce resolver.

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
