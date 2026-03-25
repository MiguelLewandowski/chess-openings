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
   * Extrai texto humano e metadados visuais (setas, círculos) de uma string de comentário.
   */
  parseComments(commentStr?: string): { text: string; visualMarkers: VisualMarkers | null } {
    if (!commentStr) return { text: "", visualMarkers: null };

    const markers: VisualMarkers = { arrows: [], circles: [] };
    let hasMarkers = false;

    // Extrai [%cal ...] (Arrows)
    const calMatches = commentStr.match(/\[%cal\s+([^\]]+)\]/g);
    if (calMatches) {
      hasMarkers = true;
      calMatches.forEach(match => {
        const inner = match.match(/\[%cal\s+([^\]]+)\]/)?.[1];
        if (inner) markers.arrows.push(...inner.split(',').map(s => s.trim()));
      });
    }

    // Extrai [%csl ...] (Circles)
    const cslMatches = commentStr.match(/\[%csl\s+([^\]]+)\]/g);
    if (cslMatches) {
      hasMarkers = true;
      cslMatches.forEach(match => {
        const inner = match.match(/\[%csl\s+([^\]]+)\]/)?.[1];
        if (inner) markers.circles.push(...inner.split(',').map(s => s.trim()));
      });
    }

    // Remove todos os comandos [%...] para isolar o texto humano
    const cleanText = commentStr.replace(/\[%[^\]]+\]/g, '').trim();

    return {
      text: cleanText,
      visualMarkers: hasMarkers ? markers : null
    };
  },

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

      const { text, visualMarkers } = this.parseComments(moveObj.commentDiag?.comment);
      
      const node: ParsedNode = {
        id: Math.random().toString(36).substring(7),
        san,
        fen: playResult.newFen,
        player: playResult.moveDetails.color === 'w' ? 'WHITE' : 'BLACK',
        originalComment: text,
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
