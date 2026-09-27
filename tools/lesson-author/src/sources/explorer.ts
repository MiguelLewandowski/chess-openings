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

// The Lichess opening explorer (masters database and Lichess games of 1600–2000 players in
// the slower time controls). Since 2025 it requires a personal API token.
export class LichessExplorer {
  constructor(
    private readonly token: string | undefined,
    private readonly cache: DiskCache,
  ) {}

  get available(): boolean {
    return Boolean(this.token)
  }

  async query(fen: string, db: ExplorerDb): Promise<ExplorerResult | null> {
    if (!this.token) return null
    return this.cache.wrap(`explorer-${db}`, fen, async () => {
      const url =
        db === 'masters'
          ? `https://explorer.lichess.ovh/masters?moves=12&fen=${encodeURIComponent(fen)}`
          : `https://explorer.lichess.ovh/lichess?variant=standard&speeds=blitz,rapid,classical&ratings=1600,1800,2000&moves=12&fen=${encodeURIComponent(fen)}`
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
