import { apiClient } from '@/lib/api-client'
import { getSession } from '@/lib/session'

export async function getLessonById(id: string) {
  const session = await getSession()
  if (!session) return null
  return apiClient.lessons.findById(id, session.apiToken)
}
