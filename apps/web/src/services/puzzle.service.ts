import { apiClient, type PuzzleData } from '@/lib/api-client'

export type { PuzzleData }

export async function getPuzzlesForSession(
  openingNames: string[],
  limit = 10,
  maxRating = 1800,
): Promise<PuzzleData[]> {
  return apiClient.puzzles.list(openingNames, limit, maxRating)
}
