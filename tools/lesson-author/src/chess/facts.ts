import { Chess, SQUARES, type Square } from 'chess.js'
import { sanToPt } from './notation'
import type { Color } from './types'

const VALUE: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

// Facts about a position that the program computes and the model is allowed to cite.
// Everything here is derived by chess.js, so none of it can be hallucinated.
export interface PositionFacts {
  sideToMove: Color
  inCheck: boolean
  materialBalance: number // pawns, positive = White is ahead
  pieces: { w: string[]; b: string[] } // "Cf3", "Bg2", "e4" (pawns as bare squares)
  hanging: string[] // pieces attacked and not defended, e.g. "Cf3 (brancas)"
  movedPieceControls: string[] // squares the piece that just moved attacks
  pawnFiles: { w: string[]; b: string[] }
  openFiles: string[]
  semiOpenFiles: { w: string[]; b: string[] } // files with no own pawn but an enemy pawn
  doubledPawns: string[]
  isolatedPawns: string[]
  castling: string
  // Pieces still on their starting squares, e.g. "Cb1", "Bc1", "Dd1": the honest answer to
  // "is the development complete?".
  undeveloped: { w: string[]; b: string[] }
  castled: { w: boolean; b: boolean }
  ascii: string
}

export function computeFacts(fen: string, movedTo?: string): PositionFacts {
  const chess = new Chess(fen)
  const pieces: PositionFacts['pieces'] = { w: [], b: [] }
  const pawnsByFile: Record<Color, Record<string, number>> = { w: {}, b: {} }
  const hanging: string[] = []
  let materialBalance = 0

  for (const square of SQUARES) {
    const piece = chess.get(square)
    if (!piece) continue
    const label = piece.type === 'p' ? square : `${sanToPt(piece.type.toUpperCase())}${square}`
    pieces[piece.color].push(label)
    materialBalance += (piece.color === 'w' ? 1 : -1) * VALUE[piece.type]
    if (piece.type === 'p') pawnsByFile[piece.color][square[0]] = (pawnsByFile[piece.color][square[0]] ?? 0) + 1

    const enemy: Color = piece.color === 'w' ? 'b' : 'w'
    if (piece.type !== 'k' && chess.attackers(square, enemy).length > 0 && chess.attackers(square, piece.color).length === 0) {
      hanging.push(`${label} (${piece.color === 'w' ? 'brancas' : 'pretas'})`)
    }
  }

  const fileSet = (color: Color) => FILES.filter((f) => pawnsByFile[color][f])
  const doubled = (['w', 'b'] as Color[]).flatMap((c) =>
    FILES.filter((f) => (pawnsByFile[c][f] ?? 0) > 1).map((f) => `coluna ${f} (${c === 'w' ? 'brancas' : 'pretas'})`),
  )
  const isolated = (['w', 'b'] as Color[]).flatMap((c) =>
    FILES.filter((f, i) => pawnsByFile[c][f] && !pawnsByFile[c][FILES[i - 1]] && !pawnsByFile[c][FILES[i + 1]]).map(
      (f) => `coluna ${f} (${c === 'w' ? 'brancas' : 'pretas'})`,
    ),
  )

  return {
    sideToMove: chess.turn(),
    inCheck: chess.isCheck(),
    materialBalance,
    pieces,
    hanging,
    movedPieceControls: movedTo ? squaresAttackedFrom(chess, movedTo as Square) : [],
    pawnFiles: { w: fileSet('w'), b: fileSet('b') },
    openFiles: FILES.filter((f) => !pawnsByFile.w[f] && !pawnsByFile.b[f]),
    semiOpenFiles: {
      w: FILES.filter((f) => !pawnsByFile.w[f] && pawnsByFile.b[f]),
      b: FILES.filter((f) => !pawnsByFile.b[f] && pawnsByFile.w[f]),
    },
    doubledPawns: doubled,
    isolatedPawns: isolated,
    castling: fen.split(' ')[2] ?? '-',
    undeveloped: { w: undevelopedPieces(chess, 'w'), b: undevelopedPieces(chess, 'b') },
    castled: { w: hasCastled(chess, 'w'), b: hasCastled(chess, 'b') },
    ascii: chess.ascii(),
  }
}

const HOME: Record<Color, [Square, string][]> = {
  w: [['b1', 'n'], ['g1', 'n'], ['c1', 'b'], ['f1', 'b'], ['d1', 'q']],
  b: [['b8', 'n'], ['g8', 'n'], ['c8', 'b'], ['f8', 'b'], ['d8', 'q']],
}

function undevelopedPieces(chess: Chess, color: Color): string[] {
  return HOME[color]
    .filter(([square, type]) => {
      const piece = chess.get(square)
      return piece?.color === color && piece.type === type
    })
    .map(([square, type]) => `${sanToPt(type.toUpperCase())}${square}`)
}

// A king on g1/c1 (g8/c8): castled, for teaching purposes (walking the king there by hand
// is rare enough in opening lines to ignore).
function hasCastled(chess: Chess, color: Color): boolean {
  const rank = color === 'w' ? '1' : '8'
  return ['g', 'c'].some((file) => {
    const piece = chess.get(`${file}${rank}` as Square)
    return piece?.type === 'k' && piece.color === color
  })
}

// Material from `color`'s side, in pawns (queen 9, rook 5, minor 3).
export function materialFor(fen: string, color: Color): number {
  const balance = computeMaterialBalance(new Chess(fen))
  return color === 'w' ? balance : -balance
}

function computeMaterialBalance(chess: Chess): number {
  let balance = 0
  for (const square of SQUARES) {
    const piece = chess.get(square)
    if (piece) balance += (piece.color === 'w' ? 1 : -1) * VALUE[piece.type]
  }
  return balance
}

// Every square the piece standing on `from` attacks (occupied or not, own pieces included:
// "defends" is an attack on a square held by an own piece).
export function squaresAttackedFrom(chess: Chess, from: Square): string[] {
  const piece = chess.get(from)
  if (!piece) return []
  return SQUARES.filter((square) => square !== from && chess.attackers(square, piece.color).includes(from))
}

export function pieceAt(fen: string, square: string): { color: Color; type: string } | null {
  if (!isSquare(square)) return null
  const piece = new Chess(fen).get(square)
  return piece ? { color: piece.color, type: piece.type } : null
}

export function isSquare(value: string): value is Square {
  return /^[a-h][1-8]$/.test(value)
}
