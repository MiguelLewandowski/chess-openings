'use server'

import { apiClient } from '@/lib/api-client'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { OPENING_STYLES, type OpeningStyle } from '@chess-openings/domain'

export async function deleteOpening(id: string) {
  const session = await getSession()
  if (!session) return { success: false, error: 'Não autenticado.' }
  // Server actions are public endpoints: check the role here too, not only in the UI.
  if (session.role !== 'ADMIN') return { success: false, error: 'Apenas administradores podem excluir aberturas.' }

  try {
    await apiClient.openings.remove(id, session.apiToken)
    revalidatePath('/openings')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete opening:', error)
    return { success: false, error: 'Falha ao excluir abertura' }
  }
}

// Saving a path, or switching to another, keeps the progress of every path: it only changes
// which one the track shows and the reviews bring back. The caller navigates afterwards (see
// ChoosePathButton).
export async function chooseOpeningPath(family: string, style: OpeningStyle) {
  const session = await getSession()
  if (!session) redirect('/login')
  // Server actions are public endpoints: the arguments come from the client.
  if (!OPENING_STYLES.includes(style)) throw new Error(`Unknown opening style: ${String(style)}`)

  await apiClient.openings.choosePath(family, style, session.apiToken)
  revalidatePath('/openings', 'layout')
}
