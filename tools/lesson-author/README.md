# lesson-author — geração de lições com IA (POC)

Ferramenta **offline** que transforma um estudo da Lichess (o esqueleto do repertório) num
rascunho de curso anotado: comentários em português para cada lance, setas e casas
destacadas, o plano do capítulo e **cartões de treino** (posições críticas e armadilhas) que
viram itens próprios da repetição espaçada no app.

> **"Por que não X?" está desligado nesta versão.** As lições comentam só a linha que o aluno
> joga; explicar alternativas deixava o texto longo demais e às vezes enganoso (a "refutação"
> incluía lances da própria engine pelo nosso lado). Para religar, suba `maxAlternatives` em
> `DEFAULT_ENRICH` (`src/enrich.ts`) e devolva a regra do `whyNot` ao `AUTHOR_SYSTEM_PROMPT`.

Ela roda na sua máquina, não na API: é demorada, custa dinheiro e tem você no meio do
processo. O app só importa o resultado depois que você revisa.

## A ideia central: a IA não é a fonte da verdade

O treinador antigo (Gemini) recebia só o lance (`g6`) e alucinava, porque tinha que imaginar
o tabuleiro. Aqui a IA é só a **redatora**. A verdade vem de fontes que não alucinam:

| Fonte | O que dá | Como |
|---|---|---|
| **Você** | O repertório e as ideias | O estudo da Lichess |
| **chess.js** | Fatos do tabuleiro: casas que cada peça controla, peças penduradas, estrutura | Calculado |
| **Engine** | Avaliação, melhores linhas, refutações | Stockfish local e/ou avaliação em nuvem da Lichess |
| **Explorer da Lichess** | O que mestres e amadores de 1600–2000 jogam, com aproveitamento | API com token |

Tudo isso vira um **dossiê** por capítulo. O Claude escreve o capítulo inteiro de uma vez
(coerência de plano entre os lances), com saída estruturada. Cada afirmação sobre o tabuleiro
("o Cf3 controla d4") vem separada do texto, e um **verificador em código** confere:

- todo lance citado existe no dossiê daquele lance (linha, engine, explorer, alternativas);
- toda peça citada está na casa dita; toda casa "controlada" é mesmo alcançada;
- "ataca"/"defende" apontam para peça inimiga/própria de verdade;
- avaliações batem com a engine; "por que não X" (quando ligado) só onde a engine confirma que X é pior;
- a pergunta de um cartão não entrega a resposta; nada de citar engine ou números.

O que falhar volta para o Claude corrigir (na mesma conversa, com a lista de erros). O que
ainda falhar depois das rodadas sai marcado **`[REVISAR: motivo]`** no PGN. Um segundo
modelo faz uma revisão independente e também marca os erros que achar. **O app se recusa a
importar um estudo que ainda tenha alguma marca `[REVISAR`.**

## Configuração (uma vez)

Crie `tools/lesson-author/.env` (ou use o `.env` da raiz):

```env
ANTHROPIC_API_KEY=sk-ant-...           # console.anthropic.com
LICHESS_TOKEN=lip_...                  # lichess.org/account/oauth/token (sem escopos)
STOCKFISH_PATH=C:\stockfish\stockfish-windows-x86-64-avx2.exe
```

- **`ANTHROPIC_API_KEY`**: obrigatória para gerar (não para `--dry-run`).
- **`LICHESS_TOKEN`**: o explorer da Lichess exige token desde 2025. Sem ele não há
  estatísticas de partidas nem cartões (os cartões dependem dos dados de amadores).
- **`STOCKFISH_PATH`**: opcional, mas recomendado. A avaliação em nuvem da Lichess cobre
  bem a teoria popular; as posições depois de um erro de amador (armadilhas) muitas vezes só
  o Stockfish local consegue avaliar. Baixe em stockfishchess.org.

## Escrevendo o repertório sem a Lichess (`.txt`)

O jeito mais rápido é digitar as linhas como você as sabe de cabeça, num arquivo `.txt`:

```text
# Abertura do Bispo
cor: brancas

## Berlinense: 3...c6
1.e4 e5 2.Bc4 Cf6 3.d3 c6 4.Cf3 d5 5.Bb3 {mantemos o bispo na diagonal a2–g8}
1.e4 e5 2.Bc4 Cf6 3.d3 c6 4.Cf3 d5 5.Bb3 Bd6 6.Cc3
```

- `#` é o nome da abertura; `cor:` é o lado do aluno (`brancas` ou `pretas`).
- Cada `##` é um capítulo (vira uma lição no app).
- A primeira linha de um capítulo é a principal; as outras viram variantes a partir de onde
  divergem. Notação portuguesa ou inglesa; números de lance opcionais; `{comentário}` opcional
  depois do lance.
- Todo lance é conferido pelo chess.js: um erro de digitação para tudo com a linha e o lance,
  antes de qualquer chamada paga.

Exemplo pronto: [`repertorios/abertura-do-bispo.txt`](repertorios/abertura-do-bispo.txt).

## Gerando o repertório automaticamente (`lessons:draft`)

Em vez de escrever as linhas de cabeça, o `lessons:draft` monta o `.txt` a partir de dados:

```powershell
pnpm lessons:draft --inicio "1.e4 e5 2.Bc4" --nome "Abertura do Bispo" --licoes 15 --rating 1000-1600 --base tools\lesson-author\repertorios\abertura-do-bispo.txt
```

- **Respostas do adversário:** o que os jogadores da faixa `--rating` jogam de verdade
  (explorer da Lichess), a partir de 5% das partidas, até 4 por posição.
- **Lances ruins que pegam iniciantes:** uma resposta que a engine pune em 1,5 peão ou mais
  vira uma linha de punição (capítulo "Armadilha: ..."), seguida até a vantagem ficar clara.
- **Nossos lances:** os do `--base` quando a posição aparece nele (mantém o sistema que você
  escolheu); fora dele, o melhor da engine, preferindo o mais jogado por mestres entre os que
  estão a até 0,30 do melhor.
- **Capítulos:** a árvore é dividida pelos desvios do adversário até chegar a `--licoes`,
  com nomes da base de aberturas da Lichess.
- Nenhuma IA escolhe lances; cada linha vem comentada (`//`) com frequência e avaliação para
  você revisar. Precisa de `LICHESS_TOKEN`; Stockfish local é muito recomendado.

`pnpm lessons:draft --help` lista as opções (profundidade, frequência mínima etc.).

### Skill do Claude Code: `/gerar-repertorio`

A skill conduz o processo inteiro — escolhe os parâmetros, roda o `lessons:draft`, revisa o
rascunho como treinador (coerência do sistema, armadilhas, nomes em português), valida com
`--dry-run` e mostra o custo, sem rodar a geração paga sem a sua aprovação. Ela fica em
`.claude/skills/gerar-repertorio/` (pasta local, fora do git); a cópia versionada está em
[`skill/gerar-repertorio/SKILL.md`](skill/gerar-repertorio/SKILL.md) — para instalar numa
máquina nova, copie a pasta para `.claude/skills/`.

## Fluxo completo (para cada abertura)

1. **Monte o esqueleto** num `.txt` (acima) ou num estudo da Lichess. Um estudo por repertório e por cor (a orientação do
   estudo diz a cor do aluno). Um capítulo por linha/variante, com os lances e, se quiser,
   anotações curtas suas. Deixe o estudo público ou não listado.
2. **Simule primeiro** (grátis, sem IA) para ver dossiês, cartões e custo estimado:

   ```bash
   pnpm lessons:generate --source tools/lesson-author/repertorios/abertura-do-bispo.txt --dry-run
   # ou: --source https://lichess.org/study/XXXXXXXX
   ```

3. **Gere:**

   ```bash
   pnpm lessons:generate --source https://lichess.org/study/XXXXXXXX
   ```

   Saem três arquivos em `out/lesson-author/`: o **PGN** anotado, o **relatório** (o que foi
   corrigido, o que ficou marcado, por que cada cartão foi escolhido e o custo) e o **dossiê**
   (exatamente o que a IA recebeu, para auditar).
4. **Revise na Lichess.** Crie um estudo novo e importe o PGN (cada partida vira um capítulo;
   escolha a orientação da cor do repertório). Procure por `[REVISAR`, corrija e apague as
   marcas. Leia os cartões: o título e a pergunta fazem sentido?
5. **Importe no app** pela linha de comando, com todos os capítulos da abertura juntos:

   ```bash
   pnpm lessons:import out/lesson-author/bispo-cap1.revisado.pgn out/lesson-author/bispo-cap14.revisado.pgn
   ```

   Ele usa o banco do `DATABASE_URL` (mostra qual antes de gravar) e recusa PGN com
   `[REVISAR`. Para produção, rode com o `DATABASE_URL` apontando para a URL pública do banco.
   Reimportar a mesma abertura substitui as lições (e zera o progresso dos alunos nelas).

## Tutorial "Primeiros passos"

O tutorial de como as peças se movem não usa IA: está escrito em
[`src/tutorial/primeiros-passos.ts`](src/tutorial/primeiros-passos.ts). Cada lição tem uma
demonstração e um capítulo `<lição> | Prática: ...` com tarefas; no último passo, todas as
respostas em `accept` valem (viram variações). O gerador joga cada lance no chess.js antes de
escrever o PGN — o importador corta a linha em silêncio no primeiro lance inválido.

```bash
pnpm --filter @chess-openings/lesson-author tutorial     # gera content/primeiros-passos.pgn
pnpm lessons:import content/primeiros-passos.pgn --tutorial
```

## Opções úteis

```bash
pnpm lessons:generate --source estudo.pgn --chapters 1,2      # só alguns capítulos
pnpm lessons:generate --source ... --model claude-fable-5-1    # comparar com o modelo mais capaz
pnpm lessons:generate --source ... --effort xhigh --fix-rounds 3
pnpm lessons:generate --source ... --max-critical 3 --max-traps 1
pnpm lessons:generate --help
```

- **Modelo**: padrão `claude-opus-5` com raciocínio adaptativo e esforço `high`. Para o POC,
  vale gerar o mesmo capítulo com `claude-fable-5-1` e comparar.
- **Estilo**: `style/exemplos.md` vai inteiro no prompt. Escrever 5–10 comentários seus ali é
  a alavanca de qualidade mais barata que existe.
- **Cache**: respostas de engine e explorer ficam em `.cache/lesson-author/` (na raiz). Rodar
  de novo depois de mexer no prompt não repete essas consultas.

## Cartões

| Tipo | Como é escolhido | O que o aluno faz |
|---|---|---|
| **Posição crítica** | Lances do repertório que menos de 50% dos jogadores de 1600–2000 acertam | Acha o lance (e a continuação curta) a partir daquela posição |
| **Armadilha** | Resposta do adversário jogada por ≥ 5% dos amadores (≥ 100 partidas) que a engine pune em ≥ 1,5 peão | Pune o erro seguindo a linha da engine |

No PGN, um cartão é um capítulo chamado `<título da lição> | Crítica: ...` ou
`<título da lição> | Armadilha: ...`, começando da posição (FEN) com a pergunta antes do
primeiro lance. Ao importar, o app pendura o cartão na lição de mesmo título. **Não renomeie
os capítulos de cartão** na Lichess, senão eles viram lições soltas.

## Resultados e próximos passos

O primeiro teste real (Claude Opus 5, capítulo 1 da Abertura do Bispo), as melhorias feitas
depois dele e o plano para testar o Claude Sonnet 5 na Batch API estão em
[`docs/teste-opus5-e-plano-sonnet5-batch.md`](docs/teste-opus5-e-plano-sonnet5-batch.md).

O repertório completo gerado com `lessons:draft`, o teste com o Claude Sonnet 5 (e por que ele
não saiu mais barato), como gastar menos, como desligar e religar a revisão automática e o
plano da Batch API estão em
[`docs/repertorio-completo-teste-sonnet5-e-custos.md`](docs/repertorio-completo-teste-sonnet5-e-custos.md).

## Custo

A simulação estima o custo; a geração real mede e mostra no relatório. Com `claude-opus-5`,
um capítulo de ~15 lances fica em torno de US$ 0,30–0,60 com a revisão independente. A
Abertura Inglesa inteira (3 capítulos, 47 lances) foi estimada em ~US$ 2.

## Limitações conhecidas

- O verificador confere fatos concretos (lances, peças, casas, avaliações). Ideias
  estratégicas ("o plano é b4–b5") só a revisão independente e você conseguem julgar.
- O nome dos capítulos da Lichess tem limite de tamanho; títulos de lição muito longos podem
  cortar o sufixo do cartão.
- Sem `LICHESS_TOKEN`, sem cartões. Sem Stockfish, poucas armadilhas.

## Desenvolvimento

```bash
pnpm --filter @chess-openings/lesson-author test
pnpm --filter @chess-openings/lesson-author typecheck
```

Os testes não usam rede nem IA: engine, explorer e o cliente da Anthropic são falsos. O
`pipeline.test.ts` cobre o ciclo inteiro (escrever → verificar → corrigir → marcar → PGN).
