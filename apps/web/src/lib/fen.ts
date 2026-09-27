export type PieceColor = 'w' | 'b'
export type PieceType = 'k' | 'q' | 'r' | 'b' | 'n' | 'p'

export interface BoardPiece {
  color: PieceColor
  type: PieceType
}

// Reads only the piece placement field of a FEN into 8 ranks (rank 8 first) of 8 files
// (a to h). Enough to draw a static board without pulling chess.js into the render.
export function boardFromFen(fen: string): (BoardPiece | null)[][] {
  const placement = fen.split(' ')[0]
  return placement.split('/').map((rank) => {
    const squares: (BoardPiece | null)[] = []
    for (const char of rank) {
      if (/\d/.test(char)) {
        squares.push(...Array<null>(Number(char)).fill(null))
      } else {
        squares.push({ color: char === char.toUpperCase() ? 'w' : 'b', type: char.toLowerCase() as PieceType })
      }
    }
    return squares
  })
}
