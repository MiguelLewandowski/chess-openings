import type { LessonSummary, LessonTrack, TrackBranch } from '../read-models/opening.read-model'

// The unlock rule of the trail: the first lesson of every branch is open, and inside a branch
// each lesson opens the next. A lesson stays open once the one before it is done, even if an
// earlier one is not (a student who skipped ahead keeps what they reached).
export function lessonTrack(lessons: LessonSummary[], completedLessonIds: Iterable<string>): LessonTrack {
  const completed = new Set(completedLessonIds)
  const branches: TrackBranch[] = []
  const byBranch = new Map<string | null, TrackBranch>()

  for (const lesson of [...lessons].sort((a, b) => a.order - b.order)) {
    let branch = byBranch.get(lesson.branch)
    if (!branch) {
      branch = { branch: lesson.branch, lessons: [] }
      byBranch.set(lesson.branch, branch)
      branches.push(branch)
    }
    const previous = branch.lessons[branch.lessons.length - 1]
    const state = completed.has(lesson.id) ? 'DONE' : !previous || completed.has(previous.id) ? 'OPEN' : 'LOCKED'
    branch.lessons.push({ ...lesson, state })
  }

  const next = branches.flatMap((b) => b.lessons).find((l) => l.state !== 'DONE')
  return { branches, nextLessonId: next?.id ?? null }
}
