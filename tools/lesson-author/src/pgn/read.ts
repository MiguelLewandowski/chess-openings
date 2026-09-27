import { readFile } from 'node:fs/promises'
import { parse } from '@mliebelt/pgn-parser'
import { Chess } from 'chess.js'
import { STARTING_FEN, type Chapter, type Color, type LineNode } from '../chess/types'
import { moveNumberOf, sideToMove } from '../chess/notation'

interface PgnMove {
  notation: { notation: string }
  commentAfter?: string
  commentDiag?: { comment?: string; colorArrows?: string[]; colorFields?: string[] }
  variations?: PgnMove[][]
}

interface PgnGame {
  tags?: Record<string, string | undefined>
  moves: PgnMove[]
}

// A Lichess study URL/ID or a local .pgn file.
export async function loadPgnSource(source: string, lichessToken?: string): Promise<string> {
  const studyId = source.match(/lichess\.org\/study\/([a-zA-Z0-9]{8})/)?.[1] ?? (/^[a-zA-Z0-9]{8}$/.test(source) ? source : null)
  if (!studyId) return readFile(source, 'utf8')

  const response = await fetch(`https://lichess.org/api/study/${studyId}.pgn?source=true&orientation=true`, {
    headers: lichessToken ? { Authorization: `Bearer ${lichessToken}` } : {},
  })
  if (!response.ok) throw new Error(`Lichess returned ${response.status} for study ${studyId}.`)
  return response.text()
}

export function readChapters(pgn: string): Chapter[] {
  const games = parse(pgn, { startRule: 'games' }) as PgnGame[]
  return games.map((game, index) => readChapter(game, index))
}

function readChapter(game: PgnGame, index: number): Chapter {
  const tags = game.tags ?? {}
  const initialFen = validFen(tags.FEN) ?? STARTING_FEN
  const ids = { next: 0 }
  return {
    index,
    title: chapterTitle(tags, index),
    studyName: tags.StudyName,
    studentColor: studentColorOf(tags.Orientation, initialFen),
    initialFen,
    roots: buildSequence(game.moves ?? [], initialFen, 1, true, index, ids),
  }
}

// Lichess exports "Study name: Chapter name" as Event and, in newer exports, the chapter
// name alone as ChapterName.
function chapterTitle(tags: Record<string, string | undefined>, index: number): string {
  if (tags.ChapterName) return tags.ChapterName
  const event = tags.Event ?? `Capítulo ${index + 1}`
  const study = tags.StudyName
  return study && event.startsWith(`${study}: `) ? event.slice(study.length + 2) : event
}

// The board orientation the author chose is the side the student plays. Without it, the
// student is whoever moves first — true for card chapters, which start on their move.
export function studentColorOf(orientation: string | undefined, initialFen: string): Color {
  if (orientation?.toLowerCase() === 'black') return 'b'
  if (orientation?.toLowerCase() === 'white') return 'w'
  return sideToMove(initialFen)
}

function validFen(fen: string | undefined): string | null {
  if (!fen) return null
  try {
    new Chess(fen)
    return fen
  } catch {
    return null
  }
}

function buildSequence(
  sequence: PgnMove[],
  fenBefore: string,
  ply: number,
  mainline: boolean,
  chapterIndex: number,
  ids: { next: number },
): LineNode[] {
  if (sequence.length === 0) return []
  const [first, ...rest] = sequence

  const chess = new Chess(fenBefore)
  let move
  try {
    move = chess.move(first.notation.notation)
  } catch {
    return []
  }

  const rawComment = first.commentDiag?.comment ?? first.commentAfter ?? ''
  const markerText = `${first.commentDiag?.comment ?? ''} ${first.commentAfter ?? ''}`
  const node: LineNode = {
    id: `c${chapterIndex + 1}-${++ids.next}`,
    ply,
    san: move.san,
    uci: `${move.from}${move.to}${move.promotion ?? ''}`,
    color: move.color,
    moveNumber: moveNumberOf(fenBefore),
    fenBefore,
    fenAfter: chess.fen(),
    mainline,
    authorComment: rawComment.replace(/\[%(cal|csl)\s+[^\]]+\]/g, '').trim(),
    authorArrows: markerList(markerText, 'cal', first.commentDiag?.colorArrows),
    authorHighlights: markerList(markerText, 'csl', first.commentDiag?.colorFields),
    children: buildSequence(rest, chess.fen(), ply + 1, mainline, chapterIndex, ids),
  }

  const siblings = [node]
  for (const variation of first.variations ?? []) {
    siblings.push(...buildSequence(variation, fenBefore, ply, false, chapterIndex, ids))
  }
  return siblings
}

function markerList(text: string, tag: 'cal' | 'csl', parsed: string[] | undefined): string[] {
  const fromText = [...text.matchAll(new RegExp(`\\[%${tag}\\s+([^\\]]+)\\]`, 'g'))].flatMap((m) =>
    m[1].split(',').map((s) => s.trim()),
  )
  return fromText.length > 0 ? fromText : (parsed ?? [])
}

// The main line: from the first root, always the first child.
export function mainline(chapter: Chapter): LineNode[] {
  const line: LineNode[] = []
  let node = chapter.roots[0]
  while (node) {
    line.push(node)
    node = node.children[0]
  }
  return line
}

export function allNodes(roots: LineNode[]): LineNode[] {
  return roots.flatMap((node) => [node, ...allNodes(node.children)])
}
