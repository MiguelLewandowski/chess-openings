import { Chess, type Square } from 'chess.js'
import type { Card } from './cards'
import { isSquare, pieceAt, squaresAttackedFrom } from './chess/facts'
import { sanFromPt, sanToPt } from './chess/notation'
import type { LineNode } from './chess/types'
import type { NodeDossier } from './enrich'
import type { ChapterAnnotation, Claim, MoveNote } from './author/schema'

export interface Issue {
  nodeId: string
  message: string
}

export interface VerifyContext {
  dossiers: NodeDossier[] // lesson nodes and card nodes
  cards: Card[]
  lineSans: Set<string> // every move of the chapter tree and of its cards
  lastMainline: NodeDossier | undefined
}

const MAX_COMMENT_CHARS = 420
const MAX_ARROWS = 3
const FORBIDDEN = /stockfish|\bengine\b|\bmotor\b|computador|centipe|\bcp\b|[+-]\d+[.,]\d+/i

// A move token as a Brazilian chess text writes it: optional move number, then a piece
// move ("Cf3", "Bxc4"), a pawn capture ("exd5"), a pawn move/square ("d4") or castling.
const TOKEN =
  /(?:(\d+)\s*(\.\.\.|\.|…)\s*)?(?<![\w-])(O-O-O|O-O|[RDTBC][a-h]?[1-8]?x?[a-h][1-8](?:=[DTBC])?|[a-h]x[a-h][1-8](?:=[DTBC])?|[a-h][1-8](?:=[DTBC])?)[+#]?(?![\w-])/g

export interface MoveToken {
  raw: string
  san: string // English SAN, without check marks
  numbered: boolean
  kind: 'piece' | 'pawn-capture' | 'bare-square' | 'castle'
}

export function extractMoveTokens(text: string): MoveToken[] {
  return [...text.matchAll(TOKEN)].map((m) => {
    const body = m[3]
    const kind: MoveToken['kind'] = body.startsWith('O-O')
      ? 'castle'
      : /^[RDTBC]/.test(body)
        ? 'piece'
        : body.includes('x')
          ? 'pawn-capture'
          : 'bare-square'
    return { raw: m[0].trim(), san: stripCheck(sanFromPt(body)), numbered: Boolean(m[1]), kind }
  })
}

const stripCheck = (san: string) => san.replace(/[+#]$/, '')

export function allowedMovesFor(d: NodeDossier, lineSans: Set<string>): Set<string> {
  const allowed = new Set([...lineSans].map(stripCheck))
  const add = (san: string) => allowed.add(stripCheck(san))
  for (const line of d.engineAfter?.lines ?? []) line.san.forEach(add)
  for (const m of d.explorerBefore.masters?.moves ?? []) add(m.san)
  for (const m of d.explorerBefore.amateurs?.moves ?? []) add(m.san)
  for (const a of d.alternatives) {
    add(a.san)
    a.refutation.forEach(add)
  }
  for (const m of d.opponentOptions) add(m.san)
  d.continuation.forEach(add)
  return allowed
}

// A piece token is fine if it is a move the dossier knows or a reference to a piece that
// stands on that square ("o Cf3 controla d4"). Bare squares ("controla d5") are always
// fine; a numbered pawn move ("4.d4") must be a known move.
export function checkTokens(text: string, d: NodeDossier, allowed: Set<string>, extraFens: string[] = []): string[] {
  const problems: string[] = []
  for (const token of extractMoveTokens(text)) {
    if (token.kind === 'bare-square' && !token.numbered) continue
    if (allowed.has(token.san)) continue
    if (token.kind === 'piece' && refersToPieceOnBoard(token.san, [d.node.fenBefore, d.node.fenAfter, ...extraFens])) continue
    problems.push(`"${token.raw}" não é um lance do dossiê deste lance nem uma peça que esteja nessa casa`)
  }
  return problems
}

function refersToPieceOnBoard(san: string, fens: string[]): boolean {
  const square = san.match(/([a-h][1-8])(?:=[QRBN])?$/)?.[1]
  const type = san[0].toLowerCase()
  if (!square) return false
  return fens.some((fen) => pieceAt(fen, square)?.type === type)
}

export function checkClaim(claim: Claim, d: NodeDossier): string | null {
  if (claim.kind === 'evaluation') return checkEvaluation(claim, d.evalStudentCp)

  const ref = parsePieceRef(claim.piece)
  if (!ref) return `claim com peça inválida: "${claim.piece}"`
  const fen = d.node.fenAfter
  const actual = pieceAt(fen, ref.square)
  if (!actual || actual.type !== ref.type) {
    return `não há ${describe(ref.type)} em ${ref.square} depois de ${d.label}`
  }

  const attacked = new Set(squaresAttackedFrom(new Chess(fen), ref.square))
  for (const target of claim.targets) {
    if (!isSquare(target)) return `casa inválida na claim: "${target}"`
    if (!attacked.has(target)) return `${claim.piece} não alcança ${target}`
    const occupant = pieceAt(fen, target)
    if (claim.kind === 'attacks' && (!occupant || occupant.color === actual.color)) {
      return `${claim.piece} "ataca" ${target}, mas lá não há peça adversária`
    }
    if (claim.kind === 'defends' && (!occupant || occupant.color !== actual.color)) {
      return `${claim.piece} "defende" ${target}, mas lá não há peça própria`
    }
  }
  return null
}

function checkEvaluation(claim: Claim, cp: number | null): string | null {
  if (cp === null) return 'avaliação afirmada sem dado de engine para esta posição'
  const ok =
    (claim.verdict === 'student_better' && cp >= 40) ||
    (claim.verdict === 'balanced' && Math.abs(cp) < 60) ||
    (claim.verdict === 'student_worse' && cp <= -40) ||
    (claim.verdict === 'decisive_for_student' && cp >= 200)
  return ok ? null : `a avaliação "${claim.verdict}" não bate com a engine (${cp} centésimos para o aluno)`
}

function parsePieceRef(piece: string | null): { type: string; square: Square } | null {
  if (!piece) return null
  const m = piece.trim().match(/^([RDTBC])?([a-h][1-8])$/)
  if (!m || !isSquare(m[2])) return null
  return { type: m[1] ? sanFromPt(m[1]).toLowerCase() : 'p', square: m[2] }
}

function describe(type: string): string {
  return { p: 'peão', n: 'cavalo', b: 'bispo', r: 'torre', q: 'dama', k: 'rei' }[type] ?? 'peça'
}

function checkNote(note: MoveNote, d: NodeDossier, allowed: Set<string>): string[] {
  const problems: string[] = []
  const text = note.comment.trim()
  if (!text) problems.push('comentário vazio')
  if (text.length > MAX_COMMENT_CHARS) problems.push(`comentário longo demais (${text.length} caracteres; máximo ${MAX_COMMENT_CHARS})`)
  if (FORBIDDEN.test(text)) problems.push('cita a engine ou números de avaliação')
  problems.push(...checkTokens(text, d, allowed))
  for (const claim of note.claims) {
    const problem = checkClaim(claim, d)
    if (problem) problems.push(problem)
  }
  if (note.arrows.length > MAX_ARROWS) problems.push(`setas demais (${note.arrows.length})`)
  for (const arrow of note.arrows) {
    if (!isSquare(arrow.from) || !isSquare(arrow.to) || arrow.from === arrow.to) {
      problems.push(`seta inválida ${arrow.from}-${arrow.to}`)
    } else if (!pieceAt(d.node.fenAfter, arrow.from)) {
      problems.push(`seta sai de ${arrow.from}, onde não há peça`)
    }
  }
  for (const h of note.highlights) if (!isSquare(h.square)) problems.push(`casa destacada inválida: "${h.square}"`)
  return problems
}

export function verifyAnnotation(annotation: ChapterAnnotation, ctx: VerifyContext): Issue[] {
  const issues: Issue[] = []
  const byId = new Map(ctx.dossiers.map((d) => [d.node.id, d]))
  const seen = new Set<string>()

  for (const note of annotation.notes) {
    const d = byId.get(note.nodeId)
    if (!d) {
      issues.push({ nodeId: note.nodeId, message: 'nota para um id que não existe no dossiê' })
      continue
    }
    if (seen.has(note.nodeId)) issues.push({ nodeId: note.nodeId, message: 'mais de uma nota para o mesmo lance' })
    seen.add(note.nodeId)
    for (const message of checkNote(note, d, allowedMovesFor(d, ctx.lineSans))) issues.push({ nodeId: d.node.id, message })
  }
  for (const d of ctx.dossiers) {
    if (!seen.has(d.node.id)) issues.push({ nodeId: d.node.id, message: `falta a nota do lance ${d.label}` })
  }

  const whyNotPerNode = new Map<string, number>()
  for (const why of annotation.whyNot) {
    const d = byId.get(why.nodeId)
    const alt = d?.alternatives.find((a) => a.id === why.alternativeId)
    if (!d || !alt) {
      issues.push({ nodeId: why.nodeId, message: `"por que não" para uma alternativa que não está no dossiê (${why.alternativeId})` })
      continue
    }
    whyNotPerNode.set(d.node.id, (whyNotPerNode.get(d.node.id) ?? 0) + 1)
    if (alt.evalDeltaCp === null || alt.evalDeltaCp > -40) {
      issues.push({ nodeId: d.node.id, message: `"por que não ${sanToPt(alt.san)}": a engine não confirma que é pior` })
    }
    const afterAlt = new Chess(d.node.fenBefore)
    afterAlt.move(alt.san)
    for (const problem of checkTokens(why.text, d, allowedMovesFor(d, ctx.lineSans), [afterAlt.fen()])) {
      issues.push({ nodeId: d.node.id, message: `"por que não": ${problem}` })
    }
  }
  for (const [nodeId, count] of whyNotPerNode) {
    if (count > 1) issues.push({ nodeId, message: 'mais de um "por que não" no mesmo lance' })
  }

  for (const card of ctx.cards) {
    const prompt = annotation.cards.find((c) => c.cardId === card.id)?.prompt.trim()
    if (!prompt) {
      issues.push({ nodeId: card.id, message: `falta a pergunta do cartão "${card.title}"` })
      continue
    }
    const first = card.roots[0]
    if (first && revealsMove(prompt, first)) {
      issues.push({ nodeId: card.id, message: `a pergunta do cartão revela a resposta (${sanToPt(first.san)})` })
    }
  }

  if (ctx.lastMainline) {
    const planText = annotation.plan.trim()
    if (!planText) issues.push({ nodeId: 'plan', message: 'falta o plano do capítulo' })
    if (FORBIDDEN.test(planText)) issues.push({ nodeId: 'plan', message: 'o plano cita a engine ou números de avaliação' })
    for (const problem of checkTokens(planText, ctx.lastMainline, allowedMovesFor(ctx.lastMainline, ctx.lineSans))) {
      issues.push({ nodeId: 'plan', message: `plano: ${problem}` })
    }
  }

  return issues
}

function revealsMove(prompt: string, node: LineNode): boolean {
  const san = stripCheck(node.san)
  return extractMoveTokens(prompt).some((t) => t.san === san && (t.kind !== 'bare-square' || t.numbered))
}
