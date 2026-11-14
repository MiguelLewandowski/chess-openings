import { useEffect, useRef, useState } from 'react'
import type { Evaluation } from '@/lib/eval-bar'
import { StockfishEngine } from '@/lib/stockfish'

// Evaluates `fen` with the in-browser Stockfish while `enabled`, cancelling the previous
// analysis whenever the position changes. The engine (a Web Worker) is only started the
// first time it is needed. Until the new position has a result, the last one is returned, so
// the bar glides from one value to the next instead of snapping back to the middle.
export function useEngineEvaluation(fen: string, { enabled, depth }: { enabled: boolean; depth: number }): Evaluation | null {
  const engineRef = useRef<StockfishEngine | null>(null)
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null)

  useEffect(
    () => () => {
      engineRef.current?.terminate()
      engineRef.current = null
    },
    [],
  )

  useEffect(() => {
    if (!enabled) return
    engineRef.current ??= new StockfishEngine()
    const engine = engineRef.current
    let current = true
    const accept = (result: Evaluation | null) => {
      if (current && result) setEvaluation(result)
    }
    engine.analyze(fen, { depth, onUpdate: accept }).then(accept)
    return () => {
      current = false
      engine.cancel()
    }
  }, [fen, enabled, depth])

  return enabled ? evaluation : null
}
