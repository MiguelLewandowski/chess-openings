<div align="center">
  <img src="public/favicon.ico" alt="Chess Openings Logo" width="120" />
  <h1>Chess Openings ♟️</h1>
  <p><strong>O Treinador de Aberturas de Xadrez Pragmático & Inteligente</strong></p>
  <p><em>Aprende uma linha, pratica contra a máquina e sê punido se esqueceres. Tudo guiado pelo Mestre Gambito.</em></p>

  <p align="center">
    <img src="https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js" alt="Next.js 15" />
    <img src="https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Prisma-7-2D3748?style=flat-square&logo=prisma" alt="Prisma" />
    <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker" alt="Docker" />
  </p>
</div>

<br />

## 🌟 O Que é o Chess Openings?

O **Chess Openings** não é mais um tabuleiro de xadrez online. É um **treinador focado exclusivamente em aberturas**, desenhado para combater a "amnésia de xadrez" e o estudo passivo.

Inspirado no modelo de retenção do Duolingo e no rigor dos clubes de xadrez clássicos, o Chess Openings valida o teu **Core Loop** de aprendizagem:

1. **Teoria:** O tabuleiro move as peças enquanto o *Mestre Gambito* explica o "porquê" de cada lance.
2. **Prática:** Tu repetes a linha. Se falhares, o sistema joga uma "capivara" (erro comum) e tu tens de encontrar a punição imediata.
3. **Retenção:** Um algoritmo **SM-2** (Spaced Repetition System) agenda automaticamente as tuas revisões.

***

## 🚀 Funcionalidades do MVP

### 🧠 1. Núcleo de Treinamento (Game Loop)

- **Modo Teoria (Playback):** Visualização automática de lances com *cards* de texto curtos explicativos. Sem vídeos longos, apenas o que interessa.
- **Modo Prática (Active Recall):** Validação ativa das tuas escolhas.
- **Validação de Alternativas:** Se jogares um lance válido mas fora da linha estudada, o Mestre Gambito compreende o teu lance, mas reconduz-te ao objetivo da aula.
- **Modo Punição (Exploiting Blunders):** Treino tático reativo a erros.

### 🦉 2. O Motor de Inteligência (Mestre Gambito)

- **Insights Contextuais:** Frases curtas e diretas (ex: *"Este lance pressiona f7, o ponto mais fraco do preto"*). Adeus setas confusas.
- **Dicionário de Erros:** Respostas mapeadas para lances intuitivos mas errados, garantindo que nunca ficas "travado" sem saber o motivo.

### 🎮 3. Retenção e Gamificação (O Efeito Duolingo)

- **Algoritmo SM-2 (SRS):** O sistema adapta as tuas revisões (ex: se acertares facilmente, revisas em 4 dias; se errares, revisas amanhã).
- **Streaks & XP:** Contador de dias consecutivos e experiência ganha por aula.
- **Arquétipos:** Definição do teu estilo de jogo (ex: *"Atacante Tático"*, *"Sólido Posicional"*).

### 🏢 4. Gestão e B2B (Diferencial)

- **Classrooms:** Professores podem criar salas, gerar *invite codes* e monitorizar o XP/Maestria dos alunos.
- **Dashboard de Maestria:** Progresso visual real (0% a 100%) no domínio de cada abertura (ex: *Italiana*).

***

## 🏗️ Arquitetura e Tech Stack

O Chess Openings foi construído focado em **Clean Code, YAGNI, KISS e SOLID**.

### Tech Stack Principal

- **Frontend/Backend:** [Next.js](https://nextjs.org/) (App Router)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
- **ORM:** [Prisma 7](https://www.prisma.io/)
- **Base de Dados:** [PostgreSQL](https://www.postgresql.org/) (via Docker)
- **Lógica de Xadrez:** `chess.js` (Motor) e `chessground` (UI/Tabuleiro)

### Estrutura de Pastas (Service Layer Pattern)

Para manter o projeto escalável, a UI (Next.js) está separada da lógica de negócio.

```text
centauro/
├── prisma/                 # Schema da BD (schema.prisma)
├── public/                 # Assets estáticos
└── src/
    ├── app/                # Roteamento Next.js (App Router)
    ├── components/         # Componentes React (UI, Chess, Gamification, Gambito)
    ├── services/           # Regras de Negócio (game.service, srs.service)
    ├── lib/                # Wrappers e Infraestrutura (Prisma Client, chess.js wrapper)
    ├── types/              # Interfaces TS Globais
    └── utils/              # Funções auxiliares puras
```

***

## 🎨 Design e Sensação (UX)

O Centauro foca-se numa estética **"Elegant Classic Chess Club"**:

- **Cores:** Creme, Verde Floresta e Madeira.
- **Som:** Feedback sonoro de peças de madeira de alta qualidade para lances e capturas.
- **Foco:** Zero distrações visuais. O tabuleiro e o Mestre Gambito são o centro da experiência.

***

## 🛠️ Como Iniciar o Projeto Localmente

### Pré-requisitos

- [Node.js](https://nodejs.org/) (v18 ou superior)
- [pnpm](https://pnpm.io/) (Gerenciador de pacotes)
- [Docker](https://www.docker.com/) e Docker Compose (Para a Base de Dados)

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
3. **Instalar Dependências:**
   ```bash
   pnpm install
   ```
4. **Configurar Variáveis de Ambiente:**
   Copia o ficheiro de exemplo (se existir) ou cria um `.env` na raiz:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/centauro?schema=public"
   ```
5. **Sincronizar a Base de Dados (Prisma):**
   ```bash
   pnpm dlx prisma db push
   # ou
   pnpm dlx prisma migrate dev
   ```
6. **Iniciar o Servidor de Desenvolvimento:**
   ```bash
   pnpm dev
   ```

Acede a <http://localhost:3000> e bem-vindo ao teu novo clube de xadrez!

***

## 🚫 O que NÃO está no MVP (Próximas Fases)

Para manter o pragmatismo e foco na entrega:

- ❌ Análise de partidas reais do Lichess/Chess.com.
- ❌ Multijogador ou lances em tempo real contra humanos.
- ❌ Vídeos longos de ensino.

***

