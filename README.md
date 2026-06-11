# 🚀 Dima New - Full-Stack E-commerce Monorepo

Welcome to **Dima New**! A modern, high-performance monorepo architecture for a full-scale e-commerce platform. 🌟

## 🏗️ Project Structure

This workspace is managed with **Nx** and uses a modular architecture:

- **apps/store**: Customer-facing Angular 21 application. 🛒
- **apps/admin**: Internal administration dashboard (Angular 21). ⚙️
- **apps/api**: NestJS 11 backend with GraphQL (Apollo). 🧠
- **libs/**: Shared features, business logic, and data access.
- **models/**: Shared TypeScript types and interfaces.

## 🛠️ Tech Stack

- **Runtime**: [Bun](https://bun.sh) ⚡
- **Monorepo**: [Nx](https://nx.dev) 🚀
- **Frontend**: Angular 21 (Signals, Standalone), TailwindCSS 4, PrimeNG 20 🎨
- **Backend**: NestJS 11, GraphQL (Apollo), Prisma 7 💾
- **Database**: PostgreSQL 🐘
- **Testing**: Vitest & Bun Test 🧪

## 🚀 Getting Started

### 1. Install Dependencies

```bash
bun install
```

### 2. Database Setup

Make sure your `.env` is configured with your PostgreSQL credentials.

```bash
bun run prisma:generate
bun run prisma:seed
```

### 3. Run Applications

| Application        | Command               | URL                             |
| ------------------ | --------------------- | ------------------------------- |
| **All (Parallel)** | `bun run start:all`   | -                               |
| **Store**          | `bun run start:store` | `http://localhost:4200`         |
| **Admin**          | `bun run start:admin` | `http://localhost:4201`         |
| **API**            | `bun run start:api`   | `http://localhost:3000/graphql` |

## 📘 Documentation

- **[Backend API & GraphQL](./libs/backend/readme_api.md)** - Modules & GraphQL Schema 🧠
- **[Catalog & Products](./libs/backend/features/catalog/readme_products.md)** - Product management 📦
- **[Auth System](./libs/backend/core/auth/readme_auth.md)** - JWT & Argon2 Security 🔐
- **[Customer Module](./libs/backend/features/customer/readme_customer.md)** - User management 👥

## 🧪 Testing & Tools

- **[Interactive API Tester](./tools/testing/api-tester.html)** - Try GraphQL in your browser! 🧪
- **[API Testing Scripts](./tools/scripts/test-api.mjs)** - Automated test suite 🤖
  ```bash
  bun tools/scripts/run-all.mjs
  ```

---

Built with ❤️ by Senior Architects. English code, human spirit. 🚀
