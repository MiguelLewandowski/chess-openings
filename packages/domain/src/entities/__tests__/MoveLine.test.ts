import { describe, it, expect } from 'vitest'
import { formatMoveList, mainLine } from '../MoveLine'

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
const node = (id: string, parentId: string | null, san: string) => ({ id, parentId, san, fen: `fen-${id}` })

describe('mainLine', () => {
  it('should return an empty line when there are no moves', () => {
    expect(mainLine([])).toEqual([])
  })

  it('should follow the first child by id at every branch', () => {
    const moves = [
      node('c', 'a', 'e5'),
      node('a', null, 'c4'),
      node('d', 'a', 'c5'), // variation: created after the main continuation
      node('e', 'c', 'Nc3'),
    ]
    expect(mainLine(moves).map((m) => m.san)).toEqual(['c4', 'e5', 'Nc3'])
  })
})

describe('formatMoveList', () => {
  it('should number moves from the starting position', () => {
    expect(formatMoveList(['c4', 'e5', 'Nc3', 'Nf6'], START)).toBe('1.c4 e5 2.Nc3 Nf6')
  })

  it('should start with an ellipsis when black moves first', () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR b KQkq - 0 1'
    expect(formatMoveList(['e5', 'Nc3'], fen)).toBe('1...e5 2.Nc3')
  })

  it('should default to move 1 with white to move when there is no FEN', () => {
    expect(formatMoveList(['e4'], null)).toBe('1.e4')
  })
})
