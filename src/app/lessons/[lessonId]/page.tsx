import Board from "@/components/chess/Board"
import CoachConsole from "@/components/chess/CoachConsole"
import GameInitializer from "@/components/chess/GameInitializer"
import { getLessonById } from "@/services/lesson.service"
import { notFound } from "next/navigation"
import { ChevronLeft, GraduationCap } from "lucide-react"
import Link from "next/link"

export default async function LessonPage({ params }: { params: { lessonId: string } }) {
    const resolvedParams = await params
    const lesson = await getLessonById(resolvedParams.lessonId)
    
    if (!lesson) {
        notFound()
    }

    const testFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

    const firstExercise = lesson.exercises[0];
    
    // Calcular a próxima lição
    const currentLessonIndex = lesson.opening.lessons.findIndex(l => l.id === lesson.id);
    const nextLesson = lesson.opening.lessons[currentLessonIndex + 1];
    const nextLessonUrl = nextLesson ? `/lessons/${nextLesson.id}` : `/openings/${lesson.opening.slug}`;

    if (!firstExercise) {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-8">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center">
                    <h2 className="text-xl font-bold tracking-tight mb-2">Incomplete Lesson</h2>
                    <p className="text-muted-foreground">This lesson does not have any configured exercises yet.</p>
                    <Link href={`/openings/${lesson.opening.slug}`} className="mt-6 inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                        Back to Path
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-violet-500/30">
            <GameInitializer initialFen={testFen} movesTree={firstExercise.moves} />
            
            {/* Header da Lição */}
            <header className="border-b border-white/5 bg-slate-950/80 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
                    <Link 
                        href={`/openings/${lesson.opening.slug}`} 
                        className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
                    >
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 transition-all">
                            <ChevronLeft className="w-4 h-4" />
                        </div>
                        <span className="hidden sm:inline">Back</span>
                    </Link>
                    
                    <div className="flex items-center gap-3">
                        <div className="bg-violet-500/10 p-2 rounded-lg text-violet-400">
                            <GraduationCap className="w-5 h-5" />
                        </div>
                        <h1 className="font-bold tracking-tight text-slate-100">{lesson.title}</h1>
                    </div>
                    
                    <div className="w-16"></div> {/* Spacer for centering */}
                </div>
            </header>

            {/* Conteúdo Principal */}
            <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                    
                    {/* Coluna da Esquerda: Tabuleiro */}
                    <div className="lg:col-span-7 flex flex-col items-center justify-center">
                        <div className="w-full max-w-[500px] aspect-square rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl shadow-black/50 bg-slate-900">
                            <Board />
                        </div>
                    </div>

                    {/* Coluna da Direita: Console do Treinador */}
                    <div className="lg:col-span-5 h-full flex flex-col justify-center">
                        <CoachConsole nextLessonUrl={nextLessonUrl} />
                    </div>
                    
                </div>
            </main>
        </div>
    )
}