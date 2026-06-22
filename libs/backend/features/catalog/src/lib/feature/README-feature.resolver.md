# GraphQL API - feature.resolver.ts

Ce document contient les exemples d'appels API GraphQL pour les opérations définies dans `feature.resolver.ts` qu'on peut copier et coller pour tester.

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

### createFeature

```graphql
mutation CreateFeature($input: CreateFeatureInput!) {
  createFeature(input: $input) {
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
  "input": {
    "name": "string",
    "position": 1,
    "publicName": "string"
  }
}
```

### createFeatureValue

```graphql
mutation CreateFeatureValue($featureId: ID!, $input: CreateFeatureValueInput!) {
  createFeatureValue(featureId: $featureId, input: $input) {
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
  "featureId": "uuid-string",
  "input": {
    "custom": true,
    "position": 1,
    "value": "string"
  }
}
```

### deleteFeature

```graphql
mutation DeleteFeature($id: ID!) {
  deleteFeature(id: $id) {
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

### deleteFeatureValue

```graphql
mutation DeleteFeatureValue($id: ID!) {
  deleteFeatureValue(id: $id) {
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

### updateFeature

```graphql
mutation UpdateFeature($id: ID!, $input: UpdateFeatureInput!) {
  updateFeature(id: $id, input: $input) {
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
  "id": "uuid-string",
  "input": {
    "name": "string",
    "position": 1,
    "publicName": "string"
  }
}
```

### updateFeatureValue

```graphql
mutation UpdateFeatureValue($id: ID!, $input: UpdateFeatureValueInput!) {
  updateFeatureValue(id: $id, input: $input) {
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
  "id": "uuid-string",
  "input": {
    "custom": true,
    "position": 1,
    "value": "string"
  }
}
```
