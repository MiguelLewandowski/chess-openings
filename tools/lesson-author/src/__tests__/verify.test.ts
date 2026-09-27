import { describe, expect, it } from 'vitest'
import type { ChapterAnnotation, Claim } from '../author/schema'
import { mainline, readChapters } from '../pgn/read'
import { checkClaim, checkTokens, extractMoveTokens, allowedMovesFor, verifyAnnotation } from '../verify'
import { chainFromSans } from '../cards'
import { dossierFor, ENGLISH_PGN } from './helpers'

const [chapter] = readChapters(ENGLISH_PGN)
const main = mainline(chapter).map((node) => dossierFor(node))
const lineSans = new Set(['c4', 'e5', 'g3', 'Nf6', 'Bg2', 'd5', 'Nc3'])
const bg2 = main[4] // after 3.Bg2

const claim = (partial: Partial<Claim>): Claim => ({ kind: 'controls', piece: null, targets: [], verdict: null, ...partial })

describe('extractMoveTokens', () => {
  it('should read Portuguese notation, numbered pawn moves and bare squares', () => {
    const tokens = extractMoveTokens('Depois de 3.Bg2 as pretas jogam 3...d5, e o Cf6 controla e4 e d5. Roque com O-O.')
    expect(tokens.map((t) => [t.san, t.kind, t.numbered])).toEqual([
      ['Bg2', 'piece', true],
      ['d5', 'bare-square', true],
      ['Nf6', 'piece', false],
      ['e4', 'bare-square', false],
      ['d5', 'bare-square', false],
      ['O-O', 'castle', false],
    ])
  })
})

describe('checkTokens', () => {
  const allowed = allowedMovesFor(bg2, lineSans)

  it('should accept moves of the line, pieces on their squares and bare squares', () => {
    expect(checkTokens('Com 3.Bg2 o Cf6 fica olhando e4 e d5.', bg2, allowed)).toEqual([])
  })

  it('should reject a numbered move the dossier does not know', () => {
    expect(checkTokens('Agora 4.b4 ganha espaço.', bg2, allowed)).toHaveLength(1)
  })

  it('should reject a piece that is not on that square', () => {
    expect(checkTokens('O Cc3 pressiona d5.', bg2, allowed)).toEqual([])
    expect(checkTokens('O Ce4 pressiona d6.', bg2, allowed)).toHaveLength(1)
  })
})

describe('checkClaim', () => {
  it('should accept a true control claim and reject a false one', () => {
    expect(checkClaim(claim({ piece: 'Bg2', targets: ['d5', 'e4'] }), bg2)).toBeNull()
    expect(checkClaim(claim({ piece: 'Bg2', targets: ['c6'] }), bg2)).toBeNull()
    expect(checkClaim(claim({ piece: 'Bg2', targets: ['f4'] }), bg2)).toMatch(/não alcança/)
  })

  it('should reject a claim about a piece that is not there', () => {
    expect(checkClaim(claim({ piece: 'Cf3', targets: ['e5'] }), bg2)).toMatch(/não há cavalo em f3/)
  })

  it('should require an enemy piece for attacks and an own piece for defends', () => {
    expect(checkClaim(claim({ kind: 'attacks', piece: 'Bg2', targets: ['e4'] }), bg2)).toMatch(/peça adversária/)
    expect(checkClaim(claim({ kind: 'defends', piece: 'Bg2', targets: ['f1'] }), bg2)).toMatch(/peça própria/)
    expect(checkClaim(claim({ kind: 'defends', piece: 'Bg2', targets: ['h1'] }), bg2)).toBeNull()
  })

  it('should check evaluations against the engine', () => {
    const withEval = { ...bg2, evalStudentCp: 25 }
    expect(checkClaim(claim({ kind: 'evaluation', verdict: 'balanced' }), withEval)).toBeNull()
    expect(checkClaim(claim({ kind: 'evaluation', verdict: 'decisive_for_student' }), withEval)).toMatch(/não bate/)
    expect(checkClaim(claim({ kind: 'evaluation', verdict: 'balanced' }), bg2)).toMatch(/sem dado de engine/)
  })
})

describe('verifyAnnotation', () => {
  const card = {
    id: 'c1-crit1',
    kind: 'CRITICAL' as const,
    title: 'Crítica: após 2...Cf6',
    reason: '',
    initialFen: bg2.node.fenBefore,
    studentColor: 'w' as const,
    roots: chainFromSans(bg2.node.fenBefore, ['Bg2'], 'c1-crit1'),
    sourceNodeId: bg2.node.id,
    score: 0.8,
  }
  const cardDossier = dossierFor(card.roots[0])
  const ctx = { dossiers: [...main, cardDossier], cards: [card], lineSans, lastMainline: main[main.length - 1] }

  const good = (): ChapterAnnotation => ({
    notes: [...main, cardDossier].map((d) => ({ nodeId: d.node.id, comment: `Lance ${d.label}.`, claims: [], arrows: [], highlights: [] })),
    whyNot: [],
    cards: [{ cardId: card.id, prompt: 'As pretas acabaram de desenvolver o cavalo. Como seguimos o plano?' }],
    plan: 'Pressionar as casas brancas do centro.',
  })

  it('should accept a clean annotation', () => {
    expect(verifyAnnotation(good(), ctx)).toEqual([])
  })

  it('should report missing notes, forbidden words and bad arrows', () => {
    const annotation = good()
    annotation.notes.pop()
    annotation.notes[0].comment = 'A engine dá +0,35 aqui.'
    annotation.notes[1].arrows = [{ from: 'a4', to: 'a5', color: 'G' }]
    const messages = verifyAnnotation(annotation, ctx).map((i) => i.message)
    expect(messages.some((m) => m.startsWith('falta a nota'))).toBe(true)
    expect(messages).toContain('cita a engine ou números de avaliação')
    expect(messages.some((m) => m.includes('onde não há peça'))).toBe(true)
  })

  it('should reject a card question that gives the answer away', () => {
    const annotation = good()
    annotation.cards[0].prompt = 'Jogue 3.Bg2 e controle a diagonal.'
    expect(verifyAnnotation(annotation, ctx).map((i) => i.message)).toContain('a pergunta do cartão revela a resposta (Bg2)')
  })

  it('should only allow "why not" for alternatives the engine refutes', () => {
    const withAlt = main.map((d) => d)
    const g3 = { ...withAlt[2], alternatives: [{ id: 'alt', san: 'Nc3', amateurShare: 0.3, mastersShare: 0.4, evalDeltaCp: -10, refutation: [], materialAfterRefutation: null }] }
    withAlt[2] = g3
    const annotation = good()
    annotation.whyNot = [{ nodeId: g3.node.id, alternativeId: 'alt', text: 'Porque sim.' }]
    const messages = verifyAnnotation(annotation, { ...ctx, dossiers: [...withAlt, cardDossier] }).map((i) => i.message)
    expect(messages).toContain('"por que não Cc3": a engine não confirma que é pior')
  })
})
