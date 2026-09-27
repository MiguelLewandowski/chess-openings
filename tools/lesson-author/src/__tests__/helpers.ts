import { computeFacts } from '../chess/facts'
import { moveLabel } from '../chess/notation'
import type { LineNode } from '../chess/types'
import type { NodeDossier } from '../enrich'
import type { Engine, EngineResult } from '../sources/engine'

export const ENGLISH_PGN = `[Event "Abertura Inglesa: Linha principal"]
[StudyName "Abertura Inglesa"]
[ChapterName "Linha principal"]
[Orientation "white"]

1. c4 {Controla d5 [%cal Gc4d5]} 1... e5 2. g3 (2. Nc3 Nf6) 2... Nf6 3. Bg2 {O bispo vigia a diagonal} 3... d5 *
`

// A dossier without network: facts are real, engine and explorer data are whatever the
// test passes in.
export function dossierFor(node: LineNode, overrides: Partial<NodeDossier> = {}): NodeDossier {
  return {
    node,
    label: moveLabel(node.moveNumber, node.color, node.san),
    mover: node.color === 'w' ? 'student' : 'opponent',
    facts: computeFacts(node.fenAfter, node.uci.slice(2, 4)),
    engineAfter: null,
    evalStudentCp: null,
    explorerBefore: { masters: null, amateurs: null },
    alternatives: [],
    opponentOptions: [],
    continuation: continuationOf(node),
    ...overrides,
  }
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

export class FakeEngine implements Engine {
  readonly name = 'fake'
  readonly calls: string[] = []

  constructor(private readonly answers: Record<string, EngineResult | null>) {}

  async analyse(fen: string): Promise<EngineResult | null> {
    this.calls.push(fen)
    return this.answers[fen] ?? null
  }

  async close(): Promise<void> {}
}
