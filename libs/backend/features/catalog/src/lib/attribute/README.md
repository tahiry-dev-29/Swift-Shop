# GraphQL API - attribute

Ce document contient les exemples d'appels API GraphQL pour les opérations définies dans ce resolver.

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
