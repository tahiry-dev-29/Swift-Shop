# GraphQL API - category.resolver.ts

Ce document contient les exemples d'appels API GraphQL pour les opérations définies dans `category.resolver.ts` qu'on peut copier et coller pour tester.

### categories

```graphql
query Categories {
  categories {
    active
    banner
    children {
      active
      banner
      dateAdd
      dateUpd
      description
      id
      metaDescription
      metaKeywords
      metaTitle
      name
      parentId
      path
      position
      slug
      thumbnail
    }
    dateAdd
    dateUpd
    description
    id
    metaDescription
    metaKeywords
    metaTitle
    name
    parentId
    path
    position
    slug
    thumbnail
  }
}
```

**Variables:**

```json
{}
```

### category

```graphql
query Category($id: ID!) {
  category(id: $id) {
    active
    banner
    children {
      active
      banner
      dateAdd
      dateUpd
      description
      id
      metaDescription
      metaKeywords
      metaTitle
      name
      parentId
      path
      position
      slug
      thumbnail
    }
    dateAdd
    dateUpd
    description
    id
    metaDescription
    metaKeywords
    metaTitle
    name
    parentId
    path
    position
    slug
    thumbnail
  }
}
```

**Variables:**

```json
{
  "id": "uuid-string"
}
```

### categoryConnection

```graphql
query CategoryConnection($args: CategoryConnectionArgs!) {
  categoryConnection(args: $args) {
    edges {
      cursor
    }
    pageInfo {
      endCursor
      hasNextPage
      hasPreviousPage
      startCursor
    }
    totalCount
  }
}
```

**Variables:**

```json
{
  "args": {
    "after": "string",
    "first": 1,
    "parentId": "uuid-string"
  }
}
```

### categoryPath

```graphql
query CategoryPath($id: ID!) {
  categoryPath(id: $id)
}
```

**Variables:**

```json
{
  "id": "uuid-string"
}
```

### categoryTree

```graphql
query CategoryTree {
  categoryTree {
    active
    banner
    children {
      active
      banner
      dateAdd
      dateUpd
      description
      id
      metaDescription
      metaKeywords
      metaTitle
      name
      parentId
      path
      position
      slug
      thumbnail
    }
    dateAdd
    dateUpd
    description
    id
    metaDescription
    metaKeywords
    metaTitle
    name
    parentId
    path
    position
    slug
    thumbnail
  }
}
```

**Variables:**

```json
{}
```

### createCategory

```graphql
mutation CreateCategory($input: CreateCategoryInput!) {
  createCategory(input: $input) {
    active
    banner
    children {
      active
      banner
      dateAdd
      dateUpd
      description
      id
      metaDescription
      metaKeywords
      metaTitle
      name
      parentId
      path
      position
      slug
      thumbnail
    }
    dateAdd
    dateUpd
    description
    id
    metaDescription
    metaKeywords
    metaTitle
    name
    parentId
    path
    position
    slug
    thumbnail
  }
}
```

**Variables:**

```json
{
  "input": {
    "active": true,
    "banner": "string",
    "description": "string",
    "metaDescription": "string",
    "metaKeywords": "string",
    "metaTitle": "string",
    "name": "string",
    "parentId": "uuid-string",
    "position": 1,
    "slug": "string",
    "thumbnail": "string"
  }
}
```

### deleteCategory

```graphql
mutation DeleteCategory($id: ID!) {
  deleteCategory(id: $id) {
    active
    banner
    children {
      active
      banner
      dateAdd
      dateUpd
      description
      id
      metaDescription
      metaKeywords
      metaTitle
      name
      parentId
      path
      position
      slug
      thumbnail
    }
    dateAdd
    dateUpd
    description
    id
    metaDescription
    metaKeywords
    metaTitle
    name
    parentId
    path
    position
    slug
    thumbnail
  }
}
```

**Variables:**

```json
{
  "id": "uuid-string"
}
```

### reorderCategories

```graphql
mutation ReorderCategories($inputs: [UpdateCategoryPositionInput!]!) {
  reorderCategories(inputs: $inputs)
}
```

**Variables:**

```json
{
  "inputs": [
    {
      "id": "uuid-string",
      "position": 1
    }
  ]
}
```

### updateCategory

```graphql
mutation UpdateCategory($id: ID!, $input: UpdateCategoryInput!) {
  updateCategory(id: $id, input: $input) {
    active
    banner
    children {
      active
      banner
      dateAdd
      dateUpd
      description
      id
      metaDescription
      metaKeywords
      metaTitle
      name
      parentId
      path
      position
      slug
      thumbnail
    }
    dateAdd
    dateUpd
    description
    id
    metaDescription
    metaKeywords
    metaTitle
    name
    parentId
    path
    position
    slug
    thumbnail
  }
}
```

**Variables:**

```json
{
  "id": "uuid-string",
  "input": {
    "active": true,
    "banner": "string",
    "description": "string",
    "metaDescription": "string",
    "metaKeywords": "string",
    "metaTitle": "string",
    "name": "string",
    "parentId": "uuid-string",
    "position": 1,
    "slug": "string",
    "thumbnail": "string"
  }
}
```
