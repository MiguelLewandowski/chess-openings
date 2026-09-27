// Writes content/primeiros-passos.pgn from the tutorial script. Import it with:
//   pnpm lessons:import content/primeiros-passos.pgn --tutorial
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { tutorialToPgn } from './pgn'
import { PRIMEIROS_PASSOS } from './primeiros-passos'

const target = fileURLToPath(new URL('../../../../content/primeiros-passos.pgn', import.meta.url))
writeFileSync(target, tutorialToPgn(PRIMEIROS_PASSOS))
console.log(`${PRIMEIROS_PASSOS.lessons.length} lições → ${target}`)
