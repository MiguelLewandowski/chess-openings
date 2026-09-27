import { Chess } from 'chess.js'
import { formatCp, studentCp, type Engine } from './sources/engine'
import { moveLabel, moveNumberOf } from './chess/notation'
import type { Chapter, Color, LineNode } from './chess/types'
import type { NodeDossier } from './enrich'

export type CardKind = 'CRITICAL' | 'TRAP'

// A short drill attached to a lesson. It starts on the student's move, from a position
// taken from the lesson (CRITICAL) or reached by a common amateur mistake (TRAP), and
// becomes its own spaced-repetition item in the app.
export interface Card {
  id: string
  kind: CardKind
  title: string
  reason: string // why it was picked, for the reviewer (not shown to students)
  initialFen: string
  studentColor: Color
  roots: LineNode[]
  sourceNodeId: string
  score: number
}

export interface CardOptions {
  maxCritical: number
  maxTraps: number
  // Earlier moves are the choice of opening itself ("2.Bc4 instead of 2.Cf3"), not a
  // moment where the student has to remember the repertoire.
  minCriticalPly: number
  minCriticalScore: number // 1 - share of amateurs who find the repertoire move
  minMistakeShare: number
  minMistakeGames: number
  minTrapGainCp: number
  minTrapEvalCp: number
  solutionPlies: number
}

export const DEFAULT_CARDS: CardOptions = {
  maxCritical: 2,
  maxTraps: 2,
  minCriticalPly: 5,
  minCriticalScore: 0.5,
  minMistakeShare: 0.05,
  minMistakeGames: 100,
  minTrapGainCp: 150,
  minTrapEvalCp: 150,
  solutionPlies: 3,
}

// Critical positions: the student's moves that 1600–2000 players most often miss. They are
// the moments the repertoire actually has to be remembered, not played on general principles.
export function mineCriticalPositions(chapter: Chapter, main: NodeDossier[], options = DEFAULT_CARDS): Card[] {
  const candidates = main
    .map((d, i) => ({ d, previous: main[i - 1] }))
    .filter(({ d, previous }) => d.mover === 'student' && d.node.ply >= options.minCriticalPly && previous && d.explorerBefore.amateurs)
    .map(({ d, previous }) => {
      const share = d.explorerBefore.amateurs!.moves.find((m) => m.san === d.node.san)?.share ?? 0
      return { d, previous: previous!, share, score: 1 - share }
    })
    .filter((c) => c.score >= options.minCriticalScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, options.maxCritical)

  return candidates.map(({ d, previous, share, score }, i) => {
    const sans = [d.node.san, ...d.continuation].slice(0, options.solutionPlies)
    return {
      id: `c${chapter.index + 1}-crit${i + 1}`,
      kind: 'CRITICAL',
      title: `Crítica: após ${previous.label}`,
      reason: `Só ${Math.round(share * 100)}% dos jogadores de 1600–2000 jogam ${d.label} nesta posição.`,
      initialFen: d.node.fenBefore,
      studentColor: chapter.studentColor,
      roots: chainFromSans(d.node.fenBefore, sans, `c${chapter.index + 1}-crit${i + 1}`),
      sourceNodeId: d.node.id,
      score,
    }
  })
}

// Traps: an opponent move that amateurs play often and that the engine punishes. The card
// starts right after the mistake and asks for the punishment.
interface TrapCandidate {
  sourceNodeId: string
  title: string
  reason: string
  initialFen: string
  solution: string[]
  gain: number
}

export async function mineTraps(
  chapter: Chapter,
  main: NodeDossier[],
  engine: Engine,
  options = DEFAULT_CARDS,
): Promise<Card[]> {
  const found: TrapCandidate[] = []

  for (const d of main) {
    if (d.mover !== 'opponent' || !d.explorerBefore.amateurs || d.evalStudentCp === null) continue
    const mistakes = d.explorerBefore.amateurs.moves.filter(
      (m) => m.san !== d.node.san && m.share >= options.minMistakeShare && m.games >= options.minMistakeGames,
    )

    for (const mistake of mistakes) {
      const chess = new Chess(d.node.fenBefore)
      try {
        chess.move(mistake.san)
      } catch {
        continue
      }
      const initialFen = chess.fen()
      const best = (await engine.analyse(initialFen, 1))?.lines[0]
      const evalAfter = studentCp(best, chapter.studentColor)
      if (!best || evalAfter === null) continue

      const gain = evalAfter - d.evalStudentCp
      if (evalAfter < options.minTrapEvalCp || gain < options.minTrapGainCp) continue

      const label = moveLabel(d.node.moveNumber, d.node.color, mistake.san)
      found.push({
        sourceNodeId: d.node.id,
        title: `Armadilha: ${label}?`,
        reason:
          `${Math.round(mistake.share * 100)}% dos jogadores de 1600–2000 jogam ${label}; depois dele a engine dá ` +
          `${formatCp(evalAfter)} para o aluno (contra ${formatCp(d.evalStudentCp)} no lance do repertório).`,
        initialFen,
        // The engine's line, cut to a length a student can remember.
        solution: best.san.slice(0, options.solutionPlies),
        gain,
      })
    }
  }

  return found
    .sort((a, b) => b.gain - a.gain)
    .slice(0, options.maxTraps)
    .map((trap, i) => {
      const id = `c${chapter.index + 1}-trap${i + 1}`
      return {
        id,
        kind: 'TRAP' as const,
        title: trap.title,
        reason: trap.reason,
        initialFen: trap.initialFen,
        studentColor: chapter.studentColor,
        roots: chainFromSans(trap.initialFen, trap.solution, id),
        sourceNodeId: trap.sourceNodeId,
        score: trap.gain,
      }
    })
}

// Builds a single-line tree (no variations) from SAN moves.
export function chainFromSans(fen: string, sans: string[], idPrefix: string): LineNode[] {
  const chess = new Chess(fen)
  const nodes: LineNode[] = []
  for (const san of sans) {
    const fenBefore = chess.fen()
    let move
    try {
      move = chess.move(san)
    } catch {
      break // an illegal move ends the line; nothing after it can be trusted
    }
    nodes.push({
      id: `${idPrefix}-${nodes.length + 1}`,
      ply: nodes.length + 1,
      san: move.san,
      uci: `${move.from}${move.to}${move.promotion ?? ''}`,
      color: move.color,
      moveNumber: moveNumberOf(fenBefore),
      fenBefore,
      fenAfter: chess.fen(),
      mainline: true,
      authorComment: '',
      authorArrows: [],
      authorHighlights: [],
      children: [],
    })
  }
  for (let i = 0; i < nodes.length - 1; i++) nodes[i].children = [nodes[i + 1]]
  return nodes.length > 0 ? [nodes[0]] : []
}
