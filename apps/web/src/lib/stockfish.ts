import { parseBestMove, type UciMove } from './sparring'

const ENGINE_URL = '/stockfish/stockfish-19-lite-single.js'

// Talks UCI to the in-browser Stockfish running in a Web Worker, so the search never blocks
// the page. One request at a time: asking for a new move supersedes the pending one.
export class StockfishEngine {
  private readonly worker: Worker
  private readonly ready: Promise<void>
  private pending: ((move: UciMove | null) => void) | null = null
  // Every "go" answers with exactly one "bestmove", in order, even after a "stop". Counting the
  // searches in flight tells a stale answer (for a position already left) from the current one.
  private searches = 0

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
      if (typeof event.data !== 'string' || !event.data.startsWith('bestmove')) return
      this.searches -= 1
      if (this.searches > 0) return
      const resolve = this.pending
      this.pending = null
      resolve?.(parseBestMove(event.data))
    })
    this.send('uci')
    this.send('isready')
  }

  async bestMove(fen: string, { skill, movetimeMs }: { skill: number; movetimeMs: number }): Promise<UciMove | null> {
    await this.ready
    this.cancel()
    return new Promise((resolve) => {
      this.pending = resolve
      this.searches += 1
      this.send(`setoption name Skill Level value ${skill}`)
      this.send(`position fen ${fen}`)
      this.send(`go movetime ${movetimeMs}`)
    })
  }

  // Drops the search in flight (e.g. the student undid or restarted mid-think): the pending
  // request resolves empty and the engine's late answer is ignored.
  cancel(): void {
    this.pending?.(null)
    this.pending = null
    if (this.searches > 0) this.send('stop')
  }

  terminate(): void {
    this.cancel()
    this.worker.terminate()
  }

  private send(command: string): void {
    this.worker.postMessage(command)
  }
}
