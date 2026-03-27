import { Chess, Move } from 'chess.js'
import { Key } from 'chessground/types';

/**
 * Wrapper utilitário em torno da biblioteca chess.js.
 * 
 * Porquê? 
 * 1. Evita espalhar `new Chess()` por todo o código (Clean Code / SOLID).
 * 2. Previne problemas de performance ou memory leaks se precisarmos de validar 
 *    muitos lances em loop, reaproveitando instâncias quando possível.
 * 3. Cria uma interface mais simples e direcionada para as necessidades do Chess Openings.
 */

export const ChessWrapper = {
  /**
   * Verifica se uma string FEN (Forsyth-Edwards Notation) é válida.
   */
  isValidFen(fen: string): boolean {
    try {
      // O chess.js v1.0.0+ usa .load() que lança erro se o FEN for inválido
      new Chess(fen)
      return true
    } catch {
      return false
    }
  },

  /**
   * Valida um lance (SAN ou notação curta ex: 'e4', ou objeto {from, to}) a partir de um FEN específico.
   * Se o lance for válido, retorna o novo FEN e os detalhes do lance.
   * Se for inválido, retorna null.
   */
  playMove(fen: string, move: string | {from: string, to: string, promotion?: string}): { newFen: string; moveDetails: Move } | null {
    try {
      // Criamos uma nova instância aqui para não poluir a instância de leitura rápida
      // se esta função for chamada em concorrência no servidor.
      const game = new Chess(fen)
      const moveDetails = game.move(move)
      
      return {
        newFen: game.fen(),
        moveDetails
      }
    } catch (error) {
      // O lance era inválido ou ilegal para esta posição
      return null
    }
  },

  /**
   * Retorna a lista de lances legais (em formato SAN) para uma dada posição.
   */
  getLegalMoves(fen: string): string[] {
    try {
      const game = new Chess(fen)
      return game.moves()
    } catch {
      return []
    }
  },

  /**
   * Gera um Map de destinos válidos para o Chessground.
   * O Chessground espera um Map<Key, Key[]> onde a chave é a casa de origem ('e2')
   * e o valor é um array de casas de destino ('e3', 'e4').
   */
  getLegalMovesMap(fen: string): Map<Key, Key[]> {
    const dests = new Map<Key, Key[]>();
    try {
      const game = new Chess(fen)
      const moves = game.moves({ verbose: true });
      
      moves.forEach(move => {
        const from = move.from as Key;
        const to = move.to as Key;
        
        if (dests.has(from)) {
          dests.get(from)?.push(to);
        } else {
          dests.set(from, [to]);
        }
      });
      
    } catch (e) {
      // Ignorar erros de FEN inválido e retornar Map vazio
    }
    return dests;
  },

  /**
   * Posição inicial padrão de uma partida de xadrez
   */
  STARTING_FEN: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
}
