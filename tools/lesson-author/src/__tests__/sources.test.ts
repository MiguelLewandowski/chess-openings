import { describe, expect, it } from 'vitest'
import { formatCp, parseUciInfo, studentCp } from '../sources/engine'
import { normalizeExplorer } from '../sources/explorer'
import { STARTING_FEN } from '../chess/types'

describe('parseUciInfo', () => {
  it('should read depth, multipv, score and pv', () => {
    const info = parseUciInfo('info depth 20 seldepth 28 multipv 2 score cp -35 nodes 1000 nps 1 time 5 pv e7e5 g1f3 b8c6')
    expect(info).toEqual({ depth: 20, multipv: 2, cp: -35, mate: null, pv: ['e7e5', 'g1f3', 'b8c6'] })
  })

  it('should read mate scores', () => {
    expect(parseUciInfo('info depth 12 score mate 3 pv d1h5')?.mate).toBe(3)
  })

  it('should ignore lines without a principal variation', () => {
    expect(parseUciInfo('info depth 5 currmove e2e4 currmovenumber 1')).toBeNull()
    expect(parseUciInfo('bestmove e2e4')).toBeNull()
  })
})

describe('studentCp', () => {
  it('should flip White-relative scores for a Black student', () => {
    expect(studentCp({ san: ['e4'], cp: 30, mate: null }, 'w')).toBe(30)
    expect(studentCp({ san: ['e4'], cp: 30, mate: null }, 'b')).toBe(-30)
  })

  it('should turn mates into large scores and describe them in words', () => {
    const cp = studentCp({ san: ['Qh5'], cp: null, mate: 2 }, 'w')
    expect(cp).toBeGreaterThan(9_000)
    expect(formatCp(cp)).toBe('mate a favor')
    expect(formatCp(-35)).toBe('-0.35')
  })
})

describe('normalizeExplorer', () => {
  it('should compute share and score from the side to move', () => {
    const result = normalizeExplorer(
      {
        white: 60,
        draws: 20,
        black: 20,
        opening: null,
        moves: [
          { san: 'e4', white: 50, draws: 10, black: 15 },
          { san: 'd4', white: 10, draws: 10, black: 5 },
        ],
      },
      STARTING_FEN,
    )
    expect(result.total).toBe(100)
    expect(result.moves[0].share).toBeCloseTo(0.75)
    expect(result.moves[0].scoreForMover).toBeCloseTo((50 + 5) / 75)
  })
})
