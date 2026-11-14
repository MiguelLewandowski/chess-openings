import { parseUciInfo, type Evaluation } from './eval-bar'
import { parseBestMove, type UciMove } from './sparring'

const ENGINE_URL = '/stockfish/stockfish-19-lite-single.js'

// Shallow depths come out in a few milliseconds and swing a lot; reporting them would only
// make the bar jitter before the real number arrives.
const MIN_REPORTED_DEPTH = 6

interface PendingSearch {
  resolve: (bestMoveLine: string | null) => void
  onInfo?: (line: string) => void
}

// Talks UCI to the in-browser Stockfish running in a Web Worker, so the search never blocks
// the page. One request at a time: a new search (move or analysis) supersedes the pending one.
export class StockfishEngine {
  private readonly worker: Worker
  private readonly ready: Promise<void>
  private pending: PendingSearch | null = null
  // Every "go" answers with exactly one "bestmove", even after a "stop". Until it does, the
  // engine is still searching and must not get a new position: the wasm build crashes on it.
  private searching = false
  private idleWaiters: (() => void)[] = []
  // Bumped by every cancel, so a request still waiting for the engine knows it was superseded.
  private generation = 0

  constructor() {
    this.worker = new Worker(ENGINE_URL)
    this.ready = new Promise((resolve) => {
      const onReady = (event: MessageEvent) => {
        if (event.data === 'readyok') {
          this.worker.removeEventListener('message', onReady)
          resolve()
        }
      }
      this.worker.addEventListener('message', onReady)
    })
    this.worker.addEventListener('message', (event: MessageEvent) => {
      if (typeof event.data !== 'string') return
      // A cancelled search keeps talking until its "bestmove"; with no pending request, it is ignored.
      if (event.data.startsWith('info')) {
        this.pending?.onInfo?.(event.data)
        return
      }
      if (!event.data.startsWith('bestmove')) return
      this.searching = false
      const pending = this.pending
      this.pending = null
      pending?.resolve(event.data)
      const waiters = this.idleWaiters
      this.idleWaiters = []
      waiters.forEach((wake) => wake())
    })
    this.send('uci')
    this.send('isready')
  }

  async bestMove(fen: string, { skill, movetimeMs }: { skill: number; movetimeMs: number }): Promise<UciMove | null> {
    const line = await this.search(fen, skill, `go movetime ${movetimeMs}`)
    return line ? parseBestMove(line) : null
  }

  // Full-strength evaluation of `fen` down to `depth`. `onUpdate` receives each deeper result
  // as it comes, so the caller can show it live; the promise resolves with the deepest one, or
  // null when the analysis was superseded or cancelled.
  async analyze(fen: string, { depth, onUpdate }: { depth: number; onUpdate?: (evaluation: Evaluation) => void }): Promise<Evaluation | null> {
    let latest: Evaluation | null = null
    const line = await this.search(fen, 20, `go depth ${depth}`, (info) => {
      const parsed = parseUciInfo(info, fen)
      if (!parsed) return
      latest = parsed.evaluation
      if (parsed.depth >= Math.min(depth, MIN_REPORTED_DEPTH)) onUpdate?.(parsed.evaluation)
    })
    return line ? latest : null
  }

  // Drops the search in flight (e.g. the student undid or moved on mid-think): the pending
  // request resolves empty and the engine's late answer is ignored.
  cancel(): void {
    this.generation += 1
    this.pending?.resolve(null)
    this.pending = null
    if (this.searching) this.send('stop')
  }

  terminate(): void {
    this.cancel()
    this.worker.terminate()
  }

  private async search(fen: string, skill: number, go: string, onInfo?: (line: string) => void): Promise<string | null> {
    await this.ready
    this.cancel()
    const generation = this.generation
    await this.whenIdle()
    if (generation !== this.generation) return null
    return new Promise((resolve) => {
      this.pending = { resolve, onInfo }
      this.searching = true
      this.send(`setoption name Skill Level value ${skill}`)
      this.send(`position fen ${fen}`)
      this.send(go)
    })
  }

  private whenIdle(): Promise<void> {
    if (!this.searching) return Promise.resolve()
    return new Promise((resolve) => this.idleWaiters.push(resolve))
  }

  private send(command: string): void {
    this.worker.postMessage(command)
  }
}
