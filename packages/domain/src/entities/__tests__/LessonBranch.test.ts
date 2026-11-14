import { describe, it, expect } from 'vitest'
import { branchOf } from '../LessonBranch'

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
const line = (moves: string, initialFen: string | null = START) => ({ initialFen, sans: moves.split(' ') })

// First line of each lesson of out/lesson-author/bispo-tatico.txt, in standard (English) SAN,
// which is how the PGN parser hands them over.
const BISHOP_TACTICAL = [
  line('e4 e5 Bc4 Bc5 d4 exd4 Bxf7+ Kxf7 Qh5+ g6 Qxc5 Nc6 Qc4+'), // 2...Bc5 — Gambito Lewis
  line('e4 e5 Bc4 d6 Nf3 h6 d4 exd4 c3 dxc3 Bxf7+'), // 2...d6
  line('e4 e5 Bc4 Nf6 d4 Nxe4 dxe5 Bc5 Qd5'), // Armadilha: 2...Cf6 3.d4 Cxe4?
  line('e4 e5 Bc4 Nc6 Nc3 Bc5 Qg4 Qf6 Nd5 Qxf2+ Kd1 d6 Qxg7'), // 2...Cc6 3.Cc3 Bc5
  line('e4 e5 Bc4 Nf6 d4 exd4 Nf3 Nxe4 Qxd4 Nf6 Nc3 Nc6 Qh4 Be7 Bg5'), // 2...Cf6 3.d4 exd4 4.Cf3 Cxe4
  line('e4 e5 Bc4 Nf6 d4 d6 dxe5 dxe5 Qxd8+ Kxd8 Nf3 Nxe4 Nxe5'), // Armadilha: 2...Cf6 3.d4 d6?
]

// First line of some lessons of out/lesson-author/bispo-equilibrado.txt.
const BISHOP_BALANCED = [
  line('e4 e5 Bc4 Bc5 Nf3 d6 c3 Bg4 Qb3'), // 2...Bc5
  line('e4 e5 Bc4 Nc6 Nf3 Nf6 d3 Bc5 c3 O-O a4 a5 Bg5'), // 2...Cc6 3.Cf3 Cf6
  line('e4 e5 Bc4 Nf6 d3 Nc6 Nf3 Bc5 c3 O-O a4'), // 2...Cf6 3.d3 Cc6
  line('e4 e5 Bc4 Nf6 d3 Bc5 Nf3 Ng4 Bxf7+ Kxf7 Ng5+ Ke8 Qxg4'), // Armadilha: 2...Cf6 3.d3 Bc5 4.Cf3 Cg4?
  line('e4 e5 Bc4 Nc6 Nf3 Bc5 c3 h6 b4 Bb6 b5 Na5 Bxf7+'), // Armadilha: 2...Cc6 3.Cf3 Bc5 4.c3 h6?
]

describe('branchOf', () => {
  it('should name each lesson by the opponent move that leaves the common trunk', () => {
    expect(branchOf(BISHOP_TACTICAL)).toEqual(['2...Bc5', '2...d6', '2...Cf6', '2...Cc6', '2...Cf6', '2...Cf6'])
  })

  it('should put a trap deep inside a line in the branch it starts from', () => {
    expect(branchOf(BISHOP_BALANCED)).toEqual(['2...Bc5', '2...Cc6', '2...Cf6', '2...Cf6', '2...Cc6'])
  })

  it('should number the branch as a White move when the student plays Black', () => {
    const french = [
      line('e4 e6 d4 d5 Nc3 Bb4'),
      line('e4 e6 d4 d5 e5 c5'),
      line('e4 e6 Nf3 d5'),
      line('e4 e6 d3 d5'),
    ]
    expect(branchOf(french)).toEqual(['2.d4', '2.d4', '2.Cf3', '2.d3'])
  })

  it('should find the trunk past a common deeper prefix', () => {
    const lines = [line('e4 e5 Bc4 Nf6 d4 exd4 Nf3 Nxe4'), line('e4 e5 Bc4 Nf6 d4 Nc6 d5'), line('e4 e5 Bc4 Nf6 d4 d6 dxe5')]
    expect(branchOf(lines)).toEqual(['3...exd4', '3...Cc6', '3...d6'])
  })

  it('should keep a lesson that ends before the divergence in the branch of the first lesson', () => {
    const lines = [line('e4 e5 Bc4 Bc5 d4'), line('e4 e5'), line('e4 e5 Bc4 Nf6 d4'), line('e4 e5 Bc4')]
    expect(branchOf(lines)).toEqual(['2...Bc5', '2...Bc5', '2...Cf6', '2...Bc5'])
  })

  it('should use the first lesson that has a branch when the first lesson itself is short', () => {
    const lines = [line('e4 e5'), line('e4 e5 Bc4 Nc6'), line('e4 e5 Bc4 Nf6')]
    expect(branchOf(lines)).toEqual(['2...Cc6', '2...Cc6', '2...Cf6'])
  })

  it('should write pieces, promotions and castling in Portuguese notation', () => {
    const lines = [line('e4 e5 Ke2'), line('e4 e5 Qh5'), line('e4 e5 Rb1'), line('e4 e5 Nf3'), line('e4 e5 O-O'), line('e4 e5 a8=Q+')]
    expect(branchOf(lines)).toEqual(['2.Re2', '2.Dh5', '2.Tb1', '2.Cf3', '2.O-O', '2.a8=D+'])
  })

  it('should number from the starting position of the lessons', () => {
    const fen = 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3'
    expect(branchOf([line('Nf6 d3', fen), line('Bc5 c3', fen)])).toEqual(['3...Cf6', '3...Bc5'])
  })

  it('should leave every lesson without a branch when there is no divergence', () => {
    expect(branchOf([])).toEqual([])
    expect(branchOf([line('e4 e5 Nf3')])).toEqual([null])
    expect(branchOf([line('e4 e5'), line('e4 e5 Nf3 Nc6'), line('e4')])).toEqual([null, null, null])
  })

  it('should leave every lesson without a branch when the lessons start from different positions', () => {
    const fen = '8/8/8/8/8/8/4K3/7k w - - 0 1'
    expect(branchOf([line('e4 e5'), line('Kd3', fen)])).toEqual([null, null])
    expect(branchOf([line('e4 e5', null), line('d4 d5', null)])).toEqual(['1.e4', '1.d4'])
  })
})
