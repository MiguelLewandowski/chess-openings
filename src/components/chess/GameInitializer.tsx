'use client'

import { useGameStore } from "@/store/GameStore";
import { useRef } from "react"


export default function GameInitializer({ initialFen, movesTree }: { initialFen: string, movesTree: any[] }){
    const isInitialized = useRef(false);

    const setupExercise = useGameStore(state => state.setupExercise);

    if(!isInitialized.current) {
        setupExercise(initialFen, movesTree);
        isInitialized.current = true;
    }

    return null;
}