import Board from "@/components/chess/Board"
import CoachConsole from "@/components/chess/CoachConsole"
import GameInitializer from "@/components/chess/GameInitializer"
import ModeToggle from "@/components/chess/ModeToggle"
import ProgressTracker from "@/components/chess/ProgressTracker"
import { apiClient } from "@/lib/api-client"
import { getSession } from "@/lib/session"
import { ChessWrapper } from "@/lib/chess"
import { notFound, redirect } from "next/navigation"
import { ChevronRight, GraduationCap } from "lucide-react"
import Link from "next/link"
import { PageBody, PageHeader } from "@/components/layout/Page"
import { CARD_KIND_LABEL, LessonCards } from "@/components/chess/LessonCards"
import { Badge } from "@/components/ui"
import { lessonShortTitle } from "@/lib/profile"

export default async function LessonPage({
    params,
    searchParams,
}: {
    params: Promise<{ lessonId: string }>
    // `exercise` opens a specific exercise (the link reviews use); `mode` switches between
    // the lesson's theory and main practice.
    searchParams: Promise<{ mode?: string; exercise?: string }>
}) {
    const resolvedParams = await params
    const resolvedSearch = await searchParams
    const session = await getSession()
    // Protected route: send anonymous users to login instead of a raw 404.
    if (!session) redirect('/login')

    const lesson = await apiClient.lessons.findById(resolvedParams.lessonId, session.apiToken)
    if (!lesson) notFound()

    const mode = resolvedSearch.mode === 'theory' ? 'THEORY' : 'PRACTICE'

    const theoryExercise = lesson.exercises.find(e => e.type === 'THEORY' && !e.cardKind)
    const practiceExercise = lesson.exercises.find(e => e.type === 'PRACTICE' && !e.cardKind)
    const cards = lesson.exercises.filter(e => e.cardKind)
    const requested = resolvedSearch.exercise ? lesson.exercises.find(e => e.id === resolvedSearch.exercise) : undefined
    const selectedExercise =
        requested ?? (mode === 'THEORY' ? (theoryExercise ?? practiceExercise) : (practiceExercise ?? theoryExercise))
    const isCard = Boolean(selectedExercise?.cardKind)

    const currentLessonIndex = lesson.opening.lessons.findIndex(l => l.id === lesson.id)
    const nextLesson = lesson.opening.lessons[currentLessonIndex + 1]
    // After a card, the next card of the lesson; after the last one, back to its practice.
    const nextCard = isCard ? cards[cards.findIndex(c => c.id === selectedExercise?.id) + 1] : undefined
    const next = isCard
        ? nextCard
            ? { url: `/lessons/${lesson.id}?exercise=${nextCard.id}`, label: 'Próximo cartão' }
            : { url: `/lessons/${lesson.id}`, label: 'Voltar à lição' }
        : { url: nextLesson ? `/lessons/${nextLesson.id}` : `/openings/${lesson.opening.slug}`, label: 'Próxima lição' }

    if (!selectedExercise) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="bg-surface-card border border-border-default rounded-[16px] p-8 max-w-md w-full text-center shadow-md">
                    <h2 className="font-display font-bold text-[20px] tracking-tight text-ink-900 mb-2">Lição incompleta</h2>
                    <p className="text-ink-500 text-[14px]">Esta lição ainda não tem exercícios configurados.</p>
                    <Link href={`/openings/${lesson.opening.slug}`} className="mt-6 inline-flex items-center gap-2 text-accent text-[14px] font-semibold hover:underline underline-offset-4">
                        <ChevronRight className="w-4 h-4 rotate-180" />
                        Voltar à trilha
                    </Link>
                </div>
            </div>
        )
    }

    const initialFen = selectedExercise.initialFen ?? ChessWrapper.STARTING_FEN

    return (
        <div className="flex-1">
            <GameInitializer
                initialFen={initialFen}
                movesTree={selectedExercise.moves}
                exerciseId={selectedExercise.id}
                intro={selectedExercise.description}
            />
            <ProgressTracker />

            <PageHeader>
                <nav className="flex items-center gap-1.5 text-[13px] min-w-0" aria-label="Breadcrumb">
                    <Link
                        href="/openings"
                        className="text-ink-500 hover:text-ink-900 transition-colors shrink-0 hidden md:inline font-medium"
                    >
                        Galeria
                    </Link>
                    <ChevronRight className="w-3.5 h-3.5 text-ink-300 shrink-0 hidden md:inline" />
                    <Link
                        href={`/openings/${lesson.opening.slug}`}
                        className="text-ink-500 hover:text-ink-900 transition-colors truncate max-w-28 sm:max-w-48 font-medium hidden sm:inline"
                    >
                        {lesson.opening.name}
                    </Link>
                    <ChevronRight className="w-3.5 h-3.5 text-ink-300 shrink-0 hidden sm:inline" />
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="bg-accent-soft p-1.5 rounded-[6px] text-accent shrink-0">
                            <GraduationCap className="w-4 h-4" />
                        </div>
                        <h1 className="font-bold tracking-tight text-ink-900 truncate text-[14px]">
                            {lessonShortTitle(lesson.title, lesson.opening.name)}
                        </h1>
                    </div>
                </nav>

                {isCard && selectedExercise.cardKind ? (
                    <div className="flex items-center gap-2 shrink-0">
                        <Badge tone={selectedExercise.cardKind === 'TRAP' ? 'danger' : 'reward'}>
                            {CARD_KIND_LABEL[selectedExercise.cardKind]}
                        </Badge>
                        <Link
                            href={`/lessons/${lesson.id}`}
                            className="hidden sm:inline text-[13px] font-semibold text-accent hover:underline underline-offset-4"
                        >
                            Voltar à lição
                        </Link>
                    </div>
                ) : (
                    <ModeToggle
                        currentMode={mode}
                        hasTheory={!!theoryExercise}
                        hasPractice={!!practiceExercise}
                    />
                )}
            </PageHeader>

            {/* Side by side once the page is wide enough for a useful board next to the coach.
                The board grows with the space but never past the visible height (the bars
                above it add 56px below lg), so the whole position always fits on screen. */}
            <PageBody className="grid grid-cols-1 gap-6 @4xl:grid-cols-[minmax(0,1fr)_minmax(340px,420px)] @7xl:grid-cols-[minmax(0,1fr)_480px] @4xl:gap-8 @4xl:items-start">
                <div className="flex justify-center min-w-0">
                    <div className="w-full max-w-[calc(100dvh-13.5rem)] lg:max-w-[calc(100dvh-10rem)] aspect-square rounded-[16px] overflow-hidden ring-1 ring-border-default shadow-xl bg-surface-card">
                        <Board />
                    </div>
                </div>

                <div className="min-w-0 @4xl:sticky @4xl:top-24 flex flex-col gap-4">
                    <CoachConsole nextLessonUrl={next.url} nextLabel={next.label} />
                    <LessonCards lessonId={lesson.id} cards={cards} activeId={selectedExercise.id} />
                </div>
            </PageBody>
        </div>
    )
}
