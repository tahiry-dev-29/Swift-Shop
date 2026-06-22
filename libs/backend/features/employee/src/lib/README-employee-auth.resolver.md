# GraphQL API - employee-auth.resolver.ts

Ce document contient les exemples d'appels API GraphQL pour les opérations définies dans `employee-auth.resolver.ts` qu'on peut copier et coller pour tester.

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

### disableEmployeeTwoFactor

```graphql
mutation DisableEmployeeTwoFactor($totp: String!) {
  disableEmployeeTwoFactor(totp: $totp) {
    active
    email
    firstname
    forcePasswordReset
    id
    lastConnectionDate
    lastname
    role {
      dateAdd
      description
      id
      isSystem
      name
      slug
    }
    roles {
      dateAdd
      description
      id
      isSystem
      name
      slug
    }
    twoFactorEnabled
  }
}
```

**Variables:**

```json
{
  "totp": "string"
}
```

### employeeLogin

```graphql
mutation EmployeeLogin($email: String!, $password: String!, $rememberDevice: Boolean, $totp: String, $trustedDeviceToken: String) {
  employeeLogin(email: $email, password: $password, rememberDevice: $rememberDevice, totp: $totp, trustedDeviceToken: $trustedDeviceToken) {
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
  "email": "string",
  "password": "string",
  "rememberDevice": true,
  "totp": "string",
  "trustedDeviceToken": "string"
}
```

### employeeLogout

```graphql
mutation EmployeeLogout {
  employeeLogout
}
```

**Variables:**

```json
{}
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

### enableEmployeeTwoFactor

```graphql
mutation EnableEmployeeTwoFactor($totp: String!) {
  enableEmployeeTwoFactor(totp: $totp) {
    active
    email
    firstname
    forcePasswordReset
    id
    lastConnectionDate
    lastname
    role {
      dateAdd
      description
      id
      isSystem
      name
      slug
    }
    roles {
      dateAdd
      description
      id
      isSystem
      name
      slug
    }
    twoFactorEnabled
  }
}
```

**Variables:**

```json
{
  "totp": "string"
}
```

### generateEmployeeTwoFactor

```graphql
mutation GenerateEmployeeTwoFactor {
  generateEmployeeTwoFactor {
    qrCodeUrl
    secret
  }
}
```

**Variables:**

```json
{}
```
