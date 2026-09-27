import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config as loadEnv } from 'dotenv'
import { DiskCache } from './sources/cache'
import { CachedEngine, LichessCloudEngine, StockfishEngine, type Engine } from './sources/engine'
import { LichessExplorer } from './sources/explorer'

// Shared by the commands: paths, environment, and the engine/explorer every run needs.

export const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const repoRoot = path.resolve(packageDir, '..', '..')
// pnpm runs scripts from the package directory; user paths resolve from where the command
// was typed instead.
export const userCwd = process.env.INIT_CWD ?? process.cwd()

loadEnv({ path: path.join(packageDir, '.env'), quiet: true })
loadEnv({ path: path.join(repoRoot, '.env'), quiet: true })

export const cache = new DiskCache(path.join(repoRoot, '.cache', 'lesson-author'))

export function createEngine(options: { stockfish?: string; depth: number; log: (m: string) => void }): Engine {
  const engines: Engine[] = []
  const stockfishPath = options.stockfish ?? process.env.STOCKFISH_PATH
  if (stockfishPath && !existsSync(stockfishPath)) {
    throw new Error(
      `O Stockfish não foi encontrado em "${stockfishPath}". Confira STOCKFISH_PATH: o nome do .exe muda ` +
        'conforme a versão baixada (ex.: stockfish-windows-x86-64-avx2.exe ou ...-universal.exe).',
    )
  }
  if (stockfishPath) engines.push(new StockfishEngine(stockfishPath, options.depth))
  else options.log('Aviso: sem Stockfish local, só a avaliação em nuvem da Lichess (cobre bem teoria popular; posições raras ficam sem avaliação).')
  engines.push(new LichessCloudEngine())
  return new CachedEngine(engines, cache)
}

export function createExplorer(log: (m: string) => void, amateurRatings?: number[]): LichessExplorer {
  const explorer = new LichessExplorer(process.env.LICHESS_TOKEN, cache, amateurRatings)
  if (!explorer.available) log('Aviso: sem LICHESS_TOKEN, sem estatísticas de partidas.')
  return explorer
}

export function resolveUserPath(p: string): string {
  return path.resolve(userCwd, p)
}
