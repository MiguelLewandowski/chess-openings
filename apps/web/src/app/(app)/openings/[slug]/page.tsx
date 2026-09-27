import type { Metadata } from "next";
import { cache } from "react";
import { getSession } from "@/lib/session";
import { apiClient } from "@/lib/api-client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { practiceXp, type LessonSummary } from "@chess-openings/domain";
import { BookOpen, Check, ChevronLeft, ChevronRight, Lock, RotateCcw, Swords, Trophy } from "lucide-react";
import { Card, EmptyState } from "@/components/ui";
import { PageBody, PageHeader, PageTitle } from "@/components/layout/Page";
import { cn } from "@/lib/cn";
import { percent } from "@/lib/profile";
import { lessonTitleParts, type LessonKind } from "@/lib/lesson-title";

// The most a lesson can pay: a perfect practice run. XP depends on how each run goes, so the
// track only promises the ceiling.
const MAX_XP_PER_LESSON = practiceXp(5);

// done: completed · current: the next lesson to study · open: unlocked but not the next one
// (happens when a later lesson was completed first) · locked: previous lesson not completed.
type StepState = "done" | "current" | "open" | "locked";

// The tab title and the page need the same opening: cache() makes it one request.
const findOpening = cache((slug: string) => apiClient.openings.findBySlug(slug));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const opening = await findOpening((await params).slug);
  return { title: opening?.name ?? "Abertura" };
}

export default async function OpeningTrackPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;

  const opening = await findOpening(resolvedParams.slug);
  if (!opening) notFound();

  const sortedLessons = [...opening.lessons].sort((a, b) => a.order - b.order);

  const completedLessonIds = new Set<string>();
  const session = await getSession();

  if (session) {
    const completed = await apiClient.progress.completedLessons(opening.id, session.apiToken);
    completed.forEach(id => completedLessonIds.add(id));
  }

  const total = sortedLessons.length;
  const done = completedLessonIds.size;
  const allDone = done === total && total > 0;
  const nextLesson = sortedLessons.find((lesson) => !completedLessonIds.has(lesson.id));

  const tutorial = opening.isTutorial;

  const stateOf = (lesson: LessonSummary, index: number): StepState => {
    if (completedLessonIds.has(lesson.id)) return "done";
    if (lesson.id === nextLesson?.id) return "current";
    return index === 0 || completedLessonIds.has(sortedLessons[index - 1].id) ? "open" : "locked";
  };

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
          <PageTitle subtitle={tutorial ? "Tutorial" : "Trilha da abertura"}>{opening.name}</PageTitle>
        </div>
      </PageHeader>

      <PageBody className="mx-auto w-full max-w-2xl">
        {total === 0 ? (
          <EmptyState
            icon={<BookOpen className="w-8 h-8" />}
            title="Nenhuma lição por aqui"
            description="Esta abertura ainda não tem lições publicadas."
          />
        ) : (
          <>
            <TrackSummary done={done} total={total} allDone={allDone} tutorial={tutorial} />

            <ol aria-label="Lições" className="mt-8 sm:mt-10">
              {sortedLessons.map((lesson, index) => {
                const state = stateOf(lesson, index);
                return (
                  <TrackStep
                    key={lesson.id}
                    lesson={lesson}
                    openingName={opening.name}
                    number={index + 1}
                    state={state}
                    // The segment below a node is "walked" once that lesson is done.
                    walked={state === "done"}
                    tutorial={tutorial}
                  />
                );
              })}
              <TrackGoal allDone={allDone} maxXp={total * MAX_XP_PER_LESSON} tutorial={tutorial} />
            </ol>
          </>
        )}
      </PageBody>
    </div>
  );
}

function TrackSummary({ done, total, allDone, tutorial }: { done: number; total: number; allDone: boolean; tutorial: boolean }) {
  const left = total - done;
  const headline = allDone
    ? tutorial ? "Tutorial concluído" : "Abertura dominada"
    : done === 0
      ? "Sua trilha começa aqui"
      : `Falta${left === 1 ? "" : "m"} ${left} ${left === 1 ? "lição" : "lições"}`;
  const detail = allDone
    ? tutorial
      ? "Você já sabe como todas as peças se movem. Hora de escolher uma abertura!"
      : "Continue revisando para manter as linhas frescas na memória."
    : "Conclua as lições em ordem: cada uma destrava a próxima.";

  return (
    <Card className="p-5 sm:p-6 flex items-center gap-5">
      <ProgressRing value={percent(done, total)} done={done} total={total} allDone={allDone} />
      <div className="min-w-0">
        <p className="font-display font-extrabold text-[20px] sm:text-[22px] tracking-tight text-ink-900 leading-tight">
          {headline}
        </p>
        <p className="text-[14px] text-ink-500 leading-relaxed mt-1">{detail}</p>
      </div>
    </Card>
  );
}

function ProgressRing({ value, done, total, allDone }: { value: number; done: number; total: number; allDone: boolean }) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  return (
    <div
      className="relative w-16 h-16 shrink-0"
      role="progressbar"
      aria-label="Progresso na trilha"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90" aria-hidden>
        <circle cx="32" cy="32" r={radius} fill="none" strokeWidth="6" className="stroke-surface-sunken" />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
          className={cn("transition-[stroke-dashoffset] duration-700", allDone ? "stroke-reward" : "stroke-success")}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-display font-extrabold text-[15px] text-ink-900">
        {done}/{total}
      </span>
    </div>
  );
}

const nodeStyles: Record<StepState, string> = {
  done: "bg-success text-white",
  current: "bg-accent text-white ring-[6px] ring-accent-soft",
  open: "bg-surface-card text-accent border-2 border-accent",
  locked: "bg-surface-card text-ink-300 border-2 border-border-default",
};

function KindIcon({ kind, className }: { kind: LessonKind; className?: string }) {
  return kind === "trap" ? <Swords className={className} /> : <BookOpen className={className} />;
}

function TrackStep({
  lesson,
  openingName,
  number,
  state,
  walked,
  tutorial,
}: {
  lesson: LessonSummary;
  openingName: string;
  number: number;
  state: StepState;
  walked: boolean;
  // A tutorial lesson is not a line or a trap: it only carries its number.
  tutorial: boolean;
}) {
  const { kind, name, moves } = lessonTitleParts(lesson.title, openingName);
  const href = `/lessons/${lesson.id}`;

  const eyebrow = (
    <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-400">
      <span>Lição {number}</span>
      {!tutorial && (
        <>
          <span aria-hidden>·</span>
          <span className={cn("inline-flex items-center gap-1", kind === "trap" && state !== "locked" && "text-warning")}>
            <KindIcon kind={kind} className="w-3 h-3" />
            {kind === "trap" ? "Armadilha" : "Linha"}
          </span>
        </>
      )}
    </p>
  );

  const body = (
    <div className="min-w-0 flex-1">
      {eyebrow}
      <p
        className={cn(
          "mt-1 font-display font-bold tracking-tight leading-snug",
          state === "current" ? "text-[18px] sm:text-[19px] text-ink-900" : "text-[16px]",
          state === "locked" ? "text-ink-400" : "text-ink-900",
        )}
      >
        {name}
      </p>
      {moves && (
        <p className={cn("mt-1.5 font-mono text-[12.5px] break-words", state === "locked" ? "text-ink-300" : "text-ink-500")}>
          {moves}
        </p>
      )}
    </div>
  );

  return (
    <li className="relative grid grid-cols-[48px_minmax(0,1fr)] gap-4 sm:gap-5 pb-5">
      {/* Track segment down to the next node. */}
      <span
        aria-hidden
        className={cn("absolute left-[23px] top-12 bottom-0 w-0.5 rounded-full", walked ? "bg-success" : "bg-border-default")}
      />

      <div
        className={cn(
          "relative z-10 w-12 h-12 rounded-full flex items-center justify-center",
          state === "current" ? "mt-4" : "mt-2",
          nodeStyles[state],
        )}
      >
        {state === "done" ? (
          <Check className="w-6 h-6" strokeWidth={3} />
        ) : state === "locked" ? (
          <Lock className="w-5 h-5" />
        ) : (
          <KindIcon kind={kind} className="w-5 h-5" />
        )}
      </div>

      {state === "current" ? (
        <Link
          href={href}
          className="group block rounded-[14px] bg-surface-card border border-accent/30 shadow-md p-4 sm:p-5 transition-all duration-150 hover:shadow-lg hover:border-accent/60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--focus-ring)]"
        >
          {body}
          <span className="mt-4 inline-flex items-center gap-2 h-10 px-5 rounded-[8px] bg-accent text-white font-semibold text-[14px] shadow-sm transition-colors group-hover:bg-accent-hover">
            Começar lição
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      ) : state === "locked" ? (
        <div aria-disabled className="flex items-start gap-3 rounded-[12px] border border-dashed border-border-default px-4 py-3.5">
          {body}
        </div>
      ) : (
        <Link
          href={href}
          className="group flex items-start gap-3 rounded-[12px] bg-surface-card border border-border-subtle px-4 py-3.5 transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--focus-ring)]"
        >
          {body}
          <span className="shrink-0 self-center inline-flex items-center gap-1 text-[13px] font-semibold text-ink-500 group-hover:text-ink-900 transition-colors">
            {state === "done" ? (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                Revisar
              </>
            ) : (
              <>
                Abrir
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </span>
        </Link>
      )}
    </li>
  );
}

function TrackGoal({ allDone, maxXp, tutorial }: { allDone: boolean; maxXp: number; tutorial: boolean }) {
  return (
    <li className="grid grid-cols-[48px_minmax(0,1fr)] gap-4 sm:gap-5 items-center">
      <div
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center",
          allDone ? "bg-reward text-white ring-[6px] ring-reward-soft" : "bg-surface-sunken text-ink-300",
        )}
      >
        <Trophy className="w-5 h-5" />
      </div>
      <div>
        <p className={cn("font-display font-bold text-[16px] tracking-tight", allDone ? "text-reward-strong" : "text-ink-400")}>
          {allDone ? (tutorial ? "Tutorial concluído!" : "Abertura dominada!") : tutorial ? "Conclua o tutorial" : "Domine a abertura"}
        </p>
        <p className="text-[13px] text-ink-400">{allDone
            ? tutorial
              ? "Agora escolha uma abertura no catálogo."
              : "Continue revisando para manter as linhas frescas."
            : `Até ${maxXp} XP ao concluir a trilha sem erros`}</p>
      </div>
    </li>
  );
}
