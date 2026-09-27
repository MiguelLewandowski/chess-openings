import { STARTING_FEN, type Color, type LineNode } from '../chess/types'

export interface NoteOutput {
  text: string
  arrows: string[] // Lichess format, e.g. "Gd2d4"
  highlights: string[] // e.g. "Rd5"
}

export interface ChapterOutput {
  title: string
  studyName?: string
  studentColor: Color
  initialFen: string
  roots: LineNode[]
  notes: Map<string, NoteOutput>
  preComment?: string // shown before the first move (the question of a card)
  trailingComment?: string // after the last main-line move (the plan)
}

// Writes chapters as one multi-game PGN, the format Lichess imports as a study (one game
// per chapter) and the app's importer reads back.
export function writePgn(chapters: ChapterOutput[]): string {
  return chapters.map(writeChapter).join('\n\n') + '\n'
}

function writeChapter(chapter: ChapterOutput): string {
  const headers: [string, string][] = [
    ['Event', chapter.title],
    ['Site', '?'],
    ['Result', '*'],
    ['ChapterName', chapter.title],
    ...(chapter.studyName ? ([['StudyName', chapter.studyName]] as [string, string][]) : []),
    ['Orientation', chapter.studentColor === 'w' ? 'white' : 'black'],
    ['Annotator', 'Chess Openings (rascunho gerado por IA; revisar)'],
  ]
  if (chapter.initialFen !== STARTING_FEN) headers.push(['SetUp', '1'], ['FEN', chapter.initialFen])

  const tokens: string[] = []
  if (chapter.preComment) tokens.push(comment(chapter.preComment))
  if (chapter.roots.length > 0) tokens.push(...writeSequence(chapter.roots, true, chapter.notes))
  if (chapter.trailingComment) tokens.push(comment(chapter.trailingComment))
  tokens.push('*')

  return `${headers.map(([k, v]) => `[${k} "${v.replace(/"/g, "'")}"]`).join('\n')}\n\n${wrap(tokens.join(' '))}`
}

function writeSequence(siblings: LineNode[], forceNumber: boolean, notes: Map<string, NoteOutput>): string[] {
  const [main, ...variations] = siblings
  const tokens = [moveText(main, forceNumber)]
  const note = notes.get(main.id)
  const hasComment = Boolean(note && (note.text || note.arrows.length || note.highlights.length))
  if (hasComment) tokens.push(noteComment(note!))

  for (const variation of variations) {
    tokens.push(`(${writeSequence([variation], true, notes).join(' ')})`)
  }

  if (main.children.length > 0) {
    // After a comment or a variation, a Black move needs its number again ("5... Nf6").
    tokens.push(...writeSequence(main.children, hasComment || variations.length > 0, notes))
  }
  return tokens
}

function moveText(node: LineNode, forceNumber: boolean): string {
  if (node.color === 'w') return `${node.moveNumber}. ${node.san}`
  return forceNumber ? `${node.moveNumber}... ${node.san}` : node.san
}

function noteComment(note: NoteOutput): string {
  const parts = [clean(note.text)]
  if (note.arrows.length > 0) parts.push(`[%cal ${note.arrows.join(',')}]`)
  if (note.highlights.length > 0) parts.push(`[%csl ${note.highlights.join(',')}]`)
  return `{${parts.filter(Boolean).join(' ')}}`
}

function comment(text: string): string {
  return `{${clean(text)}}`
}

// Braces would end the comment early; PGN has no escape for them.
function clean(text: string): string {
  return text.replace(/[{}]/g, '').replace(/\s+/g, ' ').trim()
}

// PGN readers accept long lines, but 100 columns keeps the file readable in a diff.
function wrap(text: string, width = 100): string {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(' ')) {
    if (line && line.length + word.length + 1 > width) {
      lines.push(line)
      line = word
    } else {
      line = line ? `${line} ${word}` : word
    }
  }
  if (line) lines.push(line)
  return lines.join('\n')
}
