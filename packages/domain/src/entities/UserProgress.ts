export interface SM2State {
  easinessFactor: number
  interval: number
  repetitions: number
}

// Anki's convention for a "mature" card: once the interval reaches three weeks, the item is
// considered consolidated in long-term memory.
export const MATURE_INTERVAL_DAYS = 21

export interface SM2Result extends SM2State {
  nextReview: Date
}

export function applySM2(current: SM2State, quality: number): SM2Result {
  let { easinessFactor, interval, repetitions } = current

  if (quality >= 3) {
    if (repetitions === 0) interval = 1
    else if (repetitions === 1) interval = 6
    else interval = Math.round(interval * easinessFactor)
    repetitions += 1
  } else {
    repetitions = 0
    interval = 1
  }

  easinessFactor = Math.max(
    1.3,
    easinessFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  )

  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + interval)

  return { easinessFactor, interval, repetitions, nextReview }
}

// Whole calendar days between the two dates, ignoring the time of day.
export function calendarDaysBetween(from: Date, to: Date): number {
  const start = new Date(from)
  start.setHours(0, 0, 0, 0)
  const end = new Date(to)
  end.setHours(0, 0, 0, 0)
  return Math.round((end.getTime() - start.getTime()) / 86_400_000)
}

export function calcStreak(lastStudyDate: Date | null, currentStreak: number): number {
  if (!lastStudyDate) return 1

  const diffDays = calendarDaysBetween(lastStudyDate, new Date())

  if (diffDays === 0) return currentStreak
  if (diffDays === 1) return currentStreak + 1
  return 1
}

// The stored streak is only recalculated when an exercise is completed, so after a missed
// day the database still holds the old count. This is the value to show: a streak survives
// until the end of the day after the last study session, then it is broken.
export function currentStreak(lastStudyDate: Date | null, storedStreak: number, now: Date = new Date()): number {
  if (!lastStudyDate) return 0
  return calendarDaysBetween(lastStudyDate, now) <= 1 ? storedStreak : 0
}
