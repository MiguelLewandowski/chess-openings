'use client'

import { useGameStore } from '@/store/GameStore'
import { useEffect, useRef } from 'react'

import { Chessground } from 'chessground'
import { Api } from 'chessground/api'
import { ChessWrapper } from '@/lib/chess'
import { toBoardShapes } from '@/lib/board-shapes'

export default function Board() {
  const { fen, status, playerColor, currentNodeId, exerciseMoves } = useGameStore()
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
    const canMove = color === playerColor && (status === 'idle' || status === 'error')
    const currentMove = exerciseMoves.find((m) => m.id === currentNodeId)

    cgRef.current.set({
      fen,
      turnColor: color,
      premovable: { enabled: false },
      movable: {
        color: playerColor,
        free: false,
        dests: canMove ? ChessWrapper.getLegalMovesMap(fen) : new Map(),
      },
      drawable: { enabled: true, visible: true, autoShapes: toBoardShapes(currentMove?.visualMarkers) },
    })
  }, [fen, status, playerColor, currentNodeId, exerciseMoves])

  return (
    <div className="flex flex-col items-center w-full h-full bg-surface-card">
      <div ref={boardRef} className="w-full h-full mx-auto" />
    </div>
  )
}
