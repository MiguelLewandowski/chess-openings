import { OPENING_STYLE_LABELS, type OpeningPathSummary, type OpeningStyle, type OpeningSummary } from '@chess-openings/domain'

// One sentence per style, shown where the student picks a path. It follows how each path is
// generated (lesson-author `--estilo`): which of the moves close to the engine's best we play.
export const STYLE_PITCH: Record<OpeningStyle, string> = {
  POSITIONAL: 'Os lances mais jogados por mestres: posições calmas, com um plano claro.',
  BALANCED: 'A base sólida dos mestres, trocada por um lance tático só quando ele faz o adversário errar bem mais.',
  TACTICAL: 'Os lances que mais fazem o adversário errar, com xeques, capturas e gambitos.',
}

export type OpeningView = 'track' | 'choose'

// What the opening page shows. A family with two or more paths asks for one until the student
// chooses, and again when they ask to switch. A path opened by its own slug, a family with a
// single path and an opening without paths go straight to the track.
export function openingView(opening: OpeningSummary, { switching }: { switching: boolean }): OpeningView {
  const isFamilyEntry = opening.family !== null && opening.slug === opening.family
  if (!isFamilyEntry || opening.paths.length < 2) return 'track'
  return switching || opening.chosenStyle === null ? 'choose' : 'track'
}

export function pathsLabel(paths: OpeningPathSummary[]): string {
  return paths.map((path) => OPENING_STYLE_LABELS[path.style]).join(' · ')
}
