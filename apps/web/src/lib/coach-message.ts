import type { MoveSummary } from '@chess-openings/domain'

// All in-session narration strings (pt-BR), centralized so copy lives in one place.
export const gameCopy = {
  yourTurn: 'Sua vez! Encontre o melhor lance.',
  illegalMove: 'Lance ilegal!',
  lessonCompleted: 'Parabéns! Você concluiu a teoria desta lição!',
  watchBlunder: 'Observe — o adversário está prestes a errar feio!',
  hint: (comment: string) => `Dica: ${comment}`,
  goodMove: (san: string) => `Bom lance: ${san}`,
  opponentPlayed: (san: string) => `Adversário jogou ${san}. Sua vez!`,
  previousMove: (san: string) => `Lance: ${san}`,
  notTheory: (san: string) => `${san} é legal, mas não é a teoria!`,
}

// The coach narration for a move, or null when there is none usable: either
// missing, or a raw "Erro" annotation carried over from the PGN import that
// should not be shown to the student.
export function coachComment(move: Pick<MoveSummary, 'coachInsights'>): string | null {
  const comment = move.coachInsights?.comment
  if (!comment || comment.includes('Erro')) return null
  return comment
}
