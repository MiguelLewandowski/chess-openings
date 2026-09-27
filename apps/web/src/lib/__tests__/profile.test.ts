import { describe, it, expect } from 'vitest'
import { formatNextReview, lessonShortTitle, levelTitle, percent, streakStatus, weekActivity } from '../profile'

const now = new Date(2026, 8, 26, 9, 0)
const iso = (day: number, hour = 12) => new Date(2026, 8, day, hour).toISOString()

describe('percent', () => {
  it('should return 0 when there is nothing to complete', () => {
    expect(percent(0, 0)).toBe(0)
  })

  it('should round to the nearest integer', () => {
    expect(percent(1, 3)).toBe(33)
  })
})

describe('streakStatus', () => {
  it('should be none when the user never studied', () => {
    expect(streakStatus(0, null, now)).toBe('none')
  })

  it('should be broken when the effective streak is 0', () => {
    expect(streakStatus(0, iso(20), now)).toBe('broken')
  })

  it('should be at-risk when the last session was yesterday', () => {
    expect(streakStatus(3, iso(25, 23), now)).toBe('at-risk')
  })

  it('should be active when the user already studied today', () => {
    expect(streakStatus(3, iso(26, 8), now)).toBe('active')
  })
})

describe('formatNextReview', () => {
  it('should say "hoje" for a review later today', () => {
    expect(formatNextReview(iso(26, 20), now)).toBe('hoje')
  })

  it('should say "amanhã" for the next calendar day', () => {
    expect(formatNextReview(iso(27, 1), now)).toBe('amanhã')
  })

  it('should count the days for later reviews', () => {
    expect(formatNextReview(iso(30), now)).toBe('em 4 dias')
  })
})

describe('weekActivity', () => {
  // 2026-09-26 is a Saturday.
  it('should start the week on Monday and flag today and future days', () => {
    const week = weekActivity(null, 0, now)
    expect(week.map((d) => d.label)).toEqual(['S', 'T', 'Q', 'Q', 'S', 'S', 'D'])
    expect(week[5]).toMatchObject({ name: 'sábado', isToday: true, isFuture: false })
    expect(week[6].isFuture).toBe(true)
  })

  it('should mark the run of consecutive days ending on the last study date', () => {
    const studied = weekActivity(iso(26, 8), 3, now).map((d) => d.studied)
    expect(studied).toEqual([false, false, false, true, true, true, false])
  })

  it('should keep a broken run visible on the days it happened', () => {
    const studied = weekActivity(iso(23), 2, now).map((d) => d.studied)
    expect(studied).toEqual([false, true, true, false, false, false, false])
  })
})

describe('levelTitle', () => {
  it('should map level ranges to titles', () => {
    expect(levelTitle(1)).toBe('Iniciante')
    expect(levelTitle(4)).toBe('Aprendiz')
    expect(levelTitle(6)).toBe('Praticante')
    expect(levelTitle(12)).toBe('Estrategista')
    expect(levelTitle(20)).toBe('Mestre')
  })
})

describe('lessonShortTitle', () => {
  it('should drop the opening name prefix', () => {
    expect(lessonShortTitle('Abertura Inglesa: Básico da abertura', 'Abertura Inglesa')).toBe('Básico da abertura')
  })

  it('should keep titles without the prefix', () => {
    expect(lessonShortTitle('Giuoco Piano', 'Italian Game')).toBe('Giuoco Piano')
  })
})
