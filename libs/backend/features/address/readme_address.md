# 📍 Address Module - API Documentation

> Customer address management with ownership security

## 📍 GraphQL Playground
`http://localhost:3000/graphql`

## 🔑 Authentication Required
All endpoints require authentication (CustomerGuard or EmployeeGuard).

---

## Customer Endpoints

### My Addresses (Customer)

**Header:**
```json
{ "Authorization": "Bearer <customerToken>" }
```

```graphql
query {
  myAddresses {
    id
    alias
    company
    firstname
    lastname
    address1
    address2
    postcode
    city
    countryId
    phone
    phoneMobile
    vatNumber
    active
    deleted
  }
}
```

---

### Get One Address (Customer - Ownership Required)

```graphql
query {
  address(id: 1) {
    id
    alias
    firstname
    lastname
    address1
    city
  }
}
```

---

### Create Address

```graphql
mutation {
  createAddress(input: {
    alias: "Home"
    firstname: "Jane"
    lastname: "Doe"
    address1: "123 Main Street"
    address2: "Apt 4B"
    postcode: "75001"
    city: "Paris"
    countryId: 1
    phone: "0123456789"
    phoneMobile: "0612345678"
  }) {
    id
    alias
    address1
    city
  }
}
```

---

### Update Address

```graphql
mutation {
  updateAddress(id: 1, input: {
    alias: "Work"
    phone: "0198765432"
  }) {
    id
    alias
    phone
  }
}
```

---

### Delete Address (Soft Delete)

```graphql
mutation {
  deleteAddress(id: 1) {
    id
    deleted
  }
}
```

> ⚠️ **Note:** Deletion is soft (sets `deleted: true`), data is not removed from database.

---

## Employee Endpoints

### List All Addresses (EmployeeGuard)

**Header:**
```json
{ "Authorization": "Bearer <employeeToken>" }
```

```graphql
query {
  addresses {
    id
    customerId
    alias
    firstname
    lastname
    address1
    city
    active
    deleted
  }
}
```

---

## Security

- **Customers** can only access their own addresses
- **Employees** can view all addresses
- Address ownership is verified on read, update, and delete operations
- Soft delete prevents data loss

---

## Example Workflow

```graphql
# 1. Customer Login
mutation {
  customerLogin(email: "customer@example.com", password: "customer123") {
    accessToken
  }
}

# 2. Create Address (with token from step 1)
mutation {
  createAddress(input: {
    alias: "Home"
    firstname: "John"
    lastname: "Doe"
    address1: "456 Oak Avenue"
    postcode: "69001"
    city: "Lyon"
    countryId: 1
  }) {
    id
  }
}

# 3. List My Addresses
query {
  myAddresses {
    id alias city
  }
}

# 4. Update
mutation {
  updateAddress(id: 1, input: { alias: "Primary Address" }) {
    id alias
  }
}

# 5. Delete
mutation {
  deleteAddress(id: 1) {
    id deleted
  }
}
```
