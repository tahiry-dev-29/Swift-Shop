# GraphQL API - customer-magic-link.resolver.ts

Ce document contient les exemples d'appels API GraphQL pour les opérations définies dans `customer-magic-link.resolver.ts` qu'on peut copier et coller pour tester.

### customerLoginWithMagicLink

```graphql
mutation CustomerLoginWithMagicLink($token: String!) {
  customerLoginWithMagicLink(token: $token) {
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

### requestCustomerMagicLink

```graphql
mutation RequestCustomerMagicLink($email: String!) {
  requestCustomerMagicLink(email: $email) {
    sent
  }
}
```

**Variables:**

```json
{
  "email": "string"
}
```
