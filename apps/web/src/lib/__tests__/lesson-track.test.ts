import { describe, it, expect } from 'vitest'
import type { LessonSummary } from '@chess-openings/domain'
import { nextLessonInBranch } from '../lesson-track'

const lesson = (id: string, order: number, branch: string | null): LessonSummary => ({
  id,
  title: `Lição ${id}`,
  order,
  branch,
})

describe('nextLessonInBranch', () => {
  const lessons = [
    lesson('a1', 1, '2...Cf6'),
    lesson('b1', 2, '2...Bc5'),
    lesson('a2', 3, '2...Cf6'),
    lesson('b2', 4, '2...Bc5'),
  ]

  it('should skip lessons of other branches and return the next one of the same branch', () => {
    expect(nextLessonInBranch(lessons, 'a1')?.id).toBe('a2')
    expect(nextLessonInBranch(lessons, 'b1')?.id).toBe('b2')
  })

  it('should return undefined at the end of a branch, even when other branches go on', () => {
    expect(nextLessonInBranch(lessons, 'a2')).toBeUndefined()
  })

  it('should follow the lesson order, not the array order', () => {
    const shuffled = [lessons[2], lessons[0], lessons[3], lessons[1]]
    expect(nextLessonInBranch(shuffled, 'a1')?.id).toBe('a2')
  })

  it('should treat a null branch as a single branch with every lesson', () => {
    const single = [lesson('x', 1, null), lesson('y', 2, null)]
    expect(nextLessonInBranch(single, 'x')?.id).toBe('y')
    expect(nextLessonInBranch(single, 'y')).toBeUndefined()
  })

  it('should return undefined for a lesson that is not in the list', () => {
    expect(nextLessonInBranch(lessons, 'missing')).toBeUndefined()
  })
})
