import { Chess } from 'chess.js'

// A move of the lesson: its SAN as the author typed it (chess.js decides the final form, e.g.
// adds "+"), the comment shown after it and optional arrows ("Ge2e4").
export interface ScriptedMove {
  san: string
  comment?: string
  arrows?: string[]
}

// A step of a practice: the student's move (every entry in `accept` is a right answer), the
// feedback shown after it, and the opponent's reply, whose comment carries the next instruction.
export interface PracticeStep {
  accept: string[]
  comment: string
  reply?: ScriptedMove
}

export interface TutorialLesson {
  title: string
  demo: { fen: string; moves: ScriptedMove[] }
  practice: { title: string; fen: string; intro: string; opening?: ScriptedMove; steps: PracticeStep[] }
}

export interface Tutorial {
  studyName: string
  lessons: TutorialLesson[]
}

// Writes the tutorial as one PGN game per chapter: each lesson (the demonstration) followed by
// its "<lesson> | Prática: ..." chapter. Every move is played in chess.js first, because the
// importer silently drops a line at the first move it cannot play.
export function tutorialToPgn(tutorial: Tutorial): string {
  const games: string[] = []
  for (const lesson of tutorial.lessons) {
    games.push(game(tutorial.studyName, lesson.title, lesson.demo.fen, '', demoMovetext(lesson)))
    const { practice } = lesson
    games.push(
      game(tutorial.studyName, `${lesson.title} | Prática: ${practice.title}`, practice.fen, practice.intro, practiceMovetext(lesson)),
    )
  }
  return games.join('\n\n') + '\n'
}

function game(studyName: string, chapter: string, fen: string, intro: string, movetext: string): string {
  const tags = [
    ['Event', `${studyName}: ${chapter}`],
    ['Site', '?'],
    ['Result', '*'],
    ['StudyName', studyName],
    ['ChapterName', chapter],
    ['Orientation', 'white'],
    ['SetUp', '1'],
    ['FEN', fen],
  ]
  const header = tags.map(([k, v]) => `[${k} "${v.replace(/"/g, "'")}"]`).join('\n')
  const lead = intro ? `{${clean(intro)}} ` : ''
  return `${header}\n\n${lead}${movetext} *`
}

function demoMovetext(lesson: TutorialLesson): string {
  const chess = load(lesson.demo.fen, lesson.title)
  return lesson.demo.moves.map((move, i) => token(chess, move, i === 0, lesson.title)).join(' ')
}

function practiceMovetext(lesson: TutorialLesson): string {
  const { practice } = lesson
  const where = `${lesson.title} (prática)`
  const chess = load(practice.fen, where)
  const parts: string[] = []
  if (practice.opening) parts.push(token(chess, practice.opening, true, where))

  practice.steps.forEach((step, i) => {
    const last = i === practice.steps.length - 1
    if (step.accept.length > 1 && !last) {
      throw new Error(`${where}: só o último passo pode aceitar mais de uma resposta (passo ${i + 1})`)
    }
    if (last && step.reply) throw new Error(`${where}: o último passo não tem resposta do adversário`)
    if (!last && !step.reply) throw new Error(`${where}: o passo ${i + 1} precisa da resposta do adversário`)

    const first = parts.length === 0
    const fenBefore = chess.fen()
    const [main, ...alternatives] = step.accept
    parts.push(token(chess, { san: main, comment: step.comment }, first, where))
    // Alternatives are variations of the main answer, each with the same feedback.
    for (const alternative of alternatives) {
      const branch = load(fenBefore, where)
      parts.push(`(${token(branch, { san: alternative, comment: step.comment }, true, where)})`)
    }
    if (step.reply) parts.push(token(chess, step.reply, true, where))
  })
  return parts.join(' ')
}

function load(fen: string, where: string): Chess {
  try {
    return new Chess(fen)
  } catch (error) {
    throw new Error(`${where}: FEN inválido (${fen}): ${(error as Error).message}`)
  }
}

// "3. Rf5 {comment}" or "3... Kg7 {comment}"; the number is written on White's moves and on the
// first move of a sequence (or of a variation), as PGN requires.
function token(chess: Chess, move: ScriptedMove, startsSequence: boolean, where: string): string {
  const moveNumber = chess.moveNumber()
  const white = chess.turn() === 'w'
  let played
  try {
    played = chess.move(move.san)
  } catch {
    throw new Error(`${where}: lance ilegal ${move.san} em ${chess.fen()}`)
  }
  const prefix = white ? `${moveNumber}. ` : startsSequence ? `${moveNumber}... ` : ''
  const arrows = move.arrows?.length ? ` [%cal ${move.arrows.join(',')}]` : ''
  const comment = move.comment || arrows ? ` {${clean(move.comment ?? '')}${arrows}}` : ''
  return `${prefix}${played.san}${comment}`
}

function clean(text: string): string {
  return text.replace(/[{}]/g, '').trim()
}
