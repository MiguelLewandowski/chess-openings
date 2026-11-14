import { describe, it, expect } from 'vitest'
import { activePaths } from '../ActivePath'

describe('activePaths', () => {
  it('should keep the path the student chose in each family', () => {
    const chosen = [{ family: 'bispo', style: 'TACTICAL' as const }]
    const practiced = [
      { family: 'bispo', style: 'TACTICAL' as const },
      { family: 'bispo', style: 'POSITIONAL' as const },
    ]
    expect(activePaths(chosen, practiced)).toEqual([{ family: 'bispo', style: 'TACTICAL' }])
  })

  it('should count the only practiced path of a family without a choice as active', () => {
    // A family with a single path never asks for a choice; a path opened by its own slug neither.
    expect(activePaths([], [{ family: 'bispo', style: 'BALANCED' }])).toEqual([{ family: 'bispo', style: 'BALANCED' }])
  })

  it('should leave out a family without a choice and with several practiced paths', () => {
    // Mixing paths would drill contradictory moves in the same position.
    const practiced = [
      { family: 'bispo', style: 'TACTICAL' as const },
      { family: 'bispo', style: 'POSITIONAL' as const },
    ]
    expect(activePaths([], practiced)).toEqual([])
  })

  it('should not let the practiced paths of one family affect another', () => {
    const chosen = [{ family: 'bispo', style: 'TACTICAL' as const }]
    const practiced = [
      { family: 'bispo', style: 'POSITIONAL' as const },
      { family: 'italiana', style: 'BALANCED' as const },
      { family: 'italiana', style: 'BALANCED' as const },
    ]
    expect(activePaths(chosen, practiced)).toEqual([
      { family: 'bispo', style: 'TACTICAL' },
      { family: 'italiana', style: 'BALANCED' },
    ])
  })
})
