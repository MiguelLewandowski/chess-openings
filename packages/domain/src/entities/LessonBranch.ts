const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

// A lesson's main line, in standard (English) SAN, from the position the lesson starts at
// (null = the initial position).
export interface LessonLine {
  initialFen: string | null
  sans: string[]
}

// The branch of each lesson of a path: the move that leaves the trunk the lessons share (their
// longest common prefix), labelled in Portuguese notation with its number ("2...Cf6", or
// "2.d4" when the student plays Black). In a path that move is the opponent's: we answer each
// position one way, so the lines can only part where the opponent chooses.
//
// A lesson whose line ends before the divergence goes to the branch of the first lesson that
// has one. Without a divergence (one lesson, a single chain of lines) or with lessons starting
// from different positions, every lesson gets null: one branch, the trail as a plain sequence.
export function branchOf(lines: LessonLine[]): (string | null)[] {
  const startFen = lines[0]?.initialFen ?? STARTING_FEN
  if (lines.some((l) => (l.initialFen ?? STARTING_FEN) !== startFen)) return lines.map(() => null)

  const divergence = divergencePly(lines)
  if (divergence === null) return lines.map(() => null)

  const labels = lines.map((l) => (l.sans.length > divergence ? moveLabel(l.sans[divergence], divergence, startFen) : null))
  const fallback = labels.find((label) => label !== null) ?? null
  return labels.map((label) => label ?? fallback)
}

// The first ply where the lines still going disagree; null when they never do. Lines that end
// drop out, so a short lesson never cuts the trunk short.
function divergencePly(lines: LessonLine[]): number | null {
  for (let ply = 0; ; ply++) {
    const moves = new Set(lines.filter((l) => l.sans.length > ply).map((l) => l.sans[ply]))
    if (moves.size === 0) return null
    if (moves.size > 1) return ply
  }
}

function moveLabel(san: string, ply: number, startFen: string): string {
  const [, turn = 'w', , , , fullmove = '1'] = startFen.split(' ')
  const blackStarts = turn === 'b'
  const moveNumber = (Number.parseInt(fullmove, 10) || 1) + Math.floor((ply + (blackStarts ? 1 : 0)) / 2)
  const whiteMoves = (ply % 2 === 0) !== blackStarts
  return `${moveNumber}${whiteMoves ? '.' : '...'}${sanToPortuguese(san)}`
}

// R = rei, D = dama, T = torre, B = bispo, C = cavalo.
const PORTUGUESE_PIECES: Record<string, string> = { K: 'R', Q: 'D', R: 'T', B: 'B', N: 'C' }

function sanToPortuguese(san: string): string {
  const piece = /^[KQRBN]/.test(san) ? PORTUGUESE_PIECES[san[0]] + san.slice(1) : san
  return piece.replace(/=([QRBN])/, (_, p: string) => `=${PORTUGUESE_PIECES[p]}`)
}
