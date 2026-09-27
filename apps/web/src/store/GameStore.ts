import { ChessWrapper } from '@/lib/chess'
import { coachComment, gameCopy } from '@/lib/coach-message'
import type { ExerciseCompletion, MoveSummary } from '@chess-openings/domain'
import { create } from 'zustand'

export type ExerciseMove = MoveSummary

// Ciclo de vida da sessão de treinamento. Estados são mutuamente exclusivos, então combinações inválidas não são representáveis. Não pode ter thinking e completed
export type GameStatus =
  | 'idle' // esperando o usuário pensar e jogar (ou, na demonstração, avançar)
  | 'error' // vez do usuário, a última tentativa de lance dele foi errada
  | 'thinking' // O lance do "bot" está em estado pensando - ta dando 300ms do hook useOpponentReveal
  | 'waiting' //Lance correto jogado; Esperando para revelar o lance do "bot"
  | 'completed' // exercício completo

// watch: the line is shown move by move with its comments; the student only steps through.
// practice: the student plays their moves from memory, the opponent replies on its own.
export type SessionMode = 'watch' | 'practice'

// 0: no hint · 1: the piece to move is marked · 2: the whole move is shown.
export type HintLevel = 0 | 1 | 2

const firstChild = (moves: ExerciseMove[], parentId: string | null) =>
  moves.find((m) => m.parentId === parentId)

const findNode = (moves: ExerciseMove[], id: string | null) =>
  moves.find((m) => m.id === id)

// Status quando o tabuleiro chega em `nodeId` e o controle volta para o jogador. Na prática o
// adversário responde sozinho, então a vez dele já entra em "thinking".
function nextStatus(moves: ExerciseMove[], nodeId: string | null, mode: SessionMode): GameStatus {
  const next = firstChild(moves, nodeId)
  if (!next) return 'completed'
  if (mode === 'watch') return 'idle'
  return next.isOpponentResponse ? 'thinking' : 'idle'
}

// Narração de um lance jogado: o comentário do coach ou um texto genérico. Ao concluir,
// o comentário do último lance ainda vence a mensagem de conclusão: num cartão de um lance
// só, ele é a explicação da resposta e não pode se perder.
function landingComment(status: GameStatus, node: ExerciseMove, fallback: string, doneCopy: string): string {
  const comment = coachComment(node)
  if (status === 'completed') return comment ?? doneCopy
  return comment ?? fallback
}

export interface SetupOptions {
  exerciseId?: string
  playerColor?: 'white' | 'black'
  // The landing blunder demo: the opponent's (bad) first move plays before the student's turn.
  autoPlayFirst?: boolean
  intro?: string | null
  mode?: SessionMode
}

interface GameState {
  status: GameStatus
  mode: SessionMode
  fen: string
  comment: string
  exerciseMoves: ExerciseMove[]
  currentNodeId: string | null
  playerColor: 'white' | 'black'
  initialFen: string
  initialComment: string
  exerciseId: string | null
  autoPlayFirst: boolean
  // A card's question. Shown instead of the first move's comment, which on a card explains
  // the answer and would give it away.
  intro: string | null
  // What the practice run cost; the domain turns these into the SM-2 quality and the XP.
  mistakes: number
  pieceHints: number
  revealedMoves: number
  hintLevel: HintLevel
  // Filled once the server has recorded a finished practice run.
  completion: ExerciseCompletion | null
  setupExercise: (initialFen: string, movesTree: ExerciseMove[], options?: SetupOptions) => void
  restartExercise: () => void
  handlePlayerMove: (orig: string, dest: string) => boolean
  requestHint: () => void
  playNextMove: () => void
  commitOpponentMove: () => void
  playPreviousMove: () => void
  setCompletion: (completion: ExerciseCompletion) => void
}

export const useGameStore = create<GameState>((set, get) => ({
  status: 'idle',
  mode: 'practice',
  fen: ChessWrapper.STARTING_FEN,
  comment: '',
  exerciseMoves: [],
  currentNodeId: null,
  playerColor: 'white',
  initialFen: '',
  initialComment: '',
  exerciseId: null,
  autoPlayFirst: false,
  intro: null,
  mistakes: 0,
  pieceHints: 0,
  revealedMoves: 0,
  hintLevel: 0,
  completion: null,

  setupExercise: (initialFen, movesTree, options = {}) => {
    const { exerciseId, playerColor: forcedPlayerColor, autoPlayFirst = false, intro = null, mode = 'practice' } = options
    const firstMove = firstChild(movesTree, null)
    // The side to move plays the first move: that is the student unless the first move is
    // flagged as the opponent's. Reading it from the FEN covers exercises that start
    // mid-game with Black to move (cards of a Black repertoire).
    const sideToMove = initialFen.split(' ')[1] === 'b' ? 'black' : 'white'
    const otherSide = sideToMove === 'white' ? 'black' : 'white'
    const playerColor = forcedPlayerColor ?? (firstMove?.isOpponentResponse ? otherSide : sideToMove)
    const initialComment = autoPlayFirst
      ? gameCopy.watchBlunder
      : mode === 'watch'
        ? gameCopy.watchStart
        : (intro ?? gameCopy.yourTurn)

    set({
      fen: initialFen,
      initialFen,
      initialComment,
      comment: initialComment,
      exerciseMoves: movesTree,
      currentNodeId: null,
      playerColor,
      mode,
      // A line that opens with the opponent's move (a Black repertoire) starts with its reply.
      status: autoPlayFirst ? 'waiting' : mode === 'practice' && firstMove?.isOpponentResponse ? 'thinking' : 'idle',
      exerciseId: exerciseId ?? null,
      autoPlayFirst,
      intro,
      mistakes: 0,
      pieceHints: 0,
      revealedMoves: 0,
      hintLevel: 0,
      completion: null,
    })
  },

  restartExercise: () => {
    const s = get()
    s.setupExercise(s.initialFen, s.exerciseMoves, {
      exerciseId: s.exerciseId ?? undefined,
      playerColor: s.playerColor,
      autoPlayFirst: s.autoPlayFirst,
      intro: s.intro,
      mode: s.mode,
    })
  },

  handlePlayerMove: (orig, dest) => {
    const s = get()
    if (s.mode !== 'practice') return false

    const result = ChessWrapper.playMove(s.fen, { from: orig, to: dest, promotion: 'q' })
    if (!result) {
      set({ status: 'error', comment: gameCopy.illegalMove })
      return false
    }

    const san = result.moveDetails.san
    const expected = s.exerciseMoves.find((m) => m.san === san && m.parentId === s.currentNodeId)
    if (!expected) {
      set({ status: 'error', comment: gameCopy.notTheory(san), mistakes: s.mistakes + 1 })
      return false
    }

    const status = nextStatus(s.exerciseMoves, expected.id, s.mode)
    set({
      fen: result.newFen,
      currentNodeId: expected.id,
      status,
      hintLevel: 0,
      comment: landingComment(status, expected, gameCopy.goodMove(san), gameCopy.lessonCompleted),
    })
    return true
  },

  requestHint: () => {
    const s = get()
    if (s.mode !== 'practice' || (s.status !== 'idle' && s.status !== 'error')) return

    const next = firstChild(s.exerciseMoves, s.currentNodeId)
    if (!next || next.isOpponentResponse) return

    if (s.hintLevel === 0) {
      set({ hintLevel: 1, pieceHints: s.pieceHints + 1, status: 'idle', comment: gameCopy.hintPiece })
    } else if (s.hintLevel === 1) {
      // Revealing the move replaces the piece hint that led to it, so it costs what a
      // revealed move costs, not both.
      set({
        hintLevel: 2,
        pieceHints: s.pieceHints - 1,
        revealedMoves: s.revealedMoves + 1,
        status: 'idle',
        comment: gameCopy.hintMove(next.san),
      })
    }
  },

  playNextMove: () => {
    const s = get()
    if (s.status === 'completed') return

    const next = firstChild(s.exerciseMoves, s.currentNodeId)
    if (!next) return

    // Esperando o adversário: entra na fase "thinking". A resposta é aplicada pelo
    // commitOpponentMove() quando o atraso de "pensar" da UI termina.
    if (s.status === 'waiting') {
      if (next.isOpponentResponse) set({ status: 'thinking' })
      return
    }

    // Só a demonstração avança sozinha; na prática o aluno precisa jogar (ou pedir dica).
    if (s.mode !== 'watch') return
    const status = nextStatus(s.exerciseMoves, next.id, s.mode)
    const fallback = next.isOpponentResponse ? gameCopy.opponentMove(next.san) : gameCopy.lineMove(next.san)
    set({
      fen: next.fen,
      currentNodeId: next.id,
      status,
      comment: landingComment(status, next, fallback, gameCopy.watchDone),
    })
  },

  commitOpponentMove: () => {
    const s = get()
    if (s.status !== 'thinking') return

    const next = firstChild(s.exerciseMoves, s.currentNodeId)
    if (!next) return

    const status = nextStatus(s.exerciseMoves, next.id, s.mode)
    set({
      fen: next.fen,
      currentNodeId: next.id,
      status,
      comment: landingComment(status, next, gameCopy.opponentPlayed(next.san), gameCopy.lessonCompleted),
    })
  },

  playPreviousMove: () => {
    const s = get()
    // Going back mid-practice would let the student replay a move they got wrong for free.
    if (s.mode !== 'watch' || !s.currentNodeId) return

    const current = findNode(s.exerciseMoves, s.currentNodeId)
    if (!current) return

    if (current.parentId === null) {
      set({ fen: s.initialFen, currentNodeId: null, comment: s.initialComment, status: 'idle' })
      return
    }

    const prev = findNode(s.exerciseMoves, current.parentId)
    if (!prev) return

    set({
      fen: prev.fen,
      currentNodeId: prev.id,
      comment: coachComment(prev) ?? gameCopy.previousMove(prev.san),
      status: 'idle',
    })
  },

  setCompletion: (completion) => set({ completion }),
}))
