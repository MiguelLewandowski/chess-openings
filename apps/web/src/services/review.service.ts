import { apiClient, type DueReview } from '@/lib/api-client'

export type { DueReview }

export async function getDueReviews(token: string): Promise<DueReview[]> {
  return apiClient.progress.dueReviews(token)
}
