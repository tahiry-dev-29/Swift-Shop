# GraphQL API - employee-auth

Ce document contient les exemples d'appels API GraphQL pour les opérations définies dans ce resolver.

### completeEmployeeForcedPasswordReset

```graphql
mutation CompleteEmployeeForcedPasswordReset($password: String!, $token: String!) {
  completeEmployeeForcedPasswordReset(password: $password, token: $token) {
    accessToken
    employee {
      active
      email
      firstname
      forcePasswordReset
      id
      lastConnectionDate
      lastname
      twoFactorEnabled
    }
    refreshToken
    requires2FA
    requiresPasswordReset
  }
}
```

**Variables:**

```json
{
  "password": "string",
  "token": "string"
}
```

### employeeRefreshToken

```graphql
mutation EmployeeRefreshToken($token: String!) {
  employeeRefreshToken(token: $token) {
    accessToken
    employee {
      active
      email
      firstname
      forcePasswordReset
      id
      lastConnectionDate
      lastname
      twoFactorEnabled
    }
    refreshToken
    requires2FA
    requiresPasswordReset
  }
}
```

**Variables:**

```json
{
  "token": "string"
}
```
