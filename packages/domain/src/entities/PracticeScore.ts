// How a practice run went: what the student needed to get through the line.
export interface PracticeAttempt {
  // Moves played that were legal but not the line.
  mistakes: number
  // Hints that only showed which piece to move.
  pieceHints: number
  // Hints that showed the whole move.
  revealedMoves: number
}

// Penalty points per event. A revealed move weighs 2 because the student recalled nothing.
export const PRACTICE_PENALTY = { mistake: 1, pieceHint: 1, revealedMove: 2 } as const

export const PERFECT_RUN_BONUS_XP = 5

// SM-2 quality (0–5) of a practice run: 5 minus the penalty points. Below 3 SM-2 treats
// the line as forgotten and brings it back the next day.
export function practiceQuality({ mistakes, pieceHints, revealedMoves }: PracticeAttempt): number {
  const penalty =
    mistakes * PRACTICE_PENALTY.mistake +
    pieceHints * PRACTICE_PENALTY.pieceHint +
    revealedMoves * PRACTICE_PENALTY.revealedMove
  return Math.max(0, 5 - penalty)
}

// XP follows the quality, so a run with slips still pays something and a perfect one pays
// a bonus on top.
export function practiceXp(quality: number): number {
  return quality * 2 + (quality === 5 ? PERFECT_RUN_BONUS_XP : 0)
}
