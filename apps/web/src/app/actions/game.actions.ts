'use server'

import { apiClient } from '@/lib/api-client'

export async function getExpectedResponse(currentFen: string) {
  return apiClient.moves.expected(currentFen)
}
