'use client'

import { useGameStore } from '@/store/GameStore'
import { useEffect, useRef, useState } from 'react'
import Board from './Board'
import type { PuzzleData } from '@/services/puzzle.service'
import {
    AlertTriangle, ChevronRight, RefreshCcw, Trophy,
    Target, Zap, BookOpen, CheckCircle2, Brain, SkipForward
} from 'lucide-react'
import Link from 'next/link'

interface Props {
    puzzles: PuzzleData[]
}

function RatingBadge({ rating }: { rating: number }) {
    if (rating < 1200) return (
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Easy
        </span>
    )
    if (rating < 1600) return (
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
            Medium
        </span>
    )
    if (rating < 1900) return (
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Hard
        </span>
    )
    return (
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Expert
        </span>
    )
}

export default function BlunderTrainer({ puzzles }: Props) {
    const [idx, setIdx] = useState(0)
    const [sessionComplete, setSessionComplete] = useState(false)
    const [solvedCount, setSolvedCount] = useState(0)
    const [firstTryCount, setFirstTryCount] = useState(0)

    const hadErrorRef = useRef(false)

    const {
        setupExercise, isCompleted, hasError, restartExercise,
        isWaitingForNext, isThinking, playNextMove, currentNodeId,
    } = useGameStore()

    const puzzle = puzzles[idx]

    // Carrega o puzzle quando o índice muda.
    // O 1º lance da árvore é sempre o blunder do adversário (isOpponentResponse=true),
    // por isso passamos autoPlayFirst=true para o store o animar automaticamente.
    useEffect(() => {
        if (!puzzle) return
        const firstMove = puzzle.movesTree.find((m: { parentId: string | null }) => m.parentId === null)
        const autoPlayFirst = firstMove?.isOpponentResponse === true
        setupExercise(puzzle.initialFen, puzzle.movesTree, undefined, puzzle.playerColor, autoPlayFirst)
        hadErrorRef.current = false
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idx])

    // Regista erros para estatísticas de "first try"
    useEffect(() => {
        if (hasError) hadErrorRef.current = true
    }, [hasError])

    // Auto-joga a resposta do adversário após o jogador acertar
    useEffect(() => {
        if (!isWaitingForNext) return
        const timer = setTimeout(() => playNextMove(), 600)
        return () => clearTimeout(timer)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isWaitingForNext])

    // Quando a sequência termina: regista stats e avança automaticamente
    useEffect(() => {
        if (!isCompleted) return
        setSolvedCount(s => s + 1)
        if (!hadErrorRef.current) setFirstTryCount(s => s + 1)

        const timer = setTimeout(() => {
            setIdx(prev => {
                if (prev < puzzles.length - 1) return prev + 1
                setSessionComplete(true)
                return prev
            })
        }, 2000)
        return () => clearTimeout(timer)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isCompleted])

    const handleNext = () => {
        if (idx < puzzles.length - 1) setIdx(i => i + 1)
        else setSessionComplete(true)
    }

    // ── Sem puzzles ───────────────────────────────────────────────────────────
    if (puzzles.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                    <BookOpen className="w-10 h-10 text-slate-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-200 mb-2">No puzzles available yet</h2>
                <p className="text-slate-400 max-w-sm mb-6">
                    Import the Lichess puzzle database first using{' '}
                    <code className="text-violet-400 bg-slate-800 px-1.5 py-0.5 rounded text-sm">
                        pnpm import-puzzles
                    </code>.
                </p>
                <Link href="/openings" className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
                    ← Back to Dashboard
                </Link>
            </div>
        )
    }

    // ── Sessão completa ───────────────────────────────────────────────────────
    if (sessionComplete) {
        const accuracy = solvedCount > 0 ? Math.round((firstTryCount / solvedCount) * 100) : 0
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
                <div className="max-w-lg w-full bg-slate-900 border border-violet-500/30 rounded-3xl p-10 text-center shadow-2xl shadow-violet-500/10 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-fuchsia-500/5 pointer-events-none" />
                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-violet-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                            <Trophy className="w-10 h-10 text-violet-400" />
                        </div>
                        <h2 className="text-3xl font-extrabold tracking-tight text-white mb-3">
                            Session Complete!
                        </h2>
                        <p className="text-slate-400 text-lg mb-8">
                            You punished {puzzles.length} opening{' '}
                            {puzzles.length === 1 ? 'blunder' : 'blunders'}.
                        </p>

                        <div className="grid grid-cols-2 gap-3 mb-8 text-left">
                            <div className="bg-slate-800/60 rounded-2xl p-4">
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">First Try</p>
                                <p className="text-2xl font-bold text-white">{firstTryCount}/{solvedCount}</p>
                            </div>
                            <div className="bg-slate-800/60 rounded-2xl p-4">
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Accuracy</p>
                                <p className="text-2xl font-bold text-white">{accuracy}%</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={() => {
                                    setIdx(0)
                                    setSessionComplete(false)
                                    setSolvedCount(0)
                                    setFirstTryCount(0)
                                }}
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 border border-white/5 font-medium transition-all active:scale-95"
                            >
                                <RefreshCcw className="w-4 h-4" />
                                Train Again
                            </button>
                            <Link
                                href="/openings"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-violet-600 text-white hover:bg-violet-500 font-bold transition-all active:scale-95 shadow-lg shadow-violet-500/25"
                            >
                                Dashboard
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // ── Determina o estado visual atual ───────────────────────────────────────
    type StatusConfig = {
        border: string
        headerBg: string
        icon: React.ReactNode
        iconBg: string
        label: string
        labelColor: string
        message: string
        messageBg: string
        messageColor: string
    }

    const getStatus = (): StatusConfig => {
        if (isCompleted) return {
            border: 'border-emerald-500/40',
            headerBg: 'bg-emerald-500/5',
            icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
            iconBg: 'bg-emerald-500/20',
            label: 'Sequence Complete!',
            labelColor: 'text-emerald-300',
            message: 'Brilliant! Moving to the next puzzle...',
            messageBg: 'bg-emerald-500/5 border-emerald-500/20',
            messageColor: 'text-emerald-300',
        }
        if (isThinking || isWaitingForNext) return {
            border: 'border-sky-500/30',
            headerBg: 'bg-sky-500/5',
            icon: <Brain className="w-5 h-5 text-sky-400 animate-pulse" />,
            iconBg: 'bg-sky-500/20',
            label: 'Opponent Playing',
            labelColor: 'text-sky-300',
            message: currentNodeId === null
                ? 'Your opponent is about to blunder...'
                : 'Good move! Opponent is responding...',
            messageBg: 'bg-sky-500/5 border-sky-500/20',
            messageColor: 'text-sky-300',
        }
        if (hasError) return {
            border: 'border-rose-500/30',
            headerBg: 'bg-rose-500/5',
            icon: <AlertTriangle className="w-5 h-5 text-rose-400" />,
            iconBg: 'bg-rose-500/20',
            label: 'Wrong Move!',
            labelColor: 'text-rose-300',
            message: 'That\'s not the right move — try again!',
            messageBg: 'bg-rose-500/5 border-rose-500/20',
            messageColor: 'text-rose-400',
        }
        return {
            border: 'border-slate-700/50',
            headerBg: 'bg-slate-800/30',
            icon: <Target className="w-5 h-5 text-violet-400" />,
            iconBg: 'bg-violet-500/20',
            label: 'Find the Best Move',
            labelColor: 'text-slate-200',
            message: `Your opponent blundered in the ${puzzle.openingName}. Punish it!`,
            messageBg: 'bg-slate-800/50 border-slate-700/50',
            messageColor: 'text-slate-300',
        }
    }

    const status = getStatus()
    const isLocked = isThinking || isWaitingForNext || isCompleted

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

            {/* Tabuleiro */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center">
                <div className="w-full max-w-[500px] aspect-square rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl shadow-black/50 bg-slate-900">
                    <Board />
                </div>
                <p className="mt-3 text-sm text-slate-600">
                    Playing as{' '}
                    <span className="font-semibold text-slate-400">
                        {puzzle.playerColor === 'white' ? '♔ White' : '♚ Black'}
                    </span>
                </p>
            </div>

            {/* Painel lateral */}
            <div className="lg:col-span-5 flex flex-col gap-4">

                {/* Barra de progresso */}
                <div className="flex items-center gap-1.5">
                    {puzzles.map((_, i) => (
                        <div
                            key={i}
                            className={`h-2 flex-1 rounded-full transition-all duration-500 ${
                                i < idx
                                    ? 'bg-emerald-500'
                                    : i === idx
                                    ? isCompleted ? 'bg-emerald-500' : 'bg-rose-500'
                                    : 'bg-slate-800'
                            }`}
                        />
                    ))}
                    <span className="text-xs text-slate-500 ml-1 flex-shrink-0 tabular-nums">
                        {idx + 1}/{puzzles.length}
                    </span>
                </div>

                {/* Card de status */}
                <div className={`bg-slate-900 border ${status.border} rounded-2xl overflow-hidden shadow-xl transition-all duration-300`}>

                    {/* Cabeçalho */}
                    <div className={`px-5 py-4 border-b border-slate-800/80 ${status.headerBg} flex items-center justify-between gap-3`}>
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-9 h-9 ${status.iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
                                {status.icon}
                            </div>
                            <div className="min-w-0">
                                <p className={`font-bold text-sm ${status.labelColor}`}>{status.label}</p>
                                <p className="text-slate-500 text-xs mt-0.5 truncate">{puzzle.openingName}</p>
                            </div>
                        </div>
                        <RatingBadge rating={puzzle.rating} />
                    </div>

                    {/* Corpo */}
                    <div className="p-5 space-y-4">

                        {/* Mensagem de feedback */}
                        <div className={`rounded-xl px-4 py-3.5 border transition-all duration-300 ${status.messageBg}`}>
                            <p className={`text-sm leading-relaxed ${status.messageColor}`}>
                                {status.message}
                            </p>
                        </div>

                        {/* Botões de ação */}
                        {!isLocked && (
                            <div className="flex gap-2">
                                <button
                                    onClick={restartExercise}
                                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 border border-slate-700 font-medium transition-all active:scale-95 text-sm"
                                >
                                    <RefreshCcw className="w-3.5 h-3.5" />
                                    Retry
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 border border-slate-700 font-medium transition-all active:scale-95 text-sm ml-auto"
                                >
                                    <SkipForward className="w-3.5 h-3.5" />
                                    Skip
                                </button>
                            </div>
                        )}

                        {isCompleted && (
                            <button
                                onClick={handleNext}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all active:scale-95 shadow-lg shadow-emerald-500/20 text-sm"
                            >
                                {idx < puzzles.length - 1 ? 'Next Puzzle' : 'Finish Session'}
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Rodapé com rating */}
                <div className="flex items-center justify-between px-1">
                    <span className="text-xs text-slate-700">Puzzle #{idx + 1}</span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Zap className="w-3.5 h-3.5" />
                        Rating:{' '}
                        <span className="font-semibold text-slate-400">{puzzle.rating}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
