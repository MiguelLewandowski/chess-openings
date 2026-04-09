'use client'

import { useGameStore } from "@/store/GameStore";
import { useEffect, useRef } from "react"

export default function GameInitializer({ initialFen, movesTree }: { initialFen: string, movesTree: any[] }){
    const isInitialized = useRef(false);
    const setupExercise = useGameStore(state => state.setupExercise);

    useEffect(() => {
        // Ao usar useEffect, o Zustand será atualizado APÓS o componente GameInitializer renderizar,
        // evitando o erro "Cannot update a component while rendering a different component".
        setupExercise(initialFen, movesTree);
        isInitialized.current = true;
    }, [initialFen, movesTree, setupExercise]);

    return null;
}