'use client';
import { useGameStore } from '@/store/GameStore';
import { useEffect, useRef } from 'react';

import { Chessground } from 'chessground';
import { Api } from 'chessground/api';
import { ChessWrapper } from '@/lib/chess';

export default function Board(){
const {fen,setFen,comment,setComment} = useGameStore();
const boardRef = useRef<HTMLDivElement>(null);
// Guardamos a instância do Chessground numa ref para podermos aceder-lhe sem causar re-renders
const cgRef = useRef<Api | null>(null);

// Efeito 1: Instanciar o tabuleiro apenas UMA VEZ quando a div entra no DOM
useEffect(() => {
    if(boardRef.current && !cgRef.current){
        // Usamos a FEN do Zustand que está atualizada neste momento
        const currentFen = useGameStore.getState().fen;
        
        cgRef.current = Chessground(boardRef.current, {
            fen: currentFen,
            viewOnly: false,
            turnColor: 'white', // Diz ao chessground de quem é a vez
            movable: {
                color: 'white', // O jogador só pode mover as brancas
                free: false, // Só permite lances legais do xadrez
                dests: ChessWrapper.getLegalMovesMap(currentFen) // Calculamos os destinos com a FEN correta
            },
            events: {
                move: (orig, dest) => {
                    const currentFen = useGameStore.getState().fen;
                    
                    // 1. Correção da Validação:
                    // O chess.js (que está por baixo do ChessWrapper) espera um objeto { from, to, promotion? }
                    // e não uma string concatenada "e2e4". Vamos passar o formato correto:
                    const moveAttempt = { from: orig, to: dest, promotion: 'q' }; // promotion 'q' como fallback seguro

                    const result = ChessWrapper.playMove(currentFen, moveAttempt);
                    
                    if(result){
                        // Lance legal!
                        useGameStore.getState().setFen(result.newFen);
                        useGameStore.getState().setComment(`Bom lance: ${orig} para ${dest}`);
                        useGameStore.getState().setHasError(false);
                    }else{
                        // Lance ilegal!
                        useGameStore.getState().setHasError(true);
                        useGameStore.getState().setComment(`Lance ilegal (${orig}-${dest})! Tenta outra vez.`);
                        
                        // Forçamos o chessground a voltar à posição original
                        cgRef.current?.set({fen: currentFen});
                    }
                }
            }
        });
    }

    // Só destruímos quando o componente for completamente removido da página
    return () => {
        if (cgRef.current) {
            cgRef.current.destroy();
            cgRef.current = null;
        }
    };
}, []); // <-- Array vazio: só corre na montagem inicial!

// Efeito 2: Atualizar a posição quando a FEN do Zustand mudar
useEffect(() => {
    if (cgRef.current) {
        // 2. Correção do Turno:
        // O chessground precisa saber de quem é a vez. A FEN tem essa informação na segunda parte (ex: "... w ...")
        const isWhiteTurn = fen.split(' ')[1] === 'w';
        const color = isWhiteTurn ? 'white' : 'black';

        cgRef.current.set({ 
            fen, 
            turnColor: color,
            movable: { 
                color: 'white', // <-- REVERTI PARA WHITE PARA MANTER AS PEÇAS ARRASTÁVEIS
                free: false,
                dests: isWhiteTurn ? ChessWrapper.getLegalMovesMap(fen) : new Map()
            } 
        });
    }
}, [fen]); // <-- Este corre sempre que a FEN muda

return (
    <div className="flex flex-col items-center">
        {/* 3. Correção do Tamanho:
            O Chessground usa SVGs absolutos e necessita de dimensões rígidas no seu container.
            Vamos garantir valores fixos (w-[400px] h-[400px]) para não colapsar. */}
        <div 
          ref={boardRef} 
          className="w-[350px] h-[350px] md:w-[500px] md:h-[500px] mx-auto shadow-2xl rounded-sm bg-white" 
        />
    </div>
)

}