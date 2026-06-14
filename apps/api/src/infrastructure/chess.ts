import { Chess } from 'chess.js'
import type { Move } from 'chess.js'

export const ChessWrapper = {
  isValidFen(fen: string): boolean {
    try { new Chess(fen); return true } catch { return false }
  },

  playMove(fen: string, move: string | { from: string; to: string; promotion?: string }): { newFen: string; moveDetails: Move } | null {
    try {
      const game = new Chess(fen)
      const moveDetails = game.move(move)
      return { newFen: game.fen(), moveDetails }
    } catch { return null }
  },

  STARTING_FEN: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
}
