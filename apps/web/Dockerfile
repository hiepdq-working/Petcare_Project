# Built from the repo root (see docker-compose.yml's `context: .`) —
# same reasoning as apps/api/Dockerfile: this is a pnpm workspace and the
# web app depends on @petcare/types and @petcare/constants.

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@12.5.1 --activate
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/constants/package.json packages/constants/package.json
RUN pnpm install --frozen-lockfile --filter @petcare/web --filter @petcare/types --filter @petcare/constants

FROM deps AS build
COPY packages/types packages/types
COPY packages/constants packages/constants
COPY apps/web apps/web
RUN pnpm --filter @petcare/types build
RUN pnpm --filter @petcare/constants build
# Vite inlines VITE_* vars at build time, not runtime — this has to be the
# origin the *browser* will call the API at (usually the host machine's
# mapped port), not an in-network Docker service name.
ARG VITE_API_URL=http://localhost:4000/api
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm --filter @petcare/web build

FROM nginx:1.27-alpine AS runtime
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
EXPOSE 80
