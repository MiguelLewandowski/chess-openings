import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../infrastructure/prisma.service'
import { PrismaOpeningChoiceRepository } from '../../infrastructure/repositories/prisma-opening-choice.repository'
import {
  ChooseOpeningStyle,
  OPENING_STYLES,
  OpeningFamilyNotFoundError,
  OpeningStyleNotAvailableError,
  familyNameOf,
  type LessonSummary,
  type OpeningChoice,
  type OpeningPathSummary,
  type OpeningStyle,
  type OpeningSummary,
} from '@chess-openings/domain'

const OPENING_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  styleTags: true,
  isTutorial: true,
  family: true,
  style: true,
  lessons: { select: { id: true, title: true, order: true }, orderBy: { order: 'asc' } },
} as const

interface OpeningRow {
  id: string
  name: string
  slug: string
  description: string | null
  styleTags: string[]
  isTutorial: boolean
  family: string | null
  style: OpeningStyle | null
  lessons: LessonSummary[]
}

type Choices = Map<string, OpeningStyle>

@Injectable()
export class OpeningService {
  private readonly chooseOpeningStyle: ChooseOpeningStyle

  constructor(
    private readonly prisma: PrismaService,
    choiceRepo: PrismaOpeningChoiceRepository,
  ) {
    this.chooseOpeningStyle = new ChooseOpeningStyle(choiceRepo)
  }

  // The paths of a family become one entry, where its first path stood in the list.
  async findAll(userId?: string): Promise<OpeningSummary[]> {
    const [openings, choices] = await Promise.all([
      this.prisma.opening.findMany({
        select: OPENING_SELECT,
        // A tutorial (how the pieces move) is where a beginner starts, so it leads the catalog.
        orderBy: [{ isTutorial: 'desc' }, { name: 'asc' }],
      }),
      this.findChoices(userId),
    ])

    const families = new Map<string, OpeningRow[]>()
    for (const opening of openings) {
      if (opening.family) families.set(opening.family, [...(families.get(opening.family) ?? []), opening])
    }

    const summaries: OpeningSummary[] = []
    for (const opening of openings) {
      if (!opening.family) {
        summaries.push(plainSummary(opening))
      } else if (families.get(opening.family)?.[0] === opening) {
        summaries.push(familySummary(opening.family, families.get(opening.family) ?? [], choices.get(opening.family) ?? null))
      }
    }
    return summaries
  }

  // A family slug answers with the family entry; any other slug with that opening.
  async findBySlug(slug: string, userId?: string): Promise<OpeningSummary> {
    const [paths, choices] = await Promise.all([
      this.prisma.opening.findMany({ where: { family: slug }, select: OPENING_SELECT }),
      this.findChoices(userId),
    ])
    if (paths.length > 0) return familySummary(slug, paths, choices.get(slug) ?? null)

    const opening = await this.prisma.opening.findUnique({ where: { slug }, select: OPENING_SELECT })
    if (!opening) throw new NotFoundException(`Opening '${slug}' not found.`)
    if (!opening.family) return plainSummary(opening)

    const sisters = await this.prisma.opening.findMany({ where: { family: opening.family }, select: OPENING_SELECT })
    return { ...plainSummary(opening), paths: toPaths(sisters), chosenStyle: choices.get(opening.family) ?? null }
  }

  async choose(userId: string, family: string, style: OpeningStyle): Promise<OpeningChoice> {
    try {
      return await this.chooseOpeningStyle.execute({ userId, family, style })
    } catch (error) {
      if (error instanceof OpeningFamilyNotFoundError) throw new NotFoundException(error.message)
      if (error instanceof OpeningStyleNotAvailableError) throw new BadRequestException(error.message)
      throw error
    }
  }

  async delete(id: string): Promise<void> {
    const opening = await this.prisma.opening.findUnique({ where: { id } })
    if (!opening) throw new NotFoundException(`Opening '${id}' not found.`)
    await this.prisma.opening.delete({ where: { id } })
  }

  private async findChoices(userId?: string): Promise<Choices> {
    if (!userId) return new Map()
    const rows = await this.prisma.userOpeningChoice.findMany({ where: { userId }, select: { family: true, style: true } })
    return new Map(rows.map((row) => [row.family, row.style]))
  }
}

function plainSummary(opening: OpeningRow): OpeningSummary {
  return { ...opening, paths: [], chosenStyle: null }
}

function toPaths(openings: OpeningRow[]): OpeningPathSummary[] {
  return openings
    .flatMap((o) => (o.style ? [{ id: o.id, name: o.name, slug: o.slug, style: o.style, lessons: o.lessons }] : []))
    .sort((a, b) => OPENING_STYLES.indexOf(a.style) - OPENING_STYLES.indexOf(b.style))
}

// Name and slug are the family's; the rest describes the active path: the chosen one or,
// without a (still valid) choice, the calmest.
function familySummary(family: string, openings: OpeningRow[], chosenStyle: OpeningStyle | null): OpeningSummary {
  const paths = toPaths(openings)
  const active = paths.find((p) => p.style === chosenStyle) ?? paths[0]
  const opening = openings.find((o) => o.id === active?.id) ?? openings[0]
  return {
    ...opening,
    name: familyNameOf(opening.name),
    slug: family,
    paths,
    chosenStyle: paths.some((p) => p.style === chosenStyle) ? chosenStyle : null,
  }
}
