import { ChessWrapper } from "@/lib/chess";
import next from "next";
import { create } from "zustand";

interface GameState {
    hasError: boolean;
    setHasError: (newHasError: boolean) => void;
    fen: string;
    setFen: (newFen: string) => void;
    comment: string;
    setComment: (newComment: string) => void;
    initializeGame: (fen: string) => void;
    exerciseMoves: any[];
    currentNodeId: string | null;
    isThinking: boolean;
    isCompleted: boolean;
    setupExercise: (initialFen: string, movesTree: any[]) => void;
    handlePlayerMove: (orig: string, dest: string) => boolean;
    checkCompletion: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
    hasError: false,
    setHasError: (newHasError) => set({ hasError: newHasError }),

    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // Posição inicial por defeito
    setFen: (newFen) => set({ fen: newFen }),

    comment: '',
    setComment: (newComment) => set({ comment: newComment }),

    initializeGame: (fen) => set({ fen, comment: "Sua vez!" }),

    exerciseMoves: [],
    currentNodeId: null,
    isThinking: false,
    isCompleted: false,

    setupExercise: (initialFen, movesTree) => set({
        fen: initialFen,
        exerciseMoves: movesTree,
        currentNodeId: null,
        isThinking: false,
        isCompleted: false,
        comment: "Sua vez! Encontre o melhor lance.",
        hasError: false
    }),

    handlePlayerMove: (orig, dest) => {
        const state = get();
        const moveAttempt = { from: orig, to: dest, promotion: 'q' };
        const result = ChessWrapper.playMove(state.fen, moveAttempt);

        if (!result) {
            set({ hasError: true, comment: "Lance ilegal!" });
            return false;
        }

        const moveSan = result.moveDetails.san;

        const expectedMove = state.exerciseMoves.find(move => {
            return move.san === moveSan && move.parentId === state.currentNodeId;
        })

        if (expectedMove) {
            set({
                fen: result.newFen,
                hasError: false,
                currentNodeId: expectedMove.id,
                comment: expectedMove.coachInsights?.comment?.includes("Erro")
                    ? `Bom lance: ${moveSan}`
                    : (expectedMove.coachInsights?.comment || `Bom lance: ${moveSan}`)
            });


            const updatedState = get();

            const nextMove = updatedState.exerciseMoves.find(move => move.parentId === updatedState.currentNodeId);

            if (nextMove && nextMove.isOpponentResponse) {
                set({ comment: "O oponente esta jogando...", isThinking: true });

                setTimeout(() => {
                    set({
                        fen: nextMove.fen,
                        currentNodeId: nextMove.id,
                        isThinking: false,
                        comment: nextMove.coachInsights?.comment?.includes("Erro")
                            ? `Oponente jogou: ${nextMove.san}. Sua vez!`
                            : (nextMove.coachInsights?.comment || `Oponente jogou: ${nextMove.san}. Sua vez!`),
                        
                    })
                    get().checkCompletion();
                }, 500);
            } else {
                get().checkCompletion();
            }
            return true;
        } else {
            set({ hasError: true, comment: `${moveSan} é legal, mas não é a teoria!` })
            return false;
        }
    },

    
    checkCompletion: () => {
        const state = get();

        if(!state.currentNodeId) return;

        const hasChildren = state.exerciseMoves.some(move => move.parentId === state.currentNodeId);

        if(!hasChildren){
            set({
                isCompleted: true,
                comment: "Parabéns! Você concluiu a teoria desta lição!" 
            })
        }
    }
}));