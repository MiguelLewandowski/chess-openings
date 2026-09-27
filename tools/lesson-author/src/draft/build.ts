import { Chess } from 'chess.js'
import { moveLabel, moveNumberOf, sideToMove } from '../chess/notation'
import type { Color } from '../chess/types'
import { studentCp, type Engine } from '../sources/engine'
import type { ExplorerResult } from '../sources/explorer'

// Builds an opening repertoire from data instead of memory:
// - the opponent's moves are what players of the chosen rating actually play (explorer),
//   including the bad ones; a reply the engine punishes becomes a "punish the mistake" line;
// - our moves are the engine's best, preferring the one masters play most when several are
//   about as good; after an opponent mistake, always the engine's best, until the advantage
//   is clear;
// - an optional base repertoire (a reviewed .txt) takes precedence for our moves, so a chosen
//   system (e.g. 3.d3 against 2...Cf6) is kept wherever its positions come up.
// No language model is involved: every move comes from the engine or from real games.

export interface DraftNode {
  san: string
  color: Color
  moveNumber: number
  fenBefore: string
  fenAfter: string
  children: DraftNode[]
  // Opponent moves: how often it is played in its position (0–1) and the product of those
  // shares along the path, i.e. how likely a student is to meet this line.
  share: number
  reach: number
  games: number
  // Set on an opponent move the engine punishes.
  mistake: { gainCp: number; evalAfterCp: number } | null
  // Our moves chosen while punishing a mistake.
  punishing: boolean
  fromBase: boolean
}

export interface ExplorerLike {
  query(fen: string, db: 'masters' | 'amateurs'): Promise<ExplorerResult | null>
}

export interface DraftOptions {
  maxPlies: number // stop lines at this ply of the game (e.g. 20 = move 10)
  minShare: number // opponent replies played less often than this are ignored
  maxReplies: number // at most this many opponent replies per position
  minReach: number // skip lines fewer than this fraction of games would reach
  minGames: number // stop when the explorer has fewer games than this in a position
  toleranceCp: number // our move may be this much worse than the engine's best
  mistakeCp: number // an opponent reply this much worse than their best is a mistake
  punishUntilCp: number // stop punishing once our advantage reaches this
  maxPunishPlies: number // ...or after this many plies of punishment
}

export const DEFAULT_DRAFT: DraftOptions = {
  maxPlies: 20,
  minShare: 0.05,
  maxReplies: 4,
  // Low on purpose: with a few replies per move, 1% cut lines around move 5.
  minReach: 0.003,
  minGames: 30,
  toleranceCp: 30,
  // A beginner's mistake worth a lesson usually loses about a pawn (often with an attack),
  // not a whole piece.
  mistakeCp: 100,
  punishUntilCp: 250,
  maxPunishPlies: 6,
}

export interface DraftProgress {
  positions: number
}

export class RepertoireBuilder {
  private positions = 0

  constructor(
    private readonly engine: Engine,
    private readonly explorer: ExplorerLike,
    private readonly student: Color,
    private readonly base: Map<string, string>, // position (FEN without move counters) -> our SAN
    private readonly options: DraftOptions = DEFAULT_DRAFT,
    private readonly onProgress: (p: DraftProgress) => void = () => {},
  ) {}

  // `start` is the opening's defining moves (e.g. 1.e4 e5 2.Bc4), in English SAN.
  async build(start: string[]): Promise<DraftNode[]> {
    const chess = new Chess()
    const roots: DraftNode[] = []
    let siblings = roots
    let last: DraftNode | null = null
    for (const san of start) {
      const fenBefore = chess.fen()
      const move = chess.move(san)
      const node = this.node(move.san, move.color, fenBefore, chess.fen(), 1, 1, 0)
      siblings.push(node)
      siblings = node.children
      last = node
    }
    if (!last) throw new Error('informe os lances iniciais da abertura')
    await this.expand(last, 1, 0)
    return roots
  }

  private async expand(parent: DraftNode, reach: number, punishPlies: number): Promise<void> {
    const fen = parent.fenAfter
    const ply = plyOf(fen)
    if (ply >= this.options.maxPlies || new Chess(fen).isGameOver()) return
    this.onProgress({ positions: ++this.positions })

    if (sideToMove(fen) === this.student) {
      const choice = await this.chooseOurMove(fen, punishPlies > 0)
      if (!choice) return
      const node = this.play(fen, choice.san, reach, 0)
      node.punishing = punishPlies > 0
      node.fromBase = choice.fromBase
      parent.children.push(node)

      if (punishPlies > 0) {
        const advantage = studentCp((await this.engine.analyse(node.fenAfter, 1))?.lines[0], this.student)
        if ((advantage ?? 0) >= this.options.punishUntilCp || punishPlies >= this.options.maxPunishPlies) return
        return this.expand(node, reach, punishPlies + 1)
      }
      return this.expand(node, reach, 0)
    }

    // Opponent to move: branch on what players actually play here.
    const stats = await this.explorer.query(fen, 'amateurs')
    const bestLine = (await this.engine.analyse(fen, 1))?.lines[0]
    if (!stats || stats.total < this.options.minGames) {
      // After a mistake the games run out fast; the punishment is still worth finishing,
      // so the opponent's best defence comes from the engine.
      if (punishPlies > 0 && bestLine?.san[0]) {
        const node = this.play(fen, bestLine.san[0], reach, 1)
        parent.children.push(node)
        await this.expand(node, reach, punishPlies + 1)
      }
      return
    }
    const best = studentCp(bestLine, this.student)
    const replies = stats.moves
      .filter((m) => m.share >= this.options.minShare && reach * m.share >= this.options.minReach)
      .slice(0, punishPlies > 0 ? 1 : this.options.maxReplies)

    for (const reply of replies) {
      const node = this.play(fen, reply.san, reach * reply.share, reply.share, reply.games)
      const after = studentCp((await this.engine.analyse(node.fenAfter, 1))?.lines[0], this.student)
      if (!punishPlies && best !== null && after !== null && after - best >= this.options.mistakeCp) {
        node.mistake = { gainCp: after - best, evalAfterCp: after }
      }
      parent.children.push(node)
      const punishing = punishPlies > 0 || node.mistake !== null
      await this.expand(node, node.reach, punishing ? punishPlies + 1 : 0)
    }
  }

  private async chooseOurMove(fen: string, punishing: boolean): Promise<{ san: string; fromBase: boolean } | null> {
    const fromBase = this.base.get(positionKey(fen))
    if (fromBase && isLegal(fen, fromBase)) return { san: fromBase, fromBase: true }

    const analysis = await this.engine.analyse(fen, 3)
    const lines = analysis?.lines ?? []
    if (lines.length === 0) return null
    if (punishing) return { san: lines[0].san[0], fromBase: false }

    const bestCp = studentCp(lines[0], this.student) ?? 0
    const good = lines.filter((l) => bestCp - (studentCp(l, this.student) ?? -Infinity) <= this.options.toleranceCp)
    const masters = await this.explorer.query(fen, 'masters')
    const played = (san: string) => masters?.moves.find((m) => m.san === san)?.games ?? 0
    const pick = [...good].sort((a, b) => played(b.san[0]) - played(a.san[0]))[0] ?? lines[0]
    return { san: pick.san[0], fromBase: false }
  }

  private play(fenBefore: string, san: string, reach: number, share: number, games = 0): DraftNode {
    const chess = new Chess(fenBefore)
    const move = chess.move(san)
    return this.node(move.san, move.color, fenBefore, chess.fen(), share, reach, games)
  }

  private node(san: string, color: Color, fenBefore: string, fenAfter: string, share: number, reach: number, games: number): DraftNode {
    return {
      san,
      color,
      moveNumber: moveNumberOf(fenBefore),
      fenBefore,
      fenAfter,
      children: [],
      share,
      reach,
      games,
      mistake: null,
      punishing: false,
      fromBase: false,
    }
  }
}

// FEN without the move counters: the same position reached by another move order matches.
export function positionKey(fen: string): string {
  return fen.split(' ').slice(0, 4).join(' ')
}

function plyOf(fen: string): number {
  const moveNumber = moveNumberOf(fen)
  return (moveNumber - 1) * 2 + (sideToMove(fen) === 'b' ? 1 : 0)
}

function isLegal(fen: string, san: string): boolean {
  try {
    new Chess(fen).move(san)
    return true
  } catch {
    return false
  }
}

export function labelOf(node: Pick<DraftNode, 'moveNumber' | 'color' | 'san'>): string {
  return moveLabel(node.moveNumber, node.color, node.san)
}
