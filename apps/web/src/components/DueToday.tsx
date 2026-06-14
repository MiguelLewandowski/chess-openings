import Link from 'next/link';
import { Flame, Zap, ChevronRight, CheckCircle2, Clock } from 'lucide-react';
import type { DueReview } from '@/lib/api-client';

interface DueTodayProps {
    reviews: DueReview[];
    streak: number;
    xp: number;
}

export default function DueToday({ reviews, streak, xp }: DueTodayProps) {
    const dueCount = reviews.length;
    const firstReview = reviews[0];

    // Painel de streak + XP — sempre visível se o user estiver logado
    const statsBar = (
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <Flame className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-amber-300">{streak} {streak === 1 ? 'dia' : 'dias'} seguidos</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-lg">
                <Zap className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-bold text-violet-300">{xp} XP</span>
            </div>
        </div>
    );

    if (dueCount === 0) {
        return (
            <div className="mb-8 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <p className="font-bold text-emerald-300 text-sm">Tudo em dia!</p>
                        <p className="text-slate-400 text-xs mt-0.5">Nenhuma revisão pendente. Volte amanhã para manter sua sequência.</p>
                    </div>
                </div>
                {statsBar}
            </div>
        );
    }

    const VISIBLE = 3;
    const visible = reviews.slice(0, VISIBLE);
    const hidden = dueCount - VISIBLE;
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();

    return (
        <div className="mb-8 bg-slate-900 border border-amber-500/30 rounded-2xl overflow-hidden shadow-lg shadow-amber-500/5">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-9 h-9 bg-amber-500/10 rounded-full flex items-center justify-center">
                            <Clock className="w-4 h-4 text-amber-400" />
                        </div>
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-black text-[10px] font-black rounded-full flex items-center justify-center">
                            {dueCount}
                        </span>
                    </div>
                    <div>
                        <p className="font-bold text-white text-sm">
                            {dueCount} {dueCount === 1 ? 'exercício' : 'exercícios'} para revisar hoje
                        </p>
                        <p className="text-slate-400 text-xs">Revise agora para fixar na memória</p>
                    </div>
                </div>
                {statsBar}
            </div>

            {/* Lista de exercises */}
            <div className="divide-y divide-slate-800/50">
                {visible.map((review) => {
                    const daysOverdue = Math.max(
                        0,
                        Math.floor((now - new Date(review.nextReview).getTime()) / 86_400_000)
                    );

                    return (
                        <Link
                            key={review.exercise.id}
                            href={`/lessons/${review.exercise.lesson.id}?mode=practice`}
                            className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-800/40 transition-colors group"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-slate-200 truncate">
                                        {review.exercise.lesson.opening.name}
                                    </p>
                                    <p className="text-xs text-slate-400 truncate">
                                        Lição {review.exercise.lesson.order}: {review.exercise.lesson.title}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                                {daysOverdue > 0 && (
                                    <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                                        {daysOverdue}d atrasado
                                    </span>
                                )}
                                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-violet-400 transition-colors" />
                            </div>
                        </Link>
                    );
                })}

                {hidden > 0 && (
                    <div className="px-5 py-3 text-xs text-slate-400">
                        + {hidden} {hidden > 1 ? 'exercícios' : 'exercício'} a mais
                    </div>
                )}
            </div>

            {/* CTA */}
            <div className="px-5 py-4 border-t border-slate-800 bg-slate-900/50">
                <Link
                    href={`/lessons/${firstReview.exercise.lesson.id}?mode=practice`}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-amber-500/20"
                >
                    <Zap className="w-4 h-4" />
                    Iniciar sessão de revisão
                </Link>
            </div>
        </div>
    );
}
