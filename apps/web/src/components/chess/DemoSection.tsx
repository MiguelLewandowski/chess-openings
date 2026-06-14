'use client'

import { useEffect } from 'react'
import { useGameStore } from '@/store/GameStore'
import Board from './Board'
import Link from 'next/link'
import {
    BrainCircuit, CheckCircle2, XCircle, Trophy,
    ArrowRight, RefreshCcw, ChevronLeft, ChevronRight
} from 'lucide-react'

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

const DEMO_MOVES = [
    {
        id: 'd1', san: 'e4',
        fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
        parentId: null, isOpponentResponse: false,
        coachInsights: { comment: 'Control the center. 1.e4 opens the game for the bishop and queen — the most popular first move at all levels.' },
        visualMarkers: null,
    },
    {
        id: 'd2', san: 'e5',
        fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
        parentId: 'd1', isOpponentResponse: true,
        coachInsights: { comment: 'Black mirrors your move, claiming equal central space. The tension begins.' },
        visualMarkers: null,
    },
    {
        id: 'd3', san: 'Nf3',
        fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2',
        parentId: 'd2', isOpponentResponse: false,
        coachInsights: { comment: 'The knight attacks e5 and develops with tempo. In chess, every move must create a threat.' },
        visualMarkers: null,
    },
    {
        id: 'd4', san: 'Nc6',
        fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
        parentId: 'd3', isOpponentResponse: true,
        coachInsights: { comment: 'Black defends the pawn and develops. Both sides are following the same principle: develop, develop, develop.' },
        visualMarkers: null,
    },
    {
        id: 'd5', san: 'Bc4',
        fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3',
        parentId: 'd4', isOpponentResponse: false,
        coachInsights: { comment: 'The Italian Game. The bishop targets f7 — the weakest pawn in Black\'s camp, protected only by the king since move one.' },
        visualMarkers: { arrows: ['Gc4f7'], circles: [] },
    },
]

export default function DemoSection() {
    const setupExercise = useGameStore(state => state.setupExercise)

    useEffect(() => {
        setupExercise(STARTING_FEN, DEMO_MOVES)
    }, [setupExercise])

    return (
        <section className="max-w-6xl mx-auto px-6 py-24 border-t border-white/5">
            <div className="text-center mb-12">
                <p className="text-sm font-bold tracking-widest text-violet-400 uppercase mb-3">
                    Try it now — no account needed
                </p>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
                    Learn the Italian Game in 3 moves
                </h2>
                <p className="text-slate-400 mt-3 max-w-md mx-auto">
                    Play as White. Find the correct move on the board or press <span className="text-slate-300 font-medium">Reveal Move</span> for a hint.
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
    const {
        comment, hasError, isCompleted, isThinking,
        isWaitingForNext, currentNodeId,
        playNextMove, playPreviousMove, restartExercise,
    } = useGameStore()

    if (isCompleted) {
        return (
            <div className="bg-slate-900 border border-violet-500/30 rounded-2xl p-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent pointer-events-none" />
                <div className="absolute -top-16 -right-16 w-48 h-48 bg-violet-500/10 blur-3xl rounded-full pointer-events-none" />

                <div className="relative z-10">
                    <div className="w-16 h-16 bg-violet-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
                        <Trophy className="w-8 h-8 text-violet-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">You&apos;ve got it!</h3>
                    <p className="text-slate-300 mb-8 leading-relaxed">
                        That&apos;s the Italian Game — one of the oldest and most principled openings in chess. There are dozens of variations to master, each with its own strategy.
                    </p>
                    <div className="flex flex-col gap-3">
                        <Link
                            href="/register"
                            className="flex items-center justify-center gap-2 w-full py-3.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold shadow-lg shadow-violet-500/25 transition-all duration-200 active:scale-95"
                        >
                            Start Learning for Free
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <button
                            onClick={restartExercise}
                            className="flex items-center justify-center gap-2 w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-all"
                        >
                            <RefreshCcw className="w-4 h-4" />
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-800 flex items-center gap-2">
                <div className="bg-violet-500/10 p-1.5 rounded-lg">
                    <BrainCircuit className="w-4 h-4 text-violet-400" />
                </div>
                <h3 className="font-bold text-sm text-slate-200">Master Gambito</h3>
            </div>

            <div className="p-5 flex flex-col gap-4">
                <div className="flex items-center">
                    {isThinking ? (
                        <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
                            <div className="flex gap-1">
                                {[0, 150, 300].map(d => (
                                    <span
                                        key={d}
                                        className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
                                        style={{ animationDelay: `${d}ms` }}
                                    />
                                ))}
                            </div>
                            Opponent thinking...
                        </div>
                    ) : hasError ? (
                        <div className="flex items-center gap-1.5 text-sm font-medium text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20">
                            <XCircle className="w-4 h-4" /> Incorrect Move
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                            <CheckCircle2 className="w-4 h-4" /> Your Turn
                        </div>
                    )}
                </div>

                <div className={`rounded-xl p-4 border ${hasError ? 'bg-rose-500/5 border-rose-500/10' : 'bg-slate-800/50 border-slate-700/50'}`}>
                    <p className={`text-base leading-relaxed ${hasError ? 'text-rose-200' : 'text-slate-300'}`}>
                        {comment || 'Play as White. Find the best opening move.'}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={playPreviousMove}
                        disabled={!currentNodeId}
                        className="p-3.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 rounded-xl transition-all active:scale-95"
                        title="Previous Move"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={playNextMove}
                        disabled={isThinking}
                        className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold transition-all active:scale-95 ${
                            isWaitingForNext
                                ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/25'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/50'
                        }`}
                    >
                        {isWaitingForNext ? 'Continue' : 'Reveal Move'}
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    )
}
