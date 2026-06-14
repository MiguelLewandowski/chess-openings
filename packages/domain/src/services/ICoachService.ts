export interface CoachInsight {
  comment: string
  theme: string
}

export interface CoachRequest {
  id: string
  san: string
  cpChangeTheme: string
  originalComment?: string
  isOpponentResponse: boolean
  playerColor: 'WHITE' | 'BLACK'
  tacticalContext: {
    pieceMoved: string
    capturedPiece?: string
    isCheck: boolean
  }
}

export interface ICoachService {
  generateExplanationsBatch(requests: CoachRequest[], batchSize: number): Promise<Record<string, CoachInsight>>
}
