import { Chess, Move } from 'chess.js'

/**
 * Wrapper utilitário em torno da biblioteca chess.js.
 * 
 * Porquê? 
 * 1. Evita espalhar `new Chess()` por todo o código (Clean Code / SOLID).
 * 2. Previne problemas de performance ou memory leaks se precisarmos de validar 
 *    muitos lances em loop, reaproveitando instâncias quando possível.
 * 3. Cria uma interface mais simples e direcionada para as necessidades do Chess Openings.
 */

// Instância global para operações de leitura rápida (não deve manter estado entre chamadas assíncronas)
const readOnlyChess = new Chess()

export const ChessWrapper = {
  /**
   * Verifica se uma string FEN (Forsyth-Edwards Notation) é válida.
   */
  isValidFen(fen: string): boolean {
    try {
      // O chess.js v1.0.0+ usa .load() que lança erro se o FEN for inválido
      readOnlyChess.load(fen)
      return true
    } catch {
      return false
    }
  },

  /**
   * Valida um lance (SAN ou notação curta ex: 'e4') a partir de um FEN específico.
   * Se o lance for válido, retorna o novo FEN e os detalhes do lance.
   * Se for inválido, retorna null.
   */
  playMove(fen: string, move: string): { newFen: string; moveDetails: Move } | null {
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
      readOnlyChess.load(fen)
      return readOnlyChess.moves()
    } catch {
      return []
    }
  },

  /**
   * Posição inicial padrão de uma partida de xadrez
   */
  STARTING_FEN: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
}
