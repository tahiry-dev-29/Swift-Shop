FROM node:22-alpine AS workspace

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

# Allow required build scripts in Docker
RUN printf '%s\n' \
  'onlyBuiltDependencies[]=@prisma/engines' \
  'onlyBuiltDependencies[]=prisma' \
  'onlyBuiltDependencies[]=sharp' \
  'onlyBuiltDependencies[]=esbuild' \
  'onlyBuiltDependencies[]=@swc/core' \
  'onlyBuiltDependencies[]=nx' \
  'onlyBuiltDependencies[]=argon2' \
  > .npmrc

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json prisma.config.ts ./
COPY apps ./apps
COPY libs ./libs
COPY models ./models
COPY prisma ./prisma
COPY tools ./tools

RUN pnpm install --frozen-lockfile

FROM workspace AS api-build

# Prisma 7 requires DATABASE_URL to load config — dummy value is fine for generate
ARG DATABASE_URL=postgresql://localhost:5432/placeholder?schema=public
ENV DATABASE_URL=$DATABASE_URL

RUN pnpm exec prisma generate && pnpm exec nx build api

FROM oven/bun:1-alpine AS frontend-dev

WORKDIR /app

# Node removed - Bun runtime provides node compatibility

ENV NODE_ENV=development

COPY --from=workspace /app ./

EXPOSE 4200 4201

FROM frontend-dev AS store

CMD ["bunx", "nx", "run", "store:serve:development", "--host=0.0.0.0", "--port=4200"]

FROM frontend-dev AS admin

CMD ["bunx", "nx", "run", "admin:serve:development", "--host=0.0.0.0", "--port=4201"]

FROM frontend-dev AS prisma-studio

EXPOSE 5555

CMD ["bunx", "prisma", "studio", "--port", "5555", "--browser", "none"]

FROM oven/bun:1-alpine AS api

WORKDIR /app

# Node removed - Bun runtime provides node compatibility

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=api-build /app/node_modules ./node_modules
COPY --from=api-build /app/package.json ./package.json
COPY --from=api-build /app/prisma.config.ts ./prisma.config.ts
COPY --from=api-build /app/prisma ./prisma
COPY --from=api-build /app/dist/apps/api ./dist/apps/api

EXPOSE 3000

RUN chown -R bun:bun /app/dist /app/prisma /app/prisma.config.ts

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/graphql || exit 1

USER bun

CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && bun dist/apps/api/main.js"]
