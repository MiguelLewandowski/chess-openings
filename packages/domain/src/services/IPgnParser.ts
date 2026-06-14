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
  initialFen: string
  rootNodes: ParsedNode[]
}

export interface IPgnParser {
  parseStudy(pgnString: string): ParsedChapter[]
}
