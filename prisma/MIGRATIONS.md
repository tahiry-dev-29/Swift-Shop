# 🗺️ Prisma Migrations & DevOps Guide

This document outlines the workflows for managing, squashing, and rolling back Prisma migrations in this workspace.

---

## 🛠️ 1. Applying Migrations

### Local Development

To create and apply a migration locally:

```bash
dotenv -e .env.local -- bunx prisma migrate dev --name <migration_name>
```

### Production / Docker Environment

To apply migrations safely in production without dev dependencies:

```bash
dotenv -e .env.production -- bunx prisma migrate deploy
```

---

## 💥 2. Rollback Strategy

When a migration fails or must be reverted:

1. **Local Dev Revert**:
   - Revert the schema changes in `schema.prisma`.
   - Recreate the migration state:
     ```bash
     dotenv -e .env.local -- bunx prisma migrate dev
     ```
     Prisma will detect the drift and ask to reset the database.

2. **Production Failures (Marking as Rolled Back)**:
   If a migration failed midway in production, mark it as rolled back to allow deploying subsequent migrations:
   ```bash
   dotenv -e .env.production -- bunx prisma migrate resolve --rolled-back <failed_migration_name>
   ```
   _Note: You must manually run the undo SQL statements on the production database to clean up the partially applied changes._

---

## 📐 3. Squashing Migrations

To avoid having hundreds of small migration files, you can squash them:

1. **Backup database and migrations**:
   Ensure you have copies of all data and scripts.
2. **Clear migrations folder**:
   ```bash
   rm -rf prisma/migrations/*
   ```
3. **Generate baseline migration**:
   Create a single baseline migration representing the current state of `schema.prisma`:
   ```bash
   dotenv -e .env.local -- bunx prisma migrate dev --name baseline --create-only
   ```
4. **Mark baseline as applied** in database without executing:
   ```bash
   dotenv -e .env.local -- bunx prisma migrate resolve --applied baseline
   ```

---

## ⚡ 4. Nx Affected Optimizations

In the CI/CD pipelines, we optimize execution speed by only linting, testing, and building components that changed:

- **Lint Affected**:
  ```bash
  bunx nx affected --target=lint --base=origin/main
  ```
- **Test Affected**:
  ```bash
  bunx nx affected --target=test --base=origin/main
  ```
- **Build Affected**:
  ```bash
  bunx nx affected --target=build --base=origin/main
  ```
