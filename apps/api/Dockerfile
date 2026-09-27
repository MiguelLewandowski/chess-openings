# Build from the monorepo root:
#   docker build -f apps/api/Dockerfile -t chess-openings-api .
FROM node:20-alpine AS base
# Prisma's query engine links against OpenSSL, which the Alpine image does not ship. It must
# be present before `pnpm install`, whose postinstall runs `prisma generate` and picks the
# engine build that matches the libssl it finds.
RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate
WORKDIR /repo

FROM base AS builder
# Workspace manifests + lockfile first (better layer caching)
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json ./
COPY prisma ./prisma
COPY packages ./packages
# apps/web manifest is required by --frozen-lockfile (workspace member), but its source is not needed for the API build
COPY apps/web/package.json ./apps/web/package.json
# Same reason: the offline lesson-author tool is a workspace member too.
COPY tools/lesson-author/package.json ./tools/lesson-author/package.json
COPY apps/api ./apps/api
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @chess-openings/domain build
RUN pnpm --filter @chess-openings/api build

FROM base AS runner
ENV NODE_ENV=production
# The root manifests let `pnpm db:migrate` (the platform's pre-deploy command) and
# `pnpm db:seed` run inside this image; the Prisma CLI and tsx they call come with the
# root node_modules.
COPY --from=builder /repo/package.json /repo/pnpm-workspace.yaml ./
COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/packages ./packages
COPY --from=builder /repo/prisma ./prisma
COPY --from=builder /repo/apps/api/package.json ./apps/api/package.json
COPY --from=builder /repo/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /repo/apps/api/dist ./apps/api/dist
EXPOSE 3001
CMD ["node", "apps/api/dist/main"]
