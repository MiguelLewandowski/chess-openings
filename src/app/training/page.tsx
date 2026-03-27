'use client'
import Board from '@/components/chess/Board';
import CoachCard from '@/components/gambito/CoachCard';
import { useGameStore } from '@/store/GameStore';
import { useEffect } from 'react';
import { ChessWrapper } from '@/lib/chess';
import { getExpectedResponse } from '@/app/actions/game.actions';

export default function TrainingPage() {

    const { fen, setFen, comment, setComment, hasError, setHasError } = useGameStore();

    // Efeito para simular a resposta do computador
    useEffect(() => {
        // 1. Verificamos se é a vez das pretas ('b')
        const isBlackTurn = fen.split(' ')[1] === 'b';

        if (isBlackTurn) {
            const playGambitoMove = async () => {
                try {
                    const expectedMove = await getExpectedResponse(fen);
                    if (expectedMove) {
                        setFen(expectedMove.fen);

                        const comment = (expectedMove.coachInsights as any)?.comment || `O mestre responde com: ${expectedMove.san}`;
                        setComment(comment)
                    } else {
                        setComment("Fim da linha teorica. Parabéns!")
                    }
                } catch (error) {
                    console.error("Erro ao buscar resposta do Mestre:", error)
                    setComment("O mestre Gambito esta a pensar demasiado")
                }
            }
            const timer = setTimeout(() => {
                playGambitoMove()
            }, 800)

            return () => clearTimeout(timer)
        }
    }, [fen, setFen, setComment]);

    return (
        <div className="p-8 max-w-md mx-auto space-y-4">
            <CoachCard comment={comment || 'Esperando jogada...'} theme="Desenvolvimento" isError={hasError} />

            <Board />

            <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={() => {
                    setHasError(!hasError);
                    setComment(hasError ? 'Lance normal.' : 'Capivara, perdeste a dama!');
                }}
            >
                Alternar Erro
            </button>
        </div>

    )

}