import { describe, it, expect } from 'vitest'
import { levelFromXp } from '../Level'

describe('levelFromXp', () => {
  it('should start at level 1 with no XP', () => {
    expect(levelFromXp(0)).toEqual({ level: 1, xpIntoLevel: 0, xpForNextLevel: 100 })
  })

  it('should stay at level 1 just below the first threshold', () => {
    expect(levelFromXp(99)).toEqual({ level: 1, xpIntoLevel: 99, xpForNextLevel: 100 })
  })

  it('should reach level 2 at exactly 100 XP', () => {
    expect(levelFromXp(100)).toEqual({ level: 2, xpIntoLevel: 0, xpForNextLevel: 200 })
  })

  it('should make each level cost 100 XP more than the previous one', () => {
    // 100 (L1→L2) + 200 (L2→L3) = 300, so 320 XP is level 3 with 20 XP into it.
    expect(levelFromXp(320)).toEqual({ level: 3, xpIntoLevel: 20, xpForNextLevel: 300 })
  })

  it('should treat negative XP as zero', () => {
    expect(levelFromXp(-50)).toEqual({ level: 1, xpIntoLevel: 0, xpForNextLevel: 100 })
  })
})
