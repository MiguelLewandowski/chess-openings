'use client'

import { useGameStore, type GameStatus } from '@/store/GameStore'
import { useEffect, useRef, useState } from 'react'
import Board from './Board'
import type { PuzzleData } from '@/lib/api-client'
import {
    AlertTriangle, ChevronRight, RefreshCcw, Trophy,
    Target, Zap, BookOpen, CheckCircle2, Brain, SkipForward,
} from 'lucide-react'
import Link from 'next/link'
import { Badge, type BadgeTone, Button, buttonClasses, Card, EmptyState } from '@/components/ui'
import { useOpponentReveal } from '@/hooks/useOpponentReveal'
import { AUTO_ADVANCE_MS, NEXT_PUZZLE_MS } from '@/lib/timing'
import { cn } from '@/lib/cn'

interface Props {
    puzzles: PuzzleData[]
}

function RatingBadge({ rating }: { rating: number }) {
    const { tone, label } =
        rating < 1200 ? { tone: 'emerald' as BadgeTone, label: 'Fácil' }
        : rating < 1600 ? { tone: 'sky' as BadgeTone, label: 'Médio' }
        : rating < 1900 ? { tone: 'amber' as BadgeTone, label: 'Difícil' }
        : { tone: 'rose' as BadgeTone, label: 'Especialista' }
    return <Badge tone={tone}>{label}</Badge>
}

interface StatusConfig {
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

function getStatusConfig(status: GameStatus, currentNodeId: string | null, openingName: string): StatusConfig {
    if (status === 'completed') return {
        border: 'border-[#2EA05D]/30', headerBg: 'bg-success-soft',
        icon: <CheckCircle2 className="w-5 h-5 text-success" />, iconBg: 'bg-success-soft',
        label: 'Sequência concluída!', labelColor: 'text-success',
        message: 'Brilhante! Indo para o próximo puzzle...',
        messageBg: 'bg-success-soft border-[#2EA05D]/20', messageColor: 'text-success',
    }
    if (status === 'thinking' || status === 'waiting') return {
        border: 'border-accent/20', headerBg: 'bg-accent-soft',
        icon: <Brain className="w-5 h-5 text-accent animate-pulse" />, iconBg: 'bg-accent-soft',
        label: 'Adversário jogando', labelColor: 'text-accent',
        message: currentNodeId === null
            ? 'Seu adversário está prestes a errar...'
            : 'Bom lance! O adversário está respondendo...',
        messageBg: 'bg-accent-soft border-accent/20', messageColor: 'text-accent',
    }
    if (status === 'error') return {
        border: 'border-danger/20', headerBg: 'bg-danger-soft',
        icon: <AlertTriangle className="w-5 h-5 text-danger" />, iconBg: 'bg-danger-soft',
        label: 'Lance errado!', labelColor: 'text-danger',
        message: 'Esse não é o lance certo — tente de novo!',
        messageBg: 'bg-danger-soft border-danger/20', messageColor: 'text-danger',
    }
    return {
        border: 'border-border-default', headerBg: 'bg-surface-sunken',
        icon: <Target className="w-5 h-5 text-accent" />, iconBg: 'bg-accent-soft',
        label: 'Encontre o melhor lance', labelColor: 'text-ink-900',
        message: `Seu adversário errou na ${openingName}. Puna o erro!`,
        messageBg: 'bg-surface-sunken border-border-subtle', messageColor: 'text-ink-700',
    }
}

export default function BlunderTrainer({ puzzles }: Props) {
    const [idx, setIdx] = useState(0)
    const [sessionComplete, setSessionComplete] = useState(false)
    const [solvedCount, setSolvedCount] = useState(0)
    const [firstTryCount, setFirstTryCount] = useState(0)

    const hadErrorRef = useRef(false)

    const { setupExercise, status, restartExercise, playNextMove, currentNodeId } = useGameStore()
    const puzzle = puzzles[idx]

    useOpponentReveal()

    // Load the puzzle when the index changes. The first tree node is always the
    // opponent's blunder (isOpponentResponse=true), so autoPlayFirst animates it.
    useEffect(() => {
        if (!puzzle) return
        const firstMove = puzzle.movesTree.find((m) => m.parentId === null)
        setupExercise(puzzle.initialFen, puzzle.movesTree, undefined, puzzle.playerColor, firstMove?.isOpponentResponse === true)
        hadErrorRef.current = false
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idx])

    // Track errors for the "first try" stat.
    useEffect(() => {
        if (status === 'error') hadErrorRef.current = true
    }, [status])

    // Auto-play the opponent's reply after the player is correct.
    useEffect(() => {
        if (status !== 'waiting') return
        const timer = setTimeout(() => playNextMove(), AUTO_ADVANCE_MS)
        return () => clearTimeout(timer)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status])

    // On completion: record stats and advance automatically.
    useEffect(() => {
        if (status !== 'completed') return
        setSolvedCount((s) => s + 1)
        if (!hadErrorRef.current) setFirstTryCount((s) => s + 1)

        const timer = setTimeout(() => {
            setIdx((prev) => {
                if (prev < puzzles.length - 1) return prev + 1
                setSessionComplete(true)
                return prev
            })
        }, NEXT_PUZZLE_MS)
        return () => clearTimeout(timer)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status])

    const handleNext = () => {
        if (idx < puzzles.length - 1) setIdx((i) => i + 1)
        else setSessionComplete(true)
    }

    if (puzzles.length === 0) {
        return (
            <EmptyState
                icon={<BookOpen className="w-10 h-10 text-ink-400" />}
                title="Nenhum puzzle disponível ainda"
                description={
                    <>
                        Importe primeiro a base de puzzles do Lichess com{' '}
                        <code className="text-accent bg-accent-soft px-1.5 py-0.5 rounded text-sm font-mono">pnpm import-puzzles</code>.
                    </>
                }
                action={
                    <Link href="/openings" className="text-sm text-accent font-semibold hover:underline underline-offset-4">
                        ← Voltar ao painel
                    </Link>
                }
            />
        )
    }

    if (sessionComplete) {
        const accuracy = solvedCount > 0 ? Math.round((firstTryCount / solvedCount) * 100) : 0
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
                <Card className="max-w-lg w-full p-10 text-center">
                    <div className="w-20 h-20 bg-success-soft rounded-full flex items-center justify-center mx-auto mb-6">
                        <Trophy className="w-10 h-10 text-success" />
                    </div>
                    <h2 className="font-display font-extrabold text-[28px] tracking-tight text-ink-900 mb-3">Sessão concluída!</h2>
                    <p className="text-ink-500 text-[16px] mb-8">
                        Você puniu {puzzles.length} {puzzles.length === 1 ? 'erro' : 'erros'} de abertura.
                    </p>

                    <div className="grid grid-cols-2 gap-3 mb-8 text-left">
                        <div className="bg-surface-sunken border border-border-subtle rounded-[10px] p-4">
                            <p className="text-[11px] text-ink-400 uppercase tracking-wider mb-1">Primeira tentativa</p>
                            <p className="text-[22px] font-bold text-ink-900">{firstTryCount}/{solvedCount}</p>
                        </div>
                        <div className="bg-surface-sunken border border-border-subtle rounded-[10px] p-4">
                            <p className="text-[11px] text-ink-400 uppercase tracking-wider mb-1">Precisão</p>
                            <p className="text-[22px] font-bold text-ink-900">{accuracy}%</p>
                        </div>
                    </div>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setIdx(0)
                                    setSessionComplete(false)
                                    setSolvedCount(0)
                                    setFirstTryCount(0)
                                }}
                            >
                                <RefreshCcw className="w-4 h-4" />
                                Treinar de novo
                            </Button>
                            <Link href="/openings" className={buttonClasses()}>
                                Painel
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                </Card>
            </div>
        )
    }

    const config = getStatusConfig(status, currentNodeId, puzzle.openingName)
    const isLocked = status === 'thinking' || status === 'waiting' || status === 'completed'

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

            <div className="lg:col-span-7 flex flex-col items-center justify-center">
                <div className="w-full max-w-[500px] aspect-square rounded-[16px] overflow-hidden ring-1 ring-border-default shadow-xl bg-surface-card">
                    <Board />
                </div>
                <p className="mt-3 text-[13px] text-ink-400">
                    Jogando de{' '}
                    <span className="font-semibold text-ink-600">
                        {puzzle.playerColor === 'white' ? '♔ Brancas' : '♚ Pretas'}
                    </span>
                </p>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-4">

                <div className="flex items-center gap-1.5">
                    {puzzles.map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                'h-2 flex-1 rounded-full transition-all duration-500',
                                i < idx ? 'bg-success'
                                    : i === idx ? (status === 'completed' ? 'bg-success' : 'bg-danger')
                                    : 'bg-surface-sunken border border-border-subtle',
                            )}
                        />
                    ))}
                    <span className="text-[12px] text-ink-400 ml-1 flex-shrink-0 tabular-nums">{idx + 1}/{puzzles.length}</span>
                </div>

                <div className={cn('bg-surface-card border rounded-[12px] overflow-hidden shadow-sm transition-all duration-300', config.border)}>

                    <div className={cn('px-5 py-4 border-b border-border-subtle flex items-center justify-between gap-3', config.headerBg)}>
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={cn('w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0', config.iconBg)}>
                                {config.icon}
                            </div>
                            <div className="min-w-0">
                                <p className={cn('font-bold text-sm', config.labelColor)}>{config.label}</p>
                                <p className="text-ink-400 text-[12px] mt-0.5 truncate">{puzzle.openingName}</p>
                            </div>
                        </div>
                        <RatingBadge rating={puzzle.rating} />
                    </div>

                    <div className="p-5 space-y-4">
                        <div className={cn('rounded-xl px-4 py-3.5 border transition-all duration-300', config.messageBg)}>
                            <p className={cn('text-sm leading-relaxed', config.messageColor)}>{config.message}</p>
                        </div>

                        {!isLocked && (
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={restartExercise}>
                                    <RefreshCcw className="w-3.5 h-3.5" />
                                    Repetir
                                </Button>
                                <Button variant="ghost" size="sm" onClick={handleNext} className="ml-auto">
                                    <SkipForward className="w-3.5 h-3.5" />
                                    Pular
                                </Button>
                            </div>
                        )}

                        {status === 'completed' && (
                            <Button variant="success" size="sm" onClick={handleNext} className="w-full">
                                {idx < puzzles.length - 1 ? 'Próximo puzzle' : 'Finalizar sessão'}
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between px-1">
                    <span className="text-[12px] text-ink-400">Puzzle #{idx + 1}</span>
                    <div className="flex items-center gap-1.5 text-[12px] text-ink-400">
                        <Zap className="w-3.5 h-3.5" />
                        Rating:{' '}
                        <span className="font-semibold text-ink-600">{puzzle.rating}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
