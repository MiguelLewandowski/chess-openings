import { getSession } from "@/lib/session";
import { apiClient } from "@/lib/api-client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, Star, Lock, BookOpen } from "lucide-react";
import { Card, buttonClasses } from "@/components/ui";
import { PageBody, PageHeader, PageTitle } from "@/components/layout/Page";
import { lessonShortTitle, percent } from "@/lib/profile";

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

  const nextLesson = sortedLessons.find((lesson) => !completedLessonIds.has(lesson.id));
  const progress = percent(completedLessonIds.size, sortedLessons.length);

  return (
    <div className="flex-1">

      <PageHeader>
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link
            href="/openings"
            aria-label="Voltar à galeria"
            className="inline-flex items-center justify-center w-9 h-9 shrink-0 rounded-full text-ink-500 hover:text-ink-900 hover:bg-surface-sunken transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <PageTitle subtitle="Trilha da abertura">{opening.name}</PageTitle>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-reward-soft border border-reward/20 rounded-lg font-bold text-[13px] text-reward-strong shrink-0">
          <Star className="w-4 h-4 fill-reward-strong" />
          <span>{xpEarned} XP</span>
        </div>
      </PageHeader>

      {/* Wide pages get a summary column next to the path; the path itself keeps a fixed
          width, since its zigzag is drawn relative to it. */}
      <PageBody className="grid grid-cols-1 gap-8 @4xl:grid-cols-[minmax(280px,360px)_minmax(0,1fr)] @4xl:items-start">

        <aside className="@4xl:sticky @4xl:top-24">
          <Card className="p-5 sm:p-6">
            <h2 className="font-display font-extrabold text-[22px] sm:text-[26px] tracking-tight text-ink-900">Sua trilha</h2>
            <p className="text-ink-500 text-[14px] leading-relaxed mt-2">
              {opening.description || "Conclua as lições em ordem para dominar esta abertura."}
            </p>

            <div className="mt-5">
              <div className="flex items-center justify-between text-[13px] mb-2">
                <span className="font-semibold text-ink-700">
                  {completedLessonIds.size} de {sortedLessons.length} {sortedLessons.length === 1 ? "lição" : "lições"}
                </span>
                <span className="font-mono text-ink-400">{progress}%</span>
              </div>
              <div
                className="h-2 w-full rounded-full bg-surface-sunken overflow-hidden"
                role="progressbar"
                aria-label="Progresso na trilha"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div className={`h-full rounded-full ${allDone ? "bg-reward" : "bg-accent"}`} style={{ width: `${progress}%` }} />
              </div>
            </div>

            {sortedLessons.length > 0 && (
              <Link
                href={`/lessons/${(nextLesson ?? sortedLessons[0]).id}`}
                className={buttonClasses({ className: "w-full mt-6" })}
              >
                {allDone ? "Revisar a trilha" : completedLessonIds.size === 0 ? "Começar a trilha" : "Continuar a trilha"}
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </Card>
        </aside>

        {/* The zigzag offsets and connector curves reach past the column on narrow screens;
            clip them instead of letting the page scroll sideways. */}
        <section aria-label="Lições" className="flex flex-col items-center min-w-0 overflow-x-clip py-2 @4xl:py-6">
          <div className="w-full max-w-md">
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
                      {lessonShortTitle(lesson.title, opening.name)}
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
          </div>
        </section>
      </PageBody>
    </div>
  );
}
