import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore, type ExerciseMove } from '@/store/GameStore'
import { gameCopy } from '@/lib/coach-message'

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

// 1.e4 (player) e5 (opponent) Nf3 (player)
const LINE: ExerciseMove[] = [
  { id: 'm1', san: 'e4', fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1', parentId: null, isOpponentResponse: false, coachInsights: null, visualMarkers: null },
  { id: 'm2', san: 'e5', fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2', parentId: 'm1', isOpponentResponse: true, coachInsights: null, visualMarkers: null },
  { id: 'm3', san: 'Nf3', fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2', parentId: 'm2', isOpponentResponse: false, coachInsights: null, visualMarkers: null },
]

const store = () => useGameStore.getState()

describe('setupExercise', () => {
  it('starts idle with the "your turn" prompt for a white line', () => {
    store().setupExercise(START, LINE)
    expect(store().status).toBe('idle')
    expect(store().playerColor).toBe('white')
    expect(store().comment).toBe(gameCopy.yourTurn)
  })

  it('waits and shows the blunder prompt when autoPlayFirst is set', () => {
    store().setupExercise(START, LINE, 'ex', 'white', true)
    expect(store().status).toBe('waiting')
    expect(store().comment).toBe(gameCopy.watchBlunder)
  })

  it('infers black when the root move is the opponent response', () => {
    store().setupExercise(START, [{ ...LINE[0], isOpponentResponse: true }])
    expect(store().playerColor).toBe('black')
  })
})

describe('handlePlayerMove', () => {
  beforeEach(() => store().setupExercise(START, LINE))

  it('rejects an illegal move', () => {
    expect(store().handlePlayerMove('e2', 'e5')).toBe(false)
    expect(store().status).toBe('error')
    expect(store().comment).toBe(gameCopy.illegalMove)
  })

  it('rejects a legal but off-theory move and counts the error', () => {
    expect(store().handlePlayerMove('d2', 'd4')).toBe(false)
    expect(store().status).toBe('error')
    expect(store().errorCount).toBe(1)
  })

  it('accepts the expected move and waits for the opponent reply', () => {
    expect(store().handlePlayerMove('e2', 'e4')).toBe(true)
    expect(store().currentNodeId).toBe('m1')
    expect(store().status).toBe('waiting')
  })

  it('completes when the correct move ends the line', () => {
    store().setupExercise(START, [LINE[0]])
    store().handlePlayerMove('e2', 'e4')
    expect(store().status).toBe('completed')
    expect(store().comment).toBe(gameCopy.lessonCompleted)
  })
})

describe('opponent reveal', () => {
  beforeEach(() => {
    store().setupExercise(START, LINE)
    store().handlePlayerMove('e2', 'e4')
  })

  it('enters thinking before committing the reply', () => {
    store().playNextMove()
    expect(store().status).toBe('thinking')
    expect(store().currentNodeId).toBe('m1')
  })

  it('commits the opponent move and returns control to the player', () => {
    store().playNextMove()
    store().commitOpponentMove()
    expect(store().currentNodeId).toBe('m2')
    expect(store().fen).toBe(LINE[1].fen)
    expect(store().status).toBe('idle')
  })

  it('ignores commitOpponentMove outside the thinking phase', () => {
    store().commitOpponentMove()
    expect(store().currentNodeId).toBe('m1')
    expect(store().status).toBe('waiting')
  })
})

describe('playPreviousMove', () => {
  it('steps back to the parent and then to the initial position', () => {
    store().setupExercise(START, LINE)
    store().handlePlayerMove('e2', 'e4')
    store().playNextMove()
    store().commitOpponentMove()
    expect(store().currentNodeId).toBe('m2')

    store().playPreviousMove()
    expect(store().currentNodeId).toBe('m1')
    expect(store().status).toBe('waiting') // the child is the opponent's reply

    store().playPreviousMove()
    expect(store().currentNodeId).toBeNull()
    expect(store().fen).toBe(START)
    expect(store().status).toBe('idle')
  })
})

describe('theory stepping', () => {
  it('reveals player moves and completes at the end of the line', () => {
    const theory: ExerciseMove[] = [
      { ...LINE[0], id: 't1' },
      { ...LINE[2], id: 't2', parentId: 't1' },
    ]
    store().setupExercise(START, theory)

    store().playNextMove()
    expect(store().currentNodeId).toBe('t1')
    expect(store().status).toBe('idle')

    store().playNextMove()
    expect(store().currentNodeId).toBe('t2')
    expect(store().status).toBe('completed')
  })
})
