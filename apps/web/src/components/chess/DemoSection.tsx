'use client'

import { useEffect } from 'react'
import { useGameStore } from '@/store/GameStore'
import Board from './Board'
import Link from 'next/link'
import { BrainCircuit, Trophy, ArrowRight, RefreshCcw, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button, buttonClasses, Card, StatusPill } from '@/components/ui'
import { useOpponentReveal } from '@/hooks/useOpponentReveal'
import { cn } from '@/lib/cn'
import { ChessWrapper } from '@/lib/chess'
import type { ExerciseMove } from '@/store/GameStore'

const DEMO_MOVES: ExerciseMove[] = [
  {
    id: 'd1', san: 'e4',
    fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
    parentId: null, isOpponentResponse: false,
    coachInsights: { comment: 'Controle o centro. 1.e4 abre o jogo para o bispo e a dama — o lance inicial mais popular em todos os níveis.' },
    visualMarkers: null,
  },
  {
    id: 'd2', san: 'e5',
    fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
    parentId: 'd1', isOpponentResponse: true,
    coachInsights: { comment: 'As pretas espelham o seu lance, reivindicando espaço central igual. A tensão começa.' },
    visualMarkers: null,
  },
  {
    id: 'd3', san: 'Nf3',
    fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2',
    parentId: 'd2', isOpponentResponse: false,
    coachInsights: { comment: 'O cavalo ataca e5 e se desenvolve com tempo. No xadrez, cada lance deve criar uma ameaça.' },
    visualMarkers: null,
  },
  {
    id: 'd4', san: 'Nc6',
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
    parentId: 'd3', isOpponentResponse: true,
    coachInsights: { comment: 'As pretas defendem o peão e se desenvolvem. Ambos os lados seguem o mesmo princípio: desenvolver, desenvolver, desenvolver.' },
    visualMarkers: null,
  },
  {
    id: 'd5', san: 'Bc4',
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3',
    parentId: 'd4', isOpponentResponse: false,
    coachInsights: { comment: 'A Abertura Italiana. O bispo mira f7 — o peão mais fraco do campo das pretas, defendido apenas pelo rei desde o primeiro lance.' },
    visualMarkers: { arrows: ['Gc4f7'], circles: [] },
  },
]

export default function DemoSection() {
  const setupExercise = useGameStore((state) => state.setupExercise)

  useEffect(() => {
    setupExercise(ChessWrapper.STARTING_FEN, DEMO_MOVES)
  }, [setupExercise])

  return (
    <section className="max-w-6xl mx-auto px-6 py-24 border-t border-white/5">
      <div className="text-center mb-12">
        <p className="text-sm font-bold tracking-widest text-violet-400 uppercase mb-3">
          Experimente agora — sem precisar de conta
        </p>
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
          Aprenda a Abertura Italiana em 3 lances
        </h2>
        <p className="text-slate-400 mt-3 max-w-md mx-auto">
          Jogue de brancas. Encontre o lance correto no tabuleiro ou clique em{' '}
          <span className="text-slate-300 font-medium">Revelar lance</span> para uma dica.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        <div className="lg:col-span-7">
          <div className="w-full max-w-[500px] mx-auto aspect-square rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl shadow-black/50 bg-slate-900">
            <Board />
          </div>
        </div>

        <div className="lg:col-span-5">
          <DemoCoachPanel />
        </div>
      </div>
    </section>
  )
}

function DemoCoachPanel() {
  const { comment, status, currentNodeId, playNextMove, playPreviousMove, restartExercise } = useGameStore()

  useOpponentReveal()

  if (status === 'completed') {
    return (
      <Card className="border-violet-500/30 p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent pointer-events-none" />
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-violet-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10">
          <div className="w-16 h-16 bg-violet-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
            <Trophy className="w-8 h-8 text-violet-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Você acertou!</h3>
          <p className="text-slate-300 mb-8 leading-relaxed">
            Essa é a Abertura Italiana — uma das mais antigas e fundamentadas do xadrez. Há dezenas de variações para
            dominar, cada uma com a sua própria estratégia.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/register" className={buttonClasses({ className: 'w-full' })}>
              Comece a aprender de graça
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Button variant="secondary" onClick={restartExercise} className="w-full">
              <RefreshCcw className="w-4 h-4" />
              Tentar de novo
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  const isWaiting = status === 'waiting'

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="p-5 border-b border-slate-800 flex items-center gap-2">
        <div className="bg-violet-500/10 p-1.5 rounded-lg">
          <BrainCircuit className="w-4 h-4 text-violet-400" />
        </div>
        <h3 className="font-bold text-sm text-slate-200">Mestre Gambito</h3>
      </div>

      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-center">
          <StatusPill status={status} />
        </div>

        <div
          className={cn(
            'rounded-xl p-4 border',
            status === 'error' ? 'bg-rose-500/5 border-rose-500/10' : 'bg-slate-800/50 border-slate-700/50',
          )}
        >
          <p className={cn('text-base leading-relaxed', status === 'error' ? 'text-rose-200' : 'text-slate-300')}>
            {comment || 'Jogue de brancas. Encontre o melhor lance de abertura.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={playPreviousMove}
            disabled={!currentNodeId}
            className="p-3.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 rounded-xl transition-all active:scale-95"
            title="Lance anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <Button
            variant={isWaiting ? 'primary' : 'secondary'}
            onClick={playNextMove}
            disabled={status === 'thinking'}
            className="flex-1"
          >
            {isWaiting ? 'Continuar' : 'Revelar lance'}
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
