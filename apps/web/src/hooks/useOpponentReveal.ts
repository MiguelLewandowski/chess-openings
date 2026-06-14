import { useEffect } from 'react'
import { useGameStore } from '@/store/GameStore'
import { OPPONENT_THINK_MS } from '@/lib/timing'

// Commits the opponent's reply after the think-delay whenever the session enters
// the "thinking" phase. Mount once per board screen so the store stays free of
// timers (and synchronously testable).
export function useOpponentReveal() {
  const status = useGameStore((s) => s.status)
  const commitOpponentMove = useGameStore((s) => s.commitOpponentMove)

  useEffect(() => {
    if (status !== 'thinking') return
    const timer = setTimeout(commitOpponentMove, OPPONENT_THINK_MS)
    return () => clearTimeout(timer)
  }, [status, commitOpponentMove])
}
