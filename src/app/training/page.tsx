'use client'
import CoachCard from '@/components/gambito/CoachCard';
import { useState } from 'react';

export default function TrainingPage(){
const [hasError, setHasError] = useState(false);    
const [commentText, setCommentText] = useState('');
return (
    <div className="p-8 max-w-md mx-auto space-y-4">
        <CoachCard comment={commentText || 'Esperando jogada...'} theme="Desenvolvimento" isError={hasError} />
        
        <button 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={() => {
                setHasError(!hasError); 
                setCommentText(hasError ? 'Lance normal.' : 'Capivara, perdeste a dama!');
            }}
        >
            Alternar Erro
        </button>
    </div>
    
)

}