'use server'

import { getSession } from '@/lib/session'
import { apiClient, type IngestStudyInput } from '@/lib/api-client'
import { revalidatePath } from 'next/cache'

export async function importStudyAction(input: IngestStudyInput) {
  const session = await getSession()
  if (!session) return { success: false, error: 'Não autenticado.' }
  // Server actions are public endpoints: check the role here too, not only in the UI.
  if (session.role !== 'ADMIN') return { success: false, error: 'Apenas administradores podem importar estudos.' }

  try {
    const opening = await apiClient.ingestor.study(input, session.apiToken)
    revalidatePath('/openings')
    return { success: true, message: `Abertura '${opening.name}' importada.` }
  } catch (error) {
    return { success: false, error: apiErrorMessage(error) }
  }
}

// api-client errors read "API error 400: {json}"; show the API's own message, which for an
// unreviewed study says how many passages still carry [REVISAR].
function apiErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return 'Erro desconhecido durante a importação.'
  const body = error.message.replace(/^API error \d+: /, '')
  try {
    const parsed = JSON.parse(body) as { message?: unknown }
    if (typeof parsed.message === 'string') return parsed.message
  } catch {
    // not JSON: fall through to the raw message
  }
  return error.message
}
