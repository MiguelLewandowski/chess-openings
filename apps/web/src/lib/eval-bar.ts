import type { MoveSummary } from '@chess-openings/domain'
import type { GameStatus, SessionMode } from '@/store/GameStore'
import { sideToMove } from './sparring'

// Always from White's point of view. `moves: 0` means the position on the board is already
// checkmate, won by `winner`.
export type Evaluation =
  | { kind: 'cp'; cp: number }
  | { kind: 'mate'; winner: 'white' | 'black'; moves: number }

// Past ten pawns the game is decided; more resolution there would only squeeze the range
// that matters.
const CP_LIMIT = 1000
// Lichess's winning-chances curve: +0.5 moves the bar a little, +5 most of the way.
const CP_SLOPE = 0.00368208

// How much of the bar is White's, from 0 to 100.
export function whiteShare(evaluation: Evaluation): number {
  if (evaluation.kind === 'mate') return evaluation.winner === 'white' ? 100 : 0
  const cp = Math.max(-CP_LIMIT, Math.min(CP_LIMIT, evaluation.cp))
  const winningChances = 2 / (1 + Math.exp(-CP_SLOPE * cp)) - 1
  return 50 + 50 * winningChances
}

// "+1.2", "-0.4", "0.0", "+12", "M3", "-M2". Short enough to fit inside the vertical bar.
export function formatEvaluation(evaluation: Evaluation): string {
  if (evaluation.kind === 'mate') {
    if (evaluation.moves === 0) return evaluation.winner === 'white' ? '1-0' : '0-1'
    return `${evaluation.winner === 'white' ? '' : '-'}M${evaluation.moves}`
  }
  const pawns = Math.round(Math.abs(evaluation.cp) / 10) / 10
  if (pawns === 0) return '0.0'
  const sign = evaluation.cp > 0 ? '+' : '-'
  return pawns >= 10 ? `${sign}${Math.round(pawns)}` : `${sign}${pawns.toFixed(1)}`
}

export function fromStoredCp(cp: number): Evaluation {
  return { kind: 'cp', cp }
}

// A Stockfish "info" line, whose score is the side to move's, turned to White's point of view.
// Null for lines without a score and for bounds (an aspiration window's guess, not a result).
export function parseUciInfo(line: string, fen: string): { depth: number; evaluation: Evaluation } | null {
  const match = /^info .*?\bdepth (\d+)\b.*?\bscore (cp|mate) (-?\d+)( lowerbound| upperbound)?/.exec(line)
  if (!match || match[4]) return null

  const depth = Number(match[1])
  const value = Number(match[3])
  const mover = sideToMove(fen)
  const other = mover === 'white' ? 'black' : 'white'

  if (match[2] === 'cp') return { depth, evaluation: { kind: 'cp', cp: mover === 'white' ? value : -value } }
  // "mate 0": the side to move has been mated.
  const winner = value > 0 ? mover : other
  return { depth, evaluation: { kind: 'mate', winner, moves: Math.abs(value) } }
}

export type EvalBarTarget = {
  // The position to evaluate: a move of the line, or null for the exercise's start.
  nodeId: string | null
  // False when the bar shows an earlier position than the board's.
  current: boolean
}

// Which position the bar may evaluate. The demonstration shows every position. In practice
// (lessons, reviews and cards) the evaluation of the position the student must answer would
// give the answer away, so during their turn the bar keeps the position after their own last
// move, and stays hidden (null) until they play one.
export function evalBarTarget(
  moves: MoveSummary[],
  currentNodeId: string | null,
  mode: SessionMode,
  status: GameStatus,
): EvalBarTarget | null {
  if (mode === 'watch' || status === 'completed') return { nodeId: currentNodeId, current: true }

  let node = moves.find((m) => m.id === currentNodeId)
  while (node && node.isOpponentResponse) {
    const parentId: string | null = node.parentId
    node = moves.find((m) => m.id === parentId)
  }
  if (!node) return null
  return { nodeId: node.id, current: node.id === currentNodeId }
}
