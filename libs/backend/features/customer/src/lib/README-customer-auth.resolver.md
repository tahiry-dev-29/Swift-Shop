# GraphQL API - customer-auth.resolver.ts

Ce document contient les exemples d'appels API GraphQL pour les opérations définies dans `customer-auth.resolver.ts` qu'on peut copier et coller pour tester.

### customerLogin

```graphql
mutation CustomerLogin($email: String!, $password: String!) {
  customerLogin(email: $email, password: $password) {
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
  "email": "string",
  "password": "string"
}
```

### customerRegister

```graphql
mutation CustomerRegister($input: CustomerRegisterInput!) {
  customerRegister(input: $input) {
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
  "input": {
    "birthday": "2023-01-01T00:00:00Z",
    "company": "string",
    "email": "string",
    "firstname": "string",
    "groupId": "uuid-string",
    "lastname": "string",
    "optin": true,
    "password": "string"
  }
}
```
