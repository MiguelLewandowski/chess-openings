import Link from "next/link";
import { ArrowRight, Check, Route } from "lucide-react";
import { OPENING_STYLE_LABELS, type OpeningPathSummary, type OpeningSummary } from "@chess-openings/domain";
import { apiClient } from "@/lib/api-client";
import { chooseOpeningPath } from "@/app/actions/opening.actions";
import { STYLE_PITCH } from "@/lib/opening-paths";
import { buttonClasses, Card } from "@/components/ui";
import { PageBody } from "@/components/layout/Page";
import { cn } from "@/lib/cn";
import { OpeningHeader } from "./OpeningHeader";
import { PathSubmitButton } from "./PathSubmitButton";

const cardClasses =
  "group flex h-full w-full flex-col text-left rounded-[14px] bg-surface-card border p-5 sm:p-6 transition-all duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--focus-ring)]";

// Where the student picks how to play a family: the same first moves, a different choice of
// our own moves. Every path keeps its progress, so the screen shows how far each one went.
export async function PathChoice({ opening, token }: { opening: OpeningSummary; token: string | null }) {
  const family = opening.family ?? opening.slug;
  const current = opening.chosenStyle;
  const trackHref = `/openings/${encodeURIComponent(family)}`;

  const completed = token
    ? await Promise.all(opening.paths.map((path) => apiClient.progress.completedLessons(path.id, token)))
    : opening.paths.map(() => []);

  return (
    <div className="flex-1">
      <OpeningHeader
        backHref={current ? trackHref : "/openings"}
        backLabel={current ? "Voltar à trilha" : "Voltar à galeria"}
        subtitle={current ? "Trocar caminho" : "Escolha seu caminho"}
      >
        {opening.name}
      </OpeningHeader>

      <PageBody className="mx-auto w-full max-w-4xl">
        <div className="max-w-2xl">
          <h2 className="font-display font-extrabold text-[22px] sm:text-[26px] tracking-tight text-ink-900 leading-tight">
            {current ? "Quer seguir outro caminho?" : "Como você quer jogar esta abertura?"}
          </h2>
          <p className="mt-2 text-[14px] sm:text-[15px] text-ink-500 leading-relaxed">
            {current
              ? "Trocar não apaga nada: o progresso de cada caminho fica guardado, e as revisões passam a ser só do caminho novo."
              : `As mesmas primeiras jogadas, ${opening.paths.length} jeitos de continuar. Dá para trocar depois: o progresso de cada caminho fica guardado.`}
          </p>
        </div>

        <ul aria-label="Caminhos" className="mt-6 sm:mt-8 grid grid-cols-1 @3xl:grid-cols-3 gap-4">
          {opening.paths.map((path, index) => (
            <li key={path.id}>
              {path.style === current ? (
                <Link href={trackHref} className={cn(cardClasses, "border-accent/50 shadow-md hover:border-accent")}>
                  <PathCardBody path={path} done={completed[index].length} isCurrent />
                </Link>
              ) : (
                <form action={chooseOpeningPath.bind(null, family, path.style, current !== null)} className="h-full">
                  <PathSubmitButton className={cn(cardClasses, "border-border-subtle shadow-sm hover:border-accent/50 hover:shadow-md cursor-pointer")}>
                    <PathCardBody path={path} done={completed[index].length} isCurrent={false} />
                  </PathSubmitButton>
                </form>
              )}
            </li>
          ))}
        </ul>
      </PageBody>
    </div>
  );
}

function PathCardBody({ path, done, isCurrent }: { path: OpeningPathSummary; done: number; isCurrent: boolean }) {
  const total = path.lessons.length;
  return (
    <>
      <span className="flex items-center justify-between gap-3">
        <span className="font-display font-bold text-[19px] tracking-tight text-ink-900">{OPENING_STYLE_LABELS[path.style]}</span>
        {isCurrent && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border bg-accent-soft text-accent border-accent/20">
            <Check className="w-3 h-3" strokeWidth={3} aria-hidden />
            Caminho atual
          </span>
        )}
      </span>
      <span className="mt-2 block flex-1 text-[14px] text-ink-500 leading-relaxed">{STYLE_PITCH[path.style]}</span>
      <span className="mt-4 block text-[12px] font-medium text-ink-400">
        {total} {total === 1 ? "lição" : "lições"}
        {done > 0 && ` · ${done} ${done === 1 ? "feita" : "feitas"}`}
      </span>
      <span className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-accent">
        {isCurrent ? "Continuar neste caminho" : "Seguir este caminho"}
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </span>
    </>
  );
}

// Above the track of a family path: which path it is and the way to switch. A path opened by
// its own slug may not be the one the student follows, so it offers to make it theirs.
export function PathBar({ opening }: { opening: OpeningSummary }) {
  const family = opening.family;
  const style = opening.style;
  if (!family || !style) return null;

  const isActive = opening.chosenStyle === style;
  const isFamilyEntry = opening.slug === family;

  return (
    <Card elevation="flat" className="mb-4 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <span className="mt-0.5 w-9 h-9 shrink-0 rounded-full bg-accent-soft text-accent flex items-center justify-center" aria-hidden>
          <Route className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-400">
            {isActive || isFamilyEntry ? "Seu caminho" : "Caminho"}
          </p>
          <p className="font-display font-bold text-[16px] tracking-tight text-ink-900">{OPENING_STYLE_LABELS[style]}</p>
          <p className="text-[13px] text-ink-500 leading-relaxed">
            {isActive || isFamilyEntry
              ? STYLE_PITCH[style]
              : opening.chosenStyle
                ? `Seu caminho nesta abertura é o ${OPENING_STYLE_LABELS[opening.chosenStyle]}: só ele volta nas revisões.`
                : "Você ainda não escolheu um caminho nesta abertura."}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 sm:shrink-0">
        {!isActive && !isFamilyEntry && (
          <form action={chooseOpeningPath.bind(null, family, style, false)}>
            <PathSubmitButton className={buttonClasses({ variant: "primary", size: "sm" })}>Seguir este caminho</PathSubmitButton>
          </form>
        )}
        <Link href={`/openings/${encodeURIComponent(family)}?trocar=1`} className={buttonClasses({ variant: "secondary", size: "sm" })}>
          Trocar caminho
        </Link>
      </div>
    </Card>
  );
}
