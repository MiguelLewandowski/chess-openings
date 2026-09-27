import { getSession } from "@/lib/session";
import { apiClient } from "@/lib/api-client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Star, Lock, BookOpen } from "lucide-react";

export default async function OpeningTrackPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;

  const opening = await apiClient.openings.findBySlug(resolvedParams.slug);
  if (!opening) notFound();

  const sortedLessons = [...opening.lessons].sort((a, b) => a.order - b.order);

  const completedLessonIds = new Set<string>();
  const session = await getSession();

  if (session) {
    const completed = await apiClient.progress.completedLessons(opening.id, session.apiToken);
    completed.forEach(id => completedLessonIds.add(id));
  }

  const xpEarned = completedLessonIds.size * 10;
  const allDone = completedLessonIds.size === sortedLessons.length && sortedLessons.length > 0;

  return (
    <div className="min-h-screen bg-surface-app text-ink-900 font-body">

      <header className="border-b border-border-subtle bg-surface-card/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/openings"
            className="inline-flex items-center gap-2 text-[13px] font-semibold text-ink-500 hover:text-ink-900 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Galeria</span>
          </Link>

          <h1 className="font-display font-bold text-[15px] tracking-tight text-ink-900 truncate px-4">
            {opening.name}
          </h1>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-reward-soft border border-reward/20 rounded-lg font-bold text-[13px] text-reward-strong">
            <Star className="w-4 h-4 fill-reward-strong" />
            <span>{xpEarned} XP</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-16 flex flex-col items-center">

        <div className="text-center mb-14">
          <h2 className="font-display font-extrabold text-[30px] tracking-tight mb-3 text-ink-900">Sua trilha</h2>
          <p className="text-ink-500 max-w-md mx-auto text-[14px] leading-relaxed">
            {opening.description || "Conclua as lições em ordem para dominar esta abertura."}
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

                <Link
                  href={isUnlocked || isCompleted ? `/lessons/${lesson.id}` : '#'}
                  className={`group relative z-10 flex items-center justify-center w-20 h-20 rounded-full border-b-[6px] active:border-b-0 active:translate-y-1.5 transition-all duration-150 ${
                    isCompleted
                      ? 'bg-success border-[#217A46] text-white shadow-[0_0_20px_rgba(46,160,93,0.25)]'
                      : isUnlocked
                      ? 'bg-accent border-[#1A5BC4] text-white shadow-[0_0_20px_rgba(47,123,246,0.25)] hover:bg-accent-hover'
                      : 'bg-surface-card border-border-default text-ink-400 cursor-not-allowed'
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
                    <div className="absolute -top-2 -right-2 bg-white text-accent text-[11px] font-black w-7 h-7 flex items-center justify-center rounded-full shadow border-2 border-accent">
                      {lesson.order}
                    </div>
                  )}
                </Link>

                <span className="mt-4 text-[13px] font-bold text-ink-700 text-center max-w-[150px] leading-tight">
                  {lesson.title}
                </span>

                {hasNext && (
                  <div className="absolute top-20 -z-10 h-28 w-full flex justify-center pointer-events-none opacity-15">
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

          <div className="relative flex flex-col items-center mt-8">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg border-4 ${
              allDone
                ? 'bg-reward-soft border-reward shadow-reward/20'
                : 'bg-surface-card border-border-default'
            }`}>
              <Star className={`w-10 h-10 ${allDone ? 'text-reward fill-reward' : 'text-ink-300'}`} />
            </div>
            {allDone && (
              <p className="mt-3 text-[13px] font-bold text-reward-strong">Abertura dominada!</p>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
