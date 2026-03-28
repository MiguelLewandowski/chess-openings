import Board from "@/components/chess/Board"
import GameInitializer from "@/components/chess/GameInitializer"
import { getLessonById } from "@/services/lesson.service"
import { notFound } from "next/navigation"

export default async function LessonPage({ params }: { params: { lessonId: string } }) {
    const resolvedParams = await params
    const lesson = await getLessonById(resolvedParams.lessonId)
    if (!lesson) {
        notFound()
    }

    const testFen = "r1bqkbnr/pp1ppppp/2n5/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3"

    return (
        <div className="flex flex-col md:flex-row gap-8 p-8">

            <GameInitializer initialFen={testFen} />x
            {/* Lado Esquerdo: O Tabuleiro */}
            <div className="flex-1">
                <h2>{lesson.title}</h2>
                <Board />
            </div>

            {/* Lado Direito: A "consola" do treinador (placeholder) */}
            <div className="flex-1 bg-gray-100 p-4 rounded">
                <h3>Explicações do Mestre</h3>
                <p>Os comentários vão aparecer aqui...</p>
            </div>
        </div>
    )
}