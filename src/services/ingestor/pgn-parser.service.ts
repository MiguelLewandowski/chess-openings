import { parse } from '@mliebelt/pgn-parser';
import { ChessWrapper } from '@/lib/chess';

export interface VisualMarkers {
  arrows: string[];
  circles: string[];
}

export interface ParsedNode {
  id: string; // Gerado para correlação
  san: string;
  fen: string;
  player: 'WHITE' | 'BLACK';
  originalComment: string;
  visualMarkers: VisualMarkers | null;
  children: ParsedNode[];
  isMainLine: boolean;
  // --- Novo Contexto Tático para a LLM ---
  pieceMoved: string; // p, n, b, r, q, k
  capturedPiece?: string; // p, n, b, r, q
  isCheck: boolean;
}

export interface ParsedChapter {
  title: string;
  initialFen: string;
  rootNodes: ParsedNode[]; // Os primeiros lances do capítulo (geralmente 1, mas pode ter alternativas no lance 1)
}

export const PgnParserService = {
  /**
   * Converte a AST do @mliebelt/pgn-parser na nossa estrutura de Árvore (com FENs calculados)
   */
  buildTree(movesAst: any[], currentFen: string, isMainLine: boolean = true): ParsedNode[] {
    if (!movesAst || movesAst.length === 0) return [];

    const nodes: ParsedNode[] = [];
    
    // O @mliebelt/pgn-parser retorna os lances sequencialmente num array.
    // Ex: [e4, e5, Nf3]. 
    // Para construirmos uma árvore, o nó N é pai do nó N+1.
    // Se o nó N tem "variations", elas são filhos alternativos do nó N-1.

    let fenCursor = currentFen;

    // Função auxiliar recursiva para processar a flat list como uma árvore
    const processSequence = (sequence: any[], startFen: string, mainLineFlag: boolean): ParsedNode[] => {
      if (sequence.length === 0) return [];

      const moveObj = sequence[0];
      const san = moveObj.notation.notation;
      
      // Joga o lance para descobrir o novo FEN
      const playResult = ChessWrapper.playMove(startFen, san);
      if (!playResult) {
        console.warn(`Lance ilegal ignorado no parser: ${san} na FEN ${startFen}`);
        return []; // Se for ilegal, aborta este ramo
      }

      const commentText = moveObj.commentDiag?.comment || moveObj.commentAfter || "";
      
      const markers: VisualMarkers = { arrows: [], circles: [] };
      let hasMarkers = false;

      // O @mliebelt/pgn-parser já extrai colorArrows e colorFields se estiverem no formato certo,
      // mas como vimos, o Lichess pode colocar os [%cal] e [%csl] no meio de commentAfter ou num formato que o parser falha em identificar estruturalmente.
      // Por isso, vamos fazer parsing manual com regex de toda a string de comentário para garantir.
      
      const fullComment = `${moveObj.commentDiag?.comment || ''} ${moveObj.commentAfter || ''}`;
      
      // Extrai [%cal ...] (Arrows)
      const calMatches = fullComment.match(/\[%cal\s+([^\]]+)\]/g);
      if (calMatches) {
        hasMarkers = true;
        calMatches.forEach(match => {
          const inner = match.match(/\[%cal\s+([^\]]+)\]/)?.[1];
          if (inner) markers.arrows.push(...inner.split(',').map(s => s.trim()));
        });
      } else if (moveObj.commentDiag?.colorArrows?.length > 0) {
        hasMarkers = true;
        markers.arrows.push(...moveObj.commentDiag.colorArrows);
      } else if (moveObj.commentDiag?.cal) {
        // Fallback para o caso onde o parser engole o [%cal] e joga diretamente na prop 'cal'
        hasMarkers = true;
        const cals = typeof moveObj.commentDiag.cal === 'string' ? moveObj.commentDiag.cal.split(',') : moveObj.commentDiag.cal;
        markers.arrows.push(...cals.map((s: string) => s.trim()));
      }

      // Extrai [%csl ...] (Circles)
      const cslMatches = fullComment.match(/\[%csl\s+([^\]]+)\]/g);
      if (cslMatches) {
        hasMarkers = true;
        cslMatches.forEach(match => {
          const inner = match.match(/\[%csl\s+([^\]]+)\]/)?.[1];
          if (inner) markers.circles.push(...inner.split(',').map(s => s.trim()));
        });
      } else if (moveObj.commentDiag?.colorFields?.length > 0) {
        hasMarkers = true;
        markers.circles.push(...moveObj.commentDiag.colorFields);
      } else if (moveObj.commentDiag?.csl) {
         // Fallback para o caso onde o parser engole o [%csl] e joga diretamente na prop 'csl'
         hasMarkers = true;
         const csls = typeof moveObj.commentDiag.csl === 'string' ? moveObj.commentDiag.csl.split(',') : moveObj.commentDiag.csl;
         markers.circles.push(...csls.map((s: string) => s.trim()));
      }

      // Limpar os marcadores visuais do comentário para não irem para a LLM
      const cleanCommentText = commentText.replace(/\[%(cal|csl)\s+[^\]]+\]/g, '').trim();

      const visualMarkers: VisualMarkers | null = hasMarkers ? markers : null;

      const node: ParsedNode = {
        id: Math.random().toString(36).substring(7),
        san,
        fen: playResult.newFen,
        player: playResult.moveDetails.color === 'w' ? 'WHITE' : 'BLACK',
        originalComment: cleanCommentText,
        visualMarkers,
        isMainLine: mainLineFlag,
        children: [],
        pieceMoved: playResult.moveDetails.piece,
        capturedPiece: playResult.moveDetails.captured,
        isCheck: playResult.newFen.includes('+') || playResult.moveDetails.san.includes('+') || playResult.moveDetails.san.includes('#')
      };

      // 1. O próximo lance na sequência principal é o "primeiro filho"
      const nextInSequence = sequence.slice(1);
      if (nextInSequence.length > 0) {
        node.children.push(...processSequence(nextInSequence, playResult.newFen, mainLineFlag));
      }

      // 2. Se este lance tem variações, elas também são "filhos" da posição ANTERIOR (startFen)
      // Como estamos a construir a árvore top-down, temos de retornar as variações como irmãos deste nó
      const siblings = [node];
      
      if (moveObj.variations && moveObj.variations.length > 0) {
        for (const variation of moveObj.variations) {
          // As variações não são a linha principal
          siblings.push(...processSequence(variation, startFen, false));
        }
      }

      return siblings;
    };

    return processSequence(movesAst, currentFen, isMainLine);
  },

  /**
   * Lê uma string PGN inteira (pode conter múltiplos capítulos) e extrai a informação estruturada.
   */
  parseStudy(pgnString: string): ParsedChapter[] {
    const games = parse(pgnString, { startRule: 'games' }) as any[];
    
    return games.map((game, index) => {
      const title = game.tags?.Event || `Capítulo ${index + 1}`;
      const setupFen = game.tags?.FEN || ChessWrapper.STARTING_FEN;
      
      // Validar FEN inicial
      const initialFen = ChessWrapper.isValidFen(setupFen) ? setupFen : ChessWrapper.STARTING_FEN;

      const rootNodes = this.buildTree(game.moves, initialFen, true);

      return {
        title,
        initialFen,
        rootNodes
      };
    });
  }
};
