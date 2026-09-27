# Chess Openings

Plataforma para estudar aberturas de xadrez com repetição espaçada. Você vê a linha
comentada, joga-a de memória contra a máquina e revê no tempo certo (algoritmo SM-2).

## Stack

- **Monorepo:** Turborepo + pnpm workspaces
- **Frontend:** Next.js 16 (App Router) · React 19 · TypeScript · Zustand · Tailwind CSS v4 — porta **3000**
- **Backend:** NestJS 10 · Prisma 6 · PostgreSQL · Swagger — porta **3001**
- **Domínio compartilhado:** `@chess-openings/domain` (regras de negócio e tipos, sem framework)
- **Extras:** chess.js + chessground (tabuleiro) · Stockfish.js (engine no navegador) · Google Gemini (explicações) · WebSocket (feed ao vivo do Lichess)

## Funcionalidades

- Catálogo de aberturas com uma **trilha de lições**: cada lição mostra a linha comentada e
  depois pede que você a jogue de memória, com um botão de **dica** em dois níveis (a peça,
  depois o lance)
- **Repetição espaçada (SM-2):** erros e dicas viram a nota da revisão e o XP ganho — quem
  precisou de ajuda demais revê a linha no dia seguinte
- **Jogar contra o Stockfish** a partir de qualquer posição da lição, direto no navegador
  (Stockfish 19 lite em WebAssembly, num Web Worker — sem servidor)
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

# 3. Configure os .env (copie os .env.example de apps/api e apps/web)

# 4. Aplica as migrations  (use exec, NUNCA dlx — dlx baixa o Prisma 7 incompatível)
pnpm exec prisma migrate deploy

# 5. Popula contas de demonstração
pnpm db:seed

# 6. Sobe frontend + API juntos
pnpm dev:all
```

App em http://localhost:3000 · Swagger da API em http://localhost:3001/docs

### Variáveis de ambiente

Há um `.env.example` em `apps/api/` e em `apps/web/` — copie cada um para `.env` ao lado.

O `SESSION_SECRET` **precisa ser o mesmo** no frontend e na API (o cookie do Next
guarda o JWT emitido pela API).

> **Em produção não existe fallback.** Com `NODE_ENV=production`, a API se recusa a subir
> sem `DATABASE_URL` e `SESSION_SECRET`, e o seed se recusa a rodar sem
> `SEED_ADMIN_PASSWORD`. Fora de produção, valores de desenvolvimento são assumidos.

`.env` (raiz — Prisma CLI e seed):
```env
DATABASE_URL="postgresql://admin:password123@localhost:5432/chessopenings?schema=public"
```

`apps/api/.env`:
```env
DATABASE_URL="postgresql://admin:password123@localhost:5432/chessopenings?schema=public"
SESSION_SECRET="um-segredo-compartilhado"
WEB_ORIGIN="http://localhost:3000"   # origem liberada no CORS
GEMINI_API_KEY="..."   # necessário para importar estudos (explicações da IA)
PORT=3001
```

`apps/web/.env`:
```env
API_URL="http://localhost:3001/api"   # lida em runtime pelo servidor do Next (opcional em dev)
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
pnpm build                # compila tudo (o domínio compila antes de web/api)
pnpm lint
pnpm test                 # testes (Vitest no domínio/web, Jest + Supertest na API)
pnpm test:domain          # só o domínio — ciclo rápido para regra de negócio
pnpm db:migrate           # aplica as migrations (prisma migrate deploy)
pnpm db:seed              # recria as contas de demonstração
pnpm db:seed:reviews      # gera revisões SM-2 vencidas para o aluno demo
pnpm lessons:generate --source <estudo-lichess> --dry-run   # rascunho de lições com IA
```

### Geração de lições com IA (POC)

`tools/lesson-author` transforma um estudo da Lichess num rascunho anotado (comentários,
setas, "por que não", plano e cartões de treino), com cada afirmação conferida por engine,
explorer e chess.js. Você revisa na Lichess e importa com "Usar os comentários do estudo como
estão". Passo a passo em [`tools/lesson-author/README.md`](tools/lesson-author/README.md).

## Estrutura

```
chess-openings/
├── prisma/            # schema do banco (source of truth) + migrations + seeds
├── apps/
│   ├── web/           # frontend Next.js (porta 3000) — só apresentação
│   └── api/           # backend NestJS (porta 3001) — todo o backend
├── packages/
│   └── domain/        # núcleo de negócio: SM-2, use cases, ports, tipos compartilhados
├── docs/              # arquitetura, ADRs e análises
└── CLAUDE.md          # padrões do projeto (Clean Architecture, ports/adapters, convenções)
```

O projeto segue **Clean Architecture** com **CQRS-lite**: comandos passam por casos de uso do
domínio (que só conhece interfaces — as *ports*), e as leituras consultam o Prisma direto
devolvendo *read-models*. Detalhes em [`CLAUDE.md`](CLAUDE.md) e
[`docs/architecture.md`](docs/architecture.md).

### Rotas fora do ar de propósito

`/blunder` (Modo Punição) e `/style-quiz` estão **fora do escopo do TCC1** e respondem 404.
O código continua no repositório, em pastas privadas do App Router (`app/_blunder/`,
`app/_style-quiz/`) — o prefixo `_` remove a rota sem remover o código. Cada pasta tem um
`README.md` com o passo para reativá-la.

## Docker

As imagens de produção ficam em `apps/api/Dockerfile` e `apps/web/Dockerfile` (build a partir
da raiz do monorepo). Para rodar tudo em Docker, igual à produção:

```bash
docker compose --profile full up -d --build   # banco + API + web
```

Sem o profile, `docker compose up -d` sobe só o banco (fluxo de dev com `pnpm dev:all`).

## Deploy (Railway)

Três serviços: **Postgres** (banco da Railway), **api** e **web** (ambos por Dockerfile). A
configuração de cada serviço está em `apps/api/railway.json` e `apps/web/railway.json`
(Dockerfile, migrations no pre-deploy, healthcheck e watch paths).

| Serviço | Variáveis |
|---|---|
| `api` | `DATABASE_URL`, `SESSION_SECRET`, `WEB_ORIGIN` (URL do web), `GEMINI_API_KEY`, `PORT=3001` |
| `web` | `API_URL` (URL da API + `/api`), `SESSION_SECRET` (igual ao da api), `PORT=3000` |

- `NODE_ENV=production` já vem das imagens.
- As migrations rodam sozinhas antes de cada deploy da API (`pnpm db:migrate`).
- A API expõe `GET /api/health` (checa o banco), usado como healthcheck.
- Depois do primeiro deploy: rode `pnpm db:seed` com `SEED_ADMIN_PASSWORD` definido e importe
  os estudos em `/admin/import` — o catálogo nasce vazio.
