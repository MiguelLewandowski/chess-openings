import type { OpeningStyle } from './OpeningStyle'

export interface PathKey {
  family: string
  style: OpeningStyle
}

// The path of each family whose lessons come back for review. The chosen path wins; without a
// choice, the family's only practiced path counts as active: a family with a single path never
// asks for a choice, and neither does a path opened by its own slug. Several practiced paths and
// no choice stay out, since mixing paths would drill contradictory moves in the same position.
export function activePaths(chosen: readonly PathKey[], practiced: readonly PathKey[]): PathKey[] {
  const chosenFamilies = new Set(chosen.map((c) => c.family))
  const practicedStyles = new Map<string, Set<OpeningStyle>>()
  for (const { family, style } of practiced) {
    if (chosenFamilies.has(family)) continue
    const styles = practicedStyles.get(family) ?? new Set<OpeningStyle>()
    styles.add(style)
    practicedStyles.set(family, styles)
  }

  const implicit: PathKey[] = []
  for (const [family, styles] of practicedStyles) {
    if (styles.size === 1) implicit.push({ family, style: [...styles][0] })
  }
  return [...chosen.map(({ family, style }) => ({ family, style })), ...implicit]
}
