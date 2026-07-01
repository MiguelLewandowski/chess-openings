# Chess Openings

Plataforma para estudar aberturas de xadrez com repetição espaçada. Você aprende a
teoria, pratica os lances contra a máquina e revê no tempo certo (algoritmo SM-2).

## Stack

- **Monorepo:** Turborepo + pnpm workspaces
- **Frontend:** Next.js 16 (App Router) · React 19 · TypeScript · Zustand · Tailwind CSS v4 — porta **3000**
- **Backend:** NestJS 10 · Prisma 6 · PostgreSQL · Swagger — porta **3001**
- **Domínio compartilhado:** `@chess-openings/domain` (regras de negócio e tipos, sem framework)
- **Extras:** chess.js + chessground (tabuleiro) · Google Gemini (explicações) · WebSocket (feed ao vivo do Lichess)

## Funcionalidades

- Catálogo de aberturas e lições, com modos **Teoria** e **Prática**
- **Repetição espaçada (SM-2):** agenda as revisões conforme o desempenho
- **Autenticação** JWT com papéis (`STUDENT` / `ADMIN`)
- **Importação de estudos** do Lichess (admin) — gera as lições automaticamente
- **Feed ao vivo** das partidas em destaque do Lichess via WebSocket (`/live`)

## Pré-requisitos

- Node.js 18+ · pnpm · Docker

## Como rodar

```bash
# 1. Sobe o PostgreSQL
docker compose up -d

# 2. Instala as dependências (gera o Prisma Client automaticamente)
pnpm install

# 3. Configure os .env (ver abaixo)

# 4. Aplica as migrations  (use exec, NUNCA dlx — dlx baixa o Prisma 7 incompatível)
pnpm exec prisma migrate dev

# 5. Popula contas de demonstração
pnpm db:seed

# 6. Sobe frontend + API juntos
pnpm dev:all
```

App em http://localhost:3000 · Swagger da API em http://localhost:3001/docs

### Variáveis de ambiente

O `SESSION_SECRET` **precisa ser o mesmo** no frontend e na API (o cookie do Next
guarda o JWT emitido pela API).

`.env` (raiz — Prisma CLI e seed):
```env
DATABASE_URL="postgresql://admin:password123@localhost:5432/chessopenings?schema=public"
```

`apps/api/.env`:
```env
DATABASE_URL="postgresql://admin:password123@localhost:5432/chessopenings?schema=public"
SESSION_SECRET="um-segredo-compartilhado"
GEMINI_API_KEY="..."   # necessário para importar estudos (explicações da IA)
PORT=3001
```

`apps/web/.env`:
```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
SESSION_SECRET="um-segredo-compartilhado"
```

## Contas de demonstração

Criadas pelo `pnpm db:seed`:

| Papel   | Email             | Senha      |
|---------|-------------------|------------|
| ADMIN   | `admin@chess.dev` | `admin123` |
| STUDENT | `aluno@chess.dev` | `aluno123` |

Use a conta **admin** para importar estudos em `/admin/import`.

## Comandos úteis

```bash
pnpm dev:all              # frontend + API
pnpm dev                  # só o frontend
pnpm dev:api              # só a API
pnpm test                 # testes (Vitest no domínio/web, Jest na API)
pnpm db:seed              # recria as contas de demonstração
pnpm make-admin <email>   # promove um usuário a ADMIN
```

## Estrutura

```
chess-openings/
├── prisma/            # schema do banco (source of truth) + seed
├── apps/
│   ├── web/           # frontend Next.js (porta 3000)
│   └── api/           # backend NestJS (porta 3001)
└── packages/
    └── domain/        # núcleo de negócio: SM-2, use cases, tipos compartilhados
```

> Modo Punição (`/blunder`) é opcional e usa puzzles do Lichess — importe com
> `pnpm import-puzzles` se quiser ativá-lo.
