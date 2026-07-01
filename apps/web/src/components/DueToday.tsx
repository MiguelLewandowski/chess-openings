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

    const statsBar = (
        <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-reward-soft border border-reward/20 rounded-lg">
                <Flame className="w-4 h-4 text-reward-strong" />
                <span className="text-[13px] font-bold text-reward-strong">{streak} {streak === 1 ? 'dia' : 'dias'}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-soft border border-accent/20 rounded-lg">
                <Zap className="w-4 h-4 text-accent" />
                <span className="text-[13px] font-bold text-accent">{xp} XP</span>
            </div>
        </div>
    );

    if (dueCount === 0) {
        return (
            <div className="mb-8 bg-success-soft border border-[#2EA05D]/20 rounded-[12px] p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#2EA05D]/10 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-success" />
                    </div>
                    <div>
                        <p className="font-bold text-success text-[14px]">Tudo em dia!</p>
                        <p className="text-ink-500 text-[12px] mt-0.5">Nenhuma revisão pendente. Volte amanhã para manter sua sequência.</p>
                    </div>
                </div>
                {statsBar}
            </div>
        );
    }

    const VISIBLE = 3;
    const visible = reviews.slice(0, VISIBLE);
    const hidden = dueCount - VISIBLE;
    const now = Date.now();

    return (
        <div className="mb-8 bg-surface-card border border-reward/30 rounded-[12px] overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-9 h-9 bg-reward-soft rounded-full flex items-center justify-center">
                            <Clock className="w-4 h-4 text-reward-strong" />
                        </div>
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-reward text-ink-900 text-[10px] font-black rounded-full flex items-center justify-center">
                            {dueCount}
                        </span>
                    </div>
                    <div>
                        <p className="font-bold text-ink-900 text-[14px]">
                            {dueCount} {dueCount === 1 ? 'exercício' : 'exercícios'} para revisar hoje
                        </p>
                        <p className="text-ink-500 text-[12px]">Revise agora para fixar na memória</p>
                    </div>
                </div>
                {statsBar}
            </div>

            <div className="divide-y divide-border-subtle">
                {visible.map((review) => {
                    const daysOverdue = Math.max(
                        0,
                        Math.floor((now - new Date(review.nextReview).getTime()) / 86_400_000)
                    );

                    return (
                        <Link
                            key={review.exercise.id}
                            href={`/lessons/${review.exercise.lesson.id}?mode=practice`}
                            className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-sunken transition-colors group"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-2 h-2 rounded-full bg-reward flex-shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[13px] font-semibold text-ink-900 truncate">
                                        {review.exercise.lesson.opening.name}
                                    </p>
                                    <p className="text-[12px] text-ink-500 truncate">
                                        Lição {review.exercise.lesson.order}: {review.exercise.lesson.title}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                                {daysOverdue > 0 && (
                                    <span className="text-[11px] font-bold text-danger bg-danger-soft px-2 py-0.5 rounded">
                                        {daysOverdue}d atrasado
                                    </span>
                                )}
                                <ChevronRight className="w-4 h-4 text-ink-300 group-hover:text-accent transition-colors" />
                            </div>
                        </Link>
                    );
                })}

                {hidden > 0 && (
                    <div className="px-5 py-3 text-[12px] text-ink-500">
                        + {hidden} {hidden > 1 ? 'exercícios' : 'exercício'} a mais
                    </div>
                )}
            </div>

            <div className="px-5 py-4 border-t border-border-subtle bg-surface-sunken">
                <Link
                    href={`/lessons/${firstReview.exercise.lesson.id}?mode=practice`}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-reward hover:bg-reward-strong text-ink-900 rounded-[8px] text-[14px] font-bold transition-all active:scale-[0.98] shadow-sm"
                >
                    <Zap className="w-4 h-4" />
                    Iniciar sessão de revisão
                </Link>
            </div>
        </div>
    );
}
