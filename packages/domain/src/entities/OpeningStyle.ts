// An opening can be taught along up to three paths (sister openings of the same family):
// the same first moves, a different choice of our own moves.
export type OpeningStyle = 'POSITIONAL' | 'BALANCED' | 'TACTICAL'

// From the calmest to the sharpest: the order the paths are offered in.
export const OPENING_STYLES: readonly OpeningStyle[] = ['POSITIONAL', 'BALANCED', 'TACTICAL']

export const OPENING_STYLE_LABELS: Record<OpeningStyle, string> = {
  POSITIONAL: 'Posicional',
  BALANCED: 'Equilibrado',
  TACTICAL: 'Tático',
}

const PATH_SEPARATOR = ' — '

export function pathOpeningName(familyName: string, style: OpeningStyle): string {
  return `${familyName}${PATH_SEPARATOR}${OPENING_STYLE_LABELS[style]}`
}

// The family keeps no name of its own: it is the part of a path's name before the style.
export function familyNameOf(openingName: string): string {
  const separator = openingName.lastIndexOf(PATH_SEPARATOR)
  return separator >= 0 ? openingName.slice(0, separator) : openingName
}

// The style from its Portuguese name ("tatico", "Tático"), as typed in a command line.
export function parseOpeningStyle(text: string): OpeningStyle | null {
  const wanted = fold(text)
  return OPENING_STYLES.find((style) => fold(OPENING_STYLE_LABELS[style]) === wanted) ?? null
}

function fold(text: string): string {
  return text.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}
