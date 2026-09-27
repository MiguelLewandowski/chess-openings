import type { CSSProperties } from 'react'
import { boardFromFen, type PieceType } from '@/lib/fen'
import { cn } from '@/lib/cn'

// Filled glyphs for both colours: the colour comes from CSS, as in the design system's
// ChessBoard, so white and black pieces share one silhouette. U+FE0E forces the text
// presentation; without it some platforms draw ♟ as a coloured emoji.
const TEXT = '︎'
const GLYPH: Record<PieceType, string> = {
  k: `♚${TEXT}`,
  q: `♛${TEXT}`,
  r: `♜${TEXT}`,
  b: `♝${TEXT}`,
  n: `♞${TEXT}`,
  p: `♟${TEXT}`,
}

const PIECE_FONT = "'Segoe UI Symbol','Apple Symbols','Noto Sans Symbols 2',Georgia,serif"

// Inline styles: Tailwind cannot tell whether `text-(--var)` is a colour or a size and emits
// nothing. At preview size a blurred text-shadow (as on the full board) swallows the white
// glyphs, so a thin stroke painted under the fill draws their outline instead.
const WHITE_PIECE: CSSProperties = {
  color: 'var(--piece-white)',
  WebkitTextStroke: '1.5px var(--piece-white-edge)',
  paintOrder: 'stroke fill',
}
const BLACK_PIECE: CSSProperties = { color: 'var(--piece-black)' }

// Static, non-interactive board for previews. It renders on the server; the lesson screen
// keeps the interactive chessground board.
export function MiniBoard({ fen, className, label }: { fen: string; className?: string; label: string }) {
  const board = boardFromFen(fen)

  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        'grid grid-cols-8 aspect-square overflow-hidden rounded-[6px] border-[3px] border-(--board-frame) bg-(--board-frame) shadow-(--shadow-board) [container-type:inline-size]',
        className,
      )}
    >
      {board.map((rank, r) =>
        rank.map((piece, f) => (
          <div
            key={`${r}-${f}`}
            className={cn('flex items-center justify-center', (r + f) % 2 === 0 ? 'bg-(--board-light)' : 'bg-(--board-dark)')}
          >
            {piece && (
              <span
                className="leading-none select-none text-[10.5cqi]"
                style={{ fontFamily: PIECE_FONT, ...(piece.color === 'w' ? WHITE_PIECE : BLACK_PIECE) }}
              >
                {GLYPH[piece.type]}
              </span>
            )}
          </div>
        )),
      )}
    </div>
  )
}
