import { Chess } from 'chess.js'
import { moveNumberOf, sanFromPt } from '../chess/notation'
import { STARTING_FEN, type Chapter, type Color, type LineNode } from '../chess/types'

// A repertoire typed as plain lines, the way a player knows it by heart:
//
//   # Abertura do Bispo              <- study (opening) name
//   cor: brancas                     <- side the student plays
//
//   ## Berlinense: 3...c6            <- a chapter (becomes a lesson)
//   1.e4 e5 2.Bc4 Cf6 3.d3 c6 4.Cf3 d5 5.Bb3 {comentário opcional}
//   1.e4 e5 2.Bc4 Cf6 3.d3 c6 4.Cf3 Bd6      <- shares a prefix: becomes a variation
//
// The first line of a chapter is its main line. Moves may use Portuguese (C, B, T, D, R) or
// English notation; move numbers are optional. Every move is checked by chess.js, and a bad
// one stops with the line and move, before any paid call.

export class RepertoireSyntaxError extends Error {}

export interface Repertoire {
  studyName: string | undefined
  chapters: Chapter[]
}

export function readRepertoireText(text: string): Repertoire {
  let studyName: string | undefined
  let color: Color = 'w'
  const chapters: { title: string; lines: { number: number; text: string }[] }[] = []

  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim()
    const number = i + 1
    if (!line || line.startsWith('//')) return
    if (line.startsWith('## ')) {
      chapters.push({ title: line.slice(3).trim(), lines: [] })
    } else if (line.startsWith('# ')) {
      studyName = line.slice(2).trim()
    } else if (/^(cor|color)\s*:/i.test(line)) {
      color = parseColor(line.split(':')[1], number)
    } else {
      if (chapters.length === 0) throw new RepertoireSyntaxError(`linha ${number}: lances antes do primeiro capítulo (## título)`)
      chapters[chapters.length - 1].lines.push({ number, text: line })
    }
  })

  if (chapters.length === 0) throw new RepertoireSyntaxError('nenhum capítulo (## título) encontrado')
  return {
    studyName,
    chapters: chapters.map((c, index) => buildChapter(c.title, c.lines, color, index, studyName)),
  }
}

function parseColor(value: string, lineNumber: number): Color {
  const v = value.trim().toLowerCase()
  if (['brancas', 'branco', 'white', 'w'].includes(v)) return 'w'
  if (['pretas', 'preto', 'black', 'b'].includes(v)) return 'b'
  throw new RepertoireSyntaxError(`linha ${lineNumber}: cor "${value.trim()}" inválida (use brancas ou pretas)`)
}

function buildChapter(
  title: string,
  lines: { number: number; text: string }[],
  studentColor: Color,
  index: number,
  studyName: string | undefined,
): Chapter {
  if (lines.length === 0) throw new RepertoireSyntaxError(`capítulo "${title}" sem lances`)
  const roots: LineNode[] = []
  let nextId = 0

  for (const { number, text } of lines) {
    const chess = new Chess(STARTING_FEN)
    let siblings = roots
    let ply = 1
    for (const { move: token, comment } of tokenize(text)) {
      const fenBefore = chess.fen()
      const move = playToken(chess, token)
      if (!move) {
        throw new RepertoireSyntaxError(`linha ${number}, capítulo "${title}": "${token}" não é um lance legal nesta posição (${fenBefore})`)
      }
      let node = siblings.find((n) => n.san === move.san)
      if (!node) {
        node = {
          id: `c${index + 1}-${++nextId}`,
          ply,
          san: move.san,
          uci: `${move.from}${move.to}${move.promotion ?? ''}`,
          color: move.color,
          moveNumber: moveNumberOf(fenBefore),
          fenBefore,
          fenAfter: chess.fen(),
          mainline: false, // set by markMainline once the whole chapter is built
          authorComment: '',
          authorArrows: [],
          authorHighlights: [],
          children: [],
        }
        siblings.push(node)
      }
      if (comment && !node.authorComment) node.authorComment = comment
      siblings = node.children
      ply++
    }
  }

  markMainline(roots)
  return { index, title, studyName, studentColor, initialFen: STARTING_FEN, roots }
}

// Main line = first root, then always the first child; everything else is a variation.
function markMainline(roots: LineNode[]): void {
  const visit = (nodes: LineNode[], onMain: boolean) => {
    nodes.forEach((node, i) => {
      node.mainline = onMain && i === 0
      visit(node.children, node.mainline)
    })
  }
  visit(roots, true)
}

function playToken(chess: Chess, token: string) {
  // Portuguese first ("Cf3", "Dh5", "Rg1" = king); English as a fallback ("Nf3", "Qh5").
  for (const candidate of [sanFromPt(token), token]) {
    try {
      return chess.move(candidate)
    } catch {
      // try the next reading
    }
  }
  return null
}

// Splits "1.e4 e5 2.Bc4 {ideia} Cf6" into moves, attaching each {comment} to the move before
// it. Move numbers ("1.", "1...", "12...") are dropped.
export function tokenize(text: string): { move: string; comment: string }[] {
  const tokens: { move: string; comment: string }[] = []
  const pattern = /\{([^}]*)\}|(\S+)/g
  for (const match of text.matchAll(pattern)) {
    if (match[1] !== undefined) {
      if (tokens.length > 0) tokens[tokens.length - 1].comment = match[1].trim()
      continue
    }
    const word = match[2].replace(/^\d+\.(\.\.)?/, '').replace(/[!?]+$/, '')
    if (word && !/^\d+\.*$/.test(word)) tokens.push({ move: word, comment: '' })
  }
  return tokens
}
