# 🔐 Roles Management - API Tests

> ⚠️ **Requires SUPER_ADMIN role**

## 📍 GraphQL Playground

`http://localhost:3000/graphql`

---

## Roles Management (Dynamic)

Implemented via `RoleResolver`. Protected by `SUPER_ADMIN`.

System roles (`SUPER_ADMIN`, `ADMIN`, `SALES`, `WAREHOUSE`) cannot be deleted or renamed (`isSystem: true`).

### List Roles

```graphql
query {
  roles {
    id
    name
    description
    isSystem
  }
}
```

### Create Role

```graphql
mutation {
  createRole(input: { name: "MANAGER", description: "Manager Role" }) {
    id
    name
  }
}
```

### Update Role

```graphql
mutation {
  updateRole(id: 5, input: { name: "SENIOR_MANAGER" }) {
    id
    name
  }
}
```

### Delete Role

```graphql
mutation {
  deleteRole(id: 5) {
    id
    name
  }
}
```
