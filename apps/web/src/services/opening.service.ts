import { apiClient } from '@/lib/api-client'

export async function getAllOpenings() {
  return apiClient.openings.findAll()
}

export async function getOpeningBySlug(slug: string) {
  return apiClient.openings.findBySlug(slug)
}
