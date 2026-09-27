export interface VisualMarkers {
  arrows: string[]
  circles: string[]
}

export interface ParsedNode {
  id: string
  san: string
  fen: string
  player: 'WHITE' | 'BLACK'
  originalComment: string
  visualMarkers: VisualMarkers | null
  children: ParsedNode[]
  isMainLine: boolean
  pieceMoved: string
  capturedPiece?: string
  isCheck: boolean
}

export interface ParsedChapter {
  title: string
  // Study name, when the PGN carries it (Lichess exports do).
  studyName?: string
  // The side the student plays: the chapter's board orientation on Lichess.
  studentColor: 'WHITE' | 'BLACK'
  // Comment before the first move; for a card, the question shown to the student.
  intro: string
  initialFen: string
  rootNodes: ParsedNode[]
}

export interface IPgnParser {
  parseStudy(pgnString: string): ParsedChapter[]
}
