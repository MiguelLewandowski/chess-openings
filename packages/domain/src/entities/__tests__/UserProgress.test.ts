import { describe, it, expect } from 'vitest'
import { applySM2, calcStreak } from '../UserProgress'

describe('applySM2', () => {
  it('should reset interval and repetitions when quality < 3', () => {
    const result = applySM2({ easinessFactor: 2.5, interval: 10, repetitions: 3 }, 2)
    expect(result.repetitions).toBe(0)
    expect(result.interval).toBe(1)
  })

  it('should set interval to 1 on first correct answer', () => {
    const result = applySM2({ easinessFactor: 2.5, interval: 0, repetitions: 0 }, 5)
    expect(result.interval).toBe(1)
    expect(result.repetitions).toBe(1)
  })

  it('should set interval to 6 on second correct answer', () => {
    const result = applySM2({ easinessFactor: 2.5, interval: 1, repetitions: 1 }, 5)
    expect(result.interval).toBe(6)
    expect(result.repetitions).toBe(2)
  })

  it('should multiply interval by easiness factor from third answer onward', () => {
    const result = applySM2({ easinessFactor: 2.5, interval: 6, repetitions: 2 }, 5)
    expect(result.interval).toBe(15)
    expect(result.repetitions).toBe(3)
  })

  it('should not drop easiness factor below 1.3', () => {
    const result = applySM2({ easinessFactor: 1.3, interval: 1, repetitions: 0 }, 0)
    expect(result.easinessFactor).toBeGreaterThanOrEqual(1.3)
  })

  it('should return a future nextReview date', () => {
    const result = applySM2({ easinessFactor: 2.5, interval: 0, repetitions: 0 }, 5)
    expect(result.nextReview.getTime()).toBeGreaterThan(Date.now())
  })
})

describe('calcStreak', () => {
  it('should return 1 when there is no previous study date', () => {
    expect(calcStreak(null, 5)).toBe(1)
  })

  it('should keep current streak when already studied today', () => {
    expect(calcStreak(new Date(), 5)).toBe(5)
  })

  it('should increment streak when last study was yesterday', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    expect(calcStreak(yesterday, 5)).toBe(6)
  })

  it('should reset streak to 1 when gap is greater than 1 day', () => {
    const twoDaysAgo = new Date()
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
    expect(calcStreak(twoDaysAgo, 5)).toBe(1)
  })
})
