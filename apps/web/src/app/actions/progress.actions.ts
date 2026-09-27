'use server'

import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { apiClient } from '@/lib/api-client'
import type { ExerciseCompletion, PracticeAttempt } from '@chess-openings/domain'

export async function completeExerciseAction(exerciseId: string, attempt: PracticeAttempt): Promise<ExerciseCompletion | null> {
  const session = await getSession()
  if (!session) return null

  const completion = await apiClient.progress.complete(exerciseId, attempt, session.apiToken)
  revalidatePath('/openings')
  return completion
}
