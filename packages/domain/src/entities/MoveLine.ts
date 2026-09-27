export interface LineNode {
  id: string
  parentId: string | null
  san: string
  fen: string
}

// Follows the tree from the root, always taking the first child by id. Ids are cuids,
// ordered by creation, and ingestion writes the main line before its variations, so the
// first child is the main continuation (the same rule the move lookup endpoint uses).
export function mainLine<T extends LineNode>(moves: T[]): T[] {
  const byId = (a: T, b: T) => a.id.localeCompare(b.id)
  const childrenOf = (parentId: string | null) => moves.filter((m) => m.parentId === parentId).sort(byId)

  const line: T[] = []
  let next = childrenOf(null)[0]
  while (next) {
    line.push(next)
    next = childrenOf(next.id)[0]
  }
  return line
}

// Formats SAN moves in standard notation ("1.c4 e5 2.Nc3"), numbering from the side to move
// and move number of the starting FEN, so lines that begin mid-game read correctly.
export function formatMoveList(sans: string[], startFen: string | null): string {
  const [, turn = 'w', , , , fullmove = '1'] = (startFen ?? '').split(' ')
  let moveNumber = Number.parseInt(fullmove, 10) || 1
  let whiteToMove = turn !== 'b'

  const parts: string[] = []
  sans.forEach((san, index) => {
    if (whiteToMove) parts.push(`${moveNumber}.${san}`)
    else parts.push(index === 0 ? `${moveNumber}...${san}` : san)

    if (!whiteToMove) moveNumber += 1
    whiteToMove = !whiteToMove
  })
  return parts.join(' ')
}
