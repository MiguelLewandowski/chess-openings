'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Chessground } from 'chessground'
import type { Api } from 'chessground/api'
import type { Key } from 'chessground/types'
import { Chess } from 'chess.js'
import { ArrowLeft, Cpu, RefreshCcw, Undo2 } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { ChessWrapper } from '@/lib/chess'
import { cn } from '@/lib/cn'
import { SPARRING_LEVELS, sideToMove, sparringOutcome, type SparringColor, type SparringLevel, type SparringOutcome } from '@/lib/sparring'
import { StockfishEngine } from '@/lib/stockfish'

interface Ply {
  fen: string
  san: string | null
  lastMove: [Key, Key] | null
}

type Phase = 'player' | 'engine' | 'over'

const OUTCOME_COPY: Record<SparringOutcome['reason'], string> = {
  checkmate: 'Xeque-mate.',
  stalemate: 'Afogamento: empate.',
  repetition: 'Empate por repetição.',
  insufficient: 'Empate: material insuficiente para dar mate.',
  'fifty-moves': 'Empate pela regra dos 50 lances.',
}

// Free play against the in-browser Stockfish, starting from a position of a lesson. It keeps
// its own state instead of the GameStore: there is no line to follow and nothing is scored.
export default function SparringBoard({
  startFen,
  player,
  backHref,
}: {
  startFen: string
  player: SparringColor
  backHref: string
}) {
  const [plies, setPlies] = useState<Ply[]>([{ fen: startFen, san: null, lastMove: null }])
  const [level, setLevel] = useState<SparringLevel>('medium')
  const boardRef = useRef<HTMLDivElement>(null)
  const cgRef = useRef<Api | null>(null)
  const engineRef = useRef<StockfishEngine | null>(null)

  const fen = plies[plies.length - 1].fen
  const outcome = sparringOutcome(plies.map((p) => p.fen), player)
  const phase: Phase = outcome ? 'over' : sideToMove(fen) === player ? 'player' : 'engine'

  useEffect(() => {
    const engine = new StockfishEngine()
    engineRef.current = engine
    return () => engine.terminate()
  }, [])

  useEffect(() => {
    if (!boardRef.current || cgRef.current) return
    cgRef.current = Chessground(boardRef.current, {
      fen: startFen,
      orientation: player,
      premovable: { enabled: false },
      movable: { color: player, free: false, dests: new Map() },
      events: {
        move: (orig, dest) => {
          // Chessground only offers legal destinations, so this always lands; promotion is
          // always to a queen, like in the lessons.
          setPlies((prev) => {
            const result = ChessWrapper.playMove(prev[prev.length - 1].fen, { from: orig, to: dest, promotion: 'q' })
            if (!result) return prev
            return [...prev, { fen: result.newFen, san: result.moveDetails.san, lastMove: [orig, dest] }]
          })
        },
      },
    })
    return () => {
      cgRef.current?.destroy()
      cgRef.current = null
    }
  }, [startFen, player])

  useEffect(() => {
    const last = plies[plies.length - 1]
    cgRef.current?.set({
      fen: last.fen,
      turnColor: sideToMove(last.fen),
      lastMove: last.lastMove ?? undefined,
      check: new Chess(last.fen).inCheck(),
      movable: { color: player, free: false, dests: phase === 'player' ? ChessWrapper.getLegalMovesMap(last.fen) : new Map() },
    })
  }, [plies, phase, player])

  useEffect(() => {
    if (phase !== 'engine' || !engineRef.current) return
    let current = true
    const { skill, movetimeMs } = SPARRING_LEVELS[level]
    engineRef.current.bestMove(fen, { skill, movetimeMs }).then((move) => {
      if (!current || !move) return
      const result = ChessWrapper.playMove(fen, move)
      if (!result) return
      setPlies((prev) => [...prev, { fen: result.newFen, san: result.moveDetails.san, lastMove: [move.from as Key, move.to as Key] }])
    })
    return () => {
      current = false
      engineRef.current?.cancel()
    }
  }, [phase, fen, level])

  // Back to the student's previous turn: drops the engine's reply (if it came) and the
  // student's own move. Never past the starting position.
  const undo = () =>
    setPlies((prev) => {
      let next = prev.slice(0, Math.max(1, prev.length - 1))
      while (next.length > 1 && sideToMove(next[next.length - 1].fen) !== player) next = next.slice(0, -1)
      return next
    })

  const restart = () => setPlies([{ fen: startFen, san: null, lastMove: null }])

  return (
    <div className="grid grid-cols-1 gap-6 @4xl:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] @4xl:gap-8 @4xl:items-start">
      <div className="flex justify-center min-w-0">
        <div className="w-full max-w-[calc(100dvh-13.5rem)] lg:max-w-[calc(100dvh-10rem)] aspect-square rounded-[16px] overflow-hidden ring-1 ring-border-default shadow-xl bg-surface-card">
          <div ref={boardRef} className="w-full h-full" />
        </div>
      </div>

      <div className="min-w-0 @4xl:sticky @4xl:top-24 flex flex-col gap-4">
        <Card className="p-5 flex flex-col gap-5">
          <StatusLine phase={phase} outcome={outcome} player={player} />

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-400 mb-2">Força do Stockfish</p>
            <div role="radiogroup" aria-label="Força do Stockfish" className="grid grid-cols-3 gap-1 p-1 rounded-[10px] bg-surface-sunken">
              {(Object.keys(SPARRING_LEVELS) as SparringLevel[]).map((key) => (
                <button
                  key={key}
                  role="radio"
                  aria-checked={level === key}
                  onClick={() => setLevel(key)}
                  className={cn(
                    'h-9 rounded-[8px] text-[13px] font-semibold transition-colors',
                    level === key ? 'bg-surface-card text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-900',
                  )}
                >
                  {SPARRING_LEVELS[key].label}
                </button>
              ))}
            </div>
          </div>

          <MoveList plies={plies} startFen={startFen} />

          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={undo} disabled={plies.length === 1}>
              <Undo2 className="w-4 h-4" />
              Desfazer
            </Button>
            <Button variant="secondary" onClick={restart} disabled={plies.length === 1}>
              <RefreshCcw className="w-4 h-4" />
              Recomeçar
            </Button>
          </div>
        </Card>

        <Link
          href={backHref}
          className="inline-flex items-center gap-2 self-start text-[13px] font-semibold text-ink-500 hover:text-ink-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar à lição
        </Link>
      </div>
    </div>
  )
}

function StatusLine({ phase, outcome, player }: { phase: Phase; outcome: SparringOutcome | null; player: SparringColor }) {
  if (outcome) {
    const title = outcome.result === 'win' ? 'Você venceu!' : outcome.result === 'loss' ? 'O Stockfish venceu' : 'Empate'
    return (
      <div>
        <p className={cn('font-display font-bold text-[20px] tracking-tight', outcome.result === 'win' ? 'text-success' : 'text-ink-900')}>
          {title}
        </p>
        <p className="text-[14px] text-ink-500 mt-0.5">{OUTCOME_COPY[outcome.reason]} Desfaça ou recomece para tentar outra ideia.</p>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', phase === 'engine' ? 'bg-accent-soft text-accent' : 'bg-success-soft text-success')}>
        <Cpu className={cn('w-5 h-5', phase === 'engine' && 'motion-safe:animate-pulse')} />
      </div>
      <div>
        <p className="font-display font-bold text-[17px] tracking-tight text-ink-900">
          {phase === 'engine' ? 'Stockfish pensando…' : 'Sua vez'}
        </p>
        <p className="text-[13px] text-ink-500">Você joga de {player === 'white' ? 'brancas' : 'pretas'}, a partir da posição da lição.</p>
      </div>
    </div>
  )
}

// Numbers follow the position's own move counter, so a game started at move 7 reads "7.Dxg4".
function MoveList({ plies, startFen }: { plies: Ply[]; startFen: string }) {
  const played = plies.slice(1)
  if (played.length === 0) {
    return <p className="text-[13px] text-ink-400">Nenhum lance ainda.</p>
  }

  const firstMoveNumber = Number(startFen.split(' ')[5]) || 1
  const blackStarts = sideToMove(startFen) === 'black'
  const parts = played.map((ply, i) => {
    const ply0 = i + (blackStarts ? 1 : 0)
    const number = firstMoveNumber + Math.floor(ply0 / 2)
    const isWhite = ply0 % 2 === 0
    const prefix = isWhite ? `${number}.` : i === 0 ? `${number}...` : ''
    return `${prefix}${ply.san}`
  })

  return (
    <p className="font-mono text-[13px] leading-relaxed text-ink-700 break-words max-h-32 overflow-y-auto">
      {parts.join(' ')}
    </p>
  )
}
