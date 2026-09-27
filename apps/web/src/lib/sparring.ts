import { Chess } from 'chess.js'

export type SparringColor = 'white' | 'black'

export type SparringLevel = 'easy' | 'medium' | 'hard'

// Skill Level (0–20) weakens Stockfish's choices; the think time caps how deep it looks. The
// lite build is already weaker than full Stockfish, so "hard" is strong but not superhuman.
export const SPARRING_LEVELS: Record<SparringLevel, { label: string; skill: number; movetimeMs: number }> = {
  easy: { label: 'Iniciante', skill: 1, movetimeMs: 150 },
  medium: { label: 'Intermediário', skill: 8, movetimeMs: 400 },
  hard: { label: 'Forte', skill: 20, movetimeMs: 1200 },
}

export interface UciMove {
  from: string
  to: string
  promotion?: string
}

// "bestmove e7e8q ponder d2d4" → { from: 'e7', to: 'e8', promotion: 'q' }. Null for anything
// else, including "bestmove (none)" when the side to move has no legal move.
export function parseBestMove(line: string): UciMove | null {
  const match = /^bestmove ([a-h][1-8])([a-h][1-8])([qrbn])?/.exec(line.trim())
  if (!match) return null
  return match[3] ? { from: match[1], to: match[2], promotion: match[3] } : { from: match[1], to: match[2] }
}

export function sideToMove(fen: string): SparringColor {
  return fen.split(' ')[1] === 'b' ? 'black' : 'white'
}

export type SparringOutcome =
  | { result: 'win' | 'loss'; reason: 'checkmate' }
  | { result: 'draw'; reason: 'stalemate' | 'repetition' | 'insufficient' | 'fifty-moves' }

// How the game ended, from the student's point of view; null while it goes on. `history` is
// the list of positions played, needed to spot a threefold repetition.
export function sparringOutcome(history: string[], player: SparringColor): SparringOutcome | null {
  const fen = history[history.length - 1]
  const game = new Chess(fen)
  if (game.isCheckmate()) return { result: sideToMove(fen) === player ? 'loss' : 'win', reason: 'checkmate' }
  if (game.isStalemate()) return { result: 'draw', reason: 'stalemate' }
  if (game.isInsufficientMaterial()) return { result: 'draw', reason: 'insufficient' }
  if (game.isDrawByFiftyMoves()) return { result: 'draw', reason: 'fifty-moves' }
  if (isThreefold(history)) return { result: 'draw', reason: 'repetition' }
  return null
}

// Same placement, side to move, castling and en passant: the move counters are left out.
const positionKey = (fen: string) => fen.split(' ').slice(0, 4).join(' ')

function isThreefold(history: string[]): boolean {
  const last = positionKey(history[history.length - 1])
  return history.filter((fen) => positionKey(fen) === last).length >= 3
}
