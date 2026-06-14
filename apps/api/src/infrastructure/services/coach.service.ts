import { Injectable } from '@nestjs/common'
import { GoogleGenerativeAI, SchemaType, type Schema } from '@google/generative-ai'
import type { ICoachService, CoachInsight, CoachRequest } from '@chess-openings/domain'

const SYSTEM_PROMPT = `
[T] - TASK
You are Master Gambito, a Senior Chess Instructor. Expand the author's short annotations into didactic teacher explanations.
CRITICAL REQUIREMENT: WRITE ALL OUTPUTS STRICTLY IN ENGLISH.

[R] - ROLE AND TONE
Experienced, didactic, use chess analogies. Speak from the perspective of whoever MADE the move.
If it's the student's move: "We played this to...". If it's the opponent's move: "Black plays this because...".

[I] - INSTRUCTIONS
1. STRICT PRESERVATION: If the original comment cites squares (e.g., "controls d5"), include those exact squares.
2. EXPANSION: Explain the strategic reason didactically.
3. EXTREME CONCISENESS: Maximum 1-2 short sentences. Eliminate unnecessary adjectives.
4. PROHIBITIONS: No invented future moves. No "Stockfish" or "Centipawns". No "You" for opponent moves.

[C] - SPECIFIC CASES
If there is no original comment, generate ONE short sentence on the basic principle (development, control).

[L] - LANGUAGE: ALL OUTPUTS (comment and theme) MUST BE IN ENGLISH.
`

const RESPONSE_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    comment: { type: SchemaType.STRING },
    theme: { type: SchemaType.STRING },
  },
  required: ['comment', 'theme'],
}

@Injectable()
export class CoachService implements ICoachService {
  async generateExplanationsBatch(requests: CoachRequest[], batchSize = 10): Promise<Record<string, CoachInsight>> {
    if (!process.env.GEMINI_API_KEY) {
      return requests.reduce((acc, req) => {
        acc[req.id] = { comment: `(Mock) Move ${req.san} analyzed.`, theme: req.cpChangeTheme }
        return acc
      }, {} as Record<string, CoachInsight>)
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-lite',
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: { responseMimeType: 'application/json', responseSchema: RESPONSE_SCHEMA, temperature: 0.7 },
    })

    const results: Record<string, CoachInsight> = {}

    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize)
      const batchResults = await Promise.all(batch.map(req => this.generateOne(model, req)))
      for (const { id, insight } of batchResults) {
        results[id] = insight
      }
    }

    return results
  }

  private async generateOne(model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>, req: CoachRequest): Promise<{ id: string; insight: CoachInsight }> {
    try {
      const actor = req.isOpponentResponse ? 'OPPONENT' : 'STUDENT'
      let prompt = `Student color: ${req.playerColor}\nWho made this move: ${actor}\nMove: ${req.san}\nPiece moved: ${req.tacticalContext.pieceMoved}\n`
      if (req.tacticalContext.capturedPiece) prompt += `Capture: ${req.tacticalContext.capturedPiece}\n`
      if (req.tacticalContext.isCheck) prompt += `Results in check!\n`
      prompt += `Suggested theme: ${req.cpChangeTheme}\n`
      if (req.originalComment) {
        prompt += `\nAUTHOR COMMENT (preserve cited squares):\n"${req.originalComment}"\n\nExpand didactically.`
      } else {
        prompt += `Explain this move following the rules.`
      }

      const result = await model.generateContent(prompt)
      return { id: req.id, insight: JSON.parse(result.response.text()) as CoachInsight }
    } catch {
      return { id: req.id, insight: { comment: req.originalComment ?? 'Theoretical move.', theme: req.cpChangeTheme } }
    }
  }
}
