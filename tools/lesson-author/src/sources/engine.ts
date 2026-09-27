import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { createInterface } from 'node:readline'
import { sideToMove, uciLineToSan } from '../chess/notation'
import type { Color } from '../chess/types'
import type { DiskCache } from './cache'

// One principal variation. Scores are always from White's point of view, whatever the
// source reports, so callers never have to remember whose turn it was.
export interface EngineLine {
  san: string[]
  cp: number | null
  mate: number | null
}

export interface EngineResult {
  source: string
  depth: number
  lines: EngineLine[]
}

export interface Engine {
  readonly name: string
  analyse(fen: string, multiPv: number): Promise<EngineResult | null>
  close(): Promise<void>
}

// Centipawns from the student's side; a forced mate counts as a huge advantage.
export function studentCp(line: EngineLine | undefined, student: Color): number | null {
  if (!line) return null
  const white = line.mate !== null ? Math.sign(line.mate) * (10_000 - Math.abs(line.mate) * 10) : line.cp
  if (white === null) return null
  return student === 'w' ? white : -white
}

export function formatCp(cp: number | null): string {
  if (cp === null) return '?'
  if (Math.abs(cp) >= 9_000) return cp > 0 ? 'mate a favor' : 'mate contra'
  return `${cp >= 0 ? '+' : ''}${(cp / 100).toFixed(2)}`
}

// ---------------------------------------------------------------------------------------
// Stockfish over UCI

export interface UciInfo {
  depth: number
  multipv: number
  cp: number | null
  mate: number | null
  pv: string[]
}

// Parses an "info ... score ... pv ..." line. Returns null for lines without a PV
// (currmove, string, hashfull...).
export function parseUciInfo(line: string): UciInfo | null {
  if (!line.startsWith('info ') || !line.includes(' pv ')) return null
  const depth = Number(line.match(/ depth (\d+)/)?.[1])
  const multipv = Number(line.match(/ multipv (\d+)/)?.[1] ?? 1)
  const cp = line.match(/ score cp (-?\d+)/)?.[1]
  const mate = line.match(/ score mate (-?\d+)/)?.[1]
  const pv = line.split(' pv ')[1]?.trim().split(/\s+/) ?? []
  if (!depth || pv.length === 0 || (cp === undefined && mate === undefined)) return null
  return { depth, multipv, cp: cp !== undefined ? Number(cp) : null, mate: mate !== undefined ? Number(mate) : null, pv }
}

export class StockfishEngine implements Engine {
  readonly name: string
  private process: ChildProcessWithoutNullStreams | null = null
  private listeners: ((line: string) => void)[] = []
  private queue: Promise<unknown> = Promise.resolve()

  constructor(
    private readonly binaryPath: string,
    private readonly depth: number,
  ) {
    this.name = `stockfish-d${depth}`
  }

  analyse(fen: string, multiPv: number): Promise<EngineResult | null> {
    // UCI is a single conversation; serialise the requests.
    const run = this.queue.then(() => this.runAnalysis(fen, multiPv))
    this.queue = run.catch(() => undefined)
    return run
  }

  async close(): Promise<void> {
    this.process?.stdin.write('quit\n')
    this.process = null
  }

  private async start(): Promise<void> {
    if (this.process) return
    const child = spawn(this.binaryPath, [], { stdio: 'pipe' })
    this.process = child
    // Without a listener, a failed spawn (bad path, blocked executable) crashes the whole
    // process with an unhandled 'error' event instead of a readable message.
    const failed = new Promise<never>((_, reject) =>
      child.once('error', (error) => reject(new Error(`Não foi possível iniciar o Stockfish (${this.binaryPath}): ${error.message}`))),
    )
    createInterface({ input: child.stdout }).on('line', (line) => this.listeners.forEach((l) => l(line)))
    this.send('uci')
    await Promise.race([this.waitFor((line) => line === 'uciok'), failed])
    this.send('setoption name Threads value 2')
    this.send('setoption name Hash value 256')
  }

  private async runAnalysis(fen: string, multiPv: number): Promise<EngineResult | null> {
    await this.start()
    this.send(`setoption name MultiPV value ${multiPv}`)
    this.send('isready')
    await this.waitFor((line) => line === 'readyok')

    const best = new Map<number, UciInfo>()
    const collect = (line: string) => {
      const info = parseUciInfo(line)
      if (info) best.set(info.multipv, info)
    }
    this.listeners.push(collect)
    this.send(`position fen ${fen}`)
    this.send(`go depth ${this.depth}`)
    await this.waitFor((line) => line.startsWith('bestmove'))
    this.listeners = this.listeners.filter((l) => l !== collect)

    // UCI scores are from the side to move; flip them to White's view.
    const flip = sideToMove(fen) === 'b' ? -1 : 1
    const lines = [...best.entries()]
      .sort(([a], [b]) => a - b)
      .map(([, info]) => ({
        san: uciLineToSan(fen, info.pv),
        cp: info.cp !== null ? info.cp * flip : null,
        mate: info.mate !== null ? info.mate * flip : null,
      }))
      .filter((line) => line.san.length > 0)
    return lines.length > 0 ? { source: this.name, depth: this.depth, lines } : null
  }

  private send(command: string): void {
    this.process?.stdin.write(`${command}\n`)
  }

  private waitFor(predicate: (line: string) => boolean): Promise<void> {
    return new Promise((resolve) => {
      const listener = (line: string) => {
        if (!predicate(line)) return
        this.listeners = this.listeners.filter((l) => l !== listener)
        resolve()
      }
      this.listeners.push(listener)
    })
  }
}

// ---------------------------------------------------------------------------------------
// Lichess cloud evaluation — free, no token, but only covers positions someone already
// analysed deeply on Lichess (most opening theory, few odd side lines).

const CLOUD_REQUEST_GAP_MS = 1_000

interface CloudEval {
  depth: number
  pvs: { moves: string; cp?: number; mate?: number }[]
}

export class LichessCloudEngine implements Engine {
  readonly name = 'lichess-cloud'

  async analyse(fen: string, multiPv: number): Promise<EngineResult | null> {
    // Bursts get the whole IP blocked for minutes (every request answers 429), so space
    // them out; the disk cache in front of this makes repeated runs free anyway.
    await sleep(CLOUD_REQUEST_GAP_MS)
    const url = `https://lichess.org/api/cloud-eval?fen=${encodeURIComponent(fen)}&multiPv=${multiPv}`
    const response = await fetchWithBackoff(url)
    if (!response || !response.ok) return null
    const data = (await response.json()) as CloudEval
    const lines = data.pvs
      .map((pv) => ({ san: uciLineToSan(fen, pv.moves.split(' ')), cp: pv.cp ?? null, mate: pv.mate ?? null }))
      .filter((line) => line.san.length > 0)
    return lines.length > 0 ? { source: this.name, depth: data.depth, lines } : null
  }

  async close(): Promise<void> {}
}

// Tries a local Stockfish first (it can analyse any position), then the cloud.
export class CachedEngine implements Engine {
  readonly name: string

  constructor(
    private readonly engines: Engine[],
    private readonly cache: DiskCache,
  ) {
    this.name = engines.map((e) => e.name).join('+')
  }

  async analyse(fen: string, multiPv: number): Promise<EngineResult | null> {
    for (const engine of this.engines) {
      const result = await this.cache.wrap(`engine-${engine.name}`, `${multiPv}|${fen}`, () => engine.analyse(fen, multiPv))
      if (result) return result
    }
    return null
  }

  async close(): Promise<void> {
    await Promise.all(this.engines.map((e) => e.close()))
  }
}

export async function fetchWithBackoff(url: string, init: RequestInit = {}, attempts = 4): Promise<Response | null> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await fetch(url, init)
      // Lichess asks clients to wait a full minute after a 429.
      if (response.status === 429) {
        await sleep(60_000)
        continue
      }
      return response
    } catch {
      await sleep(1_000 * (attempt + 1))
    }
  }
  return null
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
