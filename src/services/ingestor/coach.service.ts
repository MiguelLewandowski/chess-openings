import { GoogleGenerativeAI, SchemaType, Schema } from '@google/generative-ai';

// Instância única para evitar recriar em cada chamada
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const systemPrompt = `
[T] - TAREFA (TASK)
You are Master Gambito, a Senior Chess Instructor. Your task is to expand and "decorate" the author's short annotations, turning them into a teacher's explanation.
CRITICAL REQUIREMENT: YOU MUST WRITE ALL YOUR FINAL EXPLANATIONS AND COMMENTS STRICTLY IN ENGLISH.

[R] - ROLE AND TONE (PAPEL)
You are experienced, didactic, and use chess analogies, but NEVER erase the original knowledge. Your tone is that of someone standing next to the student explaining the "why" of the move.
IMPORTANT: Your speech must reflect the perspective of whoever MADE the move. If it's the student's move, speak as someone approving the decision ("We played this to..."). If it's the opponent's move, speak as someone warning about the threat ("Black plays this because they want...").

[I] - INSTRUÇÕES & REGRAS (INSTRUCTIONS)
1. STRICT PRESERVATION: If the original comment cites specific squares (e.g., "controls d5", "attacks f7") or pieces, YOU ARE REQUIRED to include those exact squares and pieces in your final explanation. It is strictly forbidden to swap real squares for generic terms like "kingside" or "center".
2. EXPANSION: Take the author's idea and explain the strategic *reason* didactically.
3. EXTREME CONCISENESS: The final comment must be EXTREMELY DIRECT and have A MAXIMUM OF 1 to 2 short sentences. The text must be 60% smaller than verbose explanations. Eliminate unnecessary adjectives. Get straight to the tactical or strategic point.
4. PROHIBITIONS:
   - FORBIDDEN to invent future moves or tactics not in the original text.
   - FORBIDDEN to use words like 'Stockfish', 'Centipawns'.
   - FORBIDDEN to address the user as "You" if the move belongs to the Opponent.

[C] - CASOS ESPECÍFICOS (SPECIFIC CASES):
- If there is no "Original comment", generate ONLY ONE short sentence focused on the basic principle of the move (e.g., development, control).

[L] - LANGUAGE:
- ALL YOUR OUTPUTS (comment and theme) MUST BE IN ENGLISH.
`;

const responseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    comment: {
      type: SchemaType.STRING,
      description: "A explicação didática sobre o lance seguindo as regras do Mestre Gambito."
    },
    theme: {
      type: SchemaType.STRING,
      description: "O tema predominante do lance (ex: Desenvolvimento, Controle do Centro, Erro Tático)."
    }
  },
  required: ["comment", "theme"]
};

export interface CoachInsight {
  comment: string;
  theme: string;
}

export interface CoachRequest {
  id: string; // ID único para correlacionar no batch
  san: string;
  cpChangeTheme: string;
  originalComment?: string;
  isOpponentResponse: boolean; // NOVO CAMPO PARA SABER DE QUEM É O LANCE
  playerColor: 'WHITE' | 'BLACK'; // A cor de quem está aprendendo a lição
  tacticalContext: {
    pieceMoved: string;
    capturedPiece?: string;
    isCheck: boolean;
  };
}

export const CoachService = {
  /**
   * Processa uma lista de requisições em lotes (batches) para não esgotar os sockets.
   * Utiliza concorrência (Promise.all) ideal para API Paga.
   */
  async generateExplanationsBatch(requests: CoachRequest[], batchSize = 10): Promise<Record<string, CoachInsight>> {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("⚠️ GEMINI_API_KEY não configurada. Retornando insights mockados.");
      return requests.reduce((acc, req) => {
        acc[req.id] = { comment: `(Mock) Lance ${req.san} analisado.`, theme: req.cpChangeTheme };
        return acc;
      }, {} as Record<string, CoachInsight>);
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-3-flash-preview', // Versão estável do Gemini
      systemInstruction: systemPrompt,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7
      }
    });

    const results: Record<string, CoachInsight> = {};

    // Processamento em lotes (Chunking)
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      console.log(`🧠 [Coach] Processando lote ${i / batchSize + 1} de ${Math.ceil(requests.length / batchSize)}...`);
      
      const batchPromises = batch.map(async (req) => {
        const actor = req.isOpponentResponse ? "OPONENTE (Bot)" : "ALUNO (Você)";
        const actorColor = req.isOpponentResponse 
          ? (req.playerColor === 'WHITE' ? 'Pretas' : 'Brancas')
          : (req.playerColor === 'WHITE' ? 'Brancas' : 'Pretas');

        let prompt = `Cor que o Aluno está jogando a lição: ${req.playerColor === 'WHITE' ? 'Brancas' : 'Pretas'}\n`;
        prompt += `Quem fez este lance: ${actor} (Jogando de ${actorColor})\n`;
        prompt += `Lance atual: ${req.san}\n`;
        prompt += `Peça que se moveu: ${req.tacticalContext.pieceMoved}\n`;
        if (req.tacticalContext.capturedPiece) {
          prompt += `[ATENÇÃO] Houve uma captura! Peça capturada: ${req.tacticalContext.capturedPiece}\n`;
        }
        if (req.tacticalContext.isCheck) {
          prompt += `[ATENÇÃO] O lance resultou num Xeque ao rei adversário!\n`;
        }
        prompt += `Tema sugerido pela mudança de avaliação: ${req.cpChangeTheme}\n`;
        
        if (req.originalComment) {
          prompt += `\nCOMENTÁRIO DO AUTOR (PRESERVAR IDEIAS E CASAS CITADAS):\n"${req.originalComment}"\n\nExpanda este comentário didaticamente, mas MANTENHA todas as casas mencionadas. Lembre-se de adaptar o tom dependendo se quem jogou foi o Aluno ou o Oponente!`;
        } else {
          prompt += `Explique este lance de acordo com as regras estabelecidas. Lembre-se de adaptar o tom dependendo se quem jogou foi o Aluno ou o Oponente!`;
        }

        try {
          const result = await model.generateContent(prompt);
          const responseText = result.response.text();
          const parsed = JSON.parse(responseText) as CoachInsight;
          return { id: req.id, insight: parsed };
        } catch (error) {
          console.error(`Erro ao gerar insight para ${req.san}:`, error);
          return { id: req.id, insight: { comment: req.originalComment || "Lance teórico.", theme: req.cpChangeTheme } };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      for (const res of batchResults) {
        results[res.id] = res.insight;
      }
    }

    return results;
  }
};
