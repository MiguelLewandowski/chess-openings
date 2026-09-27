// Levels are derived from XP, never stored: changing the curve re-levels everyone
// consistently, with no migration. Each level costs XP_LEVEL_STEP more than the previous
// one (100 XP to reach level 2, 200 more for level 3, ...), so early levels come fast
// and later ones reward sustained study.
export const XP_LEVEL_STEP = 100

export interface LevelProgress {
  level: number
  xpIntoLevel: number
  xpForNextLevel: number
}

export function levelFromXp(xp: number): LevelProgress {
  let level = 1
  let remaining = Math.max(0, xp)

  while (remaining >= level * XP_LEVEL_STEP) {
    remaining -= level * XP_LEVEL_STEP
    level += 1
  }

  return { level, xpIntoLevel: remaining, xpForNextLevel: level * XP_LEVEL_STEP }
}
