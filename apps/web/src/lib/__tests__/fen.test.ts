import { describe, it, expect } from 'vitest'
import { boardFromFen } from '../fen'

describe('boardFromFen', () => {
  const board = boardFromFen('rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR b KQkq - 0 1')

  it('should produce 8 ranks of 8 squares', () => {
    expect(board).toHaveLength(8)
    board.forEach((rank) => expect(rank).toHaveLength(8))
  })

  it('should put rank 8 first with black pieces', () => {
    expect(board[0][4]).toEqual({ color: 'b', type: 'k' })
  })

  it('should expand digits into empty squares', () => {
    expect(board[4]).toEqual([null, null, { color: 'w', type: 'p' }, null, null, null, null, null])
  })
})
