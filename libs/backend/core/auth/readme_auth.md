# 🔐 Auth Module - API Tests

## 📍 GraphQL Playground
`http://localhost:3000/graphql`

---
All OK

## 👔 Employee Login

```graphql
mutation {
  employeeLogin(email: "superadmin@dima.com", password: "admin123") {
    accessToken
    employee {
      id
      firstname
      lastname
      email
      role
    }
  }
}
```


---

## 👔 Employee Me (Protected)

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
    role
    lastConnectionDate
  }
}
```

---

## 👤 Customer Login

```graphql
mutation {
  customerLogin(email: "customer@example.com", password: "customer123") {
    accessToken
    customer {
      id
      firstname
      lastname
      email
    }
  }
}
```

---

## 👤 Customer Register

```graphql
mutation {
  customerRegister(input: {
    email: "newuser@example.com"
    password: "password123"
    firstname: "John"
    lastname: "Doe"
    groupId: 1
  }) {
    accessToken
    customer {
      id
      email
      firstname
    }
  }
}
```

---

## 👤 Customer Me (Protected)

**Header:**
```json
{ "Authorization": "Bearer <accessToken>" }
```

```graphql
query {
  customerMe {
    id
    firstname
    lastname
    email
    active
  }
}
```
