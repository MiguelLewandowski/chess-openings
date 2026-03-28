'use client'

import { useGameStore } from "@/store/GameStore"

export default function CoachConsole(){
    const comment = useGameStore(state => state.comment)
     const hasError = useGameStore(state => state.hasError);

    return (
        <div className="flex-1 bg-gray-100 p-4 rounded h-full">
            <h3 className="font-bold text-lg mb-2">Explicações do Mestre</h3>
            <p className={`p-3 rounded ${hasError ? 'bg-red-100 text-red-700' : 'bg-green-50 text-green-800'}`}>
                {comment}
            </p>
        </div>
    );
}