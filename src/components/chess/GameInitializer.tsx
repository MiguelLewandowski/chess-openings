'use client'

import { useGameStore } from "@/store/GameStore";
import { useRef } from "react"

export default function GameInitializer({initialFen} : {initialFen: string}){
    const isInitialized = useRef(false);

    const initializeGame = useGameStore(state => state.initializeGame);

    if(!isInitialized.current) {
        initializeGame(initialFen);
        isInitialized.current = true;
    }

    return null;
}