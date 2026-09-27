import { describe, expect, it } from 'vitest'
import { readRepertoireText, RepertoireSyntaxError, tokenize } from '../pgn/lines'
import { allNodes, mainline } from '../pgn/read'
import { writePgn } from '../pgn/write'
import { readChapters } from '../pgn/read'

const TEXT = `# Abertura do Bispo
cor: brancas

## Berlinense: 3...c6
1.e4 e5 2.Bc4 Cf6 3.d3 c6 4.Cf3 d5 5.Bb3 {recuamos para manter a diagonal}
1.e4 e5 2.Bc4 Cf6 3.d3 c6 4.Nf3 Bd6

## Philidor: 2...c6
1.e4 e5 2.Bc4 c6 3.d4
`

describe('tokenize', () => {
  it('should drop move numbers and attach comments to the move before them', () => {
    expect(tokenize('1.e4 e5 2.Bc4 {ideia} 2...Cf6 3.d3!?')).toEqual([
      { move: 'e4', comment: '' },
      { move: 'e5', comment: '' },
      { move: 'Bc4', comment: 'ideia' },
      { move: 'Cf6', comment: '' },
      { move: 'd3', comment: '' },
    ])
  })
})

describe('readRepertoireText', () => {
  const repertoire = readRepertoireText(TEXT)

  it('should read the study name, the side and one chapter per heading', () => {
    expect(repertoire.studyName).toBe('Abertura do Bispo')
    expect(repertoire.chapters.map((c) => [c.title, c.studentColor])).toEqual([
      ['Berlinense: 3...c6', 'w'],
      ['Philidor: 2...c6', 'w'],
    ])
  })

  it('should merge shared prefixes, keeping the first line as the main line', () => {
    const [berlin] = repertoire.chapters
    expect(mainline(berlin).map((n) => n.san)).toEqual(['e4', 'e5', 'Bc4', 'Nf6', 'd3', 'c6', 'Nf3', 'd5', 'Bb3'])
    const bd6 = allNodes(berlin.roots).find((n) => n.san === 'Bd6')
    expect(bd6?.mainline).toBe(false)
    // Portuguese and English notation reach the same node (4.Cf3 and 4.Nf3).
    expect(allNodes(berlin.roots).filter((n) => n.san === 'Nf3')).toHaveLength(1)
    expect(mainline(berlin).at(-1)?.authorComment).toBe('recuamos para manter a diagonal')
  })

  it('should read a Black repertoire', () => {
    const black = readRepertoireText('cor: pretas\n## Siciliana\n1.e4 c5')
    expect(black.chapters[0].studentColor).toBe('b')
  })

  it('should stop at an illegal move with the line number', () => {
    expect(() => readRepertoireText('## X\n1.e4 e5 2.Bc5')).toThrow(/linha 2.*"Bc5"/)
    expect(() => readRepertoireText('1.e4')).toThrow(RepertoireSyntaxError)
  })

  it('should become a PGN the app can import, named after the study', () => {
    const pgn = writePgn(
      repertoire.chapters.map((c) => ({ title: c.title, studyName: c.studyName, studentColor: c.studentColor, initialFen: c.initialFen, roots: c.roots, notes: new Map() })),
    )
    expect(pgn).toContain('[StudyName "Abertura do Bispo"]')
    const back = readChapters(pgn)
    expect(back.map((c) => c.title)).toEqual(['Berlinense: 3...c6', 'Philidor: 2...c6'])
    expect(allNodes(back[0].roots).map((n) => n.san)).toContain('Bd6')
  })
})
