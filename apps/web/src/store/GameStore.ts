import { ChessWrapper } from "@/lib/chess";
import { create } from "zustand";

export interface ExerciseMove {
  id: string
  san: string
  fen: string
  parentId: string | null
  isOpponentResponse: boolean
  coachInsights?: { comment?: string; theme?: string } | null
  visualMarkers?: { arrows?: string[]; circles?: string[] } | null
}

interface GameState {
    hasError: boolean;
    setHasError: (newHasError: boolean) => void;
    fen: string;
    setFen: (newFen: string) => void;
    comment: string;
    setComment: (newComment: string) => void;
    initializeGame: (fen: string) => void;
    exerciseMoves: ExerciseMove[];
    currentNodeId: string | null;
    isThinking: boolean;
    isCompleted: boolean;
    playerColor: 'white' | 'black';
    initialFen: string;
    initialComment: string;
    isWaitingForNext: boolean;
    exerciseId: string | null;
    errorCount: number;
    playNextMove: () => void;
    playPreviousMove: () => void;
    setupExercise: (initialFen: string, movesTree: ExerciseMove[], exerciseId?: string, playerColor?: 'white' | 'black', autoPlayFirst?: boolean) => void;
    restartExercise: () => void;
    handlePlayerMove: (orig: string, dest: string) => boolean;
    checkCompletion: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
    hasError: false,
    setHasError: (newHasError) => set({ hasError: newHasError }),

    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
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
    isWaitingForNext: false,
    exerciseId: null,
    errorCount: 0,

    playNextMove: () => {
        const state = get();
        if (state.isCompleted) return;

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

        if (!state.currentNodeId) return;

        const currentMove = state.exerciseMoves.find(m => m.id === state.currentNodeId);
        if (!currentMove) return;

        set({ hasError: false, isCompleted: false, isWaitingForNext: false });

        if (currentMove.parentId === null) {
            set({
                fen: state.initialFen,
                currentNodeId: null,
                comment: state.initialComment
            });
        } else {
            const prevMove = state.exerciseMoves.find(m => m.id === currentMove.parentId);
            if (prevMove) {
                set({
                    fen: prevMove.fen,
                    currentNodeId: prevMove.id,
                    comment: prevMove.coachInsights?.comment || `Move: ${prevMove.san}`
                });

                const nextMove = state.exerciseMoves.find(move => move.parentId === prevMove.id);
                if (nextMove && nextMove.isOpponentResponse) {
                    set({ isWaitingForNext: true });
                }
            }
        }
    },

    setupExercise: (initialFen, movesTree, exerciseId, forcedPlayerColor, autoPlayFirst = false) => {
        let playerColor: 'white' | 'black'
        if (forcedPlayerColor) {
            playerColor = forcedPlayerColor
        } else {
            const isBlackLesson = movesTree.length > 0 && movesTree.find(m => m.parentId === null)?.isOpponentResponse === true;
            playerColor = isBlackLesson ? 'black' : 'white'
        }

        const firstExpectedMove = movesTree.find(m => m.parentId === null);

        const initialComment = autoPlayFirst
            ? "Watch your opponent — they're about to blunder!"
            : (firstExpectedMove?.coachInsights?.comment
                ? `Hint: ${firstExpectedMove.coachInsights.comment}`
                : "Your turn! Find the best move.");

        set({
            initialFen,
            initialComment,
            fen: initialFen,
            exerciseMoves: movesTree,
            currentNodeId: null,
            isThinking: false,
            isCompleted: false,
            playerColor,
            isWaitingForNext: autoPlayFirst,
            comment: initialComment,
            hasError: false,
            exerciseId: exerciseId ?? null,
            errorCount: 0,
        });
    },

    restartExercise: () => {
        const state = get();
        get().setupExercise(state.initialFen, state.exerciseMoves, state.exerciseId ?? undefined);
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
        });

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
                set({ isWaitingForNext: true });
            } else {
                get().checkCompletion();
            }
            return true;
        } else {
            set({ hasError: true, comment: `${moveSan} is legal, but not the theory!`, errorCount: state.errorCount + 1 });
            return false;
        }
    },

    checkCompletion: () => {
        const state = get();

        if (!state.currentNodeId) return;

        const hasChildren = state.exerciseMoves.some(move => move.parentId === state.currentNodeId);

        if (!hasChildren) {
            set({
                isCompleted: true,
                comment: "Congratulations! You have completed the theory for this lesson!"
            });
        }
    }
}));
