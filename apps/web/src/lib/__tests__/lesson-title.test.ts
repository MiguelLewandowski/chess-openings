import { describe, it, expect } from 'vitest'
import { lessonTitleParts } from '../lesson-title'

const opening = 'Abertura do Bispo'

describe('lessonTitleParts', () => {
  it('should split a repertoire line into name and moves', () => {
    expect(lessonTitleParts('Berlinense: Defesa Paulsen (3...c6)', opening)).toEqual({
      kind: 'line',
      name: 'Berlinense: Defesa Paulsen',
      moves: '3...c6',
    })
  })

  it('should detect a trap and put the name after the dash', () => {
    expect(lessonTitleParts('Armadilha: 2...Cf6 3.d3 Bc5 4.Cf3 Cg4? — o sacrifício em f7', opening)).toEqual({
      kind: 'trap',
      name: 'O sacrifício em f7',
      moves: '2...Cf6 3.d3 Bc5 4.Cf3 Cg4?',
    })
  })

  it('should drop the opening name prefix', () => {
    expect(lessonTitleParts('Abertura do Bispo: Linha principal', opening)).toEqual({
      kind: 'line',
      name: 'Linha principal',
      moves: null,
    })
  })

  it('should keep a parenthetical without moves in the name', () => {
    expect(lessonTitleParts('Ideias gerais (introdução)', opening).name).toBe('Ideias gerais (introdução)')
  })

  it('should keep a dashed title without moves whole', () => {
    expect(lessonTitleParts('Plano — ala do rei', opening)).toEqual({ kind: 'line', name: 'Plano — ala do rei', moves: null })
  })
})
