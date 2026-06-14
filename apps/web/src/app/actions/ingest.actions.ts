'use server'

import { getSession } from '@/lib/session'
import { apiClient, type IngestStudyInput } from '@/lib/api-client'
import { revalidatePath } from 'next/cache'

export async function importStudyAction(input: IngestStudyInput) {
  const session = await getSession()
  if (!session) return { success: false, error: 'Not authenticated.' }

  try {
    const opening = await apiClient.ingestor.study(input, session.apiToken)
    revalidatePath('/openings')
    return { success: true, message: `Opening '${opening.name}' imported.` }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error during import.'
    return { success: false, error: message }
  }
}
