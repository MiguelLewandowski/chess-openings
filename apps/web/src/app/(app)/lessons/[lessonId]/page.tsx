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

export default async function LessonPage({
    params,
    searchParams,
}: {
    params: Promise<{ lessonId: string }>
    searchParams: Promise<{ mode?: string }>
}) {
    const resolvedParams = await params
    const resolvedSearch = await searchParams
    const session = await getSession()
    // Protected route: send anonymous users to login instead of a raw 404.
    if (!session) redirect('/login')

    const lesson = await apiClient.lessons.findById(resolvedParams.lessonId, session.apiToken)
    if (!lesson) notFound()

    const mode = resolvedSearch.mode === 'theory' ? 'THEORY' : 'PRACTICE'

    const theoryExercise = lesson.exercises.find(e => e.type === 'THEORY')
    const practiceExercise = lesson.exercises.find(e => e.type === 'PRACTICE')
    const selectedExercise = mode === 'THEORY' ? (theoryExercise ?? practiceExercise) : (practiceExercise ?? theoryExercise)

    const currentLessonIndex = lesson.opening.lessons.findIndex(l => l.id === lesson.id)
    const nextLesson = lesson.opening.lessons[currentLessonIndex + 1]
    const nextLessonUrl = nextLesson ? `/lessons/${nextLesson.id}` : `/openings/${lesson.opening.slug}`

    if (!selectedExercise) {
        return (
            <div className="min-h-screen bg-surface-app flex items-center justify-center p-8">
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
        <div className="min-h-screen bg-surface-app font-body">
            <GameInitializer
                initialFen={initialFen}
                movesTree={selectedExercise.moves}
                exerciseId={selectedExercise.id}
            />
            <ProgressTracker />

            <header className="border-b border-border-subtle bg-surface-card/90 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">

                    <nav className="flex items-center gap-1.5 text-[13px] min-w-0" aria-label="Breadcrumb">
                        <Link
                            href="/openings"
                            className="text-ink-500 hover:text-ink-900 transition-colors shrink-0 hidden sm:inline font-medium"
                        >
                            Galeria
                        </Link>
                        <ChevronRight className="w-3.5 h-3.5 text-ink-300 shrink-0 hidden sm:inline" />
                        <Link
                            href={`/openings/${lesson.opening.slug}`}
                            className="text-ink-500 hover:text-ink-900 transition-colors truncate max-w-24 sm:max-w-48 font-medium"
                        >
                            {lesson.opening.name}
                        </Link>
                        <ChevronRight className="w-3.5 h-3.5 text-ink-300 shrink-0" />
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="bg-accent-soft p-1.5 rounded-[6px] text-accent shrink-0">
                                <GraduationCap className="w-4 h-4" />
                            </div>
                            <h1 className="font-bold tracking-tight text-ink-900 truncate text-[14px]">{lesson.title}</h1>
                        </div>
                    </nav>

                    <ModeToggle
                        currentMode={mode}
                        hasTheory={!!theoryExercise}
                        hasPractice={!!practiceExercise}
                    />
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

                    <div className="lg:col-span-7 flex flex-col items-center justify-center">
                        <div className="w-full max-w-lg aspect-square rounded-[16px] overflow-hidden ring-1 ring-border-default shadow-xl bg-surface-card">
                            <Board />
                        </div>
                    </div>

                    <div className="lg:col-span-5 h-full flex flex-col justify-center">
                        <CoachConsole nextLessonUrl={nextLessonUrl} />
                    </div>

                </div>
            </main>
        </div>
    )
}
