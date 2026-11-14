import { describe, it, expect } from 'vitest'
import { ChooseOpeningStyle, OpeningFamilyNotFoundError, OpeningStyleNotAvailableError } from '../ChooseOpeningStyle'
import type { IOpeningChoiceRepository } from '../../repositories/IOpeningChoiceRepository'
import type { OpeningStyle } from '../../entities/OpeningStyle'

// In-memory fake: the published paths of each family and the saved choices.
function fakeRepo(families: Record<string, OpeningStyle[]>) {
  const choices = new Map<string, OpeningStyle>()
  const repo: IOpeningChoiceRepository = {
    findFamilyStyles: async (family) => families[family] ?? [],
    saveChoice: async (userId, family, style) => {
      choices.set(`${userId}:${family}`, style)
    },
  }
  return { repo, choices }
}

describe('ChooseOpeningStyle', () => {
  it('should save the path the student chose in the family', async () => {
    const { repo, choices } = fakeRepo({ 'abertura-do-bispo': ['POSITIONAL', 'TACTICAL'] })
    const result = await new ChooseOpeningStyle(repo).execute({ userId: 'u1', family: 'abertura-do-bispo', style: 'TACTICAL' })

    expect(result).toEqual({ family: 'abertura-do-bispo', style: 'TACTICAL' })
    expect(choices.get('u1:abertura-do-bispo')).toBe('TACTICAL')
  })

  it('should let the student switch to another path later', async () => {
    const { repo, choices } = fakeRepo({ 'abertura-do-bispo': ['POSITIONAL', 'TACTICAL'] })
    const useCase = new ChooseOpeningStyle(repo)
    await useCase.execute({ userId: 'u1', family: 'abertura-do-bispo', style: 'TACTICAL' })
    await useCase.execute({ userId: 'u1', family: 'abertura-do-bispo', style: 'POSITIONAL' })

    expect(choices.get('u1:abertura-do-bispo')).toBe('POSITIONAL')
  })

  it('should refuse a family that does not exist', async () => {
    const { repo, choices } = fakeRepo({})
    await expect(
      new ChooseOpeningStyle(repo).execute({ userId: 'u1', family: 'inexistente', style: 'TACTICAL' }),
    ).rejects.toBeInstanceOf(OpeningFamilyNotFoundError)
    expect(choices.size).toBe(0)
  })

  it('should refuse a path the family does not have', async () => {
    const { repo, choices } = fakeRepo({ 'abertura-do-bispo': ['TACTICAL'] })
    await expect(
      new ChooseOpeningStyle(repo).execute({ userId: 'u1', family: 'abertura-do-bispo', style: 'BALANCED' }),
    ).rejects.toBeInstanceOf(OpeningStyleNotAvailableError)
    expect(choices.size).toBe(0)
  })
})
