import type { MoveSummary } from '@chess-openings/domain'

// All in-session narration strings (pt-BR), centralized so copy lives in one place.
export const gameCopy = {
  yourTurn: 'Sua vez! Jogue a linha de memória.',
  illegalMove: 'Lance ilegal!',
  lessonCompleted: 'Parabéns! Você concluiu este exercício.',
  watchBlunder: 'Observe — o adversário está prestes a errar feio!',
  watchStart: 'Observe a linha lance a lance. Depois é a sua vez de jogá-la de memória.',
  watchDone: 'Essa é a linha completa. Agora é a sua vez de jogá-la sem ajuda.',
  hintPiece: 'Dica: mova a peça destacada.',
  hintMove: (san: string) => `O lance é ${san}. Jogue-o no tabuleiro.`,
  goodMove: (san: string) => `Bom lance: ${san}`,
  lineMove: (san: string) => `Jogamos ${san}.`,
  opponentMove: (san: string) => `O adversário responde ${san}.`,
  opponentPlayed: (san: string) => `Adversário jogou ${san}. Sua vez!`,
  previousMove: (san: string) => `Lance: ${san}`,
  notTheory: (san: string) => `${san} não é o lance da linha. Tente de novo ou peça uma dica.`,
}

// The coach narration for a move, or null when there is none usable: either
// missing, or a raw "Erro" annotation carried over from the PGN import that
// should not be shown to the student.
export function coachComment(move: Pick<MoveSummary, 'coachInsights'>): string | null {
  const comment = move.coachInsights?.comment
  if (!comment || comment.includes('Erro')) return null
  return comment
}
