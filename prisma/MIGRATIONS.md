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
   If a migration failed midway in production:
   1. Manually run the undo SQL statements on the production database to revert the partially applied changes.
   2. Mark the migration as rolled back so subsequent deployments can proceed:
      ```bash
      dotenv -e .env.production -- bunx prisma migrate resolve --rolled-back <failed_migration_name>
      ```
      _`migrate resolve` only updates the migration history — the database must already be in the correct state before running it._

---

## 📐 3. Squashing Migrations

To avoid having hundreds of small migration files, you can squash them:

1. **Backup database and migrations**:
   Ensure you have copies of all data and scripts.
2. **Clear migrations folder**:
   ```bash
   rm -rf prisma/migrations/*
   ```
3. **Generate baseline migration SQL**:
   Create a single baseline migration representing the current schema state:
   ```bash
   dotenv -e .env.production -- bunx prisma migrate diff \
     --from-empty \
     --to-schema ./prisma/schema.prisma \
     --script > prisma/migrations/000000000000_baseline/migration.sql
   ```
4. **Commit the baseline migration** to version control.
5. **Mark baseline as applied** on the production database without executing it:
   ```bash
   dotenv -e .env.production -- bunx prisma migrate resolve --applied 000000000000_baseline
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
