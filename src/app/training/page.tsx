'use client'
import CoachCard from '@/components/gambito/CoachCard';
import { useGameStore } from '@/store/GameStore';

export default function TrainingPage(){

    const {fen, setFen, comment, setComment, hasError, setHasError} = useGameStore();

return (
    <div className="p-8 max-w-md mx-auto space-y-4">
        <CoachCard comment={comment || 'Esperando jogada...'} theme="Desenvolvimento" isError={hasError} />
        
        <button 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={() => {
                setHasError(!hasError); 
                setComment(hasError ? 'Lance normal.' : 'Capivara, perdeste a dama!');
            }}
        >
            Alternar Erro
        </button>
    </div>
    
)

}