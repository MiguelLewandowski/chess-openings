import type { DiskCache } from '../sources/cache'

// Opening names from lichess-org/chess-openings (the list Lichess itself uses), keyed by
// the move sequence. Used only to name chapters.

export interface OpeningNames {
  deepest(sans: string[]): string | null
}

const FILES = ['a', 'b', 'c', 'd', 'e']
const SOURCE = 'https://raw.githubusercontent.com/lichess-org/chess-openings/master'

export function parseOpeningsTsv(tsv: string): Map<string, string> {
  const names = new Map<string, string>()
  for (const row of tsv.split(/\r?\n/).slice(1)) {
    const [eco, name, pgn] = row.split('\t')
    if (!eco || !name || !pgn) continue
    const key = pgn.replace(/\d+\.\s*/g, '').trim().split(/\s+/).join(' ')
    names.set(key, `${name} (${eco})`)
  }
  return names
}

export function namesFrom(table: Map<string, string>): OpeningNames {
  return {
    // The name of the longest prefix of `sans` that has one.
    deepest(sans) {
      for (let n = sans.length; n > 0; n--) {
        const name = table.get(sans.slice(0, n).join(' '))
        if (name) return name
      }
      return null
    },
  }
}

export async function loadOpeningNames(cache: DiskCache): Promise<OpeningNames> {
  const table = new Map<string, string>()
  for (const file of FILES) {
    const tsv = await cache.wrap('opening-names', file, async () => {
      const response = await fetch(`${SOURCE}/${file}.tsv`)
      return response.ok ? response.text() : ''
    })
    for (const [k, v] of parseOpeningsTsv(tsv)) table.set(k, v)
  }
  return namesFrom(table)
}
