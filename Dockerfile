FROM node:22-alpine AS workspace

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json prisma.config.ts ./
COPY apps ./apps
COPY libs ./libs
COPY models ./models
COPY prisma ./prisma
COPY shared ./shared
COPY tools ./tools

RUN pnpm install --frozen-lockfile

FROM workspace AS api-build

ENV DATABASE_URL="postgresql://tahiry:tahiry4534@postgres:5432/dima_new?schema=public"

RUN pnpm exec prisma generate
RUN pnpm exec nx build api

FROM oven/bun:1-alpine AS frontend-dev

WORKDIR /app

RUN apk add --no-cache nodejs

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

RUN apk add --no-cache nodejs

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=api-build /app/node_modules ./node_modules
COPY --from=api-build /app/package.json ./package.json
COPY --from=api-build /app/prisma.config.ts ./prisma.config.ts
COPY --from=api-build /app/prisma ./prisma
COPY --from=api-build /app/dist/apps/api ./dist/apps/api

EXPOSE 3000

CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && bun dist/apps/api/main.js"]
