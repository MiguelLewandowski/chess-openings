import { GoogleGenerativeAI, SchemaType, Schema } from '@google/generative-ai';

// Instância única para evitar recriar em cada chamada
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const systemPrompt = `
[T] - TAREFA (TASK)
Você é o Mestre Gambito, um Instrutor Sênior de Xadrez. A sua ÚNICA função é atuar como "Ghostwriter" (Formatador de Texto) para as anotações brutas deixadas pelo autor do curso (um Mestre Nacional). 
Você vai receber notas curtas, jargões ou rascunhos e o seu trabalho é transformar isso numa fala elegante, didática e direta.

[R] - ROLE (PAPEL)
Você NÃO É um motor de xadrez (Stockfish). Não tente inventar táticas, descobrir cravadas ou calcular lances. Confie 100% nas notas do autor. A sua voz é autoritária, impessoal e pragmática.

[I] - INSTRUÇÕES & REGRAS (INSTRUCTIONS)
1. REGRA DE OURO: Nunca invente informações táticas que não estejam nas notas originais. Se o autor escreveu "quebra o centro", você fala sobre quebrar o centro.
2. CONCISÃO RADICAL: O comentário final DEVE ter no máximo 2 frases curtas. Sem poesia, sem rodeios.
3. PROIBIÇÕES:
   - PROIBIDO listar casas (ex: "controla c5 e f6"). As LLMs alucinam geometria, não o faça.
   - PROIBIDO falar diretamente com o usuário ("Você jogou...").
   - PROIBIDO usar palavras como 'Stockfish', 'Centipeões', 'Avaliação'.

[C] - CASOS ESPECÍFICOS:
- Se não houver "Comentário original do autor" fornecido no prompt, gere apenas uma frase genérica e curta baseada no tema: "Lance natural de desenvolvimento." ou "Avança a teoria da abertura."
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
  // Contexto tático explícito para evitar alucinações da LLM
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
      model: 'gemini-2.0-flash-lite-preview-02-05', // Versão específica e ultra-barata do Flash Lite
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
        let prompt = `Lance atual: ${req.san}\n`;
        prompt += `Peça que se moveu: ${req.tacticalContext.pieceMoved}\n`;
        if (req.tacticalContext.capturedPiece) {
          prompt += `[ATENÇÃO] Houve uma captura! Peça capturada: ${req.tacticalContext.capturedPiece}\n`;
        }
        if (req.tacticalContext.isCheck) {
          prompt += `[ATENÇÃO] O lance resultou num Xeque ao rei adversário!\n`;
        }
        prompt += `Tema sugerido pela mudança de avaliação: ${req.cpChangeTheme}\n`;
        
        if (req.originalComment) {
          prompt += `Comentário original do autor: "${req.originalComment}"\nRefine este comentário com seus insights de GM.`;
        } else {
          prompt += `Explique este lance de acordo com as regras estabelecidas.`;
        }

        try {
          const result = await model.generateContent(prompt);
          const responseText = result.response.text();
          const parsed = JSON.parse(responseText) as CoachInsight;
          return { id: req.id, insight: parsed };
        } catch (error) {
          console.error(`Erro ao gerar insight para ${req.san}:`, error);
          return { id: req.id, insight: { comment: "Erro ao gerar explicação pedagógica.", theme: req.cpChangeTheme } };
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
