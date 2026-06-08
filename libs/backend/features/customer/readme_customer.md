# 👤 Customer Module - API Tests

## 📍 GraphQL Playground

`http://localhost:3000/graphql`

---

## Login

OK

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

## Register

Ok

```graphql
mutation {
  customerRegister(input: { email: "new@example.com", password: "secret123", firstname: "Jane", lastname: "Smith", groupId: 1 }) {
    accessToken
    customer {
      id
      email
    }
  }
}
```

---

## Me (Protected) 🔒

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
