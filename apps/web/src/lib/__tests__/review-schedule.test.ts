import { describe, expect, it } from 'vitest'
import { formatDayList, formatDays, reviewSchedule, reviewsToMaster } from '../review-schedule'

describe('reviewSchedule', () => {
  it('should follow SM-2: 1 day, 6 days, then multiplied by the easiness', () => {
    expect(reviewSchedule(5, 5)).toEqual([1, 6, 16, 45, 131])
  })

  it('should space the reviews less when the score is lower', () => {
    expect(reviewSchedule(3, 4)).toEqual([1, 6, 13, 27])
  })

  it('should keep a failing line on a one-day loop', () => {
    expect(reviewSchedule(2, 3)).toEqual([1, 1, 1])
  })
})

describe('reviewsToMaster', () => {
  it('should count the reviews until the interval reaches three weeks', () => {
    expect(reviewsToMaster(5)).toBe(4)
    expect(reviewsToMaster(3)).toBe(4)
  })

  it('should be null for a score that never passes', () => {
    expect(reviewsToMaster(2)).toBeNull()
  })
})

describe('formatDays', () => {
  it('should use the singular for one day', () => {
    expect(formatDays(1)).toBe('1 dia')
    expect(formatDays(16)).toBe('16 dias')
  })
})

describe('formatDayList', () => {
  it('should join the intervals into one phrase', () => {
    expect(formatDayList([1, 6, 16, 45])).toBe('1, 6, 16 e 45 dias')
    expect(formatDayList([1])).toBe('1 dia')
  })
})
