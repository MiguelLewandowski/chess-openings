'use client'

import { useGameStore, ExerciseMove } from "@/store/GameStore";
import { useEffect } from "react"

export default function GameInitializer({ initialFen, movesTree, exerciseId, playerColor }: {
    initialFen: string
    movesTree: ExerciseMove[]
    exerciseId?: string
    playerColor?: 'white' | 'black'
}){
    const setupExercise = useGameStore(state => state.setupExercise);

    useEffect(() => {
        setupExercise(initialFen, movesTree, exerciseId, playerColor);
    }, [initialFen, movesTree, exerciseId, playerColor, setupExercise]);

    return null;
}
