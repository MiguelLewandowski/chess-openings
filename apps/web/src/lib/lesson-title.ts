import { lessonShortTitle } from './profile'

export type LessonKind = 'line' | 'trap'

export interface LessonTitleParts {
  kind: LessonKind
  name: string
  // Move sequence that identifies the lesson, e.g. "3...c6". Null when the title has none.
  moves: string | null
}

const TRAP_PREFIX = /^armadilha:\s*/i
// "<moves> — <name>", the shape lesson-author gives trap chapters.
const MOVES_THEN_NAME = /^(.+?)\s+[—–-]\s+(.+)$/
// "<name> (<moves>)", the shape of repertoire chapters. Requires a digit so a plain
// parenthetical such as "(variante)" stays in the name.
const NAME_THEN_MOVES = /^(.+?)\s*\(([^()]*\d[^()]*)\)$/

// Splits a lesson title into what the path shows separately: the kind (repertoire line or
// trap), a readable name and the move sequence. Titles come from study chapter names, so any
// shape that does not match falls back to the whole title as the name.
export function lessonTitleParts(lessonTitle: string, openingName: string): LessonTitleParts {
  let title = lessonShortTitle(lessonTitle, openingName)
  const kind: LessonKind = TRAP_PREFIX.test(title) ? 'trap' : 'line'
  title = title.replace(TRAP_PREFIX, '')

  const dashed = MOVES_THEN_NAME.exec(title)
  if (dashed && /\d/.test(dashed[1])) return { kind, name: capitalize(dashed[2]), moves: dashed[1] }

  const parenthesized = NAME_THEN_MOVES.exec(title)
  if (parenthesized) return { kind, name: parenthesized[1], moves: parenthesized[2] }

  return { kind, name: title, moves: null }
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
