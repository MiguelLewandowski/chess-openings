import type { OpeningStyle } from '../entities/OpeningStyle'
import { OPENING_STYLE_LABELS } from '../entities/OpeningStyle'
import type { IOpeningChoiceRepository } from '../repositories/IOpeningChoiceRepository'
import type { OpeningChoice } from '../read-models/opening.read-model'

export class OpeningFamilyNotFoundError extends Error {
  constructor(readonly family: string) {
    super(`A abertura '${family}' não tem caminhos para escolher.`)
  }
}

export class OpeningStyleNotAvailableError extends Error {
  constructor(readonly family: string, readonly style: OpeningStyle) {
    super(`A abertura '${family}' não tem o caminho ${OPENING_STYLE_LABELS[style]}.`)
  }
}

export interface ChooseOpeningStyleInput {
  userId: string
  family: string
  style: OpeningStyle
}

// The student picks (or switches) the path of a family. Nothing is deleted: the progress of
// every path stays, and only the chosen one comes back in the reviews.
export class ChooseOpeningStyle {
  constructor(private readonly choiceRepo: IOpeningChoiceRepository) {}

  async execute({ userId, family, style }: ChooseOpeningStyleInput): Promise<OpeningChoice> {
    const styles = await this.choiceRepo.findFamilyStyles(family)
    if (styles.length === 0) throw new OpeningFamilyNotFoundError(family)
    if (!styles.includes(style)) throw new OpeningStyleNotAvailableError(family, style)

    await this.choiceRepo.saveChoice(userId, family, style)
    return { family, style }
  }
}
