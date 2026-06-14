import { describe, expect, it } from 'vitest'
import { toBoardShapes } from '@/lib/board-shapes'

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
