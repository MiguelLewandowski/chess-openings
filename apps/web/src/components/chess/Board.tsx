'use client'

import { useGameStore } from '@/store/GameStore'
import { useEffect, useRef } from 'react'

import { Chessground } from 'chessground'
import { Api } from 'chessground/api'
import { ChessWrapper } from '@/lib/chess'
import { hintShapes, toBoardShapes } from '@/lib/board-shapes'

export default function Board() {
  const { fen, status, mode, playerColor, currentNodeId, exerciseMoves, hintLevel } = useGameStore()
  const boardRef = useRef<HTMLDivElement>(null)

  const cgRef = useRef<Api | null>(null)

  useEffect(() => {
    if (!boardRef.current || cgRef.current) return

    const { fen: currentFen, playerColor: color } = useGameStore.getState()

    cgRef.current = Chessground(boardRef.current, {
      fen: currentFen,
      turnColor: color,
      orientation: color,
      premovable: { enabled: false },
      movable: { color, free: false, dests: ChessWrapper.getLegalMovesMap(currentFen) },
      events: {
        move: (orig, dest) => {
          const ok = useGameStore.getState().handlePlayerMove(orig, dest)
          if (ok) return
          const { fen: storeFen, playerColor: storeColor } = useGameStore.getState()
          cgRef.current?.set({
            fen: storeFen,
            turnColor: storeColor,
            movable: { color: storeColor, free: false, dests: ChessWrapper.getLegalMovesMap(storeFen) },
          })
        },
      },
    })

    return () => {
      cgRef.current?.destroy()
      cgRef.current = null
    }
  }, [])


  useEffect(() => {
    if (!cgRef.current) return

    const isWhiteTurn = fen.split(' ')[1] === 'w'
    const color = isWhiteTurn ? 'white' : 'black'
    // In the demonstration the student only watches; the pieces move through the controls.
    const canMove = mode === 'practice' && color === playerColor && (status === 'idle' || status === 'error')
    const currentMove = exerciseMoves.find((m) => m.id === currentNodeId)
    const nextMove = exerciseMoves.find((m) => m.parentId === currentNodeId)

    cgRef.current.set({
      fen,
      // Set on every change, not only at mount: moving between exercises (e.g. from a
      // White lesson to a card, or across repertoires) reuses this board.
      orientation: playerColor,
      turnColor: color,
      premovable: { enabled: false },
      movable: {
        color: playerColor,
        free: false,
        dests: canMove ? ChessWrapper.getLegalMovesMap(fen) : new Map(),
      },
      drawable: {
        enabled: true,
        visible: true,
        autoShapes: [...toBoardShapes(currentMove?.visualMarkers), ...hintShapes(fen, nextMove?.san, hintLevel)],
      },
    })
  }, [fen, status, mode, playerColor, currentNodeId, exerciseMoves, hintLevel])

  return (
    <div className="flex flex-col items-center w-full h-full bg-surface-card">
      <div ref={boardRef} className="w-full h-full mx-auto" />
    </div>
  )
}
