'use server'

import { getSession } from '@/lib/session'
import { apiClient, type IngestStudyInput } from '@/lib/api-client'
import { revalidatePath } from 'next/cache'

export async function importStudyAction(input: IngestStudyInput) {
  const session = await getSession()
  if (!session) return { success: false, error: 'Não autenticado.' }

  try {
    const opening = await apiClient.ingestor.study(input, session.apiToken)
    revalidatePath('/openings')
    return { success: true, message: `Abertura '${opening.name}' importada.` }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido durante a importação.'
    return { success: false, error: message }
  }
}
