import { describe, it, expect } from 'vitest'
import { OPENING_STYLES, familyNameOf, parseOpeningStyle, pathOpeningName } from '../OpeningStyle'

describe('OpeningStyle', () => {
  it('should list the paths from the calmest to the sharpest', () => {
    expect(OPENING_STYLES).toEqual(['POSITIONAL', 'BALANCED', 'TACTICAL'])
  })

  it('should name a path after its family and style', () => {
    expect(pathOpeningName('Abertura do Bispo', 'POSITIONAL')).toBe('Abertura do Bispo — Posicional')
    expect(pathOpeningName('Abertura do Bispo', 'BALANCED')).toBe('Abertura do Bispo — Equilibrado')
    expect(pathOpeningName('Abertura do Bispo', 'TACTICAL')).toBe('Abertura do Bispo — Tático')
  })

  it('should recover the family name from a path name', () => {
    expect(familyNameOf('Abertura do Bispo — Tático')).toBe('Abertura do Bispo')
    expect(familyNameOf('Abertura Inglesa')).toBe('Abertura Inglesa')
  })

  it('should read a style from its Portuguese name, with or without accents', () => {
    expect(parseOpeningStyle('posicional')).toBe('POSITIONAL')
    expect(parseOpeningStyle('Equilibrado')).toBe('BALANCED')
    expect(parseOpeningStyle('tatico')).toBe('TACTICAL')
    expect(parseOpeningStyle('tático')).toBe('TACTICAL')
    expect(parseOpeningStyle('solido')).toBeNull()
  })
})
