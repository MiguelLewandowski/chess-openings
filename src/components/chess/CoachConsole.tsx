'use client'

import { useGameStore } from "@/store/GameStore"

export default function CoachConsole(){
 const { comment, hasError, isCompleted } = useGameStore();

     if (isCompleted) {
        return (
            <div className="flex-1 bg-green-100 p-8 rounded text-center h-full flex flex-col justify-center">
                <h3 className="text-2xl font-bold text-green-800 mb-4">🎉 Lição Concluída!</h3>
                <p className="text-green-700 mb-6">{comment}</p>
                <button className="bg-green-600 text-white px-6 py-2 rounded shadow hover:bg-green-700 transition">
                    Voltar para a Trilha
                </button>
            </div>
        )
    }

    return (
        <div className="flex-1 bg-gray-100 p-4 rounded h-full">
            <h3 className="font-bold text-lg mb-2">Explicações do Mestre</h3>
            <p className={`p-3 rounded ${hasError ? 'bg-red-100 text-red-700' : 'bg-green-50 text-green-800'}`}>
                {comment}
            </p>
        </div>
    );
}