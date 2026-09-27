import { INITIAL_SM2_STATE, MATURE_INTERVAL_DAYS, applySM2 } from '@chess-openings/domain'

// The intervals (in days) a new line would get if every review scored `quality`. Runs the real
// SM-2 from the domain, so what the landing page promises is what the app does.
export function reviewSchedule(quality: number, reviews: number): number[] {
  const intervals: number[] = []
  let state = INITIAL_SM2_STATE
  for (let i = 0; i < reviews; i++) {
    state = applySM2(state, quality)
    intervals.push(state.interval)
  }
  return intervals
}

// How many reviews it takes for a line to be "mastered" (interval of three weeks or more),
// scoring `quality` every time; null when it never gets there (a failing score).
export function reviewsToMaster(quality: number, limit = 20): number | null {
  const index = reviewSchedule(quality, limit).findIndex((days) => days >= MATURE_INTERVAL_DAYS)
  return index < 0 ? null : index + 1
}

export function formatDays(days: number): string {
  return days === 1 ? '1 dia' : `${days} dias`
}

// "1, 6, 16 e 45 dias": a schedule as one short phrase, so it fits on a single line.
export function formatDayList(days: number[]): string {
  if (days.length === 1) return formatDays(days[0])
  return `${days.slice(0, -1).join(', ')} e ${days[days.length - 1]} dias`
}
