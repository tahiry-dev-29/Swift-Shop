# GraphQL API - feature

Ce document contient les exemples d'appels API GraphQL pour les opérations définies dans ce resolver.

### features

```graphql
query Features {
  features {
    id
    name
    position
    publicName
    values {
      custom
      featureId
      id
      position
      value
    }
  }
}
```

**Variables:**

```json
{}
```

### feature

```graphql
query Feature($id: ID!) {
  feature(id: $id) {
    id
    name
    position
    publicName
    values {
      custom
      featureId
      id
      position
      value
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

### featureValue

```graphql
query FeatureValue($id: ID!) {
  featureValue(id: $id) {
    custom
    featureId
    id
    position
    value
  }
}
```

**Variables:**

```json
{
  "id": "uuid-string"
}
```
