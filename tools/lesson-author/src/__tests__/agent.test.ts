import { mkdtemp, readFile, rm, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { agentFiles, processChapterWithAgent, renderAuthorInstructions } from '../agent'
import type { ChapterAnnotation, ReviewResult } from '../author/schema'
import { DEFAULT_CARDS } from '../cards'
import { DEFAULT_ENRICH, Enricher } from '../enrich'
import { allNodes, mainline, readChapters } from '../pgn/read'
import { writePgn } from '../pgn/write'
import { DiskCache } from '../sources/cache'
import { LichessExplorer } from '../sources/explorer'
import { ENGLISH_PGN, FakeEngine } from './helpers'

// The agent mode swaps the paid API call for files: the CLI writes the dossier, a Claude Code
// agent writes the annotation JSON next to it, and the next run verifies it and builds the PGN.

const [chapter] = readChapters(ENGLISH_PGN)
const ids = allNodes(chapter.roots).map((n) => n.id)
const annotation = (firstComment: string): ChapterAnnotation => ({
  notes: ids.map((id, i) => ({ nodeId: id, comment: i === 0 ? firstComment : 'Seguimos o plano.', claims: [], arrows: [], highlights: [] })),
  whyNot: [],
  cards: [],
  plan: 'Pressionar as casas brancas do centro.',
})

const deps = () => ({
  enricher: new Enricher(new FakeEngine({}), new LichessExplorer(undefined, new DiskCache('.cache-test')), DEFAULT_ENRICH),
  engine: new FakeEngine({}),
  explorerAvailable: false,
  cardOptions: DEFAULT_CARDS,
  log: () => {},
})

let dir: string
beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'agente-'))
})
afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

describe('processChapterWithAgent', () => {
  it('should write the dossier and keep an unannotated chapter out of the app', async () => {
    const { result, status } = await processChapterWithAgent(chapter, deps(), dir)
    const files = agentFiles(dir, chapter)

    expect(status.state).toBe('pendente')
    const dossier = JSON.parse(await readFile(files.dossier, 'utf8'))
    expect(dossier.nos.map((n: { id: string }) => n.id)).toEqual(ids)
    // Every node is flagged, so the importer refuses the PGN until the agent writes it.
    expect(writePgn(result.outputs)).toContain('[REVISAR')
  })

  it('should verify the annotation and list what is wrong for the agent to fix', async () => {
    const files = agentFiles(dir, chapter)
    await writeFile(files.annotation, JSON.stringify(annotation('1.c4 e depois 2.b4 ganha espaço.')))

    const { status } = await processChapterWithAgent(chapter, deps(), dir)
    expect(status.state).toBe('com-problemas')
    expect(status.issues).toHaveLength(1)
    const problems = await readFile(files.problems, 'utf8')
    expect(problems).toContain('2.b4')
    expect(problems).toContain(mainline(chapter)[0].id)
  })

  it('should report a malformed annotation instead of crashing', async () => {
    const files = agentFiles(dir, chapter)
    await writeFile(files.annotation, JSON.stringify({ notes: [{ nodeId: ids[0] }] }))

    const { status, result } = await processChapterWithAgent(chapter, deps(), dir)
    expect(status.state).toBe('json-invalido')
    expect(await readFile(files.problems, 'utf8')).toMatch(/formato/i)
    expect(writePgn(result.outputs)).toContain('[REVISAR')
  })

  it('should wait for an independent review once the verifier is satisfied', async () => {
    const files = agentFiles(dir, chapter)
    await writeFile(files.annotation, JSON.stringify(annotation('1.c4 controla d5.')))

    const { status, result } = await processChapterWithAgent(chapter, deps(), dir)
    expect(status.state).toBe('aguardando-revisao')
    expect(writePgn(result.outputs)).toContain('{1.c4 controla d5.}')
  })

  it('should flag the errors of a fresh review and ignore a review older than the annotation', async () => {
    const files = agentFiles(dir, chapter)
    const first = mainline(chapter)[0].id
    const review: ReviewResult = { issues: [{ nodeId: first, severity: 'error', problem: 'c4 não controla d5 sozinho' }] }
    await writeFile(files.annotation, JSON.stringify(annotation('1.c4 controla d5.')))
    await writeFile(files.review, JSON.stringify(review))
    const later = new Date(Date.now() + 5_000)
    await utimes(files.review, later, later)

    const fresh = await processChapterWithAgent(chapter, deps(), dir)
    expect(fresh.status.state).toBe('revisao-com-erros')
    expect(fresh.result.outputs[0].notes.get(first)?.text).toMatch(/^\[REVISAR: c4 não controla d5 sozinho\]/)
    // The author fixes from the same file the verifier writes to.
    expect(await readFile(files.problems, 'utf8')).toContain(`[${first}] (erro) c4 não controla d5 sozinho`)

    // The author rewrote the chapter after the review: that review no longer applies.
    const evenLater = new Date(Date.now() + 10_000)
    await utimes(files.annotation, evenLater, evenLater)
    const stale = await processChapterWithAgent(chapter, deps(), dir)
    expect(stale.status.state).toBe('aguardando-revisao')
    expect(writePgn(stale.result.outputs)).not.toContain('[REVISAR')
  })

  it('should be ready when the review has no errors (warnings are only reported)', async () => {
    const files = agentFiles(dir, chapter)
    await writeFile(files.annotation, JSON.stringify(annotation('1.c4 controla d5.')))
    await writeFile(files.review, JSON.stringify({ issues: [{ nodeId: 'plan', severity: 'warning', problem: 'vago' }] }))
    const later = new Date(Date.now() + 5_000)
    await utimes(files.review, later, later)

    const { status, result } = await processChapterWithAgent(chapter, deps(), dir)
    expect(status.state).toBe('pronto')
    expect(status.warnings).toBe(1)
    expect(writePgn(result.outputs)).not.toContain('[REVISAR')
  })
})

describe('renderAuthorInstructions', () => {
  it('should carry the same rules the API author gets, the style examples and the JSON schema', () => {
    const text = renderAuthorInstructions('**1.c4** — exemplo do autor')
    expect(text).toContain('O dossiê é a única fonte de verdade')
    expect(text).toContain('exemplo do autor')
    expect(text).toContain('"nodeId"')
    expect(text).toContain('decisive_for_student')
  })
})
