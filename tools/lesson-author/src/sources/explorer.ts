import { sideToMove } from '../chess/notation'
import type { DiskCache } from './cache'
import { fetchWithBackoff, sleep } from './engine'

export type ExplorerDb = 'masters' | 'amateurs'

export interface ExplorerMove {
  san: string
  games: number
  share: number // 0–1, of all games in this position
  scoreForMover: number // 0–1, from the side that plays the move
}

export interface ExplorerResult {
  total: number
  moves: ExplorerMove[]
  opening: { eco: string; name: string } | null
}

interface RawExplorer {
  white: number
  draws: number
  black: number
  moves: { san: string; white: number; draws: number; black: number }[]
  opening: { eco: string; name: string } | null
}

// Rating buckets the Lichess explorer accepts; each one is a lower bound (1600 = 1600–1799).
export const RATING_BUCKETS = [400, 1000, 1200, 1400, 1600, 1800, 2000, 2200, 2500] as const

// "1000-1600" -> [1000, 1200, 1400]: the buckets whose lower bound falls in [from, to).
export function ratingBuckets(range: string): number[] {
  const [from, to] = range.split('-').map((n) => Number(n.trim()))
  if (!Number.isFinite(from) || !Number.isFinite(to) || from >= to) {
    throw new Error(`faixa de rating inválida: "${range}" (use, por exemplo, 1000-1600)`)
  }
  const buckets = RATING_BUCKETS.filter((b) => b >= from && b < to)
  if (buckets.length === 0) throw new Error(`nenhuma faixa da Lichess entre ${from} e ${to}`)
  return [...buckets]
}

// The Lichess opening explorer (masters database and Lichess games of amateur players in
// the slower time controls). Since 2025 it requires a personal API token.
export class LichessExplorer {
  constructor(
    private readonly token: string | undefined,
    private readonly cache: DiskCache,
    // Default 1600–2000: the level of the students the lessons are written for.
    private readonly amateurRatings: number[] = [1600, 1800, 2000],
  ) {}

  get available(): boolean {
    return Boolean(this.token)
  }

  async query(fen: string, db: ExplorerDb): Promise<ExplorerResult | null> {
    if (!this.token) return null
    const ratings = this.amateurRatings.join(',')
    const namespace = db === 'masters' ? 'explorer-masters' : ratings === '1600,1800,2000' ? 'explorer-amateurs' : `explorer-amateurs-${ratings}`
    return this.cache.wrap(namespace, fen, async () => {
      const url =
        db === 'masters'
          ? `https://explorer.lichess.ovh/masters?moves=12&fen=${encodeURIComponent(fen)}`
          : `https://explorer.lichess.ovh/lichess?variant=standard&speeds=blitz,rapid,classical&ratings=${ratings}&moves=12&fen=${encodeURIComponent(fen)}`
      // Be polite to a free service: one request at a time with a short pause.
      await sleep(250)
      const response = await fetchWithBackoff(url, { headers: { Authorization: `Bearer ${this.token}` } })
      if (!response?.ok) return null
      return normalizeExplorer((await response.json()) as RawExplorer, fen)
    })
  }
}

export function normalizeExplorer(raw: RawExplorer, fen: string): ExplorerResult {
  const total = raw.white + raw.draws + raw.black
  const mover = sideToMove(fen)
  return {
    total,
    opening: raw.opening,
    moves: raw.moves.map((m) => {
      const games = m.white + m.draws + m.black
      const wins = mover === 'w' ? m.white : m.black
      return {
        san: m.san,
        games,
        share: total > 0 ? games / total : 0,
        scoreForMover: games > 0 ? (wins + m.draws / 2) / games : 0,
      }
    }),
  }
}
