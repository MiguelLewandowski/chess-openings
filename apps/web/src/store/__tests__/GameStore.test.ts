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

// Plays e4 and lets the opponent answer e5, leaving the student to find Nf3.
function reachNf3() {
  store().handlePlayerMove('e2', 'e4')
  store().commitOpponentMove()
}

describe('setupExercise', () => {
  it('starts practice idle with the "your turn" prompt for a white line', () => {
    store().setupExercise(START, LINE)
    expect(store().mode).toBe('practice')
    expect(store().status).toBe('idle')
    expect(store().playerColor).toBe('white')
    expect(store().comment).toBe(gameCopy.yourTurn)
  })

  it('starts the demonstration with its own prompt', () => {
    store().setupExercise(START, LINE, { mode: 'watch' })
    expect(store().status).toBe('idle')
    expect(store().comment).toBe(gameCopy.watchStart)
  })

  it('waits and shows the blunder prompt when autoPlayFirst is set', () => {
    store().setupExercise(START, LINE, { exerciseId: 'ex', playerColor: 'white', autoPlayFirst: true })
    expect(store().status).toBe('waiting')
    expect(store().comment).toBe(gameCopy.watchBlunder)
  })

  it('plays black and lets the opponent open when the root move is its response', () => {
    store().setupExercise(START, [{ ...LINE[0], isOpponentResponse: true }])
    expect(store().playerColor).toBe('black')
    expect(store().status).toBe('thinking')
  })

  it('plays Black when the exercise starts with Black to move on the student move', () => {
    const blackToMove = 'rnbqkb1r/pp2pppp/3p1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R b KQkq - 2 5'
    const card: ExerciseMove[] = [
      { id: 'k1', san: 'a6', fen: 'rnbqkb1r/1p2pppp/p2p1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 6', parentId: null, isOpponentResponse: false, coachInsights: null, visualMarkers: null },
    ]
    store().setupExercise(blackToMove, card)
    expect(store().playerColor).toBe('black')
  })

  it('keeps the last move explanation on completion when there is one', () => {
    const line = [{ ...LINE[0], coachInsights: { comment: 'e4 ocupa o centro.' } }]
    store().setupExercise(START, line, { exerciseId: 'card', intro: 'Como ocupamos o centro?' })
    store().handlePlayerMove('e2', 'e4')
    expect(store().status).toBe('completed')
    expect(store().comment).toBe('e4 ocupa o centro.')
  })

  it('shows a card question instead of the first move comment, and keeps it on restart', () => {
    const commented = [{ ...LINE[0], coachInsights: { comment: 'e4 ocupa o centro.' } }, ...LINE.slice(1)]
    store().setupExercise(START, commented, { exerciseId: 'card', intro: 'Como ocupamos o centro?' })
    expect(store().comment).toBe('Como ocupamos o centro?')

    store().handlePlayerMove('e2', 'e4')
    store().restartExercise()
    expect(store().comment).toBe('Como ocupamos o centro?')
  })

  it('clears the counters and the recorded result on restart', () => {
    store().setupExercise(START, LINE, { exerciseId: 'ex' })
    store().handlePlayerMove('d2', 'd4')
    store().requestHint()
    store().setCompletion({ quality: 3, xpEarned: 6, intervalDays: 1, nextReview: '2026-10-01T00:00:00.000Z' })

    store().restartExercise()
    expect(store()).toMatchObject({ mistakes: 0, pieceHints: 0, revealedMoves: 0, hintLevel: 0, completion: null })
  })
})

describe('handlePlayerMove', () => {
  beforeEach(() => store().setupExercise(START, LINE))

  it('rejects an illegal move', () => {
    expect(store().handlePlayerMove('e2', 'e5')).toBe(false)
    expect(store().status).toBe('error')
    expect(store().comment).toBe(gameCopy.illegalMove)
  })

  it('rejects a legal but off-line move and counts the mistake', () => {
    expect(store().handlePlayerMove('d2', 'd4')).toBe(false)
    expect(store().status).toBe('error')
    expect(store().mistakes).toBe(1)
  })

  it('accepts the expected move and lets the opponent reply on its own', () => {
    expect(store().handlePlayerMove('e2', 'e4')).toBe(true)
    expect(store().currentNodeId).toBe('m1')
    expect(store().status).toBe('thinking')
  })

  it('completes when the correct move ends the line', () => {
    store().setupExercise(START, [LINE[0]])
    store().handlePlayerMove('e2', 'e4')
    expect(store().status).toBe('completed')
    expect(store().comment).toBe(gameCopy.lessonCompleted)
  })

  it('ignores board moves during the demonstration', () => {
    store().setupExercise(START, LINE, { mode: 'watch' })
    expect(store().handlePlayerMove('e2', 'e4')).toBe(false)
    expect(store().currentNodeId).toBeNull()
    expect(store().mistakes).toBe(0)
  })
})

describe('requestHint', () => {
  beforeEach(() => store().setupExercise(START, LINE))

  it('first marks the piece, then reveals the move', () => {
    store().requestHint()
    expect(store()).toMatchObject({ hintLevel: 1, pieceHints: 1, revealedMoves: 0, comment: gameCopy.hintPiece })

    store().requestHint()
    // The reveal replaces the piece hint that led to it: it costs 2, not 1 + 2.
    expect(store()).toMatchObject({ hintLevel: 2, pieceHints: 0, revealedMoves: 1, comment: gameCopy.hintMove('e4') })

    store().requestHint()
    expect(store()).toMatchObject({ hintLevel: 2, pieceHints: 0, revealedMoves: 1 })
  })

  it('clears the error state so the student can try again', () => {
    store().handlePlayerMove('d2', 'd4')
    store().requestHint()
    expect(store().status).toBe('idle')
    expect(store().mistakes).toBe(1)
  })

  it('resets for the next move but keeps the run totals', () => {
    store().requestHint()
    reachNf3()
    expect(store().hintLevel).toBe(0)
    expect(store().pieceHints).toBe(1)
  })

  it('does nothing while the opponent is thinking or during the demonstration', () => {
    store().handlePlayerMove('e2', 'e4')
    store().requestHint()
    expect(store().pieceHints).toBe(0)

    store().setupExercise(START, LINE, { mode: 'watch' })
    store().requestHint()
    expect(store().pieceHints).toBe(0)
  })
})

describe('practice never reveals moves for free', () => {
  beforeEach(() => store().setupExercise(START, LINE))

  it('ignores playNextMove on the student turn', () => {
    store().playNextMove()
    expect(store().currentNodeId).toBeNull()
  })

  it('ignores playPreviousMove', () => {
    reachNf3()
    store().playPreviousMove()
    expect(store().currentNodeId).toBe('m2')
  })
})

describe('opponent reply', () => {
  beforeEach(() => {
    store().setupExercise(START, LINE)
    store().handlePlayerMove('e2', 'e4')
  })

  it('commits the opponent move and returns control to the player', () => {
    store().commitOpponentMove()
    expect(store().currentNodeId).toBe('m2')
    expect(store().fen).toBe(LINE[1].fen)
    expect(store().status).toBe('idle')
  })

  it('ignores commitOpponentMove outside the thinking phase', () => {
    store().commitOpponentMove()
    store().commitOpponentMove()
    expect(store().currentNodeId).toBe('m2')
  })
})

describe('demonstration', () => {
  beforeEach(() => store().setupExercise(START, LINE, { mode: 'watch' }))

  it('steps through both sides and completes at the end of the line', () => {
    store().playNextMove()
    expect(store().currentNodeId).toBe('m1')
    expect(store().status).toBe('idle')

    store().playNextMove()
    expect(store().currentNodeId).toBe('m2')
    expect(store().comment).toBe(gameCopy.opponentMove('e5'))

    store().playNextMove()
    expect(store().currentNodeId).toBe('m3')
    expect(store().status).toBe('completed')
    expect(store().comment).toBe(gameCopy.watchDone)
  })

  it('steps back to the parent and then to the initial position', () => {
    store().playNextMove()
    store().playNextMove()

    store().playPreviousMove()
    expect(store().currentNodeId).toBe('m1')
    expect(store().status).toBe('idle')

    store().playPreviousMove()
    expect(store().currentNodeId).toBeNull()
    expect(store().fen).toBe(START)
  })
})
