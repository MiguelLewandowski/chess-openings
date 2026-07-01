import { Injectable } from '@nestjs/common'
import { Chess } from 'chess.js'
import { PrismaService } from '../../infrastructure/prisma.service'

export interface PuzzleMoveNode {
  id: string
  san: string
  fen: string
  parentId: string | null
  isOpponentResponse: boolean
  coachInsights: { comment: string }
}

export interface PuzzleData {
  id: string
  lichessId: string
  openingName: string
  initialFen: string
  movesTree: PuzzleMoveNode[]
  playerColor: 'white' | 'black'
  rating: number
}

function buildMovesTree(initialFen: string, uciMoves: string[]): PuzzleMoveNode[] {
  const chess = new Chess(initialFen)
  const nodes: PuzzleMoveNode[] = []
  let parentId: string | null = null

  uciMoves.forEach((uci, index) => {
    const from = uci.slice(0, 2)
    const to = uci.slice(2, 4)
    const promotion = uci.length === 5 ? uci[4] : undefined

    const move = chess.move({ from, to, promotion: promotion as 'q' | 'r' | 'b' | 'n' | undefined })
    if (!move) return

    nodes.push({
      id: `m${index}`,
      san: move.san,
      fen: chess.fen(),
      parentId,
      isOpponentResponse: index % 2 === 0,
      coachInsights: { comment: '' },
    })
    parentId = `m${index}`
  })

  return nodes
}

function formatOpeningName(raw: string): string {
  return raw.replace(/^[A-E]\d{2}_/, '').replace(/_/g, ' ')
}

@Injectable()
export class PuzzleService {
  constructor(private readonly prisma: PrismaService) {}

  async findForSession(openingNames: string[], limit = 10, maxRating = 1800): Promise<PuzzleData[]> {
    const safeLimit = Math.min(limit, 20)

    const whereClause =
      openingNames.length > 0
        ? {
            OR: openingNames.map((name) => ({
              openingTags: { contains: name.split(' ')[0], mode: 'insensitive' as const },
            })),
            rating: { lte: maxRating },
          }
        : { openingTags: { not: null }, rating: { lte: maxRating } }

    const raw = await this.prisma.puzzle.findMany({
      where: whereClause,
      take: safeLimit * 5,
      orderBy: { rating: 'asc' },
    })

    for (let i = raw.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[raw[i], raw[j]] = [raw[j], raw[i]]
    }

    return raw.slice(0, safeLimit).map((p) => {
      const movesTree = buildMovesTree(p.fen, p.moves.split(' '))
      const sideToMove = p.fen.split(' ')[1]
      const playerColor: 'white' | 'black' = sideToMove === 'w' ? 'black' : 'white'

      return {
        id: p.id,
        lichessId: p.lichessId,
        openingName: p.openingTags ? formatOpeningName(p.openingTags) : 'Opening Puzzle',
        initialFen: p.fen,
        movesTree,
        playerColor,
        rating: p.rating,
      }
    })
  }
}
