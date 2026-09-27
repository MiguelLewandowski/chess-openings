import { calendarDaysBetween } from '@chess-openings/domain'

export function percent(done: number, total: number): number {
  return total === 0 ? 0 : Math.round((done / total) * 100)
}

// none: never studied · broken: missed a day · at-risk: studied yesterday, not yet today ·
// active: already studied today.
export type StreakStatus = 'none' | 'broken' | 'at-risk' | 'active'

export function streakStatus(streak: number, lastStudyDate: string | null, now: Date = new Date()): StreakStatus {
  if (!lastStudyDate) return 'none'
  if (streak === 0) return 'broken'
  return calendarDaysBetween(new Date(lastStudyDate), now) === 0 ? 'active' : 'at-risk'
}

export interface WeekDay {
  label: string
  name: string
  studied: boolean
  isToday: boolean
  isFuture: boolean
}

const WEEK_LABELS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']
const WEEK_NAMES = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo']

// The current week, Monday first. No daily history is stored, but the last run of study
// days is exact: `runLength` consecutive days ending on `lastStudyDate`.
export function weekActivity(lastStudyDate: string | null, runLength: number, now: Date = new Date()): WeekDay[] {
  const mondayOffset = (now.getDay() + 6) % 7
  const last = lastStudyDate ? new Date(lastStudyDate) : null

  return WEEK_LABELS.map((label, index) => {
    const day = new Date(now)
    day.setDate(now.getDate() - mondayOffset + index)
    const daysBeforeLast = last ? calendarDaysBetween(day, last) : -1

    return {
      label,
      name: WEEK_NAMES[index],
      studied: daysBeforeLast >= 0 && daysBeforeLast < runLength,
      isToday: index === mondayOffset,
      isFuture: index > mondayOffset,
    }
  })
}

const LEVEL_TITLES: { from: number; title: string }[] = [
  { from: 15, title: 'Mestre' },
  { from: 10, title: 'Estrategista' },
  { from: 6, title: 'Praticante' },
  { from: 3, title: 'Aprendiz' },
  { from: 1, title: 'Iniciante' },
]

export function levelTitle(level: number): string {
  return LEVEL_TITLES.find((tier) => level >= tier.from)?.title ?? 'Iniciante'
}

const STYLE_TAG_LABELS: Record<string, string> = {
  Aggressive: 'Agressiva',
  Solid: 'Sólida',
  Positional: 'Posicional',
  Universal: 'Universal',
}

export function styleTagLabel(tag: string): string {
  return STYLE_TAG_LABELS[tag] ?? tag
}

// Imported lesson titles repeat the opening ("Abertura Inglesa: Básico da abertura"); next to
// the opening name that prefix is noise.
export function lessonShortTitle(lessonTitle: string, openingName: string): string {
  const prefix = `${openingName}:`
  return lessonTitle.startsWith(prefix) ? lessonTitle.slice(prefix.length).trim() : lessonTitle
}

export function formatNextReview(date: string, now: Date = new Date()): string {
  const days = calendarDaysBetween(now, new Date(date))
  if (days <= 0) return 'hoje'
  if (days === 1) return 'amanhã'
  return `em ${days} dias`
}

// "Setembro de 2026": Intl gives the month in lower case, and CSS `capitalize` would also
// capitalise the "de".
export function formatMemberSince(date: string): string {
  const text = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(date))
  return text.charAt(0).toUpperCase() + text.slice(1)
}
