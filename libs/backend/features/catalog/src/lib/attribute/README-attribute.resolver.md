# GraphQL API - attribute.resolver.ts

Ce document contient les exemples d'appels API GraphQL pour les opérations définies dans `attribute.resolver.ts` qu'on peut copier et coller pour tester.

### attributeGroup

```graphql
query AttributeGroup($id: ID!) {
  attributeGroup(id: $id) {
    id
    name
    position
    publicName
    type
    values {
      attributeGroupId
      color
      id
      name
      position
    }
  }
}
```

**Variables:**

```json
{
  "id": "uuid-string"
}
```

### attributeGroups

```graphql
query AttributeGroups {
  attributeGroups {
    id
    name
    position
    publicName
    type
    values {
      attributeGroupId
      color
      id
      name
      position
    }
  }
}
```

**Variables:**

```json
{}
```

### createAttributeGroup

```graphql
mutation CreateAttributeGroup($input: CreateAttributeGroupInput!) {
  createAttributeGroup(input: $input) {
    id
    name
    position
    publicName
    type
    values {
      attributeGroupId
      color
      id
      name
      position
    }
  }
}
```

**Variables:**

```json
{
  "input": {
    "name": "string",
    "position": 1,
    "publicName": "string",
    "type": "string"
  }
}
```

### createAttributeValue

```graphql
mutation CreateAttributeValue($groupId: ID!, $input: CreateAttributeValueInput!) {
  createAttributeValue(groupId: $groupId, input: $input) {
    attributeGroupId
    color
    id
    name
    position
  }
}
```

**Variables:**

```json
{
  "groupId": "uuid-string",
  "input": {
    "color": "string",
    "name": "string",
    "position": 1
  }
}
```

### deleteAttributeGroup

```graphql
mutation DeleteAttributeGroup($id: ID!) {
  deleteAttributeGroup(id: $id) {
    id
    name
    position
    publicName
    type
    values {
      attributeGroupId
      color
      id
      name
      position
    }
  }
}
```

**Variables:**

```json
{
  "id": "uuid-string"
}
```

### deleteAttributeValue

```graphql
mutation DeleteAttributeValue($id: ID!) {
  deleteAttributeValue(id: $id) {
    attributeGroupId
    color
    id
    name
    position
  }
}
```

**Variables:**

```json
{
  "id": "uuid-string"
}
```

### updateAttributeGroup

```graphql
mutation UpdateAttributeGroup($id: ID!, $input: UpdateAttributeGroupInput!) {
  updateAttributeGroup(id: $id, input: $input) {
    id
    name
    position
    publicName
    type
    values {
      attributeGroupId
      color
      id
      name
      position
    }
  }
}
```

**Variables:**

```json
{
  "id": "uuid-string",
  "input": {
    "name": "string",
    "position": 1,
    "publicName": "string",
    "type": "string"
  }
}
```

### updateAttributeValue

```graphql
mutation UpdateAttributeValue($id: ID!, $input: UpdateAttributeValueInput!) {
  updateAttributeValue(id: $id, input: $input) {
    attributeGroupId
    color
    id
    name
    position
  }
}
```

**Variables:**

```json
{
  "id": "uuid-string",
  "input": {
    "color": "string",
    "name": "string",
    "position": 1
  }
}
```
