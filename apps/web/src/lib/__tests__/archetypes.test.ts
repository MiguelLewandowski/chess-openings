import { describe, expect, it } from 'vitest'
import { ARCHETYPES, dominantStyle, isStyleArchetype } from '@/lib/archetypes'

describe('dominantStyle', () => {
  it('picks the most frequent style', () => {
    expect(dominantStyle(['Aggressive', 'Aggressive', 'Solid'])).toBe('Aggressive')
    expect(dominantStyle(['Solid', 'Positional', 'Positional'])).toBe('Positional')
  })

  it('defaults to Universal when there are no answers', () => {
    expect(dominantStyle([])).toBe('Universal')
  })

  it('breaks ties deterministically by archetype order', () => {
    expect(dominantStyle(['Aggressive', 'Solid'])).toBe('Aggressive')
  })
})

describe('isStyleArchetype', () => {
  it('accepts the canonical keys only', () => {
    expect(isStyleArchetype('Solid')).toBe(true)
    expect(isStyleArchetype('Aggressive')).toBe(true)
  })

  it('rejects display names and empty values', () => {
    expect(isStyleArchetype('O Predador Tático')).toBe(false)
    expect(isStyleArchetype(null)).toBe(false)
    expect(isStyleArchetype(undefined)).toBe(false)
  })
})

describe('ARCHETYPES', () => {
  it('covers every style key with a display name', () => {
    expect(Object.keys(ARCHETYPES)).toHaveLength(4)
    for (const info of Object.values(ARCHETYPES)) {
      expect(info.name).toBeTruthy()
      expect(info.description).toBeTruthy()
    }
  })
})
