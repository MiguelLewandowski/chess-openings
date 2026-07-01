'use client'

import { useGameStore, ExerciseMove } from "@/store/GameStore";
import { useEffect, useRef } from "react"

export default function GameInitializer({ initialFen, movesTree, exerciseId, playerColor }: {
    initialFen: string
    movesTree: ExerciseMove[]
    exerciseId?: string
    playerColor?: 'white' | 'black'
}){
    const setupExercise = useGameStore(state => state.setupExercise);
    const initializedFor = useRef<string | undefined>(undefined);

    useEffect(() => {
        // Only (re)initialize when the exercise identity changes. Recording a
        // completion runs a Server Action, which refreshes the page and hands us
        // a new movesTree reference; without this guard that new reference would
        // re-run setupExercise and reset the board to the start right after the
        // "lesson completed" screen appears.
        const key = exerciseId ?? initialFen;
        if (initializedFor.current === key) return;
        initializedFor.current = key;
        setupExercise(initialFen, movesTree, exerciseId, playerColor);
    }, [exerciseId, initialFen, movesTree, playerColor, setupExercise]);

    return null;
}
