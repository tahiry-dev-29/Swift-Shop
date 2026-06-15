# GraphQL API - role.resolver.ts

Ce document contient les exemples d'appels API GraphQL pour les opérations définies dans `role.resolver.ts` qu'on peut copier et coller pour tester.

### listRoles

```graphql
query ListRoles($filter: RoleFilterInput) {
  listRoles(filter: $filter) {
    items {
      description
      employeeCount
      id
      isSystem
      name
      permissionCount
      slug
    }
    total
  }
}
```

**Variables:**

```json
{
  "filter": {
    "isSystem": true,
    "search": "string",
    "skip": 1,
    "take": 1
  }
}
```

### myPermissions

```graphql
query MyPermissions {
  myPermissions {
    action
    description
    id
    resource
    slug
  }
}
```

**Variables:**

```json
{}
```

### permissionsMatrix

```graphql
query PermissionsMatrix {
  permissionsMatrix {
    permissions {
      action
      resource
    }
    resource
  }
}
```

**Variables:**

```json
{}
```

### role

```graphql
query Role($id: ID!) {
  role(id: $id) {
    dateAdd
    description
    id
    isSystem
    name
    permissions {
      action
      description
      id
      resource
      slug
    }
    slug
  }
}
```

**Variables:**

```json
{
  "id": "uuid-string"
}
```

### roles

```graphql
query Roles {
  roles {
    description
    employeeCount
    id
    isSystem
    name
    permissionCount
    slug
  }
}
```

**Variables:**

```json
{}
```

### assignPermissionsToRole

```graphql
mutation AssignPermissionsToRole($input: PermissionIdsInput!, $roleId: ID!) {
  assignPermissionsToRole(input: $input, roleId: $roleId) {
    dateAdd
    description
    id
    isSystem
    name
    permissions {
      action
      description
      id
      resource
      slug
    }
    slug
  }
}
```

**Variables:**

```json
{
  "input": {
    "permissionIds": ["uuid-string"]
  },
  "roleId": "uuid-string"
}
```

### assignRolesToEmployee

```graphql
mutation AssignRolesToEmployee($employeeId: ID!, $input: RoleIdsInput!) {
  assignRolesToEmployee(employeeId: $employeeId, input: $input) {
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
  "employeeId": "uuid-string",
  "input": {
    "roleIds": ["uuid-string"]
  }
}
```

### cloneRole

```graphql
mutation CloneRole($id: ID!, $newName: String!) {
  cloneRole(id: $id, newName: $newName) {
    dateAdd
    description
    id
    isSystem
    name
    permissions {
      action
      description
      id
      resource
      slug
    }
    slug
  }
}
```

**Variables:**

```json
{
  "id": "uuid-string",
  "newName": "string"
}
```

### createRole

```graphql
mutation CreateRole($input: CreateRoleInput!) {
  createRole(input: $input) {
    dateAdd
    description
    id
    isSystem
    name
    permissions {
      action
      description
      id
      resource
      slug
    }
    slug
  }
}
```

**Variables:**

```json
{
  "input": {
    "description": "string",
    "name": "string",
    "slug": "string"
  }
}
```

### deleteRole

```graphql
mutation DeleteRole($id: ID!) {
  deleteRole(id: $id) {
    dateAdd
    description
    id
    isSystem
    name
    permissions {
      action
      description
      id
      resource
      slug
    }
    slug
  }
}
```

**Variables:**

```json
{
  "id": "uuid-string"
}
```

### revokePermissionsFromRole

```graphql
mutation RevokePermissionsFromRole($input: PermissionIdsInput!, $roleId: ID!) {
  revokePermissionsFromRole(input: $input, roleId: $roleId) {
    dateAdd
    description
    id
    isSystem
    name
    permissions {
      action
      description
      id
      resource
      slug
    }
    slug
  }
}
```

**Variables:**

```json
{
  "input": {
    "permissionIds": ["uuid-string"]
  },
  "roleId": "uuid-string"
}
```

### revokeRolesFromEmployee

```graphql
mutation RevokeRolesFromEmployee($employeeId: ID!, $input: RoleIdsInput!) {
  revokeRolesFromEmployee(employeeId: $employeeId, input: $input) {
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
  "employeeId": "uuid-string",
  "input": {
    "roleIds": ["uuid-string"]
  }
}
```

### updateRole

```graphql
mutation UpdateRole($id: ID!, $input: UpdateRoleInput!) {
  updateRole(id: $id, input: $input) {
    dateAdd
    description
    id
    isSystem
    name
    permissions {
      action
      description
      id
      resource
      slug
    }
    slug
  }
}
```

**Variables:**

```json
{
  "id": "uuid-string",
  "input": {
    "description": "string",
    "name": "string",
    "slug": "string"
  }
}
```
