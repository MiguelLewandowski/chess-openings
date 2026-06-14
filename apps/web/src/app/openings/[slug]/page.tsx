import { getOpeningBySlug } from "@/services/opening.service";
import { getSession } from "@/lib/session";
import { apiClient } from "@/lib/api-client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Star, Lock, BookOpen } from "lucide-react";

export default async function OpeningTrackPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;

  const opening = await getOpeningBySlug(resolvedParams.slug);
  if (!opening) notFound();

  const sortedLessons = [...opening.lessons].sort((a, b) => a.order - b.order);

  // Determinar quais lições estão completas com base no UserProgress real
  const completedLessonIds = new Set<string>();
  const session = await getSession();

  if (session) {
    const completed = await apiClient.progress.completedLessons(opening.id, session.apiToken);
    completed.forEach(id => completedLessonIds.add(id));
  }

  // XP total desta abertura (lições completas × 10)
  const xpEarned = completedLessonIds.size * 10;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-violet-500/30">

      {/* Header Fixo */}
      <header className="border-b border-white/5 bg-slate-950/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/openings"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Gallery</span>
          </Link>

          <h1 className="font-bold tracking-tight text-slate-100 truncate px-4">
            {opening.name}
          </h1>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/10 text-violet-400 rounded-lg font-bold text-sm">
            <Star className="w-4 h-4 fill-violet-400" />
            <span>{xpEarned} XP</span>
          </div>
        </div>
      </header>

      {/* Trilha (Path) */}
      <main className="max-w-3xl mx-auto px-4 py-16 flex flex-col items-center">

        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight mb-3">Your Path</h2>
          <p className="text-slate-400 max-w-md mx-auto">
            {opening.description || "Complete the lessons in order to master this opening."}
          </p>
        </div>

        <div className="relative w-full flex flex-col items-center pb-24">

          {sortedLessons.map((lesson, index) => {
            const cycle = index % 4;
            let translateX = "translate-x-0";
            if (cycle === 1) translateX = "translate-x-12 sm:translate-x-20";
            if (cycle === 3) translateX = "-translate-x-12 sm:-translate-x-20";

            const hasNext = index < sortedLessons.length - 1;
            const nextCycle = (index + 1) % 4;

            const isCompleted = completedLessonIds.has(lesson.id);
            const isUnlocked = index === 0 || completedLessonIds.has(sortedLessons[index - 1].id);

            return (
              <div key={lesson.id} className={`relative flex flex-col items-center w-full ${translateX} mb-12`}>

                {/* Título Flutuante acima do botão */}
                <div className="absolute -top-10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-slate-800 text-slate-200 text-sm font-bold py-1.5 px-4 rounded-xl shadow-xl border border-white/10 relative">
                    {lesson.title}
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-800 border-b border-r border-white/10 rotate-45"></div>
                  </div>
                </div>

                {/* Nó/Botão da Lição */}
                <Link
                  href={isUnlocked || isCompleted ? `/lessons/${lesson.id}` : '#'}
                  className={`group relative z-10 flex items-center justify-center w-20 h-20 rounded-full border-b-8 active:border-b-0 active:translate-y-2 transition-all duration-150 ${
                    isCompleted
                      ? 'bg-emerald-500 border-emerald-700 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                      : isUnlocked
                      ? 'bg-violet-500 border-violet-700 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:bg-violet-400'
                      : 'bg-slate-800 border-slate-900 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isCompleted ? (
                    <Star className="w-8 h-8 fill-white" />
                  ) : isUnlocked ? (
                    <BookOpen className="w-8 h-8" />
                  ) : (
                    <Lock className="w-7 h-7" />
                  )}

                  {isUnlocked && !isCompleted && (
                    <div className="absolute -top-2 -right-2 bg-white text-violet-600 text-xs font-black w-7 h-7 flex items-center justify-center rounded-full shadow-lg border-2 border-violet-500">
                      {lesson.order}
                    </div>
                  )}
                </Link>

                <span className="mt-4 text-sm font-bold text-slate-300 text-center max-w-[150px] leading-tight">
                  {lesson.title}
                </span>

                {/* Linha Conectora SVG */}
                {hasNext && (
                  <div className="absolute top-20 -z-10 h-28 w-full flex justify-center pointer-events-none opacity-20">
                    <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                      {cycle === 0 && nextCycle === 1 && (
                        <path d="M 50,0 Q 50,50 75,50 T 100,100" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="10 10" />
                      )}
                      {cycle === 1 && nextCycle === 2 && (
                        <path d="M 50,0 Q 50,50 25,50 T 0,100" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="10 10" />
                      )}
                      {cycle === 2 && nextCycle === 3 && (
                        <path d="M 50,0 Q 50,50 25,50 T 0,100" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="10 10" />
                      )}
                      {cycle === 3 && nextCycle === 0 && (
                        <path d="M 50,0 Q 50,50 75,50 T 100,100" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="10 10" />
                      )}
                    </svg>
                  </div>
                )}
              </div>
            );
          })}

          {/* Troféu Final */}
          <div className="relative flex flex-col items-center mt-8">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center shadow-2xl border-4 ${
              completedLessonIds.size === sortedLessons.length && sortedLessons.length > 0
                ? 'bg-amber-500/20 border-amber-500 shadow-amber-500/20'
                : 'bg-slate-900 border-slate-800'
            }`}>
              <Star className={`w-10 h-10 ${
                completedLessonIds.size === sortedLessons.length && sortedLessons.length > 0
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-slate-600'
              }`} />
            </div>
            {completedLessonIds.size === sortedLessons.length && sortedLessons.length > 0 && (
              <p className="mt-3 text-sm font-bold text-amber-400">Opening Mastered!</p>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
