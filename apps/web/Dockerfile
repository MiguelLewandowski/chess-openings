# Build from the monorepo root:
#   docker build -f apps/web/Dockerfile -t chess-openings-web .
# Runtime variables: API_URL, SESSION_SECRET (see apps/web/.env.example). Nothing about the
# API address is baked in at build time, so one image serves any environment.
FROM node:20-alpine AS base
# The root postinstall runs `prisma generate`, which looks for OpenSSL even though the web
# app never talks to the database.
RUN apk add --no-cache openssl
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
# Same reason: the offline lesson-author tool is a workspace member too.
COPY tools/lesson-author/package.json ./tools/lesson-author/package.json
COPY apps/web ./apps/web
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @chess-openings/domain build
RUN pnpm --filter @chess-openings/web build

FROM node:20-alpine AS runner
WORKDIR /repo
ENV NODE_ENV=production
# `output: standalone` produces a minimal server plus the traced dependencies; static/ is
# not included in it and must be copied alongside, and so is public/ (the in-browser
# Stockfish, copied there by the build script).
COPY --from=builder /repo/apps/web/.next/standalone ./
COPY --from=builder /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /repo/apps/web/public ./apps/web/public
EXPOSE 3000
# The platform may override PORT; HOSTNAME makes the server listen on every interface
# instead of only the container's loopback.
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "apps/web/server.js"]
