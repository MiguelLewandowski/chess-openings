import type { LessonSummary } from '@chess-openings/domain'

// The "next lesson" button stays inside the branch the student is studying: at its end the
// student goes back to the opening page to pick another branch. Lessons without a branch (null)
// form a single branch, so the button walks every lesson as before.
export function nextLessonInBranch(lessons: LessonSummary[], currentId: string): LessonSummary | undefined {
  const current = lessons.find((lesson) => lesson.id === currentId)
  if (!current) return undefined

  return lessons
    .filter((lesson) => lesson.branch === current.branch && lesson.order > current.order)
    .sort((a, b) => a.order - b.order)[0]
}
