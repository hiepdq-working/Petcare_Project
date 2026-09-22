# Built from the repo root (see docker-compose.yml's `context: .`) because
# this is a pnpm workspace — the API depends on @petcare/types, which has
# to be installed/built alongside it, not copied in isolation.

FROM node:20-alpine AS base
# Prisma's schema/query engines are native binaries linked against
# OpenSSL — without it, `prisma generate`/`migrate deploy` fail at
# runtime with an opaque "Could not parse schema engine response"
# rather than a clear "openssl not found".
RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@12.5.1 --activate
WORKDIR /repo

# ---- deps: install once, keyed only on lockfile + package.json files ----
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/types/package.json packages/types/package.json
RUN pnpm install --frozen-lockfile --filter @petcare/api --filter @petcare/types

# ---- build: compile the shared package, generate Prisma client, build Nest ----
FROM deps AS build
COPY packages/types packages/types
COPY apps/api apps/api
RUN pnpm --filter @petcare/types build
RUN pnpm --filter @petcare/api prisma:generate
RUN pnpm --filter @petcare/api build
# The seed script is TS but ts-node isn't shipped in the runtime image —
# compile it once here so `node prisma/seed.js` works at container runtime
# (see docker-compose.yml / docs/LOGIN_GUIDE.md for how it's actually run).
RUN cd apps/api && npx tsc prisma/seed.ts --outDir prisma --module commonjs \
    --target es2022 --moduleResolution node --esModuleInterop --skipLibCheck --resolveJsonModule

# ---- runtime: only what's needed to run the compiled server ----
FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /repo
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /repo/packages/types ./packages/types
COPY --from=build /repo/apps/api/dist ./apps/api/dist
COPY --from=build /repo/apps/api/prisma ./apps/api/prisma
COPY --from=build /repo/apps/api/package.json ./apps/api/package.json

WORKDIR /repo/apps/api
EXPOSE 4000
# Applies any migrations not yet on the DB, then starts the server — safe
# to run on every container start (a no-op once the DB is up to date).
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
