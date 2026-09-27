import { describe, expect, it } from 'vitest'
import { Chess } from 'chess.js'
import { chainFromSans, DEFAULT_CARDS, mineCriticalPositions, mineTraps } from '../cards'
import { materialAfter } from '../enrich'
import { mainline, readChapters } from '../pgn/read'
import type { ExplorerResult } from '../sources/explorer'
import { dossierFor, ENGLISH_PGN, FakeEngine } from './helpers'

const explorer = (moves: [string, number, number][]): ExplorerResult => ({
  total: moves.reduce((s, [, g]) => s + g, 0),
  opening: null,
  moves: moves.map(([san, games, share]) => ({ san, games, share, scoreForMover: 0.5 })),
})

describe('mineCriticalPositions', () => {
  it('should pick the student moves that amateurs miss, titled by the previous move', () => {
    const [chapter] = readChapters(ENGLISH_PGN)
    const main = mainline(chapter).map((node) =>
      dossierFor(node, {
        // 3.Bg2 is found by only 20% of amateurs; 2.g3 by 90%.
        explorerBefore: {
          masters: null,
          amateurs: node.san === 'Bg2' ? explorer([['Nc3', 800, 0.8], ['Bg2', 200, 0.2]]) : explorer([[node.san, 900, 0.9]]),
        },
      }),
    )

    const cards = mineCriticalPositions(chapter, main)
    expect(cards).toHaveLength(1)
    expect(cards[0].title).toBe('Crítica: após 2...Cf6')
    expect(cards[0].initialFen).toBe(main[4].node.fenBefore)
    expect(cards[0].roots[0].san).toBe('Bg2')
    expect(cards[0].roots[0].children[0].san).toBe('d5')
  })
})

describe('mineTraps', () => {
  it('should turn a popular losing reply into a punish-the-mistake card', async () => {
    const [chapter] = readChapters(ENGLISH_PGN)
    const main = mainline(chapter).map((node) => dossierFor(node))
    // After 1.c4, pretend 20% of amateurs play 1...f6? and the engine wins material.
    const afterC4 = main[0]
    const e5 = main[1]
    e5.explorerBefore = { masters: null, amateurs: explorer([['e5', 700, 0.7], ['f6', 200, 0.2]]) }
    e5.evalStudentCp = 20
    const mistake = new Chess(afterC4.node.fenAfter)
    mistake.move('f6')

    const engine = new FakeEngine({
      [mistake.fen()]: { source: 'fake', depth: 20, lines: [{ san: ['Qb3', 'e6', 'd4'], cp: 250, mate: null }] },
    })
    const cards = await mineTraps(chapter, main, engine)

    expect(cards).toHaveLength(1)
    expect(cards[0].kind).toBe('TRAP')
    expect(cards[0].title).toBe('Armadilha: 1...f6?')
    expect(cards[0].initialFen).toBe(mistake.fen())
    expect(cards[0].roots[0].san).toBe('Qb3')
  })

  it('should ignore rare mistakes and small gains', async () => {
    const [chapter] = readChapters(ENGLISH_PGN)
    const main = mainline(chapter).map((node) => dossierFor(node))
    main[1].explorerBefore = { masters: null, amateurs: explorer([['e5', 990, 0.97], ['f6', 20, 0.02]]) }
    main[1].evalStudentCp = 20
    const cards = await mineTraps(chapter, main, new FakeEngine({}), DEFAULT_CARDS)
    expect(cards).toHaveLength(0)
  })
})

describe('chainFromSans', () => {
  it('should build a single line and stop at an illegal move', () => {
    const [root] = chainFromSans('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', ['e4', 'e5', 'Ke3', 'Nf3'], 'k')
    expect(root.san).toBe('e4')
    expect(root.children[0].san).toBe('e5')
    expect(root.children[0].children).toHaveLength(0)
  })
})

describe('materialAfter', () => {
  it('should give the absolute balance at the end of a line, even mid-exchange', () => {
    // 1.e4 e5 2.Bc4 Nf6 3.d3 c6 4.Nf3 d5 5.Bb3 Bd6 6.Nc3 dxe4 7.Ng5 O-O 8.Ngxe4 Nxe4:
    // Black has just taken a knight. 9.Bxf7+ Rxf7 10.Nxe4 leaves White a piece for a pawn.
    const chess = new Chess()
    for (const san of ['e4', 'e5', 'Bc4', 'Nf6', 'd3', 'c6', 'Nf3', 'd5', 'Bb3', 'Bd6', 'Nc3', 'dxe4', 'Ng5', 'O-O', 'Ngxe4', 'Nxe4']) chess.move(san)
    expect(materialAfter(chess.fen(), ['Bxf7+', 'Rxf7', 'Nxe4'], 'w')).toBe(-2)
    expect(materialAfter(chess.fen(), ['Nxe4'], 'w')).toBe(0)
    expect(materialAfter(chess.fen(), ['Nxe4', 'Ke3'], 'w')).toBeNull()
  })
})

