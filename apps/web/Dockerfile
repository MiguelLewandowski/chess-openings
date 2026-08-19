# Build from the monorepo root:
#   docker build -f apps/web/Dockerfile --build-arg NEXT_PUBLIC_API_URL=https://api.example/api -t chess-openings-web .
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate
WORKDIR /repo

FROM base AS builder
# Workspace manifests + lockfile first (better layer caching)
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json ./
COPY prisma ./prisma
COPY packages ./packages
# apps/api manifest is required by --frozen-lockfile (workspace member), but its source is
# not needed to build the web app
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web ./apps/web
RUN pnpm install --frozen-lockfile

# NEXT_PUBLIC_* is inlined into the client bundle at build time, not read at runtime, so it
# has to be present here. Passing it only as a runtime env var leaves the browser pointing
# at localhost:3001 in production.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN pnpm --filter @chess-openings/domain build
RUN pnpm --filter @chess-openings/web build

FROM base AS runner
ENV NODE_ENV=production
# `output: standalone` produces a minimal server plus the traced dependencies; static/ is
# not included in it and must be copied alongside. There is no public/ directory in this
# app — add a COPY for it if one is ever created.
COPY --from=builder /repo/apps/web/.next/standalone ./
COPY --from=builder /repo/apps/web/.next/static ./apps/web/.next/static
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "apps/web/server.js"]
