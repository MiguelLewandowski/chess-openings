<div align="center">
  <h1>Chess Openings</h1>
  <p><strong>O Treinador de Aberturas de Xadrez Pragmático & Inteligente</strong></p>
  <p><em>Aprende uma linha, pratica contra a máquina e sê punido se esqueceres. Tudo guiado pelo Mestre Gambito.</em></p>

  <p align="center">
    <img src="https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js" alt="Next.js 15" />
    <img src="https://img.shields.io/badge/NestJS-10-E0234E?style=flat-square&logo=nestjs" alt="NestJS 10" />
    <img src="https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma" alt="Prisma" />
    <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat-square&logo=postgresql" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker" alt="Docker" />
  </p>
</div>

<br />

## O Que é o Chess Openings?

O **Chess Openings** não é mais um tabuleiro de xadrez online. É um **treinador focado exclusivamente em aberturas**, desenhado para combater a "amnésia de xadrez" e o estudo passivo.

Inspirado no modelo de retenção do Duolingo e no rigor dos clubes de xadrez clássicos, o Chess Openings fecha o loop de aprendizagem em três fases:

1. **Teoria:** O tabuleiro move as peças automaticamente enquanto o *Mestre Gambito* explica o "porquê" estratégico de cada lance — sem vídeos longos, sem setas confusas.
2. **Prática:** Tu repetes a linha. Se jogares um lance fora do repertório, o Mestre Gambito reconhece o teu lance mas reconduz-te ao objetivo. Se jogares uma asneira real, receberes um puzzle de punição.
3. **Retenção:** Um algoritmo **SM-2** (Spaced Repetition System) agenda automaticamente as tuas revisões com base no teu desempenho — sem esforço manual.

---

## Funcionalidades do MVP

### 1. Catálogo de Aberturas

O ponto de entrada da plataforma. O utilizador vê a lista de aberturas disponíveis, cada uma com as suas lições organizadas por ordem. O progresso SM-2 de cada lição é visível diretamente no catálogo — o utilizador sabe sempre o que está em atraso e o que foi dominado.

* Navegação por `/openings` com cards por abertura.
* Detalhe por abertura em `/openings/[slug]` com a sequência de lições e o estado de cada uma (nova, em progresso, dominada).
* Componente **DueToday** na página inicial: lista das revisões SM-2 pendentes para o dia.

### 2. Núcleo de Treinamento (Game Loop)

O coração da plataforma. Cada lição em `/lessons/[lessonId]` tem dois modos que o utilizador pode alternar:

**Modo Teoria (Playback)**
O tabuleiro reproduz automaticamente a linha da abertura, lance a lance. A cada movimento, o *Mestre Gambito* apresenta um *card* com a explicação estratégica — pressão em casas-chave, ameaças imediatas, ideias típicas de médio-jogo. O ritmo é controlado pelo utilizador (botão "Próximo").

**Modo Prática (Active Recall)**
O tabuleiro para e o utilizador tem de jogar. O sistema valida o lance usando `chess.js`:
* **Lance correto:** avança para o próximo.
* **Lance válido mas fora da linha:** o Mestre Gambito reconhece ("Boa ideia, mas hoje queremos...") e redireciona.
* **Lance errado (blunder):** o sistema joga uma "capivara" — a continuação mais comum e punitiva do adversário. O utilizador tem de encontrar a punição imediata. Este é o **Modo Punição**.

O componente **ModeToggle** permite ao utilizador alternar entre Teoria e Prática a qualquer momento da lição, sem perder o progresso.

### 3. Modo Punição (Blunder Training)

Disponível em `/blunder`. Usa puzzles de abertura reais da base de dados do Lichess (~4 M puzzles), filtrados pelas aberturas do repertório do utilizador e pelo rating configurado.

O **BlunderTrainer** apresenta uma posição após um erro comum e o utilizador tem de encontrar a melhor resposta. Integrado com o SM-2: um puzzle falhado volta mais cedo; um resolvido facilmente aguarda mais tempo.

### 4. O Mestre Gambito (Motor de IA Pedagógica)

O Mestre Gambito não é um chatbot genérico. A sua voz e os seus comentários são produzidos por uma **arquitetura híbrida Human-in-the-loop**:

1. **Curadoria Humana:** O autor (Mestre Nacional) cria *Studies* no Lichess e anota cada lance com palavras-chave estratégicas curtas (ex: *"pressão f7"*, *"controlo do centro"*).
2. **IA como Ghostwriter:** O pipeline de ingestão consome o PGN do Lichess e usa o `gemini-2.0-flash-lite` estritamente como expansor de texto. A IA não inventa xadrez — ela expande as notas curtas numa narrativa envolvente com a voz do Mestre Gambito.

Esta abordagem elimina as alucinações táticas comuns em LLMs (casas controladas inventadas, defesas inexistentes) e garante conteúdo de qualidade GM.

O **Dicionário de Erros** mapeia os lances intuitivos mas errados mais comuns para cada posição, com respostas específicas — o utilizador nunca fica "travado" sem perceber o motivo.

### 5. Retenção (Spaced Repetition SM-2)

Implementado no pacote `@chess-openings/domain`, o algoritmo SM-2 atualiza três parâmetros por cada submissão:

* `easinessFactor` — facilidade percebida da lição (0–5).
* `interval` — dias até à próxima revisão.
* `repetitions` — contador de repetições consecutivas corretas.

O utilizador avalia o seu desempenho após cada lição (escala de qualidade). O sistema usa essa avaliação para recalcular a data da próxima revisão: acertar facilmente → revisão em dias; errar → revisão amanhã.

O componente **ProgressTracker** exibe o estado SM-2 em tempo real durante a lição: próxima revisão, intervalo atual e histórico de qualidade.

### 6. Gamificação e Perfil

* **XP:** Experiência ganha por cada lição concluída.
* **Streak:** Contador de dias consecutivos de estudo.
* **Arquétipos de Jogo:** O *style-quiz* em `/style-quiz` determina o estilo do utilizador (ex: *"Atacante Tático"*, *"Sólido Posicional"*, *"Equilibrista Estratégico"*). O arquétipo influencia os comentários do Mestre Gambito e poderá ordenar o catálogo de aberturas por adequação de estilo.

### 7. Autenticação e Perfil

* Registo e login em `/register` e `/login` via JWT emitido pela API NestJS.
* Sessão mantida por cookie no Next.js (`session.ts`).
* Roles: `STUDENT` (padrão), `TEACHER` e `ADMIN` (acesso à importação de estudos).

### 8. Painel de Administração e Pipeline de Conteúdo

Acessível em `/admin/import` por utilizadores com role `ADMIN`. Cola o URL de um estudo público do Lichess e o sistema:
1. Faz o download do PGN via API do Lichess.
2. Parseia os capítulos e as anotações (PGN Parser).
3. Envia as anotações ao Gemini para expansão narrativa (voz do Mestre Gambito).
4. Persiste a abertura, as lições e os exercícios na base de dados via NestJS.

---

## Arquitetura e Tech Stack

O Chess Openings foi construído com foco em **Clean Code, YAGNI, KISS e SOLID**.

### Tech Stack Principal

* **Monorepo:** [Turborepo](https://turbo.build/) + pnpm workspaces
* **Frontend:** [Next.js 15](https://nextjs.org/) (App Router) — porta **3000**
* **Backend (API):** [NestJS 10](https://nestjs.com/) + Swagger/OpenAPI — porta **3001**
* **Domínio Partilhado:** `@chess-openings/domain` (entidades, casos de uso, interfaces — sem dependência de framework, testável em isolamento)
* **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
* **Gestão de Estado Global:** [Zustand](https://github.com/pmndrs/zustand) (`GameStore` — estado do tabuleiro, modo de jogo, progresso da lição)
* **ORM:** [Prisma 6](https://www.prisma.io/)
* **Base de Dados:** [PostgreSQL](https://www.postgresql.org/) (via Docker)
* **Lógica de Xadrez:** `chess.js` (validação SAN/FEN, geração de lances legais) + `chessground` (UI interativa SVG do tabuleiro)
* **IA:** Google Gemini (`gemini-2.0-flash-lite`) — apenas para expansão narrativa no pipeline de ingestão

> **Fluxo de dados:** o **Next.js comunica exclusivamente com a API NestJS** via `src/lib/api-client.ts` (cliente HTTP tipado). Todo o acesso à base de dados (auth, openings, lições, progresso SM-2, ingestão, puzzles) passa pelo NestJS. O Next.js mantém apenas Server Components, estado de UI (Zustand) e sessão por cookie. O `@chess-openings/domain` é partilhado pelos dois.

### Estrutura do Monorepo

```text
chess-openings/
├── prisma/                        # Schema da BD (schema.prisma) — source of truth
├── scripts/
│   └── import-puzzles.ts          # Importação de puzzles do Lichess (Modo Punição)
├── apps/
│   ├── web/                       # Frontend Next.js 15 (porta 3000)
│   │   └── src/
│   │       ├── app/               # App Router
│   │       │   ├── openings/      # Catálogo e detalhe de abertura
│   │       │   ├── lessons/       # Game loop (teoria + prática)
│   │       │   ├── blunder/       # Modo Punição
│   │       │   ├── style-quiz/    # Quiz de arquétipo
│   │       │   ├── admin/         # Importação de estudos (ADMIN)
│   │       │   ├── login/         # Autenticação
│   │       │   ├── register/
│   │       │   └── actions/       # Server Actions (auth, openings, progress, ingest)
│   │       ├── components/
│   │       │   ├── chess/         # Board, ModeToggle, ProgressTracker, CoachConsole,
│   │       │   │                  # BlunderTrainer, GameInitializer, DemoSection
│   │       │   └── ui/            # Biblioteca de UI reutilizável: Button, Card,
│   │       │                      # Badge, EmptyState, StatusPill
│   │       ├── hooks/             # useOpponentReveal (lógica de reveal do adversário)
│   │       ├── store/             # GameStore (Zustand — estado global de UI)
│   │       └── lib/
│   │           ├── api-client.ts  # Cliente HTTP tipado para a API NestJS
│   │           ├── session.ts     # Sessão por cookie (JWT da API)
│   │           ├── archetypes.ts  # Definições e mapeamento de arquétipos
│   │           ├── board-shapes.ts# Formas SVG para anotações do tabuleiro
│   │           ├── chess.ts       # Helpers de lógica chess.js
│   │           ├── coach-message.ts # Geração de mensagens do Mestre Gambito
│   │           ├── cn.ts          # Utilitário de class merging (clsx + twMerge)
│   │           └── timing.ts      # Helpers de temporização (playback)
│   └── api/                       # Backend NestJS 10 (porta 3001)
│       ├── src/
│       │   ├── modules/           # auth, opening, lesson, progress, ingestor, move, puzzle
│       │   ├── common/            # Guards, pipes, interceptors, decorators partilhados
│       │   └── infrastructure/    # PrismaService, repositórios, services (Lichess, engine, coach)
│       └── test/                  # Testes de integração e2e (Jest + Supertest)
└── packages/
    └── domain/                    # @chess-openings/domain — entidades, use-cases, SM-2
```

---

## Design e Sensação (UX)

O Chess Openings foca-se numa estética **"Elegant Classic Chess Club"**:

* **Cores:** Creme, Verde Floresta e Madeira.
* **Som:** Feedback sonoro de peças de madeira de alta qualidade para lances e capturas.
* **Foco:** Zero distrações visuais. O tabuleiro e o Mestre Gambito são o centro da experiência.

---

## Importar Puzzles (Modo Punição)

O Modo Punição usa puzzles de abertura reais da base de dados do Lichess. Este passo é opcional — só necessário para activar a rota `/blunder`.

### Setup (uma vez)

**1. Descarregar o CSV (~350 MB comprimido):**

```powershell
# Windows PowerShell — usa curl.exe (curl sozinho é alias do Invoke-WebRequest)
curl.exe -L "https://database.lichess.org/lichess_db_puzzle.csv.zst" -o puzzles.csv.zst
```

```bash
# Linux / macOS
curl -L "https://database.lichess.org/lichess_db_puzzle.csv.zst" -o puzzles.csv.zst
```

**2. Instalar o zstd e descomprimir (~1.5 GB descomprimido):**

```powershell
# Windows — reinicia o terminal após o install
winget install zstd
zstd -d puzzles.csv.zst -o puzzles.csv
```

```bash
# Linux / macOS
brew install zstd   # ou: sudo apt install zstd
zstd -d puzzles.csv.zst -o puzzles.csv
```

**3. Importar para a base de dados:**

```bash
pnpm import-puzzles                       # CSV na raiz, rating até 2000
pnpm import-puzzles puzzles.csv           # caminho personalizado
pnpm import-puzzles puzzles.csv 1500      # rating máximo personalizado
```

O script filtra apenas puzzles com o tema `opening` e `OpeningTags` preenchido (rating 900–2000 por omissão). Puzzles duplicados são ignorados — podes re-correr sem erros.

---

## Como Iniciar o Projeto Localmente

### Pré-requisitos

* [Node.js](https://nodejs.org/) (v18 ou superior)
* [pnpm](https://pnpm.io/) (Gerenciador de pacotes)
* [Docker](https://www.docker.com/) e Docker Compose (Para a Base de Dados)

### Passo a Passo

1. **Clonar o Repositório:**
   ```bash
   git clone https://github.com/teu-usuario/chess-openings.git
   cd chess-openings
   ```

2. **Subir a Base de Dados PostgreSQL:**
   ```bash
   docker-compose up -d
   ```

3. **Instalar Dependências (todos os workspaces):**
   ```bash
   pnpm install
   ```

4. **Configurar Variáveis de Ambiente:**

   `.env` na raiz (apenas para o Prisma CLI / `import-puzzles`):
   ```env
   DATABASE_URL="postgresql://admin:password123@localhost:5432/chessopenings?schema=public"
   ```

   `apps/web/.env` (Next.js — só esta variável):
   ```env
   NEXT_PUBLIC_API_URL="http://localhost:3001/api"
   ```

   `apps/api/.env` (NestJS — não committar):
   ```env
   DATABASE_URL="postgresql://admin:password123@localhost:5432/chessopenings?schema=public"
   SESSION_SECRET="um-segredo-partilhado-entre-next-e-nest"
   GEMINI_API_KEY="..."   # necessário para importar estudos (narração do Mestre Gambito)
   PORT=3001
   ```

   > O `SESSION_SECRET` **tem de ser o mesmo** nos dois `.env` (`apps/api` e raiz) — o cookie de sessão do Next.js guarda o JWT emitido pela API NestJS. O Next.js **não acede diretamente à base de dados** — não precisa de `DATABASE_URL`.

5. **Sincronizar a Base de Dados (Prisma 6 — usar `exec`, não `dlx`):**
   ```bash
   pnpm exec prisma db push
   ```
   > ⚠️ `pnpm dlx prisma` baixa o Prisma 7 (incompatível com o schema atual). Usa sempre `pnpm exec prisma`.
   > O `pnpm install` do passo anterior já corre `prisma generate` automaticamente (via `postinstall`) — não é necessário corrê-lo manualmente.

6. **Popular a base de dados com contas de demonstração (seed):**
   ```bash
   pnpm db:seed
   ```
   Cria duas contas prontas para login. É idempotente — podes re-correr a qualquer momento (repõe as senhas abaixo):

   | Papel   | Email             | Senha      |
   |---------|-------------------|------------|
   | ADMIN   | `admin@chess.dev` | `admin123` |
   | STUDENT | `aluno@chess.dev` | `aluno123` |

   > A conta **`admin@chess.dev`** já tem role `ADMIN` — usa-a para aceder a `/admin/import` sem precisares do `pnpm make-admin`.
   > O seed corre também automaticamente após `pnpm exec prisma migrate reset`.

7. **Iniciar Frontend + API em simultâneo:**
   ```bash
   pnpm dev:all     # Next.js em :3000 + NestJS em :3001
   ```
   Ou separadamente: `pnpm dev` (Next) e `pnpm dev:api` (NestJS).

Acede a [http://localhost:3000](http://localhost:3000) (app) e [http://localhost:3001/docs](http://localhost:3001/docs) (Swagger da API).

> **Alternativa — API em Docker:** para correr a API em container em vez de `pnpm dev:all`,
> usa `docker-compose --profile full up -d` (sobe banco + API) e depois só `pnpm dev` para o frontend.

### Importar um estudo (conteúdo)

A importação de estudos do Lichess (gera lições) exige um utilizador com role **ADMIN**. Se correste o seed (passo 6), usa a conta **`admin@chess.dev`** / `admin123` — já é ADMIN. Para promover outra conta:

```bash
pnpm make-admin teu@email.com    # promove a ADMIN (faz logout/login depois)
```

Depois, em `http://localhost:3000/admin/import`, cola o URL de um estudo público do Lichess.
(Também disponível via Swagger: `POST /api/ingestor/study`.)

### Testes

```bash
pnpm test         # Testes unitários: domínio (SM-2) + web (helpers de lib/), via turbo
pnpm test:e2e     # Testes de integração da API (requer PostgreSQL a correr), via turbo
```

O frontend (`apps/web`) usa **Vitest** para testes unitários dos helpers em `src/lib/` (ex: `archetypes`, `board-shapes`). O domínio (`packages/domain`) e a API (`apps/api`) usam **Jest**.

---

## O que NÃO está no MVP (Próximas Fases)

Para manter o pragmatismo e foco na entrega:

* **B2B / Classrooms:** os models `Classroom`/`Enrollment` existem no schema, mas o módulo e a UI ainda não foram implementados.
* Análise de partidas reais do Lichess/Chess.com.
* Multijogador ou lances em tempo real contra humanos.
* Vídeos longos de ensino.
* Comentários adaptativos por arquétipo (infraestrutura existe, UI por fazer).

---

<div align="center">
  <p>Feito com pragmatismo e código limpo.</p>
</div>
