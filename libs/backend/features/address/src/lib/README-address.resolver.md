# GraphQL API - address.resolver.ts

Ce document contient les exemples d'appels API GraphQL pour les opérations définies dans `address.resolver.ts` qu'on peut copier et coller pour tester.

### address

```graphql
query Address($id: ID!) {
  address(id: $id) {
    active
    address1
    address2
    alias
    city
    company
    countryId
    customerId
    deleted
    firstname
    id
    lastname
    phone
    phoneMobile
    postcode
    vatNumber
  }
}
```

**Variables:**

```json
{
  "id": "uuid-string"
}
```

### addresses

```graphql
query Addresses {
  addresses {
    active
    address1
    address2
    alias
    city
    company
    countryId
    customerId
    deleted
    firstname
    id
    lastname
    phone
    phoneMobile
    postcode
    vatNumber
  }
}
```

**Variables:**

```json
{}
```

### myAddresses

```graphql
query MyAddresses {
  myAddresses {
    active
    address1
    address2
    alias
    city
    company
    countryId
    customerId
    deleted
    firstname
    id
    lastname
    phone
    phoneMobile
    postcode
    vatNumber
  }
}
```

**Variables:**

```json
{}
```

### createAddress

```graphql
mutation CreateAddress($input: CreateAddressInput!) {
  createAddress(input: $input) {
    active
    address1
    address2
    alias
    city
    company
    countryId
    customerId
    deleted
    firstname
    id
    lastname
    phone
    phoneMobile
    postcode
    vatNumber
  }
}
```

**Variables:**

```json
{
  "input": {
    "address1": "string",
    "address2": "string",
    "alias": "string",
    "city": "string",
    "company": "string",
    "countryId": "uuid-string",
    "firstname": "string",
    "lastname": "string",
    "phone": "string",
    "phoneMobile": "string",
    "postcode": "string",
    "vatNumber": "string"
  }
}
```

### deleteAddress

```graphql
mutation DeleteAddress($id: ID!) {
  deleteAddress(id: $id) {
    active
    address1
    address2
    alias
    city
    company
    countryId
    customerId
    deleted
    firstname
    id
    lastname
    phone
    phoneMobile
    postcode
    vatNumber
  }
}
```

**Variables:**

```json
{
  "id": "uuid-string"
}
```

### updateAddress

```graphql
mutation UpdateAddress($id: ID!, $input: UpdateAddressInput!) {
  updateAddress(id: $id, input: $input) {
    active
    address1
    address2
    alias
    city
    company
    countryId
    customerId
    deleted
    firstname
    id
    lastname
    phone
    phoneMobile
    postcode
    vatNumber
  }
}
```

**Variables:**

```json
{
  "id": "uuid-string",
  "input": {
    "active": true,
    "address1": "string",
    "address2": "string",
    "alias": "string",
    "city": "string",
    "company": "string",
    "countryId": "uuid-string",
    "firstname": "string",
    "lastname": "string",
    "phone": "string",
    "phoneMobile": "string",
    "postcode": "string",
    "vatNumber": "string"
  }
}
```
