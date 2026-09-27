import { describe, expect, it } from 'vitest'
import { tutorialToPgn, type Tutorial } from '../tutorial/pgn'
import { PRIMEIROS_PASSOS } from '../tutorial/primeiros-passos'

const lesson = (steps: Tutorial['lessons'][number]['practice']['steps']): Tutorial => ({
  studyName: 'Teste',
  lessons: [
    {
      title: 'A torre',
      demo: { fen: '7k/8/8/8/8/8/8/R3K3 w - - 0 1', moves: [{ san: 'Ra5', comment: 'Linha reta.' }] },
      practice: { title: 'mova', fen: '7k/8/8/8/8/8/8/R3K3 w - - 0 1', intro: 'Mova a torre.', steps },
    },
  ],
})

describe('tutorialToPgn', () => {
  it('should play every lesson of the real tutorial', () => {
    const pgn = tutorialToPgn(PRIMEIROS_PASSOS)
    expect(pgn.match(/\[ChapterName /g)).toHaveLength(PRIMEIROS_PASSOS.lessons.length * 2)
    expect(pgn).toContain('[ChapterName "O peão | Prática: avance e capture"]')
  })

  it('should write the lesson, its practice chapter, the intro and the alternatives as variations', () => {
    const pgn = tutorialToPgn(lesson([{ accept: ['Ra7', 'Ra6'], comment: 'Isso!' }]))
    expect(pgn).toContain('[ChapterName "A torre"]')
    expect(pgn).toContain('[ChapterName "A torre | Prática: mova"]')
    expect(pgn).toContain('{Mova a torre.} 1. Ra7 {Isso!} (1. Ra6 {Isso!}) *')
  })

  it('should number the reply and the next move after a variation', () => {
    const pgn = tutorialToPgn(
      lesson([
        { accept: ['Ra5'], comment: 'Isso!', reply: { san: 'Kg7', comment: 'Agora para o lado.' } },
        { accept: ['Rb5'], comment: 'Fim.' },
      ]),
    )
    expect(pgn).toContain('1. Ra5 {Isso!} 1... Kg7 {Agora para o lado.} 2. Rb5 {Fim.}')
  })

  it('should stop on an illegal move instead of writing a cut line', () => {
    // Typed without the check sign: chess.js still finds it and writes "Ra8+".
    expect(tutorialToPgn(lesson([{ accept: ['Ra8'], comment: 'x' }]))).toContain('1. Ra8+ {x}')
    expect(() => tutorialToPgn(lesson([{ accept: ['Rh8'], comment: 'x' }]))).toThrow(/lance ilegal Rh8/)
  })

  it('should only accept several answers on the last step', () => {
    const steps = [
      { accept: ['Ra5', 'Ra6'], comment: 'x', reply: { san: 'Kg7' } },
      { accept: ['Rb5'], comment: 'y' },
    ]
    expect(() => tutorialToPgn(lesson(steps))).toThrow(/último passo/)
  })
})
