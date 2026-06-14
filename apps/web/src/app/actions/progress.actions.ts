'use server'

import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { apiClient } from '@/lib/api-client'

export async function completeExerciseAction(exerciseId: string, quality: number) {
  const session = await getSession()
  if (!session) return { success: false }

  await apiClient.progress.complete(exerciseId, quality, session.apiToken)
  revalidatePath('/openings')
  return { success: true }
}
