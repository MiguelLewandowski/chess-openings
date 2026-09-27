import { describe, expect, it } from 'vitest'
import { allNodes, mainline, readChapters, studentColorOf } from '../pgn/read'
import { writePgn } from '../pgn/write'
import { STARTING_FEN } from '../chess/types'
import { ENGLISH_PGN } from './helpers'

describe('readChapters', () => {
  const [chapter] = readChapters(ENGLISH_PGN)

  it('should take the chapter name and the student color from the Lichess headers', () => {
    expect(chapter.title).toBe('Linha principal')
    expect(chapter.studentColor).toBe('w')
  })

  it('should keep the main line and the variations apart', () => {
    expect(mainline(chapter).map((n) => n.san)).toEqual(['c4', 'e5', 'g3', 'Nf6', 'Bg2', 'd5'])
    const variation = allNodes(chapter.roots).find((n) => n.san === 'Nc3')
    expect(variation?.mainline).toBe(false)
    expect(variation?.children[0].san).toBe('Nf6')
  })

  it('should separate the comment from the arrows', () => {
    const c4 = mainline(chapter)[0]
    expect(c4.authorComment).toBe('Controla d5')
    expect(c4.authorArrows).toEqual(['Gc4d5'])
  })

  it('should fall back to the side to move when there is no orientation', () => {
    expect(studentColorOf(undefined, 'rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR b KQkq - 0 1')).toBe('b')
    expect(studentColorOf('black', STARTING_FEN)).toBe('b')
  })
})

describe('writePgn', () => {
  it('should round-trip moves, variations, comments, markers and headers', () => {
    const [chapter] = readChapters(ENGLISH_PGN)
    const nodes = mainline(chapter)
    const notes = new Map([
      [nodes[0].id, { text: 'Controlamos d5 {sem chaves}', arrows: ['Gc4d5'], highlights: ['Rd5'] }],
      [nodes[1].id, { text: 'As pretas ocupam o centro.', arrows: [], highlights: [] }],
    ])
    const pgn = writePgn([
      { title: 'Linha principal', studentColor: 'b', initialFen: STARTING_FEN, roots: chapter.roots, notes, trailingComment: 'Plano: jogar b4.' },
    ])

    const [back] = readChapters(pgn)
    expect(back.title).toBe('Linha principal')
    expect(back.studentColor).toBe('b')
    expect(mainline(back).map((n) => n.san)).toEqual(mainline(chapter).map((n) => n.san))
    expect(allNodes(back.roots).some((n) => n.san === 'Nc3' && !n.mainline)).toBe(true)
    expect(mainline(back)[0].authorComment).toBe('Controlamos d5 sem chaves')
    expect(mainline(back)[0].authorArrows).toEqual(['Gc4d5'])
    expect(mainline(back)[0].authorHighlights).toEqual(['Rd5'])
    expect(pgn).toContain('{Plano: jogar b4.}')
  })

  it('should write the setup headers for a chapter that starts mid-game', () => {
    const fen = 'rnbqkbnr/pppp1ppp/8/4p3/2P5/8/PP1PPPPP/RNBQKBNR w KQkq - 0 2'
    const pgn = writePgn([{ title: 'Cartão', studentColor: 'w', initialFen: fen, roots: [], notes: new Map(), preComment: 'O que jogar?' }])
    expect(pgn).toContain('[SetUp "1"]')
    expect(pgn).toContain(`[FEN "${fen}"]`)
    expect(pgn).toContain('{O que jogar?}')
  })
})
