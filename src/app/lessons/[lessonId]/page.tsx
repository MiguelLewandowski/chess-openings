import Board from "@/components/chess/Board"
import CoachConsole from "@/components/chess/CoachConsole"
import GameInitializer from "@/components/chess/GameInitializer"
import { getLessonById } from "@/services/lesson.service"
import { notFound } from "next/navigation"

export default async function LessonPage({ params }: { params: { lessonId: string } }) {
    const resolvedParams = await params
    const lesson = await getLessonById(resolvedParams.lessonId)
    if (!lesson) {
        notFound()
    }

    const testFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

    const firstExercise = lesson.exercises[0];
    if (!firstExercise) {
        return <div>Esta lição não tem exercícios.</div>;
    }

    return (
        <div className="flex flex-col md:flex-row gap-8 p-8">

            <GameInitializer initialFen={testFen} movesTree={firstExercise.moves} />
            {/* Lado Esquerdo: O Tabuleiro */}
            <div className="flex-1">
                <h2>{lesson.title}</h2>
                <Board />
            </div>

           <CoachConsole/>
        </div>
    )
}