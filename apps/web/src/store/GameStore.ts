import { ChessWrapper } from '@/lib/chess'
import { coachComment, gameCopy } from '@/lib/coach-message'
import type { MoveSummary } from '@chess-openings/domain'
import { create } from 'zustand'

export type ExerciseMove = MoveSummary

// Lifecycle of a training session. States are mutually exclusive, so invalid
// combinations (e.g. "thinking" while "completed") are unrepresentable.
export type GameStatus =
  | 'idle' // waiting for the player's move
  | 'error' // player's turn; last attempt was wrong (board stays interactive)
  | 'thinking' // the opponent's move is animating
  | 'waiting' // correct move played; waiting to reveal the opponent's reply
  | 'completed' // exercise finished

const firstChild = (moves: ExerciseMove[], parentId: string | null) =>
  moves.find((m) => m.parentId === parentId)

const findNode = (moves: ExerciseMove[], id: string | null) =>
  moves.find((m) => m.id === id)

// Status once the board lands on `nodeId` and control returns to the player.
function nextStatus(moves: ExerciseMove[], nodeId: string): GameStatus {
  const next = firstChild(moves, nodeId)
  if (!next) return 'completed'
  return next.isOpponentResponse ? 'waiting' : 'idle'
}

// Narration for a landed move: the completion line, the coach's own comment, or
// a generic fallback.
function landingComment(status: GameStatus, node: ExerciseMove, fallback: string): string {
  return status === 'completed' ? gameCopy.lessonCompleted : coachComment(node) ?? fallback
}

interface GameState {
  status: GameStatus
  fen: string
  comment: string
  exerciseMoves: ExerciseMove[]
  currentNodeId: string | null
  playerColor: 'white' | 'black'
  initialFen: string
  initialComment: string
  exerciseId: string | null
  errorCount: number
  autoPlayFirst: boolean
  setupExercise: (
    initialFen: string,
    movesTree: ExerciseMove[],
    exerciseId?: string,
    playerColor?: 'white' | 'black',
    autoPlayFirst?: boolean,
  ) => void
  restartExercise: () => void
  handlePlayerMove: (orig: string, dest: string) => boolean
  playNextMove: () => void
  commitOpponentMove: () => void
  playPreviousMove: () => void
}

export const useGameStore = create<GameState>((set, get) => ({
  status: 'idle',
  fen: ChessWrapper.STARTING_FEN,
  comment: '',
  exerciseMoves: [],
  currentNodeId: null,
  playerColor: 'white',
  initialFen: '',
  initialComment: '',
  exerciseId: null,
  errorCount: 0,
  autoPlayFirst: false,

  setupExercise: (initialFen, movesTree, exerciseId, forcedPlayerColor, autoPlayFirst = false) => {
    const firstMove = firstChild(movesTree, null)
    const playerColor = forcedPlayerColor ?? (firstMove?.isOpponentResponse ? 'black' : 'white')
    const hint = firstMove ? coachComment(firstMove) : null
    const initialComment = autoPlayFirst
      ? gameCopy.watchBlunder
      : hint
        ? gameCopy.hint(hint)
        : gameCopy.yourTurn

    set({
      fen: initialFen,
      initialFen,
      initialComment,
      comment: initialComment,
      exerciseMoves: movesTree,
      currentNodeId: null,
      playerColor,
      status: autoPlayFirst ? 'waiting' : 'idle',
      exerciseId: exerciseId ?? null,
      errorCount: 0,
      autoPlayFirst,
    })
  },

  restartExercise: () => {
    const s = get()
    s.setupExercise(s.initialFen, s.exerciseMoves, s.exerciseId ?? undefined, s.playerColor, s.autoPlayFirst)
  },

  handlePlayerMove: (orig, dest) => {
    const s = get()
    const result = ChessWrapper.playMove(s.fen, { from: orig, to: dest, promotion: 'q' })
    if (!result) {
      set({ status: 'error', comment: gameCopy.illegalMove })
      return false
    }

    const san = result.moveDetails.san
    const expected = s.exerciseMoves.find((m) => m.san === san && m.parentId === s.currentNodeId)
    if (!expected) {
      set({ status: 'error', comment: gameCopy.notTheory(san), errorCount: s.errorCount + 1 })
      return false
    }

    const status = nextStatus(s.exerciseMoves, expected.id)
    set({
      fen: result.newFen,
      currentNodeId: expected.id,
      status,
      comment: landingComment(status, expected, gameCopy.goodMove(san)),
    })
    return true
  },

  playNextMove: () => {
    const s = get()
    if (s.status === 'completed') return

    const next = firstChild(s.exerciseMoves, s.currentNodeId)
    if (!next) return

    // Waiting on the opponent: enter the thinking phase. The reply is applied by
    // commitOpponentMove() once the UI think-delay elapses.
    if (s.status === 'waiting') {
      if (next.isOpponentResponse) set({ status: 'thinking' })
      return
    }

    // Theory stepping: reveal the next player move.
    if (next.isOpponentResponse) return
    const status = nextStatus(s.exerciseMoves, next.id)
    set({
      fen: next.fen,
      currentNodeId: next.id,
      status,
      comment: landingComment(status, next, gameCopy.goodMove(next.san)),
    })
  },

  commitOpponentMove: () => {
    const s = get()
    if (s.status !== 'thinking') return

    const next = firstChild(s.exerciseMoves, s.currentNodeId)
    if (!next) return

    const status = nextStatus(s.exerciseMoves, next.id)
    set({
      fen: next.fen,
      currentNodeId: next.id,
      status,
      comment: landingComment(status, next, gameCopy.opponentPlayed(next.san)),
    })
  },

  playPreviousMove: () => {
    const s = get()
    if (!s.currentNodeId) return

    const current = findNode(s.exerciseMoves, s.currentNodeId)
    if (!current) return

    if (current.parentId === null) {
      set({ fen: s.initialFen, currentNodeId: null, comment: s.initialComment, status: 'idle' })
      return
    }

    const prev = findNode(s.exerciseMoves, current.parentId)
    if (!prev) return

    const next = firstChild(s.exerciseMoves, prev.id)
    set({
      fen: prev.fen,
      currentNodeId: prev.id,
      comment: coachComment(prev) ?? gameCopy.previousMove(prev.san),
      status: next?.isOpponentResponse ? 'waiting' : 'idle',
    })
  },
}))
