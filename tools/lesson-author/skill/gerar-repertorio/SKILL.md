---
name: gerar-repertorio
description: Gera o repertório de uma abertura de xadrez em linhas de texto (.txt) para o lesson-author — linhas principais, desvios e linhas de punição a lances ruins que pegam iniciantes — a partir do que se joga de verdade (explorer da Lichess) e da engine, revisa o rascunho como treinador e deixa pronto para gerar as lições. Use quando o usuário pedir um repertório, linhas, lições ou "um .txt" de uma abertura (ex.: "gera 15 lições da Abertura do Bispo", "quero o repertório da Siciliana de pretas").
---

# Gerar repertório (.txt) para o lesson-author

Você monta o repertório de uma abertura no formato `.txt` que `pnpm lessons:generate` lê
(ver `tools/lesson-author/README.md`, seção "Escrevendo o repertório sem a Lichess"). Quem
escolhe os lances são os **dados**, não você: o comando `pnpm lessons:draft` constrói a
árvore com o explorer da Lichess (o que os adversários da faixa de rating jogam) e o
Stockfish (os nossos lances e as punições). O seu papel é configurar, revisar como treinador
e entregar um arquivo limpo.

## Regras

- **Nunca invente lances.** Todo lance do arquivo final vem do rascunho gerado ou de um
  repertório base já aprovado. Pode cortar linhas e reordenar; não pode acrescentar linhas de
  memória.
- **Nunca rode a geração paga** (`pnpm lessons:generate` sem `--dry-run`) sem o usuário
  aprovar explicitamente, com o custo estimado na mão.
- **Nunca mostre segredos.** Para conferir o `.env`, verifique só se as variáveis existem
  (por exemplo `grep -c '^LICHESS_TOKEN=' tools/lesson-author/.env`), jamais o valor.
- Tudo o que o usuário lê é em português do Brasil; lances em notação portuguesa
  (C, B, T, D, R).

## 1. Entender o pedido (pergunte só o que faltar)

| Parâmetro | Como decidir | Padrão |
|---|---|---|
| Abertura (`--inicio`) | Os lances que a definem, ex.: `1.e4 e5 2.Bc4` | — (pergunte se não der para inferir) |
| Cor do aluno (`--cor`) | Quem joga o último lance de `--inicio` | inferida |
| Nome (`--nome`) | Nome em português, ex.: "Abertura do Bispo" | — |
| Lições (`--licoes`) | O número pedido | 15 |
| Rating dos adversários (`--rating`) | "Pegar iniciantes" / armadilhas: `1000-1600`. Repertório para alunos mais fortes: `1600-2200` | `1000-1600` |
| Profundidade (`--ate-lance`) | Até que lance da partida | 10 |
| Base (`--base`) | Se já existe um `.txt` aprovado dessa abertura em `tools/lesson-author/repertorios/`, use-o: os nossos lances dele têm prioridade e mantêm o sistema escolhido | — |

## 2. Pré-requisitos

- `LICHESS_TOKEN` definido (o explorer exige). Sem ele o comando para com mensagem clara.
- `STOCKFISH_PATH` definido e o arquivo existindo (muito recomendado: sem ele, a avaliação
  em nuvem da Lichess não cobre posições raras e bloqueia o IP com muitas consultas).

## 3. Gerar o rascunho

```bash
pnpm lessons:draft --inicio "1.e4 e5 2.Bc4" --nome "Abertura do Bispo" --licoes 15 \
  --rating 1000-1600 --base tools/lesson-author/repertorios/abertura-do-bispo.txt \
  --out tools/lesson-author/repertorios/abertura-do-bispo-completo.txt
```

Leva de alguns minutos a ~20 (centenas de consultas ao explorer e à engine; tudo fica em
cache, então rodar de novo é rápido). Rode em segundo plano e acompanhe a saída.

Se vierem **menos capítulos** que o pedido: baixe `--min-freq` (ex.: `0.03`) ou aumente
`--ate-lance`. Se vierem **linhas demais** num capítulo: aumente `--min-freq` ou baixe
`--max-respostas`.

Linhas de punição aparecem com um comentário `// X? — N% dos jogadores ... jogam`. Se vierem
**poucas**: baixe `--erro-cp` (ex.: `80`) ou `--min-alcance` (ex.: `0.002`). Se vierem
punições fracas (vantagem pequena no fim): suba `--erro-cp` (ex.: `150`).

## 4. Revisar o rascunho como treinador

Leia o `.txt` inteiro. Cada linha vem com comentários `//` (frequência, avaliação) que ajudam.

1. **Sistema coerente.** Os nossos lances devem formar um repertório que um aluno consiga
   lembrar (ex.: sempre 3.d3 contra 2...Cf6). Se a engine escolheu sistemas diferentes em
   ramos parecidos, rode de novo com `--base` apontando para um arquivo com o sistema
   desejado, em vez de editar lance por lance.
2. **Armadilhas** (capítulos "Armadilha: ..."): confira se o comentário faz sentido e se a
   linha termina depois da punição. São o ponto alto para iniciantes: mantenha-as.
3. **Cortes.** Remova linhas repetidas ou que não acrescentam nada (ex.: transposições para
   a mesma posição de outro capítulo). Mantenha a primeira linha de cada capítulo como a
   principal.
4. **Títulos.** Traduza os nomes da Lichess para o português ("Berlin Defense" → "Defesa
   Berlinense", "Philidor Counterattack" → "Contra-ataque Philidor") e deixe-os curtos. Nunca
   use `|` num título (é o separador dos cartões).
5. **Ordem.** Linhas mais comuns primeiro; cada armadilha perto do capítulo do qual ela sai.

## 5. Validar e apresentar

```bash
pnpm lessons:generate --source tools/lesson-author/repertorios/<arquivo>.txt --dry-run
```

A simulação confere cada lance (um erro aponta a linha exata), monta os dossiês, acha os
cartões e estima o custo (veja o relatório em `out/lesson-author/`).

Apresente ao usuário:

- uma tabela dos capítulos (título, nº de linhas, se é armadilha, % das partidas);
- o custo estimado da geração com IA;
- o comando da geração real (com `--chapters` para começar por poucos capítulos) — e espere
  a aprovação dele antes de rodar.
