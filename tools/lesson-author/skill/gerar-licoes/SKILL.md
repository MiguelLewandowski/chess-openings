---
name: gerar-licoes
description: Gera as lições anotadas de uma abertura de xadrez SEM a API da Anthropic. Agentes do Claude Code (autor e revisor, Opus 5.5) escrevem os comentários a partir dos dossiês do lesson-author, o verificador em código confere e o importador do app valida o formato. Prefere linhas táticas e forçadas escolhidas por dados. Use quando o usuário pedir "gera as lições/aberturas", "anota o repertório" ou "sem rodar a API".
---

# Gerar lições com agentes (sem API da Anthropic)

O pipeline é o mesmo do `lessons:generate` (dossiê → escrita → verificador → revisão → PGN).
A diferença é quem escreve: no lugar da chamada paga, os subagentes `autor-licoes` e
`revisor-licoes` (em `.claude/agents/`, os dois em `claude-opus-5-5`). Quem decide se um
capítulo está pronto é **o verificador em código e o importador do app**, não o agente.

Tudo o que o usuário lê é em PT-BR. Nunca mostre segredos do `.env`; confira só se existem
(`grep -c '^LICHESS_TOKEN=' tools/lesson-author/.env`).

## 1. O repertório (.txt)

Se o usuário já tem um `.txt` aprovado em `tools/lesson-author/repertorios/`, use-o.
Senão, monte com a skill `/gerar-repertorio`, mas no **estilo tático**:

```bash
pnpm lessons:draft --inicio "<lances>" --nome "<nome>" --licoes <n> --rating 1000-1600 \
  --estilo tatico --erro-cp 80 --out tools/lesson-author/repertorios/<slug>.txt
```

- `--estilo tatico`: entre os nossos lances que estão até 0,50 do melhor da engine, escolhe o
  que mais faz os adversários daquela faixa **errarem de verdade** (perda média medida no
  explorer + engine), com bônus para xeques e capturas. As linhas ganham o comentário
  `// escolha tática: ...` com o número, para a revisão.
- `--erro-cp 80`: mais linhas de punição (armadilhas) do que o padrão de 100.
- Para pedir uma abertura "tática" sem nome definido, sugira aberturas forçantes e populares
  na faixa: Abertura do Bispo, Gambito Escocês, Italiana com 4.d4 / Fried Liver contra 3...Cf6,
  Gambito do Rei, Stafford (de pretas), e confirme com o usuário antes de rodar.
- Revise o rascunho como manda a `/gerar-repertorio` (sistema coerente, armadilhas,
  títulos em português, ordem). Nenhum lance de memória: só do rascunho.

## 2. Preparar os dossiês

```bash
pnpm lessons:generate --source tools/lesson-author/repertorios/<arquivo>.txt --agente out/lesson-author/<slug>-agente
```

Grava na pasta `INSTRUCOES-AUTOR.md`, `INSTRUCOES-REVISOR.md` (geradas de
`src/author/prompt.ts`, a mesma fonte do modo API), `capNN.dossie.json` por capítulo,
`estado.json` e o PGN (bloqueado com `[REVISAR` enquanto houver capítulo sem anotação).
A primeira vez demora (engine + explorer); depois fica tudo em cache.

## 3. Autores em paralelo

Para cada capítulo `pendente`, `json-invalido`, `com-problemas` ou `revisao-com-erros` do
`estado.json`, lance um subagente `autor-licoes` (até 4 de cada vez, em paralelo) com:

> pasta: out/lesson-author/<slug>-agente · capitulo: N · fonte: tools/lesson-author/repertorios/<arquivo>.txt

Confira o retorno de cada um no `capNN.problemas.md`, não só na resposta dele.

Se o tipo `autor-licoes`/`revisor-licoes` não aparecer (os agentes só carregam quando a sessão
começa), use `general-purpose` com `model: opus` e `effort: xhigh` (o revisor com `high`), e
comece o prompt com "Você é o agente `autor-licoes`. Leia e siga à risca
`.claude/agents/autor-licoes.md` (ignore o frontmatter)."

## 4. Revisão independente

Rode de novo o comando do passo 2 (sem `--chapters`) para atualizar o `estado.json`. Para
cada capítulo em `aguardando-revisao`, lance um `revisor-licoes` (pasta e capítulo).
Depois rode o passo 2 de novo:

- `revisao-com-erros` → volta ao passo 3 (o autor corrige pelo `problemas.md`) e depois a uma
  nova revisão. **No máximo 2 ciclos** de revisão por capítulo; o que sobrar fica marcado
  `[REVISAR: ...]` no PGN para o Miguel decidir.
- `pronto` **com avisos**, no 1º ciclo → os avisos também voltam ao autor (como no modo API:
  aviso é texto fraco ou impreciso que o verificador não pega) e depois a uma nova revisão.
  Do 2º ciclo em diante, só erros voltam.
- `pronto` sem avisos, ou no 2º ciclo → acabou.

## 5. Validar o formato com o app

```bash
pnpm lessons:import out/lesson-author/<slug>-agente/<slug>.pgn --check
```

Usa o importador de verdade (`IngestStudy` com o parser da API), sem banco e sem rede: lista
lições, lances e cartões, e reprova se houver `[REVISAR`, cartão solto (título sem lição de
mesmo nome), lição ou cartão sem lances, ou cartão sem pergunta. Com `[REVISAR` restante, o
`--check` reprova de propósito: liste os trechos para o usuário.

## 6. Entregar

Mostre ao usuário:

- tabela por capítulo: título, estado, nº de lances, cartões, rodadas, avisos da revisão;
- resultado do `--check`;
- o que ficou marcado `[REVISAR` (trecho e motivo);
- o comando de importação, **sem rodar**: gravar no banco é com o usuário.

```bash
pnpm lessons:import out/lesson-author/<slug>-agente/<slug>.pgn
```

## Regras

- Nunca rode `lessons:generate` sem `--agente` ou `--dry-run`: isso chama a API paga.
- Não edite as anotações você mesmo para "passar": devolva ao `autor-licoes`.
- Não apague `[REVISAR` para o `--check` passar.
- Os capítulos de cartão (`<lição> | Crítica: ...`, `<lição> | Armadilha: ...`) não podem ser
  renomeados: o importador os pendura na lição pelo título.
