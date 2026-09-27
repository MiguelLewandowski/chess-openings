// Serves the in-browser engine from public/stockfish. The npm package ships every build
// (~200MB); the app only needs the lite single-threaded one (~1.8MB), which runs without the
// cross-origin isolation headers the multi-threaded builds require. The .js finds its .wasm
// next to itself, so both keep their original names.
import { copyFileSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const bin = join(dirname(require.resolve('stockfish/package.json')), 'bin')
const target = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'stockfish')

mkdirSync(target, { recursive: true })
for (const file of ['stockfish-19-lite-single.js', 'stockfish-19-lite-single.wasm']) {
  copyFileSync(join(bin, file), join(target, file))
}
