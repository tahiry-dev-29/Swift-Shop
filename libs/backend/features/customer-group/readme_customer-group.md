# 👥 CustomerGroup Module - API Tests

> ⚠️ **Toutes les routes requièrent un token Employee**

## 📍 GraphQL Playground

`http://localhost:3000/graphql`

**Header (toutes les requêtes):**

```json
{ "Authorization": "Bearer <employeeToken>" }
```

---

## List All Groups

OK

```graphql
query {
  customerGroups {
    id
    name
    reduction
    showPrices
  }
}
```

---

## Get One Group

Ok

```graphql
query {
  customerGroup(id: 1) {
    id
    name
    reduction
    showPrices
  }
}
```

---

## ## Create Group

Implemented: Name must be unique (throws ConflictException if exists)

```graphql
mutation {
  createCustomerGroup(input: { name: "VIP", reduction: 15.0, showPrices: true }) {
    id
    name
    reduction
  }
}
```

---

## Update Group

Ok

```graphql
mutation {
  updateCustomerGroup(id: 2, input: { reduction: 20.0 }) {
    id
    name
    reduction
  }
}
```

---

## Delete Group

Ok

```graphql
mutation {
  deleteCustomerGroup(id: 2) {
    id
    name
  }
}
```
