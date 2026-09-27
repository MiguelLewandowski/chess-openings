'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Eye, RefreshCcw } from 'lucide-react'
import { practiceQuality, practiceXp } from '@chess-openings/domain'
import { useGameStore, type ExerciseMove, type SessionMode } from '@/store/GameStore'
import { Button, buttonClasses, Card } from '@/components/ui'
import { ChessWrapper } from '@/lib/chess'
import { formatDayList, reviewSchedule } from '@/lib/review-schedule'
import Board from './Board'
import CoachConsole from './CoachConsole'

// The start of the Abertura do Bispo, as the lesson in the catalog teaches it (same comments).
const DEMO_LINE: ExerciseMove[] = [
  {
    id: 'd1', san: 'e4', parentId: null, isOpponentResponse: false,
    fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    coachInsights: { comment: 'Abrimos com o peão do rei: ele ocupa o centro e controla d5 e f5.' },
    visualMarkers: null,
  },
  {
    id: 'd2', san: 'e5', parentId: 'd1', isOpponentResponse: true,
    fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
    coachInsights: { comment: 'As pretas respondem no mesmo espírito e disputam o centro.' },
    visualMarkers: null,
  },
  {
    id: 'd3', san: 'Bc4', parentId: 'd2', isOpponentResponse: false,
    fen: 'rnbqkbnr/pppp1ppp/8/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR b KQkq - 1 2',
    coachInsights: { comment: 'A Abertura do Bispo: o bispo vai para a diagonal que mira f7, a casa que só o rei preto defende.' },
    visualMarkers: { arrows: ['Gc4f7'], circles: ['Gf7'] },
  },
  {
    id: 'd4', san: 'Nf6', parentId: 'd3', isOpponentResponse: true,
    fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 2 3',
    coachInsights: { comment: 'As pretas desenvolvem o cavalo e já atacam o peão de e4, que está sem defesa.' },
    visualMarkers: { arrows: ['Rf6e4'], circles: [] },
  },
  {
    id: 'd5', san: 'd3', parentId: 'd4', isOpponentResponse: false,
    fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/3P4/PPP2PPP/RNBQK1NR b KQkq - 0 3',
    coachInsights: { comment: 'Defendemos e4 com um peão e mantemos o bispo apontado para f7.' },
    visualMarkers: { arrows: ['Gd3e4'], circles: [] },
  },
]

// The practice replays the line without its comments, like the lessons do.
const PRACTICE_LINE = DEMO_LINE.map((move) => ({ ...move, coachInsights: null, visualMarkers: null }))

// The lesson flow without an account: watch the line, play it from memory, and see what the
// spaced repetition would do with the result.
export default function DemoSection() {
  const [mode, setMode] = useState<SessionMode>('watch')
  const setupExercise = useGameStore((s) => s.setupExercise)
  const status = useGameStore((s) => s.status)
  const ready = useGameStore((s) => s.exerciseId === `demo-${mode}` && s.mode === mode)

  useEffect(() => {
    setupExercise(ChessWrapper.STARTING_FEN, mode === 'watch' ? DEMO_LINE : PRACTICE_LINE, {
      exerciseId: `demo-${mode}`,
      mode,
    })
  }, [mode, setupExercise])

  const panel = !ready ? (
    <Card aria-busy className="h-72 animate-pulse bg-surface-sunken" />
  ) : mode === 'practice' && status === 'completed' ? (
    <DemoResult onRewatch={() => setMode('watch')} />
  ) : (
    <CoachConsole
      nextLessonUrl="/register"
      nextLabel="Criar conta"
      onStartPractice={() => setMode('practice')}
      onRewatch={() => setMode('watch')}
    />
  )

  return (
    <section id="demo" className="scroll-mt-20 border-t border-border-subtle">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="max-w-2xl mb-12">
          <p className="text-[12px] font-bold tracking-[0.14em] text-ink-400 uppercase mb-3">Experimente sem criar conta</p>
          <h2 className="font-display font-extrabold text-[30px] sm:text-[40px] tracking-tight text-ink-900 leading-[1.1]">
            Os primeiros lances da Abertura do Bispo
          </h2>
          <p className="text-ink-500 mt-4 text-[16px] leading-relaxed">
            Veja a linha com a explicação de cada lance e depois jogue-a de memória. É exatamente assim que cada lição
            funciona.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-7">
            <div className="w-full max-w-[560px] mx-auto aspect-square rounded-[16px] overflow-hidden ring-1 ring-border-default shadow-lg bg-surface-card">
              <Board />
            </div>
          </div>
          <div className="lg:col-span-5">{panel}</div>
        </div>
      </div>
    </section>
  )
}

function DemoResult({ onRewatch }: { onRewatch: () => void }) {
  const mistakes = useGameStore((s) => s.mistakes)
  const pieceHints = useGameStore((s) => s.pieceHints)
  const revealedMoves = useGameStore((s) => s.revealedMoves)
  const restartExercise = useGameStore((s) => s.restartExercise)

  // The same rule the app applies to a real practice run.
  const quality = practiceQuality({ mistakes, pieceHints, revealedMoves })
  const passed = quality >= 3
  const hints = pieceHints + revealedMoves

  return (
    <Card className="p-6 sm:p-8">
      <p className="text-[12px] font-bold tracking-[0.14em] uppercase text-ink-400">Resultado</p>
      <h3 className="font-display font-extrabold text-[26px] tracking-tight text-ink-900 mt-1">
        {quality === 5 ? 'Perfeito' : passed ? 'Linha concluída' : 'Quase lá'}
      </h3>
      <p className="text-[14px] text-ink-500 mt-1">
        {mistakes} {mistakes === 1 ? 'erro' : 'erros'} · {hints} {hints === 1 ? 'dica' : 'dicas'} · nota {quality} de 5 ·{' '}
        {practiceXp(quality)} XP
      </p>

      <div className="mt-6 rounded-[10px] border border-border-subtle bg-surface-sunken p-4">
        {passed ? (
          <>
            <p className="text-[14px] text-ink-700">Com uma conta, mantendo esse desempenho, esta linha voltaria em:</p>
            <p className="mt-2 font-display font-bold text-[18px] text-ink-900">{formatDayList(reviewSchedule(quality, 4))}</p>
          </>
        ) : (
          <p className="text-[14px] text-ink-700">
            Como você precisou de bastante ajuda, a linha voltaria amanhã, e continuaria voltando todo dia até você
            acertá-la.
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <Link href="/register" className={buttonClasses({ className: 'w-full' })}>
          Criar conta grátis
          <ArrowRight className="w-4 h-4" />
        </Link>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={restartExercise}>
            <RefreshCcw className="w-4 h-4" />
            Tentar de novo
          </Button>
          <Button variant="secondary" onClick={onRewatch}>
            <Eye className="w-4 h-4" />
            Rever a linha
          </Button>
        </div>
      </div>
    </Card>
  )
}
