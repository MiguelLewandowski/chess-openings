/**
 * Interface para a resposta da Lichess Cloud Eval API
 */
export interface LichessCloudEval {
  id: string; // FEN
  depth: number;
  pvs: Array<{
    moves: string; // UCI moves
    cp?: number;
    mate?: number;
  }>;
  error?: string;
}

export interface EngineEvaluation {
  cp: number | null;
  mate: number | null;
  complexity: 'BAIXA' | 'MEDIA' | 'ALTA' | 'MATE';
}

export const EngineService = {
  /**
   * Avalia uma posição (FEN) usando a Lichess Cloud API.
   * Vantagem: Instantâneo e não gasta CPU do nosso servidor.
   * Desvantagem: Pode não ter posições muito obscuras na cache (retorna null).
   */
  async getEvaluation(fen: string): Promise<EngineEvaluation | null> {
    try {
      // Lichess pede para enviarmos a FEN encodada no URL
      const url = `https://lichess.org/api/cloud/eval?fen=${encodeURIComponent(fen)}&multiPv=1`;
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          // Posição não encontrada na Cloud (muito raro em aberturas principais)
          return null;
        }
        throw new Error(`Lichess API Erro: ${response.status}`);
      }

      const data = (await response.json()) as LichessCloudEval;
      
      if (data.error || !data.pvs || data.pvs.length === 0) {
        return null;
      }

      const pv = data.pvs[0];
      const hasMate = pv.mate !== undefined;

      return {
        cp: pv.cp ?? null,
        mate: pv.mate ?? null,
        complexity: hasMate ? 'MATE' : 'BAIXA' // Simplificado por agora. No futuro podemos cruzar com depth menores
      };
    } catch (error) {
      console.error(`Erro ao avaliar FEN ${fen}:`, error);
      return null;
    }
  },

  /**
   * Processa uma lista de FENs em lotes paralelos
   */
  async getEvaluationsBatch(fens: string[], batchSize = 10): Promise<Record<string, EngineEvaluation | null>> {
    const results: Record<string, EngineEvaluation | null> = {};
    const uniqueFens = Array.from(new Set(fens));

    for (let i = 0; i < uniqueFens.length; i += batchSize) {
      const batch = uniqueFens.slice(i, i + batchSize);
      console.log(`⚙️ [Engine] Avaliando lote ${i / batchSize + 1} de ${Math.ceil(uniqueFens.length / batchSize)}...`);
      
      const promises = batch.map(async (fen) => {
        // Pequeno delay para não levar rate limit de 429 da Lichess
        await new Promise(r => setTimeout(r, 100)); 
        const evalData = await this.getEvaluation(fen);
        return { fen, evalData };
      });

      const batchResults = await Promise.all(promises);
      for (const res of batchResults) {
        results[res.fen] = res.evalData;
      }
    }

    return results;
  },

  /**
   * Determina o tema tático/posicional com base na mudança de avaliação (CP)
   */
  determineTheme(cpChange: number): string {
    if (cpChange <= -200) return "Erro Tático Grave (Blunder)";
    if (cpChange <= -100) return "Erro (Mistake)";
    if (cpChange <= -50) return "Imprecisão (Inaccuracy)";
    if (cpChange >= 100) return "Lance Brilhante/Excelente";
    return "Desenvolvimento / Posicional";
  }
};
