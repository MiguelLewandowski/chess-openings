import { Injectable } from '@nestjs/common'
import { parse } from '@mliebelt/pgn-parser'
import { ChessWrapper } from '../chess'
import type { IPgnParser, ParsedNode, ParsedChapter, VisualMarkers } from '@chess-openings/domain'

interface PgnCommentDiag {
  comment?: string
  colorArrows?: string[]
  colorFields?: string[]
  cal?: string | string[]
  csl?: string | string[]
}

interface PgnMove {
  notation: { notation: string }
  commentDiag?: PgnCommentDiag
  commentAfter?: string
  variations?: PgnMove[][]
}

interface PgnGame {
  tags?: Record<string, string>
  moves: PgnMove[]
}

@Injectable()
export class PgnParserService implements IPgnParser {
  parseStudy(pgnString: string): ParsedChapter[] {
    const games = parse(pgnString, { startRule: 'games' }) as PgnGame[]

    return games.map((game, index) => {
      const title = game.tags?.Event || `Chapter ${index + 1}`
      const setupFen = game.tags?.FEN || ChessWrapper.STARTING_FEN
      const initialFen = ChessWrapper.isValidFen(setupFen) ? setupFen : ChessWrapper.STARTING_FEN
      return { title, initialFen, rootNodes: this.buildTree(game.moves, initialFen) }
    })
  }

  private buildTree(movesAst: PgnMove[], currentFen: string, isMainLine = true): ParsedNode[] {
    if (!movesAst || movesAst.length === 0) return []
    return this.processSequence(movesAst, currentFen, isMainLine)
  }

  private processSequence(sequence: PgnMove[], startFen: string, mainLineFlag: boolean): ParsedNode[] {
    if (sequence.length === 0) return []

    const moveObj = sequence[0]
    const san = moveObj.notation.notation
    const playResult = ChessWrapper.playMove(startFen, san)
    if (!playResult) return []

    const fullComment = `${moveObj.commentDiag?.comment ?? ''} ${moveObj.commentAfter ?? ''}`
    const cleanComment = fullComment.replace(/\[%(cal|csl)\s+[^\]]+\]/g, '').trim()
    const visualMarkers = this.extractMarkers(moveObj, fullComment)

    const node: ParsedNode = {
      id: Math.random().toString(36).substring(7),
      san,
      fen: playResult.newFen,
      player: playResult.moveDetails.color === 'w' ? 'WHITE' : 'BLACK',
      originalComment: cleanComment,
      visualMarkers,
      isMainLine: mainLineFlag,
      children: [],
      pieceMoved: playResult.moveDetails.piece,
      capturedPiece: playResult.moveDetails.captured,
      isCheck: playResult.moveDetails.san.includes('+') || playResult.moveDetails.san.includes('#'),
    }

    const nextInSequence = sequence.slice(1)
    if (nextInSequence.length > 0) {
      node.children.push(...this.processSequence(nextInSequence, playResult.newFen, mainLineFlag))
    }

    const siblings = [node]
    if (moveObj.variations) {
      for (const variation of moveObj.variations) {
        siblings.push(...this.processSequence(variation, startFen, false))
      }
    }

    return siblings
  }

  private extractMarkers(moveObj: PgnMove, fullComment: string): VisualMarkers | null {
    const markers: VisualMarkers = { arrows: [], circles: [] }
    let hasMarkers = false

    const calMatches = fullComment.match(/\[%cal\s+([^\]]+)\]/g)
    if (calMatches) {
      hasMarkers = true
      calMatches.forEach(m => {
        const inner = m.match(/\[%cal\s+([^\]]+)\]/)?.[1]
        if (inner) markers.arrows.push(...inner.split(',').map(s => s.trim()))
      })
    } else if ((moveObj.commentDiag?.colorArrows?.length ?? 0) > 0) {
      hasMarkers = true
      markers.arrows.push(...moveObj.commentDiag!.colorArrows!)
    }

    const cslMatches = fullComment.match(/\[%csl\s+([^\]]+)\]/g)
    if (cslMatches) {
      hasMarkers = true
      cslMatches.forEach(m => {
        const inner = m.match(/\[%csl\s+([^\]]+)\]/)?.[1]
        if (inner) markers.circles.push(...inner.split(',').map(s => s.trim()))
      })
    } else if ((moveObj.commentDiag?.colorFields?.length ?? 0) > 0) {
      hasMarkers = true
      markers.circles.push(...moveObj.commentDiag!.colorFields!)
    }

    return hasMarkers ? markers : null
  }
}
