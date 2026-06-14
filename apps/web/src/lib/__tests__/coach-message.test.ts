import { describe, expect, it } from 'vitest'
import { coachComment, gameCopy } from '@/lib/coach-message'

describe('coachComment', () => {
  it('returns the comment when present and not an error annotation', () => {
    expect(coachComment({ coachInsights: { comment: 'Controle o centro' } })).toBe('Controle o centro')
  })

  it('returns null when there is no comment', () => {
    expect(coachComment({ coachInsights: null })).toBeNull()
    expect(coachComment({ coachInsights: {} })).toBeNull()
  })

  it('hides raw "Erro" annotations carried over from the PGN import', () => {
    expect(coachComment({ coachInsights: { comment: 'Erro: lance fraco' } })).toBeNull()
  })
})

describe('gameCopy', () => {
  it('formats move narration in pt-BR', () => {
    expect(gameCopy.goodMove('e4')).toBe('Bom lance: e4')
    expect(gameCopy.opponentPlayed('e5')).toBe('Adversário jogou e5. Sua vez!')
    expect(gameCopy.hint('foco em f7')).toBe('Dica: foco em f7')
  })
})
