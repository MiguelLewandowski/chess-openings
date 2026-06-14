import type { DrawShape } from 'chessground/draw'
import type { Key } from 'chessground/types'
import type { MoveSummary } from '@chess-openings/domain'

const BRUSH_BY_CODE: Record<string, string> = { G: 'green', R: 'red', B: 'blue', Y: 'yellow' }

function brush(code: string): string {
  return BRUSH_BY_CODE[code.toUpperCase()] ?? 'green'
}

// Converts Lichess PGN annotations into Chessground shapes.
// Arrows are 5 chars (color + from + to, e.g. "Gc4f7") or 4 chars (from + to).
// Circles are 3 chars (color + square) or 2 chars (square); default brush is green.
export function toBoardShapes(markers: MoveSummary['visualMarkers']): DrawShape[] {
  if (!markers) return []
  const shapes: DrawShape[] = []

  for (const arrow of markers.arrows ?? []) {
    if (arrow.length === 5) {
      shapes.push({ orig: arrow.slice(1, 3) as Key, dest: arrow.slice(3, 5) as Key, brush: brush(arrow[0]) })
    } else if (arrow.length === 4) {
      shapes.push({ orig: arrow.slice(0, 2) as Key, dest: arrow.slice(2, 4) as Key, brush: 'green' })
    }
  }

  for (const circle of markers.circles ?? []) {
    if (circle.length === 3) {
      shapes.push({ orig: circle.slice(1, 3) as Key, brush: brush(circle[0]) })
    } else if (circle.length === 2) {
      shapes.push({ orig: circle.slice(0, 2) as Key, brush: 'green' })
    }
  }

  return shapes
}
