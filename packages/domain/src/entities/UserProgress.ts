export interface SM2State {
  easinessFactor: number
  interval: number
  repetitions: number
}

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

export function calcStreak(lastStudyDate: Date | null, currentStreak: number): number {
  if (!lastStudyDate) return 1

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const last = new Date(lastStudyDate)
  last.setHours(0, 0, 0, 0)

  const diffDays = Math.round((today.getTime() - last.getTime()) / 86_400_000)

  if (diffDays === 0) return currentStreak
  if (diffDays === 1) return currentStreak + 1
  return 1
}
