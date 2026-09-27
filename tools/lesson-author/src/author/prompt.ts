import type { Card } from '../cards'
import { formatLine, sanToPt } from '../chess/notation'
import type { Chapter } from '../chess/types'
import type { NodeDossier } from '../enrich'
import { formatCp } from '../sources/engine'
import type { ExplorerResult } from '../sources/explorer'

export const AUTHOR_SYSTEM_PROMPT = `Você escreve os comentários de um curso de aberturas de xadrez. O repertório é de um Mestre Nacional brasileiro; os alunos têm entre 1200 e 1800 de rating e estudam no app com repetição espaçada.

Você recebe um DOSSIÊ por capítulo, calculado por programa: posições, fatos do tabuleiro, linhas de engine, estatísticas de partidas de mestres e de amadores, alternativas e cartões de treino. O dossiê é a única fonte de verdade. Um verificador automático confere cada comentário contra ele e devolve o que estiver errado.

Regras que o verificador cobra:
1. Só cite lances que aparecem no dossiê do próprio lance: a linha do capítulo, a continuação, as linhas da engine, os lances do explorer, as alternativas e as refutações. Nunca invente variantes.
2. Use notação portuguesa: R (rei), D (dama), T (torre), B (bispo), C (cavalo); peões só pela casa. Lances numerados: "4.d4", "4...Cf6". Uma peça citada pelo nome da casa ("o Cf3") precisa estar nessa casa.
3. Toda afirmação de que uma peça controla casas, ataca uma peça inimiga ou defende uma peça própria vai também em "claims", com a peça e as casas exatas. Se não tem certeza, não afirme.
4. Avaliações ("as brancas ficam melhor", "posição igual") só com uma claim "evaluation" coerente com a avaliação da engine do dossiê.
5. Não mencione engine, Stockfish, computador, centipawns nem números de avaliação. Não invente estatísticas, partidas, jogadores ou datas; percentuais só se estiverem no dossiê.
6. Quando houver comentário do autor, ele é a verdade: preserve a ideia e as casas que ele citou e apenas explique melhor.

Como escrever:
- Português do Brasil, tom de professor, direto. 1 a 3 frases por lance; lances óbvios, 1 frase.
- Lances do aluno na primeira pessoa do plural ("jogamos", "nosso bispo"); lances do adversário na terceira ("as pretas respondem...").
- Explique o porquê (plano, casa-chave, estrutura), não descreva o que o tabuleiro já mostra.
- Setas: no máximo 2 por lance. G = nossa ideia, R = ameaça ou perigo, Y = alternativa, B = informação. Casas destacadas: no máximo 2.
- "whyNot": só para alternativas do dossiê com "diferença" de -0,40 ou pior; explique a refutação usando a linha fornecida. Uma por lance, no máximo.
- Cartões: "prompt" é a pergunta mostrada ao aluno ANTES de ele jogar. Descreva a situação (o que o adversário acabou de fazer, o que está em jogo) e pergunte o que jogamos. Não nomeie, descreva nem insinue o lance: nada da peça que se move, da casa de destino ou de verbos que o entreguem ("recuar o bispo", "desenvolver o cavalo").
- "plan": 2 a 4 frases sobre o plano típico depois da última posição do capítulo. Só proponha lances e avanços que aparecem nas linhas da engine ou nos lances de mestres do último nó; não prometa rupturas que não estejam lá, e não se contradiga com as próprias linhas.
- Descreva só o que o tabuleiro do dossiê mostra: use "pecasAindaEmCasa" e "jaRocou" antes de falar de desenvolvimento ou de roque, e "casasControladasPelaPecaMovida" antes de dizer que uma peça "mira" ou "pressiona" algo.
- Em "por que não", use "saldoDeMaterialAoFimDaRefutacao" para dizer o que se perde; não conte capturas de cabeça.
- Escreva uma nota para cada nó do dossiê (inclusive os dos cartões), usando o "id" exato.`

export const REVIEWER_SYSTEM_PROMPT = `Você revisa comentários de um curso de aberturas de xadrez antes de um Mestre Nacional aprová-los. Você recebe o DOSSIÊ calculado por programa (a verdade) e os comentários gerados.

Aponte, por nó, qualquer afirmação que o dossiê não sustente: lances ou planos que não aparecem ali, peças em casas erradas, avaliações exageradas, ideias estratégicas duvidosas para esta estrutura, contradições entre lances, e perguntas de cartão que revelam a resposta.
Use "error" para o que está errado e "warning" para o que é fraco ou impreciso. Não aponte estilo. Se estiver tudo certo, devolva a lista vazia.`

const EVAL_WORDS: [number, string][] = [
  [250, 'vantagem decisiva do aluno'],
  [90, 'vantagem clara do aluno'],
  [40, 'vantagem leve do aluno'],
  [-40, 'equilíbrio'],
  [-90, 'vantagem leve do adversário'],
  [-250, 'vantagem clara do adversário'],
]

// "-2" alone is easy to misread; spell it out from the student's side.
function materialWords(pawns: number): string {
  if (pawns === 0) return 'material igual ao fim da linha'
  const side = pawns > 0 ? 'a mais' : 'a menos'
  return `ao fim da linha, o aluno fica com ${Math.abs(pawns)} ${Math.abs(pawns) === 1 ? 'ponto' : 'pontos'} de material ${side} (peão = 1, peça menor = 3)`
}

export function evalInWords(cp: number | null): string {
  if (cp === null) return 'sem avaliação disponível'
  return EVAL_WORDS.find(([threshold]) => cp >= threshold)?.[1] ?? 'vantagem decisiva do adversário'
}

function explorerSummary(result: ExplorerResult | null) {
  if (!result || result.total === 0) return null
  return {
    partidas: result.total,
    lances: result.moves.slice(0, 6).map((m) => ({
      lance: sanToPt(m.san),
      frequencia: `${Math.round(m.share * 100)}%`,
      aproveitamentoDeQuemJoga: `${Math.round(m.scoreForMover * 100)}%`,
    })),
  }
}

export function renderNode(d: NodeDossier) {
  const f = d.facts
  return {
    id: d.node.id,
    lance: d.label,
    quem: d.mover === 'student' ? 'aluno' : 'adversário',
    linhaPrincipal: d.node.mainline,
    comentarioDoAutor: d.node.authorComment || null,
    setasDoAutor: [...d.node.authorArrows, ...d.node.authorHighlights],
    tabuleiroDepois: f.ascii,
    fenDepois: d.node.fenAfter,
    fatos: {
      pecasBrancas: f.pieces.w.join(' '),
      pecasPretas: f.pieces.b.join(' '),
      casasControladasPelaPecaMovida: f.movedPieceControls.join(' '),
      pecasPenduradas: f.hanging,
      xeque: f.inCheck,
      materialEmPeoes: f.materialBalance,
      colunasAbertas: f.openFiles,
      colunasSemiAbertas: { brancas: f.semiOpenFiles.w, pretas: f.semiOpenFiles.b },
      peoesDobrados: f.doubledPawns,
      peoesIsolados: f.isolatedPawns,
      direitosDeRoque: f.castling,
      pecasAindaEmCasa: { brancas: f.undeveloped.w, pretas: f.undeveloped.b },
      jaRocou: { brancas: f.castled.w, pretas: f.castled.b },
    },
    engine: d.engineAfter
      ? {
          avaliacao: evalInWords(d.evalStudentCp),
          linhas: d.engineAfter.lines.map((l) => formatLine(d.node.fenAfter, l.san.slice(0, 8))),
        }
      : null,
    explorerAntesDoLance: {
      mestres: explorerSummary(d.explorerBefore.masters),
      amadores1600a2000: explorerSummary(d.explorerBefore.amateurs),
      abertura: d.explorerBefore.masters?.opening ?? d.explorerBefore.amateurs?.opening ?? null,
    },
    alternativas: d.alternatives.map((a) => ({
      id: a.id,
      lance: sanToPt(a.san),
      frequenciaEntreAmadores: a.amateurShare !== null ? `${Math.round(a.amateurShare * 100)}%` : null,
      diferenca: a.evalDeltaCp !== null ? formatCp(a.evalDeltaCp) : null,
      refutacao: a.refutation.length > 0 ? formatLine(afterMove(d.node.fenBefore), a.refutation) : null,
      saldoDeMaterialAoFimDaRefutacao: a.materialAfterRefutation === null ? null : materialWords(a.materialAfterRefutation),
    })),
    respostasComunsDoAdversario: d.opponentOptions.map((m) => ({
      lance: sanToPt(m.san),
      frequencia: `${Math.round(m.share * 100)}%`,
    })),
    continuacao: d.continuation.length > 0 ? formatLine(d.node.fenAfter, d.continuation) : null,
  }
}

// The refutation line starts after the alternative, i.e. from the other side's move; the
// caller only needs the move-number prefix to be right, so flip the side to move.
function afterMove(fenBefore: string): string {
  const parts = fenBefore.split(' ')
  const white = parts[1] === 'w'
  parts[1] = white ? 'b' : 'w'
  if (!white) parts[5] = String(Number(parts[5]) + 1)
  return parts.join(' ')
}

export function renderDossier(chapter: Chapter, dossiers: NodeDossier[], cards: Card[], cardDossiers: NodeDossier[]): string {
  const byId = new Map(cardDossiers.map((d) => [d.node.id, d]))
  const cardNodes = (card: Card) => {
    const nodes = []
    let node = card.roots[0]
    while (node) {
      nodes.push(byId.get(node.id))
      node = node.children[0]
    }
    return nodes.filter(Boolean).map((d) => renderNode(d!))
  }

  return JSON.stringify(
    {
      capitulo: chapter.title,
      alunoJogaDe: chapter.studentColor === 'w' ? 'brancas' : 'pretas',
      nos: dossiers.map(renderNode),
      cartoes: cards.map((card) => ({
        cardId: card.id,
        tipo: card.kind === 'CRITICAL' ? 'posição crítica' : 'armadilha (punir o erro do adversário)',
        titulo: card.title,
        motivo: card.reason,
        posicaoInicial: card.initialFen,
        nos: cardNodes(card),
      })),
    },
    null,
    1,
  )
}
