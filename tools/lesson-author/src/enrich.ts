import { Chess } from 'chess.js'
import { computeFacts, materialFor, type PositionFacts } from './chess/facts'
import { moveLabel } from './chess/notation'
import type { Chapter, LineNode } from './chess/types'
import { allNodes, mainline } from './pgn/read'
import { studentCp, type Engine, type EngineResult } from './sources/engine'
import type { ExplorerMove, ExplorerResult, LichessExplorer } from './sources/explorer'

// A move the student could have played instead of the repertoire move, with what the
// engine says about it. The model may only write "why not X" for these.
export interface Alternative {
  id: string
  san: string
  amateurShare: number | null
  mastersShare: number | null
  evalDeltaCp: number | null // student's view: alternative minus repertoire move (negative = worse)
  refutation: string[] // engine line after the alternative, SAN
  // The student's material balance at the end of the refutation, in pawns (-2 = e.g. a
  // piece for a pawn). Absolute, not a difference: the alternative often comes in the
  // middle of an exchange, where "before" is not a meaningful baseline. Computed so the
  // model never has to count captures itself.
  materialAfterRefutation: number | null
}

export interface NodeDossier {
  node: LineNode
  label: string
  mover: 'student' | 'opponent'
  facts: PositionFacts
  engineAfter: EngineResult | null
  evalStudentCp: number | null
  explorerBefore: { masters: ExplorerResult | null; amateurs: ExplorerResult | null }
  alternatives: Alternative[]
  opponentOptions: ExplorerMove[] // popular replies the repertoire does not cover
  continuation: string[] // next main-line moves, SAN
}

export interface EnrichOptions {
  engineLines: number
  maxAlternatives: number
  // No "why not X" before this ply: the first moves are the choice of opening (2.f4 is the
  // King's Gambit, not a mistake), not an error to explain.
  minAlternativePly: number
  minOpponentShare: number
}

export const DEFAULT_ENRICH: EnrichOptions = { engineLines: 3, maxAlternatives: 3, minAlternativePly: 5, minOpponentShare: 0.1 }

export class Enricher {
  constructor(
    private readonly engine: Engine,
    private readonly explorer: LichessExplorer,
    private readonly options: EnrichOptions = DEFAULT_ENRICH,
  ) {}

  async chapter(chapter: Chapter, onProgress?: (done: number, total: number) => void): Promise<NodeDossier[]> {
    const main = new Set(mainline(chapter).map((n) => n.id))
    const nodes = allNodes(chapter.roots)
    const dossiers: NodeDossier[] = []
    for (const node of nodes) {
      dossiers.push(await this.node(node, chapter.studentColor, main.has(node.id)))
      onProgress?.(dossiers.length, nodes.length)
    }
    return dossiers
  }

  async node(node: LineNode, student: Chapter['studentColor'], isMainline: boolean): Promise<NodeDossier> {
    const mover = node.color === student ? 'student' : 'opponent'
    const engineAfter = await this.engine.analyse(node.fenAfter, this.options.engineLines)
    const evalStudentCp = studentCp(engineAfter?.lines[0], student)

    // Explorer data only for the main line: it is what the lesson teaches, and it keeps the
    // number of requests to a free service reasonable.
    const explorerBefore = isMainline
      ? {
          masters: await this.explorer.query(node.fenBefore, 'masters'),
          amateurs: await this.explorer.query(node.fenBefore, 'amateurs'),
        }
      : { masters: null, amateurs: null }

    const alternatives =
      isMainline && mover === 'student' && node.ply >= this.options.minAlternativePly
        ? await this.alternatives(node, student, evalStudentCp, explorerBefore)
        : []

    const opponentOptions =
      isMainline && mover === 'opponent'
        ? (explorerBefore.amateurs?.moves ?? []).filter(
            (m) => m.san !== node.san && m.share >= this.options.minOpponentShare,
          )
        : []

    return {
      node,
      label: moveLabel(node.moveNumber, node.color, node.san),
      mover,
      facts: computeFacts(node.fenAfter, node.uci.slice(2, 4)),
      engineAfter,
      evalStudentCp,
      explorerBefore,
      alternatives,
      opponentOptions,
      continuation: continuationOf(node),
    }
  }

  private async alternatives(
    node: LineNode,
    student: Chapter['studentColor'],
    repertoireCp: number | null,
    explorer: NodeDossier['explorerBefore'],
  ): Promise<Alternative[]> {
    const before = await this.engine.analyse(node.fenBefore, this.options.engineLines)
    const candidates = new Set<string>()
    for (const line of before?.lines ?? []) if (line.san[0]) candidates.add(line.san[0])
    for (const move of (explorer.amateurs?.moves ?? []).slice(0, this.options.maxAlternatives)) candidates.add(move.san)
    candidates.delete(node.san)

    const result: Alternative[] = []
    for (const san of [...candidates].slice(0, this.options.maxAlternatives)) {
      const chess = new Chess(node.fenBefore)
      try {
        chess.move(san)
      } catch {
        continue
      }
      const after = await this.engine.analyse(chess.fen(), 1)
      const altCp = studentCp(after?.lines[0], student)
      const refutation = after?.lines[0]?.san.slice(0, 6) ?? []
      result.push({
        id: `${node.id}-alt${result.length + 1}`,
        san,
        amateurShare: explorer.amateurs?.moves.find((m) => m.san === san)?.share ?? null,
        mastersShare: explorer.masters?.moves.find((m) => m.san === san)?.share ?? null,
        evalDeltaCp: altCp !== null && repertoireCp !== null ? altCp - repertoireCp : null,
        refutation,
        materialAfterRefutation: materialAfter(node.fenBefore, [san, ...refutation], student),
      })
    }
    return result
  }
}

export function materialAfter(fen: string, sans: string[], student: Chapter['studentColor']): number | null {
  const chess = new Chess(fen)
  for (const san of sans) {
    try {
      chess.move(san)
    } catch {
      return null
    }
  }
  return materialFor(chess.fen(), student)
}

function continuationOf(node: LineNode): string[] {
  const line: string[] = []
  let next = node.children[0]
  while (next && line.length < 6) {
    line.push(next.san)
    next = next.children[0]
  }
  return line
}
