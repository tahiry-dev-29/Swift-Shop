# 📂 Catalog Module - Categories API

> Hierarchical category management with tree structure

## 📍 GraphQL Playground
`http://localhost:3000/graphql`

## 🔑 Authentication
- **Public**: `categories`, `categoryTree`, `category`, `categoryPath`
- **SuperAdmin Only**: `createCategory`, `updateCategory`, `deleteCategory`

---

## 📋 Query Operations

### List All Categories (Flat)

```graphql
query {
  categories {
    id
    name
    description
    active
    position
    parentId
    dateAdd
    dateUpd
  }
}
```

---

### Get Category Tree (Nested)

```graphql
query {
  categoryTree {
    id
    name
    description
    children {
      id
      name
      children {
        id
        name
      }
    }
  }
}
```

**Response Example:**
```json
{
  "data": {
    "categoryTree": [
      {
        "id": 1,
        "name": "Electronics",
        "description": "Electronic devices",
        "children": [
          {
            "id": 2,
            "name": "Smartphones",
            "children": []
          },
          {
            "id": 3,
            "name": "Laptops",
            "children": []
          }
        ]
      }
    ]
  }
}
```

---

### Get One Category

```graphql
query {
  category(id: 1) {
    id
    name
    description
    active
    position
    parentId
    children {
      id
      name
    }
  }
}
```

---

### Get Category Path (Breadcrumb)

```graphql
query {
  categoryPath(id: 2)
}
```

**Response Example:**
```json
{
  "data": {
    "categoryPath": ["Electronics", "Smartphones"]
  }
}
```

---

## ✏️ Mutation Operations (SuperAdmin Only)

> ⚠️ **All mutations require SuperAdmin authentication**

**Header:**
```json
{ "Authorization": "Bearer <superAdminToken>" }
```

### Create Category

```graphql
mutation {
  createCategory(input: {
    name: "Electronics"
    description: "Electronic devices and gadgets"
    active: true
    position: 1
  }) {
    id
    name
    description
    parentId
  }
}
```

**Create Child Category:**
```graphql
mutation {
  createCategory(input: {
    name: "Smartphones"
    description: "Mobile phones and accessories"
    parentId: 1
    position: 1
  }) {
    id
    name
    parentId
  }
}
```

---

### Update Category

```graphql
mutation {
  updateCategory(id: 1, input: {
    name: "Consumer Electronics"
    description: "Updated description"
    active: true
  }) {
    id
    name
    description
  }
}
```

**Move Category (Change Parent):**
```graphql
mutation {
  updateCategory(id: 2, input: {
    parentId: 3
  }) {
    id
    name
    parentId
  }
}
```

---

### Delete Category

```graphql
mutation {
  deleteCategory(id: 1) {
    id
    name
  }
}
```

> ⚠️ **Note:** Cannot delete a category that has children. Delete children first or move them to another parent.

**Error Example:**
```json
{
  "errors": [{
    "message": "Cannot delete category with children"
  }]
}
```

---

## 📊 Complete CRUD Workflow

```graphql
# 1. Create Root Category
mutation {
  createCategory(input: {
    name: "Fashion"
    description: "Clothing and accessories"
  }) {
    id
  }
}

# 2. Create Sub-Categories
mutation {
  createCategory(input: {
    name: "Men"
    parentId: 1
  }) {
    id
  }
}

mutation {
  createCategory(input: {
    name: "Women"
    parentId: 1
  }) {
    id
  }
}

# 3. Create Nested Sub-Category
mutation {
  createCategory(input: {
    name: "Shirts"
    parentId: 2
  }) {
    id
  }
}

# 4. Get Full Tree
query {
  categoryTree {
    id
    name
    children {
      id
      name
      children {
        id
        name
      }
    }
  }
}

# 5. Get Breadcrumb Path
query {
  categoryPath(id: 4)
}
# Returns: ["Fashion", "Men", "Shirts"]

# 6. Update Category
mutation {
  updateCategory(id: 4, input: {
    name: "Dress Shirts"
  }) {
    id
    name
  }
}

# 7. Move Category to Different Parent
mutation {
  updateCategory(id: 4, input: {
    parentId: 3
  }) {
    id
    name
    parentId
  }
}

# 8. Delete Leaf Category (No Children)
mutation {
  deleteCategory(id: 4) {
    id
  }
}
```

---

## 🎯 Use Cases

### E-commerce Navigation
```graphql
query {
  categoryTree {
    id
    name
    children {
      id
      name
    }
  }
}
```
Use for main navigation menu.

### Product Filters
```graphql
query {
  category(id: 1) {
    id
    name
    children {
      id
      name
    }
  }
}
```
Get subcategories for filtering products.

### Breadcrumb Navigation
```graphql
query {
  categoryPath(id: 5)
}
```
Display: Home > Electronics > Smartphones > iPhone

---

## ⚙️ Features

✅ **Full CRUD** - Create, Read, Update, Delete  
✅ **Tree Structure** - Parent-child relationships  
✅ **Nested Queries** - Get full tree with children  
✅ **Breadcrumb Path** - Get category hierarchy  
✅ **Position Ordering** - Control display order  
✅ **Active Status** - Enable/disable categories  
✅ **Protected Mutations** - SuperAdmin only

---

## 🔒 Security

- Public can view categories (read-only)
- Only SuperAdmin can create/update/delete
- Cannot delete categories with children
- Tree integrity maintained automatically

---

# 🎨 Attributes API (Variants)

> Manage product variants like Size, Color, etc.

## 📋 Query Operations

### List Attribute Groups
```graphql
query {
  attributeGroups {
    id
    name
    publicName
    type
    values {
      id
      name
      color
    }
  }
}
```

### Get One Group
```graphql
query {
  attributeGroup(id: 1) {
    id
    name
    values {
      id
      name
    }
  }
}
```

## ✏️ Mutation Operations (SuperAdmin Only)

### Create Group
```graphql
mutation {
  createAttributeGroup(input: {
    name: "Size"
    publicName: "Taille"
    type: "select"
  }) {
    id
    name
  }
}
```

### Create Value
```graphql
mutation {
  createAttributeValue(groupId: 1, input: {
    name: "L"
    position: 3
  }) {
    id
    name
  }
}
```

### Create Color Value
```graphql
mutation {
  createAttributeValue(groupId: 2, input: {
    name: "Red"
    color: "#FF0000"
  }) {
    id
    name
    color
  }
}
```

### Delete Group (Cascades delete values)
```graphql
mutation {
  deleteAttributeGroup(id: 1) {
    id
  }
}
```
