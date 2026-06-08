# 👔 Employee Module - API Tests

## 📍 GraphQL Playground

`http://localhost:3000/graphql`

---

## 🔑 Login

```graphql
mutation {
  employeeLogin(email: "superadmin@dima.com", password: "admin123") {
    accessToken
    employee {
      id
      firstname
      lastname
      email
      role {
        name
      }
    }
  }
}
```

**Autres comptes:**

```graphql
mutation {
  employeeLogin(email: "staff@dima.com", password: "employee123") {
    accessToken
    employee {
      id
      role {
        name
      }
    }
  }
}
```

---

## 👤 Me (Protected) 🔒

**Header:**

```json
{ "Authorization": "Bearer <accessToken>" }
```

```graphql
query {
  employeeMe {
    id
    firstname
    lastname
    email
    role {
      name
    }
    lastConnectionDate
  }
}
```

---

## 👥 Employee CRUD (Super Admin Only) 🔒

> ⚠️ **Requires SUPER_ADMIN role**

### List All Employees

```graphql
query {
  employees {
    id
    firstname
    lastname
    email
    role {
      name
    }
    active
  }
}
```

### Get One Employee

```graphql
query {
  employee(id: 1) {
    id
    firstname
    lastname
    email
    role {
      name
    }
    active
    lastConnectionDate
  }
}
```

### Create Employee

```graphql
mutation {
  createEmployee(input: { email: "manager@dima.com", password: "manager123", firstname: "Manager", lastname: "User", roleId: 2 }) {
    id
    email
    role {
      name
    }
  }
}
```

### Update Employee

```graphql
mutation {
  updateEmployee(id: 2, input: { roleId: 3, active: true }) {
    id
    role {
      name
    }
    active
  }
}
```

### Delete Employee

```graphql
mutation {
  deleteEmployee(id: 3) {
    id
    email
  }
}
```
