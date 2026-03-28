import { create } from "zustand";

interface GameState {
    hasError: boolean;
    setHasError: (newHasError: boolean) => void;
    fen: string;
    setFen: (newFen: string) => void;
    comment: string;
    setComment: (newComment: string) => void;
    initializeGame: (fen: string) => void;
}

export const useGameStore = create<GameState>((set) => ({
    hasError: false,
    setHasError: (newHasError) => set({ hasError: newHasError }),
    
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // Posição inicial por defeito
    setFen: (newFen) => set({ fen: newFen }),
    
    comment: '',
    setComment: (newComment) => set({ comment: newComment }),

    initializeGame: (fen) => set({ fen, comment: "Sua vez!" }),
}));