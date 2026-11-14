import type { OpeningStyle } from '../entities/OpeningStyle'

export interface IOpeningChoiceRepository {
  // The styles of the paths published in the family; empty when there is no such family.
  findFamilyStyles(family: string): Promise<OpeningStyle[]>
  // Creates the student's choice in the family, or replaces the one already there.
  saveChoice(userId: string, family: string, style: OpeningStyle): Promise<void>
}
