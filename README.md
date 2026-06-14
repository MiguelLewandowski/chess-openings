<div align="center">
  <img src="public/favicon.ico" alt="Chess Openings Logo" width="120" />
  <h1>Chess Openings</h1>
  <p><strong>O Treinador de Aberturas de Xadrez Pragmático & Inteligente</strong></p>
  <p><em>Aprende uma linha, pratica contra a máquina e sê punido se esqueceres. Tudo guiado pelo Mestre Gambito.</em></p>

  <p align="center">
    <img src="https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js" alt="Next.js 15" />
    <img src="https://img.shields.io/badge/NestJS-10-E0234E?style=flat-square&logo=nestjs" alt="NestJS 10" />
    <img src="https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma" alt="Prisma" />
    <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker" alt="Docker" />
  </p>
</div>

<br />

## O Que é o Chess Openings?

O **Chess Openings** não é mais um tabuleiro de xadrez online. É um **treinador focado exclusivamente em aberturas**, desenhado para combater a "amnésia de xadrez" e o estudo passivo.

Inspirado no modelo de retenção do Duolingo e no rigor dos clubes de xadrez clássicos, o Chess Openings valida o teu **Core Loop** de aprendizagem:
1. **Teoria:** O tabuleiro move as peças enquanto o *Mestre Gambito* explica o "porquê" de cada lance.
2. **Prática:** Tu repetes a linha. Se falhares, o sistema joga uma "capivara" (erro comum) e tu tens de encontrar a punição imediata.
3. **Retenção:** Um algoritmo **SM-2** (Spaced Repetition System) agenda automaticamente as tuas revisões.

---

## Funcionalidades do MVP

### 1. Núcleo de Treinamento (Game Loop)
* **Modo Teoria (Playback):** Visualização automática de lances com *cards* de texto curtos explicativos. Sem vídeos longos, apenas o que interessa.
* **Modo Prática (Active Recall):** Validação ativa das tuas escolhas.
* **Seletor de Modo (ModeToggle):** Componente visual para alternar entre Teoria e Prática dentro da mesma lição.
* **Validação de Alternativas:** Se jogares um lance válido mas fora da linha estudada, o Mestre Gambito compreende o teu lance, mas reconduz-te ao objetivo da aula.
* **Modo Punição (Exploiting Blunders):** Puzzles de abertura reais do Lichess (~4 M puzzles), filtrados pelas aberturas do teu repertório. Requer setup de importação (ver abaixo).

### 2. O Motor de Inteligência (Mestre Gambito)
* **Insights Contextuais:** Frases curtas e diretas (ex: *"Este lance pressiona f7, o ponto mais fraco do preto"*). Adeus setas confusas.
* **Dicionário de Erros:** Respostas mapeadas para lances intuitivos mas errados, garantindo que nunca ficas "travado" sem saber o motivo.

### 3. Retenção e Gamificação (O Efeito Duolingo)
* **Algoritmo SM-2 (SRS):** O sistema adapta as tuas revisões (ex: se acertares facilmente, revisas em 4 dias; se errares, revisas amanhã). Implementado via `completeExerciseAction()` que actualiza `easinessFactor`, `interval` e `repetitions` em cada submissão.
* **ProgressTracker:** Componente que exibe o progresso SM-2 em tempo real, streak de dias consecutivos e XP acumulado directamente no ecrã de lição.
* **Streaks & XP:** Contador de dias consecutivos e experiência ganha por aula.
* **Arquétipos:** Definição do teu estilo de jogo (ex: *"Atacante Tático"*, *"Sólido Posicional"*).

### 4. Gestão e B2B (Diferencial)
* **Classrooms:** Professores podem criar salas, gerar *invite codes* e monitorizar o XP/Maestria dos alunos.
* **Dashboard de Maestria:** Progresso visual real (0% a 100%) no domínio de cada abertura (ex: *Italiana*).

---

## Arquitetura e Tech Stack

O Chess Openings foi construído focado em **Clean Code, YAGNI, KISS e SOLID**.

### A Arquitetura Híbrida de IA (Human-in-the-loop)
Após testes exaustivos com modelos de linguagem (LLMs) como Gemini e GPT, constatámos que **a IA alucina frequentemente na análise tática de xadrez** (ex: inventando defesas inexistentes ou listando casas controladas sem contexto estratégico).
Para garantir um conteúdo pedagógico de nível Grande Mestre (GM), o Chess Openings adota uma arquitetura híbrida:
1. **Curadoria Humana (Mestre Nacional):** O autor cria *Studies* no Lichess e anota os lances com palavras-chave estratégicas.
2. **IA como Ghostwriter:** O nosso pipeline consome o PGN do Lichess e usa o `gemini-2.0-flash-lite` estritamente como formatador de texto. A IA não inventa xadrez; ela expande as notas curtas do Mestre numa narrativa envolvente ("A voz do Mestre Gambito").

### Tech Stack Principal
* **Monorepo:** [Turborepo](https://turbo.build/) + pnpm workspaces
* **Frontend:** [Next.js 15](https://nextjs.org/) (App Router) — porta **3000**
* **Backend (API):** [NestJS 10](https://nestjs.com/) + Swagger/OpenAPI — porta **3001**
* **Domínio:** `@chess-openings/domain` (entidades, casos de uso, interfaces — sem dependência de framework, testável em isolamento)
* **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
* **Gestão de Estado Global:** [Zustand](https://github.com/pmndrs/zustand) (Eliminando Prop Drilling no fluxo de treino)
* **ORM:** [Prisma 6](https://www.prisma.io/)
* **Base de Dados:** [PostgreSQL](https://www.postgresql.org/) (via Docker)
* **Lógica de Xadrez:** `chess.js` (Motor de regras e validação SAN/FEN) e `chessground` (UI interativa SVG)

> **Arquitetura:** o **Next.js consome a API NestJS** via `src/lib/api-client.ts` — todo o acesso à base de dados (auth, openings, lições, progresso SM-2, ingestão) passa pelo NestJS. O Next.js mantém apenas Server Components, estado de UI (Zustand) e sessão por cookie. O `@chess-openings/domain` é partilhado pelos dois.

### Estrutura do Monorepo
A UI (Next.js) está separada do backend (NestJS) e do domínio partilhado.

```text
chess-openings/
├── prisma/                     # Schema da BD (schema.prisma) — source of truth
├── scripts/
│   └── import-puzzles.ts       # Importação de puzzles do Lichess (Modo Punição)
├── apps/
│   ├── web/                    # Frontend Next.js 15 (porta 3000)
│   │   └── src/
│   │       ├── app/            # App Router: openings, lessons, style-quiz, admin, actions
│   │       ├── components/     # Board, ModeToggle, ProgressTracker, CoachConsole, ...
│   │       ├── store/          # Estado Global de UI (Zustand: GameStore)
│   │       ├── services/       # opening/lesson/review → delegam à API NestJS
│   │       └── lib/
│   │           ├── api-client.ts  # Cliente HTTP tipado para a API NestJS
│   │           └── session.ts     # Sessão por cookie (JWT da API)
│   └── api/                    # Backend NestJS 10 (porta 3001)
│       ├── src/
│       │   ├── modules/        # auth, opening, lesson, progress, ingestor
│       │   └── infrastructure/ # PrismaService, services (Lichess, engine, coach)
│       └── test/               # Testes de integração e2e (Jest + Supertest)
└── packages/
    └── domain/                 # @chess-openings/domain — entidades, use-cases, interfaces (SM-2)
```

> A **raiz** é apenas o orquestrador do monorepo (Turborepo + pnpm workspaces) e o tooling de base de dados (schema Prisma + `import-puzzles`). Todo o código de aplicação vive em `apps/*`.

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

   `apps/web/.env` (Next.js):
   ```env
   DATABASE_URL="postgresql://admin:password123@localhost:5432/chessopenings?schema=public"
   NEXT_PUBLIC_API_URL="http://localhost:3001/api"
   ```

   `apps/api/.env` (NestJS — não committar):
   ```env
   DATABASE_URL="postgresql://admin:password123@localhost:5432/chessopenings?schema=public"
   SESSION_SECRET="um-segredo-partilhado-entre-next-e-nest"
   GEMINI_API_KEY="..."   # opcional — só necessário para importar estudos (narração do Mestre Gambito)
   PORT=3001
   ```

   > O `SESSION_SECRET` **tem de ser o mesmo** na raiz e no `apps/api` — o cookie de sessão do Next.js guarda o JWT emitido pela API NestJS.

5. **Sincronizar a Base de Dados (Prisma 6 — usar `exec`, não `dlx`):**
   ```bash
   pnpm exec prisma db push
   ```
   > ⚠️ `pnpm dlx prisma` baixa o Prisma 7 (incompatível com o schema atual). Usa sempre `pnpm exec prisma`.

6. **Iniciar Frontend + API em simultâneo:**
   ```bash
   pnpm dev:all     # Next.js em :3000 + NestJS em :3001
   ```
   Ou separadamente: `pnpm dev` (Next) e `pnpm dev:api` (NestJS).

Acede a [http://localhost:3000](http://localhost:3000) (app) e [http://localhost:3001/docs](http://localhost:3001/docs) (Swagger da API).

> **Alternativa — API em Docker:** para correr a API em container em vez de `pnpm dev:all`,
> usa `docker-compose --profile full up -d` (sobe banco + API) e depois só `pnpm dev` para o frontend.

### Testes

```bash
pnpm test         # Testes unitários do domínio (SM-2), via turbo
pnpm test:e2e     # Testes de integração da API (requer PostgreSQL), via turbo
```

---

## O que NÃO está no MVP (Próximas Fases)
Para manter o pragmatismo e foco na entrega:
* Análise de partidas reais do Lichess/Chess.com.
* Multijogador ou lances em tempo real contra humanos.
* Vídeos longos de ensino.

---

<div align="center">
  <p>Feito com pragmatismo e código limpo.</p>
</div>
