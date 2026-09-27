import { describe, it, expect } from 'vitest'
import { practiceQuality, practiceXp } from '../PracticeScore'

const attempt = (mistakes = 0, pieceHints = 0, revealedMoves = 0) => ({ mistakes, pieceHints, revealedMoves })

describe('practiceQuality', () => {
  it('should be 5 for a run with no mistakes and no hints', () => {
    expect(practiceQuality(attempt())).toBe(5)
  })

  it('should take one point per mistake and per piece hint', () => {
    expect(practiceQuality(attempt(1))).toBe(4)
    expect(practiceQuality(attempt(1, 1))).toBe(3)
  })

  it('should take two points per revealed move', () => {
    expect(practiceQuality(attempt(0, 0, 1))).toBe(3)
    expect(practiceQuality(attempt(0, 0, 2))).toBe(1)
  })

  it('should fail the line (below 3) after three mistakes', () => {
    expect(practiceQuality(attempt(3))).toBe(2)
  })

  it('should never go below 0', () => {
    expect(practiceQuality(attempt(4, 2, 3))).toBe(0)
  })
})

describe('practiceXp', () => {
  it('should pay the perfect-run bonus only at quality 5', () => {
    expect(practiceXp(5)).toBe(15)
    expect(practiceXp(4)).toBe(8)
  })

  it('should pay nothing at quality 0', () => {
    expect(practiceXp(0)).toBe(0)
  })
})
