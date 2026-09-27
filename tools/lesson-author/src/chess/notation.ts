import { Chess, type Square } from 'chess.js'
import type { Color } from './types'

// Comments are written for Brazilian students, in Portuguese algebraic notation
// (R = rei, D = dama, T = torre, B = bispo, C = cavalo). Everything the program computes
// uses standard English SAN, so these two maps are the only bridge between them.
const PT_TO_EN: Record<string, string> = { R: 'K', D: 'Q', T: 'R', B: 'B', C: 'N' }
const EN_TO_PT: Record<string, string> = { K: 'R', Q: 'D', R: 'T', B: 'B', N: 'C' }

export function sanToPt(san: string): string {
  const piece = /^[KQRBN]/.test(san) ? EN_TO_PT[san[0]] + san.slice(1) : san
  return piece.replace(/=([QRBN])/, (_, p: string) => `=${EN_TO_PT[p]}`)
}

export function sanFromPt(san: string): string {
  const piece = /^[RDTBC]/.test(san) ? PT_TO_EN[san[0]] + san.slice(1) : san
  return piece.replace(/=([DTBC])/, (_, p: string) => `=${PT_TO_EN[p]}`)
}

// "4.d4" for White, "4...Cf6" for Black.
export function moveLabel(moveNumber: number, color: Color, san: string): string {
  return `${moveNumber}${color === 'w' ? '.' : '...'}${sanToPt(san)}`
}

export function moveNumberOf(fen: string): number {
  return Number.parseInt(fen.split(' ')[5] ?? '1', 10) || 1
}

export function sideToMove(fen: string): Color {
  return fen.split(' ')[1] === 'b' ? 'b' : 'w'
}

// Converts engine output (UCI, e.g. "e2e4 e7e5") into SAN from a position. Stops at the
// first move that is not legal, so a malformed line can never produce fake moves.
export function uciLineToSan(fen: string, uciMoves: string[]): string[] {
  const chess = new Chess(fen)
  const sans: string[] = []
  for (const uci of uciMoves) {
    try {
      const to = standardCastlingTarget(chess, uci)
      const move = chess.move({ from: uci.slice(0, 2), to, promotion: uci[4] })
      sans.push(move.san)
    } catch {
      break
    }
  }
  return sans
}

// The Lichess cloud eval writes castling the Chess960 way, as the king capturing its own
// rook ("e1h1"); chess.js only accepts the king's destination ("e1g1").
function standardCastlingTarget(chess: Chess, uci: string): string {
  const from = uci.slice(0, 2)
  const to = uci.slice(2, 4)
  const piece = chess.get(from as Square)
  const target = chess.get(to as Square)
  if (piece?.type !== 'k' || target?.type !== 'r' || target.color !== piece.color) return to
  return `${to[0] > from[0] ? 'g' : 'c'}${from[1]}`
}

// "5.h3 Bxf3 6.Dxf3" — numbered, in Portuguese notation, starting from `fen`.
export function formatLine(fen: string, sans: string[]): string {
  let moveNumber = moveNumberOf(fen)
  let color = sideToMove(fen)
  return sans
    .map((san, i) => {
      const pt = sanToPt(san)
      const label = color === 'w' ? `${moveNumber}.${pt}` : i === 0 ? `${moveNumber}...${pt}` : pt
      if (color === 'b') moveNumber += 1
      color = color === 'w' ? 'b' : 'w'
      return label
    })
    .join(' ')
}
