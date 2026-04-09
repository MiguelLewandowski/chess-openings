'use client'

import { useGameStore } from "@/store/GameStore"
import { CheckCircle2, XCircle, BrainCircuit, Trophy, ArrowRight, RefreshCcw, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function CoachConsole({ nextLessonUrl = "/openings" }: { nextLessonUrl?: string }) {
    const { comment, hasError, isCompleted, isThinking, isWaitingForNext, playNextMove, playPreviousMove, exerciseMoves, currentNodeId, initializeGame, fen } = useGameStore();
    const [progress, setProgress] = useState(0);

    // Atalhos de teclado
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') {
                playNextMove();
            } else if (e.key === 'ArrowLeft') {
                playPreviousMove();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [playNextMove, playPreviousMove]);

    // Calculate progress
    useEffect(() => {
        if (isCompleted) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setProgress(100);
            return;
        }
        if (!exerciseMoves || exerciseMoves.length === 0) {
            setProgress(0);
            return;
        }

        // Find max depth of the tree
        const getDepth = (nodeId: string | null): number => {
            const children = exerciseMoves.filter(m => m.parentId === nodeId);
            if (children.length === 0) return 0;
            return 1 + Math.max(...children.map(c => getDepth(c.id)));
        };

        const totalDepth = getDepth(null);

        // Find current depth
        let currentDepth = 0;
        let current = exerciseMoves.find(m => m.id === currentNodeId);
        while (current) {
            currentDepth++;
            current = exerciseMoves.find(m => m.id === current?.parentId);
        }

        if (totalDepth > 0) {
            setProgress(Math.round((currentDepth / totalDepth) * 100));
        } else {
            setProgress(0);
        }

    }, [currentNodeId, exerciseMoves, isCompleted]);

    if (isCompleted) {
        return (
            <div className="flex flex-col h-full bg-slate-900 border border-violet-500/50 rounded-2xl p-8 shadow-2xl shadow-violet-500/10 relative overflow-hidden animate-in fade-in zoom-in duration-500">
                
                {/* Wow Moment Background Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-transparent pointer-events-none" />
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-500/20 blur-3xl rounded-full pointer-events-none" />

                <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10 space-y-6">
                    <div className="w-20 h-20 bg-violet-500/20 rounded-full flex items-center justify-center mb-2 animate-pulse">
                        <Trophy className="w-10 h-10 text-violet-400" />
                    </div>
                    
                    <div className="space-y-2">
                        <h3 className="text-2xl font-bold tracking-tight text-slate-50">Lesson Completed</h3>
                        <p className="text-slate-300 text-lg leading-relaxed max-w-md">
                            {comment}
                        </p>
                    </div>

                    <div className="pt-8 w-full flex flex-col sm:flex-row gap-4 justify-center">
                        <button 
                            onClick={() => initializeGame('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')} 
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 transition-all duration-200 active:scale-95 font-medium border border-white/5"
                        >
                            <RefreshCcw className="w-4 h-4" />
                            Retry Lesson
                        </button>
                        <Link 
                            href={nextLessonUrl}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-violet-600 text-white hover:bg-violet-500 transition-all duration-200 active:scale-95 font-medium shadow-lg shadow-violet-500/25"
                        >
                            Next Lesson
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl shadow-black/20">
            
            {/* Header & Progress */}
            <div className="p-6 border-b border-slate-800 bg-slate-900/50">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold tracking-tight text-slate-200 flex items-center gap-2">
                        <BrainCircuit className="w-5 h-5 text-violet-400" />
                        Master Insights
                    </h3>
                    <span className="text-xs font-medium text-slate-500 bg-slate-800 px-2.5 py-1 rounded-full">
                        {progress}%
                    </span>
                </div>
                
                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-violet-500 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 flex flex-col">
                
                {/* Status Indicator */}
                <div className="mb-6 flex items-center gap-3">
                    {isThinking ? (
                        <div className="flex items-center gap-2 text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50 w-fit">
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                            <span className="text-sm font-medium">Opponent thinking...</span>
                        </div>
                    ) : hasError ? (
                        <div className="flex items-center gap-2 text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20 w-fit">
                            <XCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Incorrect Move</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 w-fit">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-sm font-medium">Your Turn</span>
                        </div>
                    )}
                </div>

                {/* Comment Box */}
                <div className={`flex-1 rounded-xl p-6 transition-colors duration-300 border ${
                    hasError 
                        ? 'bg-rose-500/5 border-rose-500/10' 
                        : 'bg-slate-800/50 border-slate-700/50'
                }`}>
                    <p className={`text-lg leading-relaxed ${hasError ? 'text-rose-200' : 'text-slate-300'}`}>
                        {comment}
                    </p>
                </div>

                {/* Player Controls */}
                {!isCompleted && (
                    <div className="mt-6 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                        <button 
                            onClick={playPreviousMove}
                            disabled={!currentNodeId}
                            className="flex items-center justify-center p-3.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 rounded-xl transition-all active:scale-95"
                            title="Previous Move (Left Arrow)"
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
                            title="Next Move (Right Arrow)"
                        >
                            {isWaitingForNext ? 'Continue' : 'Reveal Move'}
                            {isWaitingForNext ? <ArrowRight className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        </button>
                    </div>
                )}
                
            </div>
        </div>
    );
}