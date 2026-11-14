import { describe, expect, it } from 'vitest'
import type { MoveSummary } from '@chess-openings/domain'
import { evalBarTarget, formatEvaluation, fromStoredCp, parseUciInfo, whiteShare, type Evaluation } from '@/lib/eval-bar'

const cp = (value: number): Evaluation => ({ kind: 'cp', cp: value })
const mate = (winner: 'white' | 'black', moves: number): Evaluation => ({ kind: 'mate', winner, moves })

describe('whiteShare', () => {
  it('splits the bar in half for an equal position', () => {
    expect(whiteShare(cp(0))).toBe(50)
  })

  it('grows with the advantage and is symmetric between the sides', () => {
    expect(whiteShare(cp(120))).toBeGreaterThan(whiteShare(cp(50)))
    expect(whiteShare(cp(-200))).toBeCloseTo(100 - whiteShare(cp(200)), 10)
  })

  it('keeps a half pawn and five pawns clearly apart', () => {
    expect(whiteShare(cp(50))).toBeLessThan(60)
    expect(whiteShare(cp(500))).toBeGreaterThan(80)
  })

  it('saturates at ten pawns without ever filling the bar', () => {
    expect(whiteShare(cp(2500))).toBe(whiteShare(cp(1000)))
    expect(whiteShare(cp(1000))).toBeLessThan(100)
    expect(whiteShare(cp(-1000))).toBeGreaterThan(0)
  })

  it('fills the bar for the side that mates', () => {
    expect(whiteShare(mate('white', 3))).toBe(100)
    expect(whiteShare(mate('black', 1))).toBe(0)
  })
})

describe('formatEvaluation', () => {
  it('shows pawns with one decimal and a sign', () => {
    expect(formatEvaluation(cp(120))).toBe('+1.2')
    expect(formatEvaluation(cp(-45))).toBe('-0.5')
    expect(formatEvaluation(cp(-38))).toBe('-0.4')
  })

  it('shows a near-zero evaluation as 0.0, without a sign', () => {
    expect(formatEvaluation(cp(0))).toBe('0.0')
    expect(formatEvaluation(cp(4))).toBe('0.0')
    expect(formatEvaluation(cp(-4))).toBe('0.0')
  })

  it('drops the decimal from ten pawns on, so it fits the bar', () => {
    expect(formatEvaluation(cp(1234))).toBe('+12')
    expect(formatEvaluation(cp(-998))).toBe('-10')
  })

  it('shows a forced mate as M and the number of moves', () => {
    expect(formatEvaluation(mate('white', 3))).toBe('M3')
    expect(formatEvaluation(mate('black', 2))).toBe('-M2')
  })

  it('shows the result of a position already mated', () => {
    expect(formatEvaluation(mate('white', 0))).toBe('1-0')
    expect(formatEvaluation(mate('black', 0))).toBe('0-1')
  })
})

describe('fromStoredCp', () => {
  it('reads the stored centipawns, already from White’s point of view', () => {
    expect(fromStoredCp(-87)).toEqual(cp(-87))
  })
})

describe('parseUciInfo', () => {
  const WHITE_TO_MOVE = 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2'
  const BLACK_TO_MOVE = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1'

  it('reads the depth and the score of the side to move, turned to White’s point of view', () => {
    const line = 'info depth 12 seldepth 17 multipv 1 score cp 34 nodes 51234 nps 400000 pv g1f3 b8c6'
    expect(parseUciInfo(line, WHITE_TO_MOVE)).toEqual({ depth: 12, evaluation: cp(34) })
    expect(parseUciInfo(line, BLACK_TO_MOVE)).toEqual({ depth: 12, evaluation: cp(-34) })
  })

  it('turns a mate score into the side that mates', () => {
    expect(parseUciInfo('info depth 9 score mate 2 pv d8h4', BLACK_TO_MOVE)).toEqual({ depth: 9, evaluation: mate('black', 2) })
    expect(parseUciInfo('info depth 9 score mate -3 pv a2a3', WHITE_TO_MOVE)).toEqual({ depth: 9, evaluation: mate('black', 3) })
    expect(parseUciInfo('info depth 9 score mate -1 pv a7a6', BLACK_TO_MOVE)).toEqual({ depth: 9, evaluation: mate('white', 1) })
  })

  it('credits the other side when the side to move is already mated', () => {
    expect(parseUciInfo('info depth 0 score mate 0', BLACK_TO_MOVE)).toEqual({ depth: 0, evaluation: mate('white', 0) })
  })

  it('ignores bounds and lines without a score', () => {
    expect(parseUciInfo('info depth 14 score cp 40 lowerbound nodes 1', WHITE_TO_MOVE)).toBeNull()
    expect(parseUciInfo('info string NNUE evaluation using nn.nnue', WHITE_TO_MOVE)).toBeNull()
    expect(parseUciInfo('bestmove e2e4 ponder e7e5', WHITE_TO_MOVE)).toBeNull()
  })
})

describe('evalBarTarget', () => {
  // 1.e4 (student) e5 (opponent) 2.Nf3 (student) Nc6 (opponent)
  const move = (id: string, parentId: string | null, isOpponentResponse: boolean): MoveSummary => ({
    id, parentId, isOpponentResponse, san: id, fen: `fen-${id}`, coachInsights: null, visualMarkers: null,
  })
  const LINE = [move('e4', null, false), move('e5', 'e4', true), move('Nf3', 'e5', false), move('Nc6', 'Nf3', true)]
  // A Black repertoire: the opponent opens.
  const BLACK_LINE = [move('e4', null, true), move('c5', 'e4', false)]

  it('always shows the board’s position in the demonstration', () => {
    expect(evalBarTarget(LINE, null, 'watch', 'idle')).toEqual({ nodeId: null, current: true })
    expect(evalBarTarget(LINE, 'e5', 'watch', 'idle')).toEqual({ nodeId: 'e5', current: true })
    expect(evalBarTarget(LINE, 'Nc6', 'watch', 'completed')).toEqual({ nodeId: 'Nc6', current: true })
  })

  it('stays hidden in practice until the student plays a move', () => {
    expect(evalBarTarget(LINE, null, 'practice', 'idle')).toBeNull()
    expect(evalBarTarget(LINE, null, 'practice', 'error')).toBeNull()
    expect(evalBarTarget(BLACK_LINE, null, 'practice', 'thinking')).toBeNull()
    // The opponent's first move is on the board, the student's answer is not.
    expect(evalBarTarget(BLACK_LINE, 'e4', 'practice', 'idle')).toBeNull()
  })

  it('shows the position right after the student’s move', () => {
    expect(evalBarTarget(LINE, 'e4', 'practice', 'thinking')).toEqual({ nodeId: 'e4', current: true })
  })

  it('keeps the evaluation after the student’s last move while they look for the next one', () => {
    // The opponent's reply would give the answer away (a blunder makes the bar jump).
    expect(evalBarTarget(LINE, 'e5', 'practice', 'idle')).toEqual({ nodeId: 'e4', current: false })
    expect(evalBarTarget(LINE, 'e5', 'practice', 'error')).toEqual({ nodeId: 'e4', current: false })
  })

  it('shows the final position once the line is complete', () => {
    expect(evalBarTarget(LINE, 'Nc6', 'practice', 'completed')).toEqual({ nodeId: 'Nc6', current: true })
  })
})
