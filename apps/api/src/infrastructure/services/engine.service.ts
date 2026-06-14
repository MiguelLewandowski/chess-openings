import { Injectable } from '@nestjs/common'
import type { IEngineService, EngineEvaluation } from '@chess-openings/domain'

interface LichessCloudEval {
  pvs: Array<{ moves: string; cp?: number; mate?: number }>
  error?: string
}

@Injectable()
export class EngineService implements IEngineService {
  async getEvaluationsBatch(fens: string[], batchSize = 10): Promise<Record<string, EngineEvaluation | null>> {
    const results: Record<string, EngineEvaluation | null> = {}
    const uniqueFens = Array.from(new Set(fens))

    for (let i = 0; i < uniqueFens.length; i += batchSize) {
      const batch = uniqueFens.slice(i, i + batchSize)
      const promises = batch.map(async (fen, index) => {
        await new Promise(r => setTimeout(r, index * 250))
        return { fen, evalData: await this.getEvaluation(fen) }
      })
      const batchResults = await Promise.all(promises)
      for (const { fen, evalData } of batchResults) {
        results[fen] = evalData
      }
    }

    return results
  }

  private async getEvaluation(fen: string): Promise<EngineEvaluation | null> {
    try {
      const url = `https://lichess.org/api/cloud/eval?fen=${encodeURIComponent(fen)}&multiPv=1`
      const response = await fetch(url)
      if (!response.ok) return null

      const data = (await response.json()) as LichessCloudEval
      if (data.error || !data.pvs?.length) return null

      const pv = data.pvs[0]
      return {
        cp: pv.cp ?? null,
        mate: pv.mate ?? null,
        complexity: pv.mate !== undefined ? 'MATE' : 'BAIXA',
      }
    } catch {
      return null
    }
  }
}
