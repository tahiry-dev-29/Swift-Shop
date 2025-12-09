# 🚀 Backend API - Documentation

Liste complète des APIs GraphQL disponibles avec exemples de test.

## 📋 Endpoints Disponibles

| Module | Endpoint | Type | Auth |
|--------|----------|------|------|
| **Auth/Employee** | `employeeLogin` | Mutation | ❌ |
| **Auth/Employee** | `employeeMe` | Query | 🔒 Employee |
| **Auth/Customer** | `customerLogin` | Mutation | ❌ |
| **Auth/Customer** | `customerRegister` | Mutation | ❌ |
| **Auth/Customer** | `customerMe` | Query | 🔒 Customer |
| **CustomerGroup** | `customerGroups` | Query | 🔒 Employee |
| **CustomerGroup** | `customerGroup(id)` | Query | 🔒 Employee |
| **CustomerGroup** | `createCustomerGroup` | Mutation | 🔒 Employee |
| **CustomerGroup** | `updateCustomerGroup` | Mutation | 🔒 Employee |
| **CustomerGroup** | `deleteCustomerGroup` | Mutation | 🔒 Employee |

## 🔑 Credentials de Test

```
👔 SuperAdmin  : superadmin@dima.com / admin123
👔 Employee    : staff@dima.com / employee123
👤 Customer    : customer@example.com / customer123
```

## 📁 Modules

| Module | README |
|--------|--------|
| Auth | [readme_auth.md](./core/auth/readme_auth.md) |
| Customer | [readme_customer.md](./features/customer/readme_customer.md) |
| CustomerGroup | [readme_customer-group.md](./features/customer-group/readme_customer-group.md) |
| Employee | [readme_employee.md](./features/employee/readme_employee.md) |
| Roles | [readme_roles.md](./features/employee/readme_roles.md) |
