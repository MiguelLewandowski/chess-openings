import Board from "@/components/chess/Board"
import CoachConsole from "@/components/chess/CoachConsole"
import GameInitializer from "@/components/chess/GameInitializer"
import ModeToggle from "@/components/chess/ModeToggle"
import ProgressTracker from "@/components/chess/ProgressTracker"
import { apiClient } from "@/lib/api-client"
import { getSession } from "@/lib/session"
import { ChessWrapper } from "@/lib/chess"
import { notFound } from "next/navigation"
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
    const lesson = session ? await apiClient.lessons.findById(resolvedParams.lessonId, session.apiToken) : null

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
            <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-8">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center">
                    <h2 className="text-xl font-bold tracking-tight mb-2">Lição incompleta</h2>
                    <p className="text-slate-400">Esta lição ainda não tem exercícios configurados.</p>
                    <Link href={`/openings/${lesson.opening.slug}`} className="mt-6 inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 transition-colors">
                        <ChevronRight className="w-4 h-4 rotate-180" />
                        Voltar à trilha
                    </Link>
                </div>
            </div>
        )
    }

    const initialFen = selectedExercise.initialFen ?? ChessWrapper.STARTING_FEN

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-violet-500/30">
            <GameInitializer
                initialFen={initialFen}
                movesTree={selectedExercise.moves}
                exerciseId={selectedExercise.id}
            />
            <ProgressTracker />

            {/* Header */}
            <header className="border-b border-white/5 bg-slate-950/80 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">

                    <nav className="flex items-center gap-1.5 text-sm min-w-0" aria-label="Breadcrumb">
                        <Link
                            href="/openings"
                            className="text-slate-400 hover:text-slate-200 transition-colors shrink-0 hidden sm:inline"
                        >
                            Galeria
                        </Link>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0 hidden sm:inline" />
                        <Link
                            href={`/openings/${lesson.opening.slug}`}
                            className="text-slate-400 hover:text-slate-200 transition-colors truncate max-w-24 sm:max-w-48"
                        >
                            {lesson.opening.name}
                        </Link>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="bg-violet-500/10 p-1.5 rounded-lg text-violet-400 shrink-0">
                                <GraduationCap className="w-4 h-4" />
                            </div>
                            <h1 className="font-bold tracking-tight text-slate-100 truncate">{lesson.title}</h1>
                        </div>
                    </nav>

                    <ModeToggle
                        currentMode={mode}
                        hasTheory={!!theoryExercise}
                        hasPractice={!!practiceExercise}
                    />
                </div>
            </header>

            {/* Conteúdo Principal */}
            <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

                    <div className="lg:col-span-7 flex flex-col items-center justify-center">
                        <div className="w-full max-w-lg aspect-square rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl shadow-black/50 bg-slate-900">
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
