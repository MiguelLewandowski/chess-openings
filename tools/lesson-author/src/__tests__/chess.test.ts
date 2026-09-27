import { describe, expect, it } from 'vitest'
import { Chess } from 'chess.js'
import { computeFacts, materialFor, squaresAttackedFrom } from '../chess/facts'
import { formatLine, moveLabel, sanFromPt, sanToPt, uciLineToSan } from '../chess/notation'
import { STARTING_FEN } from '../chess/types'

describe('notation', () => {
  it('should translate piece letters between English and Portuguese', () => {
    expect(sanToPt('Nf3')).toBe('Cf3')
    expect(sanToPt('Qxd8+')).toBe('Dxd8+')
    expect(sanToPt('Rae1')).toBe('Tae1')
    expect(sanToPt('Kg1')).toBe('Rg1')
    expect(sanToPt('exd8=Q')).toBe('exd8=D')
    expect(sanFromPt('Cf3')).toBe('Nf3')
    expect(sanFromPt('Rg1')).toBe('Kg1')
    expect(sanFromPt('O-O')).toBe('O-O')
  })

  it('should number moves for either side', () => {
    expect(moveLabel(4, 'w', 'd4')).toBe('4.d4')
    expect(moveLabel(4, 'b', 'Nf6')).toBe('4...Cf6')
  })

  it('should turn engine UCI into SAN and stop at an illegal move', () => {
    expect(uciLineToSan(STARTING_FEN, ['e2e4', 'e7e5', 'g1f3'])).toEqual(['e4', 'e5', 'Nf3'])
    expect(uciLineToSan(STARTING_FEN, ['e2e4', 'e2e5', 'g1f3'])).toEqual(['e4'])
  })

  it('should read castling written as king-takes-rook, as the Lichess cloud eval does', () => {
    const fen = 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 1 5'
    expect(uciLineToSan(fen, ['e1h1', 'e8h8'])).toEqual(['O-O', 'O-O'])
    expect(uciLineToSan(fen, ['e1g1'])).toEqual(['O-O'])
  })

  it('should format a numbered line from a Black move', () => {
    const afterE4 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1'
    expect(formatLine(afterE4, ['e5', 'Nf3', 'Nc6'])).toBe('1...e5 2.Cf3 Cc6')
  })
})

describe('facts', () => {
  it('should count a defender as attacking its own piece square', () => {
    // chess.js reports attackers regardless of the occupant, which "defends" relies on.
    const chess = new Chess(STARTING_FEN)
    expect(chess.attackers('e2', 'w')).toContain('e1')
  })

  it('should list the squares the moved piece controls', () => {
    const chess = new Chess(STARTING_FEN)
    chess.move('Nf3')
    const facts = computeFacts(chess.fen(), 'f3')
    expect(facts.movedPieceControls.sort()).toEqual(['d2', 'd4', 'e1', 'e5', 'g1', 'g5', 'h2', 'h4'])
    expect(squaresAttackedFrom(chess, 'f3')).toContain('e5')
  })

  it('should flag a hanging piece', () => {
    // 1.e4 d5 2.Bb5+?? leaves nothing hanging, but after 1.e4 e5 2.Qh5 Nc6 3.Qxf7+?? the
    // queen on f7 is defended by nothing and attacked by the king.
    const chess = new Chess(STARTING_FEN)
    for (const san of ['e4', 'e5', 'Qh5', 'Nc6', 'Qxf7+']) chess.move(san)
    expect(computeFacts(chess.fen()).hanging).toContain('Df7 (brancas)')
  })

  it('should list the pieces still at home and whether each side castled', () => {
    const chess = new Chess(STARTING_FEN)
    for (const san of ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'O-O']) chess.move(san)
    const facts = computeFacts(chess.fen())
    expect(facts.undeveloped.w).toEqual(['Cb1', 'Bc1', 'Dd1'])
    expect(facts.undeveloped.b).toEqual(['Cg8', 'Bc8', 'Dd8'])
    expect(facts.castled).toEqual({ w: true, b: false })
  })

  it('should count material from either side', () => {
    // White is a knight up.
    const fen = 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    expect(materialFor(fen, 'w')).toBe(3)
    expect(materialFor(fen, 'b')).toBe(-3)
  })

  it('should describe pawn structure', () => {
    const facts = computeFacts('4k3/pp6/8/8/8/8/P1P5/4K3 w - - 0 1')
    expect(facts.isolatedPawns).toContain('coluna a (brancas)')
    expect(facts.openFiles).toContain('d')
    expect(facts.semiOpenFiles.w).toContain('b')
  })
})
