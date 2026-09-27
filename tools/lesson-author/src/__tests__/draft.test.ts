import { describe, expect, it } from 'vitest'
import { Chess } from 'chess.js'
import { DEFAULT_DRAFT, positionKey, RepertoireBuilder, type DraftNode, type ExplorerLike } from '../draft/build'
import { splitChapters } from '../draft/chapters'
import { namesFrom, parseOpeningsTsv } from '../draft/names'
import { renderRepertoire } from '../draft/render'
import { readRepertoireText } from '../pgn/lines'
import { mainline } from '../pgn/read'
import type { EngineResult } from '../sources/engine'
import type { ExplorerResult } from '../sources/explorer'
import { ratingBuckets } from '../sources/explorer'
import { FakeEngine } from './helpers'

const fenAfter = (...sans: string[]) => {
  const chess = new Chess()
  for (const san of sans) chess.move(san)
  return chess.fen()
}
const eval_ = (san: string[], cp: number): EngineResult => ({ source: 'fake', depth: 20, lines: [{ san, cp, mate: null }] })
const stats = (moves: [string, number][]): ExplorerResult => {
  const total = moves.reduce((s, [, g]) => s + g, 0)
  return { total, opening: null, moves: moves.map(([san, games]) => ({ san, games, share: games / total, scoreForMover: 0.5 })) }
}

// 1.e4 e5 2.Bc4 and then: 2...Cf6 (60%), 2...Bc5 (30%) and the beginner's 2...Dh4? (10%).
const START = ['e4', 'e5', 'Bc4']
const AFTER_START = fenAfter(...START)

const engine = new FakeEngine({
  [AFTER_START]: eval_(['Nf6'], 30),
  [fenAfter(...START, 'Nf6')]: eval_(['d3'], 20),
  [fenAfter(...START, 'Bc5')]: {
    source: 'fake',
    depth: 20,
    lines: [
      { san: ['Nf3'], cp: 30, mate: null },
      { san: ['c3'], cp: 20, mate: null },
      { san: ['Qg4'], cp: -50, mate: null },
    ],
  },
  [fenAfter(...START, 'Qh4')]: eval_(['Nf3', 'Qxe4+'], 250),
  [fenAfter(...START, 'Qh4', 'Nf3')]: eval_(['Qxe4+'], 300),
})

class FakeExplorer implements ExplorerLike {
  async query(fen: string, db: 'masters' | 'amateurs'): Promise<ExplorerResult | null> {
    if (db === 'amateurs' && fen === AFTER_START) return stats([['Nf6', 600], ['Bc5', 300], ['Qh4', 100]])
    // Masters prefer 3.c3 over 3.Cf3 against 2...Bc5.
    if (db === 'masters' && fen === fenAfter(...START, 'Bc5')) return stats([['c3', 90], ['Nf3', 10]])
    return null
  }
}

async function buildTree(): Promise<DraftNode[]> {
  // The approved repertoire plays 3.d3 against 2...Cf6.
  const base = new Map([[positionKey(fenAfter(...START, 'Nf6')), 'd3']])
  const builder = new RepertoireBuilder(engine, new FakeExplorer(), 'w', base, { ...DEFAULT_DRAFT, maxPlies: 6 })
  return builder.build(START)
}

function childOf(nodes: DraftNode[], ...sans: string[]): DraftNode {
  let current = nodes.find((n) => n.san === sans[0])!
  for (const san of sans.slice(1)) current = current.children.find((n) => n.san === san)!
  return current
}

describe('RepertoireBuilder', () => {
  it('should branch on what players play, keep the base system and prefer the masters move', async () => {
    const roots = await buildTree()
    const bc4 = childOf(roots, 'e4', 'e5', 'Bc4')
    expect(bc4.children.map((n) => n.san)).toEqual(['Nf6', 'Bc5', 'Qh4'])

    const vsNf6 = childOf(roots, 'e4', 'e5', 'Bc4', 'Nf6', 'd3')
    expect(vsNf6.fromBase).toBe(true)
    // Nf3 is 0.10 better for the engine, but within tolerance and masters play c3 more.
    expect(childOf(roots, 'e4', 'e5', 'Bc4', 'Bc5').children[0].san).toBe('c3')
  })

  it('should mark a punished beginner move and follow the punishment until the advantage is clear', async () => {
    const roots = await buildTree()
    const qh4 = childOf(roots, 'e4', 'e5', 'Bc4', 'Qh4')
    expect(qh4.mistake).toEqual({ gainCp: 220, evalAfterCp: 250 })
    expect(qh4.share).toBeCloseTo(0.1)
    const punishment = qh4.children[0]
    expect(punishment.san).toBe('Nf3')
    expect(punishment.punishing).toBe(true)
    expect(punishment.children).toHaveLength(0) // +3.00 reached: stop
  })
})

describe('splitChapters + renderRepertoire', () => {
  const names = namesFrom(
    parseOpeningsTsv('eco\tname\tpgn\nC24\tBishop\'s Opening: Berlin Defense\t1. e4 e5 2. Bc4 Nf6\nC23\tBishop\'s Opening\t1. e4 e5 2. Bc4\n'),
  )

  it('should split at the first opponent choice, most common first, with the trap as its own chapter', async () => {
    const chapters = splitChapters(await buildTree(), START.length, 3, names, '1000–1399')
    expect(chapters.map((c) => c.title)).toEqual([
      "2...Cf6 — Bishop's Opening: Berlin Defense (C24)",
      "2...Bc5 — Bishop's Opening (C23)",
      "Armadilha: 2...Dh4? — Bishop's Opening (C23)",
    ])
    expect(chapters[2].lines[0].note).toBe('2...Dh4? — 10% dos jogadores de 1000–1399 jogam; depois dele, +2.50 para nós')
  })

  it('should write a .txt the generator reads back, lines and colour included', async () => {
    const chapters = splitChapters(await buildTree(), START.length, 3, names, '1000–1399')
    const text = renderRepertoire({ name: 'Abertura do Bispo', student: 'w', chapters, settings: ['teste'] })
    expect(text).toContain('1.e4 e5 2.Bc4 Dh4 3.Cf3')

    const back = readRepertoireText(text)
    expect(back.studyName).toBe('Abertura do Bispo')
    expect(back.chapters).toHaveLength(3)
    expect(mainline(back.chapters[0]).map((n) => n.san)).toEqual(['e4', 'e5', 'Bc4', 'Nf6', 'd3'])
  })

  it('should keep a single chapter when asked for one', async () => {
    const chapters = splitChapters(await buildTree(), START.length, 1, names, '1000–1399')
    expect(chapters).toHaveLength(1)
    expect(chapters[0].lines.map((l) => l.sans.at(-1))).toEqual(['d3', 'c3', 'Nf3'])
  })
})

describe('ratingBuckets', () => {
  it('should map a range to the Lichess explorer buckets', () => {
    expect(ratingBuckets('1000-1600')).toEqual([1000, 1200, 1400])
    expect(ratingBuckets('1600-2200')).toEqual([1600, 1800, 2000])
    expect(() => ratingBuckets('1600-1000')).toThrow()
  })
})

describe('RepertoireBuilder after a mistake', () => {
  it('should finish the punishment with the engine defence when the games run out', async () => {
    // After 2...Dh4? 3.Cf3 the explorer has no games; the engine defends with 3...Dxe4+.
    const deeper = new FakeEngine({
      [AFTER_START]: eval_(['Nf6'], 30),
      [fenAfter(...START, 'Qh4')]: eval_(['Nf3', 'Qxe4+'], 150),
      [fenAfter(...START, 'Qh4', 'Nf3')]: eval_(['Qxe4+'], 120),
      [fenAfter(...START, 'Qh4', 'Nf3', 'Qxe4+')]: eval_(['Be2'], 100),
      [fenAfter(...START, 'Qh4', 'Nf3', 'Qxe4+', 'Be2')]: eval_(['Qxg2'], 300),
    })
    const builder = new RepertoireBuilder(deeper, new FakeExplorer(), 'w', new Map(), { ...DEFAULT_DRAFT, maxPlies: 10 })
    const roots = await builder.build(START)
    const line = [childOf(roots, 'e4', 'e5', 'Bc4', 'Qh4')]
    while (line.at(-1)!.children.length > 0) line.push(line.at(-1)!.children[0])
    expect(line.map((n) => n.san)).toEqual(['Qh4', 'Nf3', 'Qxe4+', 'Be2'])
  })
})
