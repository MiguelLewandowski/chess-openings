import { describe, expect, it } from 'vitest'
import { hintShapes, toBoardShapes } from '@/lib/board-shapes'

describe('toBoardShapes', () => {
  it('returns no shapes when there are no markers', () => {
    expect(toBoardShapes(null)).toEqual([])
    expect(toBoardShapes({})).toEqual([])
  })

  it('parses a colored arrow (5 chars)', () => {
    expect(toBoardShapes({ arrows: ['Gc4f7'] })).toEqual([{ orig: 'c4', dest: 'f7', brush: 'green' }])
    expect(toBoardShapes({ arrows: ['Rc4f7'] })).toEqual([{ orig: 'c4', dest: 'f7', brush: 'red' }])
  })

  it('parses a plain arrow (4 chars) as green', () => {
    expect(toBoardShapes({ arrows: ['c4f7'] })).toEqual([{ orig: 'c4', dest: 'f7', brush: 'green' }])
  })

  it('parses colored and plain circles', () => {
    expect(toBoardShapes({ circles: ['Bd4'] })).toEqual([{ orig: 'd4', brush: 'blue' }])
    expect(toBoardShapes({ circles: ['d4'] })).toEqual([{ orig: 'd4', brush: 'green' }])
  })

  it('falls back to green for an unknown color code', () => {
    expect(toBoardShapes({ arrows: ['Xc4f7'] })).toEqual([{ orig: 'c4', dest: 'f7', brush: 'green' }])
  })
})

describe('hintShapes', () => {
  const start = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

  it('should draw nothing without a hint or a move', () => {
    expect(hintShapes(start, 'e4', 0)).toEqual([])
    expect(hintShapes(start, undefined, 2)).toEqual([])
  })

  it('should mark only the piece at level 1', () => {
    expect(hintShapes(start, 'Nf3', 1)).toEqual([{ orig: 'g1', brush: 'yellow' }])
  })

  it('should draw the whole move at level 2', () => {
    expect(hintShapes(start, 'Nf3', 2)).toEqual([{ orig: 'g1', dest: 'f3', brush: 'yellow' }])
  })

  it('should draw nothing for a move that is not legal in the position', () => {
    expect(hintShapes(start, 'Nf6', 2)).toEqual([])
  })
})
