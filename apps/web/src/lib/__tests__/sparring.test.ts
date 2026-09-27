import { describe, expect, it } from 'vitest'
import { parseBestMove, sideToMove, sparringOutcome } from '../sparring'

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

describe('parseBestMove', () => {
  it('should read the move and ignore the ponder move', () => {
    expect(parseBestMove('bestmove g1f3 ponder d7d5')).toEqual({ from: 'g1', to: 'f3' })
  })

  it('should read a promotion', () => {
    expect(parseBestMove('bestmove e7e8q')).toEqual({ from: 'e7', to: 'e8', promotion: 'q' })
  })

  it('should return null when there is no move or the line is something else', () => {
    expect(parseBestMove('bestmove (none)')).toBeNull()
    expect(parseBestMove('info depth 10 score cp 20')).toBeNull()
  })
})

describe('sideToMove', () => {
  it('should read the active color from the FEN', () => {
    expect(sideToMove(START)).toBe('white')
    expect(sideToMove('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1')).toBe('black')
  })
})

describe('sparringOutcome', () => {
  // 1.f3 e5 2.g4 Qh4# — White is mated.
  const foolsMate = 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3'

  it('should be null while the game goes on', () => {
    expect(sparringOutcome([START], 'white')).toBeNull()
  })

  it('should be a loss when the student is mated and a win when the engine is', () => {
    expect(sparringOutcome([foolsMate], 'white')).toEqual({ result: 'loss', reason: 'checkmate' })
    expect(sparringOutcome([foolsMate], 'black')).toEqual({ result: 'win', reason: 'checkmate' })
  })

  it('should be a draw by stalemate', () => {
    expect(sparringOutcome(['7k/5Q2/6K1/8/8/8/8/8 b - - 0 1'], 'white')).toEqual({ result: 'draw', reason: 'stalemate' })
  })

  it('should be a draw when the same position appears three times', () => {
    const a = 'rnbqkbnr/pppppppp/8/8/8/5N2/PPPPPPPP/RNBQKB1R b KQkq - 1 1'
    const b = 'rnbqkb1r/pppppppp/5n2/8/8/5N2/PPPPPPPP/RNBQKB1R w KQkq - 2 2'
    // Only the move counters differ between repetitions.
    const history = [START, a, b, START.replace(' 0 1', ' 4 3'), a.replace(' 1 1', ' 5 3'), b, START.replace(' 0 1', ' 8 5')]
    expect(sparringOutcome(history, 'white')).toEqual({ result: 'draw', reason: 'repetition' })
  })
})
