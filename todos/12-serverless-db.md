# 🗺️ Feature / Sprint Plan: Migration DB Serverless (Neon)

**Sprint / Reference**: 12-serverless-db
**Date**: 2026-07-14
**Status**: 📝 Draft

---

## 🎯 1. Objective & Scope

Remplacer PostgreSQL local (Docker) par **Neon** (serverless PostgreSQL) pour **tous les environnements** : dev, staging, prod.

- **Scope:**
  - [ ] Compte Neon + projet + branches (main, staging, dev)
  - [ ] Connection pooling PGBouncer activé
  - [ ] Remplacer `@prisma/adapter-pg` → `@prisma/adapter-neon`
  - [ ] Remplacer `pg.Pool` → `Pool` de `@neondatabase/serverless`
  - [ ] Supprimer PostgreSQL de Docker Compose (ou profil optionnel)
  - [ ] Seed script compatible Neon
  - [ ] `.env.neon` template

---

## 🏗️ 2. Architectural Sketch

### Changement adaptateur

```
AVANT (local + Docker)                   APRÈS (Neon full remote)
─────────────────────────────────────    ──────────────────────────────────────────
PrismaService                            PrismaService
  └─ @prisma/adapter-pg                    └─ @prisma/adapter-neon   🔄 CHANGE
  └─ Pool from pg                          └─ Pool from @neondatabase/serverless 🔄
       │                                        │
  DATABASE_URL                              DATABASE_URL
  postgresql://localhost:5442/dima_new      postgresql://ep-xxx.us-east-1.aws.neon.tech
```

### Infrastructure

```
┌─────────────────────  NEON  ─────────────────────┐
│                                                   │
│  Branche: main      ─── Prod   (pooled URL)       │
│  Branche: staging   ─── Staging (pooled URL)      │
│  Branche: dev-xxx   ─── Dev     (pooled URL)      │
│                                                   │
│  PGBouncer activé sur chaque branche              │
│  Point-in-time recovery disponible                │
│                                                   │
└───────────────────────────────────────────────────┘
                          │
                    DATABASE_URL
                          │
              ┌───────────┴───────────┐
              │                       │
          API (NestJS)           Seed / Migrations
          PrismaService           `prisma migrate deploy`
          @prisma/adapter-neon    `prisma db seed`
```

---

## 🔧 3. Task Breakdown

### Étape 1 — Login & Setup Neon CLI

- [ ] `npm install -g @neondatabase/cli` ou `pnpm add -g @neondatabase/cli`
- [ ] `neonctl auth` — login interactif browser
- [ ] Configurer le token API pour usage headless :
      `bash
      neonctl auth --token
  # export NEON_API_KEY=<token>
  `

### Étape 2 — Projet & Branches

- [ ] Créer le projet :
      `bash
neonctl projects create --name swift-shop --region aws-eu-west-3
`
- [ ] Créer la branche `staging` :
      `bash
neonctl branches create --name staging
`
- [ ] Lier API key à un fichier `.env.neon` :
      `env
NEON_API_KEY="<token>"
NEON_PROJECT_ID="<project-id>"
`

### Étape 3 — Connection Strings

- [ ] Récupérer les pooled URLs avec PGBouncer :
      `bash
neonctl connection-string --branch main --pooled    # main
neonctl connection-string --branch staging --pooled # staging
`
- [ ] Stocker dans `.env.neon` :
      `env
NEON_DATABASE_URL_MAIN="postgresql://..."
NEON_DATABASE_URL_STAGING="postgresql://..."
`
- [ ] Copier l'URL `main` dans `.env.local` en tant que `DATABASE_URL`
- [ ] Copier l'URL `main` dans `.env.production` en tant que `DATABASE_URL`

### Étape 4 — Packages

- [ ] `pnpm add @prisma/adapter-neon @neondatabase/serverless`
- [ ] `pnpm remove @prisma/adapter-pg` (si plus utilisé ailleurs)

### Étape 5 — Modifier PrismaService

- [ ] `libs/data-access-prisma/src/lib/prisma.service.ts`:
      `typescript
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool } from '@neondatabase/serverless';
`
- [ ] Simplifier/supprimer `enableShutdownHooks` (connexions éphémères, plus besoin de `pool.end()` sur SIGTERM)

### Étape 6 — Modifier Seed

- [ ] `prisma/seed.ts`: remplacer `PrismaPg` + `pg.Pool` par `PrismaNeon` + `Pool` de `@neondatabase/serverless`

### Étape 7 — Docker Compose

- [ ] Supprimer le service `postgres` (plus besoin)
- [ ] Ou ajouter `profiles: [local-db]` pour garder PostgreSQL accessible

### Étape 8 — Migration & Seed

- [ ] `bunx prisma migrate deploy` sur branche `main` Neon
- [ ] `bunx prisma db seed`
- [ ] Vérifier avec Prisma Studio (`bunx prisma studio`)

### Étape 9 — Webpack (si applicable)

- [ ] Vérifier `apps/api/webpack.config.js`: remplacer `externals` de `@prisma/adapter-pg` par `@prisma/adapter-neon` et `@neondatabase/serverless`

### Étape 10 — Documentation

- [ ] Ajouter section Neon dans README (création branche, seed, promote)
- [ ] Procédure rollback (point-in-time restore Neon)

---

## 📖 4. Configuration Files Summary

| Fichier                                             | Changement                                                                 |
| --------------------------------------------------- | -------------------------------------------------------------------------- |
| `libs/data-access-prisma/src/lib/prisma.service.ts` | `adapter-pg` → `adapter-neon`, `pg.Pool` → `@neondatabase/serverless`      |
| `prisma/seed.ts`                                    | Idem                                                                       |
| `apps/api/webpack.config.js`                        | Màj des `externals`                                                        |
| `prisma/schema.prisma`                              | Aucun                                                                      |
| `prisma.config.ts`                                  | Aucun                                                                      |
| `.env.neon`                                         | **Nouveau**                                                                |
| `.env.local`                                        | `DATABASE_URL` → URL Neon poolée                                           |
| `.env.production`                                   | `DATABASE_URL` → URL Neon poolée                                           |
| `docker-compose.yml`                                | Suppression ou profilage de `postgres`                                     |
| `package.json`                                      | `@prisma/adapter-pg` → `@prisma/adapter-neon` + `@neondatabase/serverless` |
| `todos/todos.md`                                    | Ajout lien vers `12-serverless-db.md`                                      |

---

## ✅ 5. Vérification

1. `bunx prisma validate` → OK
2. `bunx prisma migrate deploy` → migrations sur Neon
3. `pnpm exec nx build api` → build réussi
4. API démarre sans Docker PostgreSQL, répond sur GraphQL
5. `bunx prisma studio` → données visibles
