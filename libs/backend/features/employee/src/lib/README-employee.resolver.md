# GraphQL API - employee.resolver.ts

Ce document contient les exemples d'appels API GraphQL pour les opérations définies dans `employee.resolver.ts` qu'on peut copier et coller pour tester.

### employee

```graphql
query Employee($id: ID!) {
  employee(id: $id) {
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
  "id": "uuid-string"
}
```

### employeeMe

```graphql
query EmployeeMe {
  employeeMe {
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
{}
```

### employees

```graphql
query Employees {
  employees {
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
{}
```

### createEmployee

```graphql
mutation CreateEmployee($input: CreateEmployeeInput!) {
  createEmployee(input: $input) {
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
  "input": {
    "email": "string",
    "firstname": "string",
    "lastname": "string",
    "password": "string",
    "roleId": "uuid-string"
  }
}
```

### deleteEmployee

```graphql
mutation DeleteEmployee($id: ID!) {
  deleteEmployee(id: $id) {
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
  "id": "uuid-string"
}
```

### updateEmployee

```graphql
mutation UpdateEmployee($id: ID!, $input: UpdateEmployeeInput!) {
  updateEmployee(id: $id, input: $input) {
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
  "id": "uuid-string",
  "input": {
    "active": true,
    "firstname": "string",
    "forcePasswordReset": true,
    "lastname": "string",
    "roleId": "uuid-string"
  }
}
```
