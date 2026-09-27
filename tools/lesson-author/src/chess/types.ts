export type Color = 'w' | 'b'

export const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

// One move of a chapter, with the positions on both sides of it. `ply` counts from the
// chapter's first move (1-based) and is used only to order and label things.
export interface LineNode {
  id: string
  ply: number
  san: string
  uci: string
  color: Color
  moveNumber: number
  fenBefore: string
  fenAfter: string
  mainline: boolean
  authorComment: string
  authorArrows: string[]
  authorHighlights: string[]
  children: LineNode[]
}

export interface Chapter {
  index: number
  title: string
  studyName?: string
  studentColor: Color
  initialFen: string
  roots: LineNode[]
}
