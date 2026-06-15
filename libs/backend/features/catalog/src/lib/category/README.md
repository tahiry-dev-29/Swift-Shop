# GraphQL API - category

Ce document contient les exemples d'appels API GraphQL pour les opérations définies dans ce resolver.

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
