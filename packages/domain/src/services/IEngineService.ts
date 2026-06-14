export interface EngineEvaluation {
  cp: number | null
  mate: number | null
  complexity: 'BAIXA' | 'MEDIA' | 'ALTA' | 'MATE'
}

export interface IEngineService {
  getEvaluationsBatch(fens: string[], batchSize: number): Promise<Record<string, EngineEvaluation | null>>
}
