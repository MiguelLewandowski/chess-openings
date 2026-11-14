import { describe, it, expect } from 'vitest'
import { lessonTrack } from '../LessonTrack'

const lesson = (id: string, order: number, branch: string | null) => ({ id, title: `Lição ${id}`, order, branch })

// Lessons ordered by frequency, as the draft writes them: the branches interleave.
const BISHOP = [
  lesson('bc5', 1, '2...Bc5'),
  lesson('cf6-a', 2, '2...Cf6'),
  lesson('cc6-a', 3, '2...Cc6'),
  lesson('cf6-b', 4, '2...Cf6'),
  lesson('cf6-trap', 5, '2...Cf6'),
  lesson('cc6-b', 6, '2...Cc6'),
]

const shape = (track: ReturnType<typeof lessonTrack>) =>
  track.branches.map((b) => [b.branch, b.lessons.map((l) => `${l.id}:${l.state}`)])

describe('lessonTrack', () => {
  it('should group the lessons by branch, in the order of the first lesson of each branch', () => {
    const track = lessonTrack([...BISHOP].reverse(), [])
    expect(track.branches.map((b) => [b.branch, b.lessons.map((l) => l.id)])).toEqual([
      ['2...Bc5', ['bc5']],
      ['2...Cf6', ['cf6-a', 'cf6-b', 'cf6-trap']],
      ['2...Cc6', ['cc6-a', 'cc6-b']],
    ])
  })

  it('should open the first lesson of every branch and lock the rest, suggesting the first branch', () => {
    const track = lessonTrack(BISHOP, [])
    expect(shape(track)).toEqual([
      ['2...Bc5', ['bc5:OPEN']],
      ['2...Cf6', ['cf6-a:OPEN', 'cf6-b:LOCKED', 'cf6-trap:LOCKED']],
      ['2...Cc6', ['cc6-a:OPEN', 'cc6-b:LOCKED']],
    ])
    expect(track.nextLessonId).toBe('bc5')
  })

  it('should unlock the next lesson of a branch once the previous one is done', () => {
    const track = lessonTrack(BISHOP, ['cf6-a'])
    expect(shape(track)[1]).toEqual(['2...Cf6', ['cf6-a:DONE', 'cf6-b:OPEN', 'cf6-trap:LOCKED']])
    expect(track.nextLessonId).toBe('bc5')
  })

  it('should suggest the next lesson walking the branches in order', () => {
    expect(lessonTrack(BISHOP, ['bc5']).nextLessonId).toBe('cf6-a')
    expect(lessonTrack(BISHOP, ['bc5', 'cf6-a']).nextLessonId).toBe('cf6-b')
    expect(lessonTrack(BISHOP, ['cc6-a']).nextLessonId).toBe('bc5')
    expect(lessonTrack(BISHOP, BISHOP.map((l) => l.id)).nextLessonId).toBeNull()
  })

  it('should keep a lesson open when the one before it is done, even if an earlier one is not', () => {
    const track = lessonTrack(BISHOP, ['cf6-b'])
    expect(shape(track)[1]).toEqual(['2...Cf6', ['cf6-a:OPEN', 'cf6-b:DONE', 'cf6-trap:OPEN']])
  })

  it('should make a single sequential branch of lessons without a branch, as the trail was before', () => {
    const track = lessonTrack([lesson('b', 2, null), lesson('a', 1, null), lesson('c', 3, null)], ['a'])
    expect(shape(track)).toEqual([[null, ['a:DONE', 'b:OPEN', 'c:LOCKED']]])
    expect(track.nextLessonId).toBe('b')
  })

  it('should return no branches for an opening without lessons', () => {
    expect(lessonTrack([], [])).toEqual({ branches: [], nextLessonId: null })
  })
})
