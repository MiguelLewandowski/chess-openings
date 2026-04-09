'use client';
import { useGameStore } from '@/store/GameStore';
import { useEffect, useRef } from 'react';

import { Chessground } from 'chessground';
import { Api } from 'chessground/api';
import { ChessWrapper } from '@/lib/chess';

function getBrushColor(code: string) {
    switch (code.toUpperCase()) {
        case 'G': return 'green';
        case 'R': return 'red';
        case 'B': return 'blue';
        case 'Y': return 'yellow';
        default: return 'green';
    }
}

export default function Board() {
    const { fen, isThinking, playerColor, currentNodeId, exerciseMoves } = useGameStore();
    const boardRef = useRef<HTMLDivElement>(null);
    // Guardamos a instância do Chessground numa ref para podermos aceder-lhe sem causar re-renders
    const cgRef = useRef<Api | null>(null);

    // Efeito 1: Instanciar o tabuleiro apenas UMA VEZ quando a div entra no DOM
    useEffect(() => {
        if (boardRef.current && !cgRef.current) {
            // Usamos a FEN do Zustand que está atualizada neste momento
            const currentFen = useGameStore.getState().fen;
            const currentPlayerColor = useGameStore.getState().playerColor;

            cgRef.current = Chessground(boardRef.current, {
                fen: currentFen,
                viewOnly: false,
                turnColor: currentPlayerColor, // Diz ao chessground de quem é a vez (dinâmico)
                orientation: currentPlayerColor, // Vira o tabuleiro para o jogador
                premovable: { enabled: false },
                movable: {
                    color: currentPlayerColor, // O jogador só pode mover as suas peças
                    free: false, // Só permite lances legais do xadrez
                    dests: ChessWrapper.getLegalMovesMap(currentFen) // Calculamos os destinos com a FEN correta
                },
                events: {
                    move: (orig, dest) => {
                        // O tabuleiro agora é burro. Ele só avisa a loja.
                        const success = useGameStore.getState().handlePlayerMove(orig, dest);

                        if (!success) {
                            // Se falhou, forçamos o tabuleiro visual a voltar para a FEN atual da loja
                            const currentFen = useGameStore.getState().fen;
                            const currentPlayerColor = useGameStore.getState().playerColor;
                            cgRef.current?.set({
                                fen: currentFen,
                                turnColor: currentPlayerColor,
                                movable: {
                                    color: currentPlayerColor, 
                                    free: false, 
                                    dests: ChessWrapper.getLegalMovesMap(currentFen) 
                                },
                            });
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

            // Extrair setas e círculos do lance atual
            const currentMove = exerciseMoves.find(m => m.id === currentNodeId);
            const visualMarkers = currentMove?.visualMarkers;
            const shapes: any[] = [];

            if (visualMarkers) {
                // As cores do Lichess PGN são: G (green), R (red), B (blue), Y (yellow)
                // Se a anotação for [%cal c4f7] (sem a letra da cor no início), assumimos green.
                
                if (visualMarkers.arrows) {
                    visualMarkers.arrows.forEach((arrow: string) => {
                        if (arrow.length === 5) {
                            shapes.push({
                                orig: arrow.substring(1, 3),
                                dest: arrow.substring(3, 5),
                                brush: getBrushColor(arrow[0])
                            });
                        } else if (arrow.length === 4) {
                             // Caso do Lichess onde a cor é omitida, ex: [%cal c4f7]
                             shapes.push({
                                orig: arrow.substring(0, 2),
                                dest: arrow.substring(2, 4),
                                brush: 'green'
                            });
                        }
                    });
                }
                if (visualMarkers.circles) {
                    visualMarkers.circles.forEach((circle: string) => {
                        if (circle.length === 3) {
                            shapes.push({
                                orig: circle.substring(1, 3),
                                brush: getBrushColor(circle[0])
                            });
                        } else if (circle.length === 2) {
                            // Caso do Lichess onde a cor é omitida, ex: [%csl e4]
                             shapes.push({
                                orig: circle.substring(0, 2),
                                brush: 'green'
                            });
                        }
                    });
                }
            }

            cgRef.current.set({
                fen,
                turnColor: color,
                premovable: { enabled: false },
                movable: {
                    color: playerColor, // O jogador só pode mover a SUA cor
                    free: false,
                    // O mapa de destinos só é gerado se for a vez do jogador E o bot não estiver a pensar E o jogo não tiver acabado E não estiver esperando clique no Continuar
                    dests: (color === playerColor && !isThinking && !useGameStore.getState().isWaitingForNext && !useGameStore.getState().isCompleted) ? ChessWrapper.getLegalMovesMap(fen) : new Map()
                },
                drawable: {
                    enabled: true, // Tem que habilitar o drawable para as setas aparecerem
                    visible: true, // OBRIGATÓRIO: garante que as formas SVG sejam visíveis
                    autoShapes: shapes // Setas programáticas devem ir no autoShapes
                }
            });
        }
    }, [fen, isThinking, playerColor, currentNodeId, exerciseMoves]); // <-- Adicionado currentNodeId e exerciseMoves às dependências

    return (
        <div className="flex flex-col items-center w-full h-full bg-slate-900">
            {/* 3. Correção do Tamanho:
            O Chessground usa SVGs absolutos e necessita de dimensões rígidas no seu container.
            Vamos garantir que ele preencha o container do pai. */}
            <div
                ref={boardRef}
                className="w-full h-full mx-auto"
            />
        </div>
    )

}