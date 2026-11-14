import { describe, it, expect } from 'vitest'
import type { OpeningPathSummary, OpeningStyle, OpeningSummary } from '@chess-openings/domain'
import { openingView, pathsLabel, STYLE_PITCH } from '../opening-paths'

function path(style: OpeningStyle): OpeningPathSummary {
  return { id: `id-${style}`, name: `Abertura Teste — ${style}`, slug: `abertura-teste-${style.toLowerCase()}`, style, lessons: [] }
}

function opening(overrides: Partial<OpeningSummary> = {}): OpeningSummary {
  return {
    id: 'id-POSITIONAL',
    name: 'Abertura Teste',
    slug: 'abertura-teste',
    description: null,
    styleTags: [],
    isTutorial: false,
    family: 'abertura-teste',
    style: 'POSITIONAL',
    lessons: [],
    paths: [path('POSITIONAL'), path('BALANCED'), path('TACTICAL')],
    chosenStyle: null,
    ...overrides,
  }
}

describe('openingView', () => {
  it('should open the track of an opening without paths', () => {
    const plain = opening({ family: null, style: null, paths: [], slug: 'italiana' })
    expect(openingView(plain, { switching: false })).toBe('track')
    expect(openingView(plain, { switching: true })).toBe('track')
  })

  it('should ask for a path when a family has several and none was chosen', () => {
    expect(openingView(opening(), { switching: false })).toBe('choose')
  })

  it('should open the chosen path track', () => {
    expect(openingView(opening({ chosenStyle: 'TACTICAL', style: 'TACTICAL' }), { switching: false })).toBe('track')
  })

  it('should show the choice again when the student asks to switch', () => {
    expect(openingView(opening({ chosenStyle: 'TACTICAL', style: 'TACTICAL' }), { switching: true })).toBe('choose')
  })

  it('should open a family with a single path straight into its track', () => {
    const single = opening({ paths: [path('TACTICAL')], style: 'TACTICAL' })
    expect(openingView(single, { switching: false })).toBe('track')
    expect(openingView(single, { switching: true })).toBe('track')
  })

  it('should open the track of a path reached by its own slug', () => {
    const tactical = opening({ slug: 'abertura-teste-tactical', name: 'Abertura Teste — Tático', style: 'TACTICAL' })
    expect(openingView(tactical, { switching: false })).toBe('track')
  })
})

describe('pathsLabel', () => {
  it('should name the paths in Portuguese, calmest first', () => {
    expect(pathsLabel(opening().paths)).toBe('Posicional · Equilibrado · Tático')
  })

  it('should be empty for an opening without paths', () => {
    expect(pathsLabel([])).toBe('')
  })
})

describe('STYLE_PITCH', () => {
  it('should describe every style', () => {
    for (const style of ['POSITIONAL', 'BALANCED', 'TACTICAL'] as const) {
      expect(STYLE_PITCH[style].length).toBeGreaterThan(0)
    }
  })
})
