#!/usr/bin/env tsx
/**
 * Importa puzzles de abertura da base de dados de puzzles do Lichess.
 *
 * SETUP (uma vez):
 *   1. Descarrega o CSV (atenção: ~350 MB comprimido, ~1.5 GB descomprimido):
 *        curl -L "https://database.lichess.org/lichess_db_puzzle.csv.zst" -o puzzles.csv.zst
 *
 *   2. Descomprime:
 *        Linux/Mac : zstd -d puzzles.csv.zst -o puzzles.csv
 *        Windows   : winget install zstd   (depois)   zstd -d puzzles.csv.zst -o puzzles.csv
 *
 *   3. Corre este script:
 *        pnpm import-puzzles
 *        pnpm import-puzzles puzzles.csv       (caminho personalizado)
 *        pnpm import-puzzles puzzles.csv 1500  (limite de rating máximo)
 *
 * O script filtra apenas puzzles com o tema "opening" e com OpeningTags preenchido,
 * descartando tudo o que não é relevante para o Modo Punição.
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as readline from 'readline'
import * as path from 'path'

const prisma = new PrismaClient()

// ─── Configurações ───────────────────────────────────────────────────────────

const DEFAULT_CSV_PATH = 'puzzles.csv'
const BATCH_SIZE = 500          // registos por INSERT
const DEFAULT_MAX_RATING = 2000 // descarta puzzles muito difíceis
const DEFAULT_MIN_RATING = 900

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface LichessRow {
    PuzzleId: string
    FEN: string
    Moves: string
    Rating: string
    RatingDeviation: string
    Popularity: string
    NbPlays: string
    Themes: string
    GameUrl: string
    OpeningTags: string
}

// ─── Parsing do CSV ───────────────────────────────────────────────────────────

const HEADERS: (keyof LichessRow)[] = [
    'PuzzleId', 'FEN', 'Moves', 'Rating', 'RatingDeviation',
    'Popularity', 'NbPlays', 'Themes', 'GameUrl', 'OpeningTags',
]

function parseLine(line: string): LichessRow | null {
    // O CSV do Lichess não tem aspas — split simples é suficiente
    const parts = line.split(',')
    if (parts.length < HEADERS.length) return null
    const row: Partial<LichessRow> = {}
    HEADERS.forEach((h, i) => { row[h] = parts[i] ?? '' })
    return row as LichessRow
}

// ─── Lógica de filtro ─────────────────────────────────────────────────────────

function shouldKeep(row: LichessRow, minRating: number, maxRating: number): boolean {
    if (!row.Themes.includes('opening')) return false
    if (!row.OpeningTags) return false
    const rating = parseInt(row.Rating, 10)
    if (isNaN(rating)) return false
    if (rating < minRating || rating > maxRating) return false
    return true
}

// ─── Inserção em lote ─────────────────────────────────────────────────────────

async function flushBatch(
    batch: { lichessId: string; fen: string; moves: string; rating: number; openingTags: string; themes: string }[]
) {
    if (batch.length === 0) return
    // skipDuplicates permite re-correr o script sem erros
    await prisma.puzzle.createMany({ data: batch, skipDuplicates: true })
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    const csvPath = process.argv[2] ?? DEFAULT_CSV_PATH
    const maxRating = parseInt(process.argv[3] ?? String(DEFAULT_MAX_RATING), 10)

    const absolutePath = path.resolve(csvPath)
    if (!fs.existsSync(absolutePath)) {
        console.error(`\n❌  Ficheiro não encontrado: ${absolutePath}`)
        console.error('\nTranscreve o SETUP no topo deste ficheiro para obter o CSV.\n')
        process.exit(1)
    }

    console.log(`\n📂  A processar: ${absolutePath}`)
    console.log(`⚙️   Filtro: tema=opening | rating ${DEFAULT_MIN_RATING}–${maxRating}\n`)

    const stream = fs.createReadStream(absolutePath, { encoding: 'utf8' })
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity })

    const batch: Parameters<typeof flushBatch>[0] = []
    let lineCount = 0
    let imported = 0
    let skipped = 0
    let firstLine = true

    for await (const line of rl) {
        if (firstLine) { firstLine = false; continue } // cabeçalho
        lineCount++

        if (lineCount % 100_000 === 0) {
            process.stdout.write(`\r  Lidas ${lineCount.toLocaleString()} linhas | importados: ${imported.toLocaleString()}`)
        }

        const row = parseLine(line)
        if (!row || !shouldKeep(row, DEFAULT_MIN_RATING, maxRating)) {
            skipped++
            continue
        }

        batch.push({
            lichessId: row.PuzzleId,
            fen: row.FEN,
            moves: row.Moves,
            rating: parseInt(row.Rating, 10),
            openingTags: row.OpeningTags.trim(),
            themes: row.Themes.trim(),
        })

        if (batch.length >= BATCH_SIZE) {
            await flushBatch(batch)
            imported += batch.length
            batch.length = 0
        }
    }

    // flush do último lote
    await flushBatch(batch)
    imported += batch.length

    console.log(`\n\n✅  Concluído!`)
    console.log(`   Linhas processadas : ${lineCount.toLocaleString()}`)
    console.log(`   Puzzles importados : ${imported.toLocaleString()}`)
    console.log(`   Ignorados          : ${skipped.toLocaleString()}\n`)

    await prisma.$disconnect()
}

main().catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
})
