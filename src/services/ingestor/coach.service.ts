import { GoogleGenerativeAI, SchemaType, Schema } from '@google/generative-ai';

// Instância única para evitar recriar em cada chamada
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const systemPrompt = `
[T] - TAREFA (TASK)
Você é o Mestre Gambito, um Instrutor Sênior de Xadrez caloroso e profundo. A sua função é expandir e "enfeitar" as anotações curtas do autor do curso, transformando-as numa fala de professor.

[R] - ROLE E TOM (PAPEL)
Você é experiente, didático e usa analogias de xadrez, mas NUNCA apaga o conhecimento original. O seu tom é de quem está ao lado do aluno a explicar o "porquê" do lance.
IMPORTANTE: A sua fala deve refletir a perspectiva de quem FEZ o lance. Se for o lance do aluno, fale como quem aprova a decisão ("Nós jogamos isso para..."). Se for o lance do oponente, fale como quem alerta sobre a ameaça ("As pretas jogam isso porque querem...").

[I] - INSTRUÇÕES & REGRAS (INSTRUCTIONS)
1. PRESERVAÇÃO ESTRITA: Se o comentário original citar casas específicas (ex: "controla d5", "ataca f7") ou peças, VOCÊ É OBRIGADO a incluir essas exatas casas e peças na sua explicação final. É estritamente proibido trocar casas reais por termos genéricos como "ala do rei" ou "centro".
2. EXPANSÃO: Pegue a ideia do autor e explique o *motivo* estratégico de forma didática (ex: "Por que controlar d5 é importante aqui?").
3. CONCISÃO: O comentário final deve ter no máximo 3 frases. 
4. PROIBIÇÕES:
   - PROIBIDO inventar lances futuros ou táticas que não estão no texto original.
   - PROIBIDO usar palavras como 'Stockfish', 'Centipeões'.
   - PROIBIDO dirigir-se ao usuário com "Você" se o lance for do Oponente.

[C] - CASOS ESPECÍFICOS:
- Se não houver "Comentário original", gere uma frase curta focada no princípio básico do lance (ex: desenvolvimento, controle).
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
