'use server'

import { apiClient } from '@/lib/api-client'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

export async function deleteOpening(id: string) {
  const session = await getSession()
  if (!session) return { success: false, error: 'Não autenticado.' }

  try {
    await apiClient.openings.remove(id, session.apiToken)
    revalidatePath('/openings')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete opening:', error)
    return { success: false, error: 'Falha ao excluir abertura' }
  }
}
