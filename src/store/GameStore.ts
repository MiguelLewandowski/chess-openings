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
    playerColor: 'white' | 'black';
    initialFen: string; // NOVO: para o player conseguir voltar ao início
    initialComment: string; // NOVO: para restaurar o comentário inicial
    isWaitingForNext: boolean; // Flag para pausar antes do lance do oponente
    playNextMove: () => void; // NOVO: Avança lance
    playPreviousMove: () => void; // NOVO: Recua lance
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

    initializeGame: (fen) => set({ fen, comment: "Your turn!" }),

    exerciseMoves: [],
    currentNodeId: null,
    isThinking: false,
    isCompleted: false,
    playerColor: 'white',
    initialFen: '',
    initialComment: '',
    isWaitingForNext: false, // Inicializa como false

    playNextMove: () => {
        const state = get();
        if (state.isCompleted) return;

        // 1. Se estivermos parados à espera que o oponente jogue (botão Continuar)
        if (state.isWaitingForNext) {
            const nextMove = state.exerciseMoves.find(move => move.parentId === state.currentNodeId);
            if (nextMove && nextMove.isOpponentResponse) {
                set({ isWaitingForNext: false, isThinking: true });

                setTimeout(() => {
                    set({
                        fen: nextMove.fen,
                        currentNodeId: nextMove.id,
                        isThinking: false,
                        comment: nextMove.coachInsights?.comment?.includes("Erro")
                            ? `Opponent played: ${nextMove.san}. Your turn!`
                            : (nextMove.coachInsights?.comment || `Opponent played: ${nextMove.san}. Your turn!`),
                    });
                    get().checkCompletion();
                }, 300);
            }
            return;
        }

        // 2. Se for a nossa vez (Auto-play do lance correto para saltar)
        const nextMove = state.exerciseMoves.find(move => move.parentId === state.currentNodeId);
        if (nextMove && !nextMove.isOpponentResponse) {
            set({
                fen: nextMove.fen,
                hasError: false,
                currentNodeId: nextMove.id,
                comment: nextMove.coachInsights?.comment?.includes("Erro")
                    ? `Good move: ${nextMove.san}`
                    : (nextMove.coachInsights?.comment || `Good move: ${nextMove.san}`)
            });

            // Verificar se o a seguir é o oponente para bloquear e pedir "Continuar"
            const nextNextMove = get().exerciseMoves.find(move => move.parentId === nextMove.id);
            if (nextNextMove && nextNextMove.isOpponentResponse) {
                set({ isWaitingForNext: true });
            } else {
                get().checkCompletion();
            }
        }
    },

    playPreviousMove: () => {
        const state = get();
        
        // Se ainda não houve nenhum lance, não há como recuar
        if (!state.currentNodeId) return;

        const currentMove = state.exerciseMoves.find(m => m.id === state.currentNodeId);
        if (!currentMove) return;

        // Limpa o estado de erro ou de lição concluída
        set({ hasError: false, isCompleted: false, isWaitingForNext: false });

        if (currentMove.parentId === null) {
            // Recuamos para a posição inicial exata
            set({
                fen: state.initialFen,
                currentNodeId: null,
                comment: state.initialComment
            });
        } else {
            // Recuamos um nó na árvore
            const prevMove = state.exerciseMoves.find(m => m.id === currentMove.parentId);
            if (prevMove) {
                set({
                    fen: prevMove.fen,
                    currentNodeId: prevMove.id,
                    comment: prevMove.coachInsights?.comment || `Move: ${prevMove.san}`
                });

                // Se o que vier a seguir for do oponente, garantimos que pausamos de novo no futuro
                const nextMove = state.exerciseMoves.find(move => move.parentId === prevMove.id);
                if (nextMove && nextMove.isOpponentResponse) {
                    set({ isWaitingForNext: true });
                }
            }
        }
    },

    setupExercise: (initialFen, movesTree) => {
        // Descobre a cor do jogador: se o primeiro lance é do oponente, o jogador é as pretas!
        const isBlackLesson = movesTree.length > 0 && movesTree.find((m: any) => m.parentId === null)?.isOpponentResponse === true;
          const firstExpectedMove = movesTree.find((m: any) => m.parentId === null);
        
        // Pega o comentário desse lance, ou usa o fallback
        const initialComment = firstExpectedMove?.coachInsights?.comment 
            ? `Hint: ${firstExpectedMove.coachInsights.comment}` 
            : "Your turn! Find the best move.";
        set({
            initialFen,
            initialComment,
            fen: initialFen,
            exerciseMoves: movesTree,
            currentNodeId: null,
            isThinking: false,
            isCompleted: false,
            playerColor: isBlackLesson ? 'black' : 'white',
            isWaitingForNext: false, // Reseta a flag ao iniciar
            comment: initialComment,
            hasError: false
        });
    },

    handlePlayerMove: (orig, dest) => {
        const state = get();
        const moveAttempt = { from: orig, to: dest, promotion: 'q' };
        const result = ChessWrapper.playMove(state.fen, moveAttempt);

        if (!result) {
            set({ hasError: true, comment: "Illegal move!" });
            return false;
        }

        const moveSan = result.moveDetails.san;

        const expectedMove = state.exerciseMoves.find(move => {
            return move.san === moveSan && move.parentId === state.currentNodeId;
        })

          if (expectedMove) {
             console.log("DADOS DO LANCE:", expectedMove);
             console.log("INSIGHTS:", expectedMove.coachInsights);
        }

        if (expectedMove) {
            set({
                fen: result.newFen,
                hasError: false,
                currentNodeId: expectedMove.id,
                comment: expectedMove.coachInsights?.comment?.includes("Erro")
                    ? `Good move: ${moveSan}`
                    : (expectedMove.coachInsights?.comment || `Good move: ${moveSan}`)
            });

            const updatedState = get();
            const nextMove = updatedState.exerciseMoves.find(move => move.parentId === updatedState.currentNodeId);

            if (nextMove && nextMove.isOpponentResponse) {
                // Em vez de jogar o lance do oponente imediatamente (atropelando as setas e os comentários do jogador),
                // ativamos a flag isWaitingForNext para o utilizador poder ler a explicação calmamente.
                set({ isWaitingForNext: true });
            } else {
                get().checkCompletion();
            }
            return true;
        } else {
            set({ hasError: true, comment: `${moveSan} is legal, but not the theory!` })
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
                comment: "Congratulations! You have completed the theory for this lesson!" 
            })
        }
    }
}));