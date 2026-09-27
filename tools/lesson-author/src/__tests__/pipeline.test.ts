import { describe, expect, it } from 'vitest'
import type Anthropic from '@anthropic-ai/sdk'
import { UsageTracker } from '../author/claude'
import type { ChapterAnnotation, ReviewResult } from '../author/schema'
import { DEFAULT_CARDS } from '../cards'
import { DEFAULT_ENRICH, Enricher } from '../enrich'
import { processChapter } from '../pipeline'
import { allNodes, mainline, readChapters } from '../pgn/read'
import { writePgn } from '../pgn/write'
import { LichessExplorer } from '../sources/explorer'
import { DiskCache } from '../sources/cache'
import { ENGLISH_PGN, FakeEngine } from './helpers'

// Stands in for the Anthropic client: returns the queued annotations in order and records
// every request, so the test can check the fix round appended to the same conversation.
function fakeClient(responses: (ChapterAnnotation | ReviewResult)[]) {
  const requests: { messages: unknown[] }[] = []
  const client = {
    beta: {
      messages: {
        stream: (params: { messages: unknown[] }) => {
          requests.push({ messages: [...params.messages] })
          const body = responses.shift()
          return {
            finalMessage: async () => ({
              stop_reason: 'end_turn',
              content: [{ type: 'text', text: JSON.stringify(body) }],
              usage: { input_tokens: 1000, output_tokens: 500, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
            }),
          }
        },
      },
    },
  }
  return { client: client as unknown as Anthropic, requests }
}

describe('processChapter', () => {
  const [chapter] = readChapters(ENGLISH_PGN)
  const ids = allNodes(chapter.roots).map((n) => n.id)
  const annotation = (firstComment: string): ChapterAnnotation => ({
    notes: ids.map((id, i) => ({ nodeId: id, comment: i === 0 ? firstComment : 'Seguimos o plano.', claims: [], arrows: [], highlights: [] })),
    whyNot: [],
    cards: [],
    plan: 'Pressionar as casas brancas do centro.',
  })

  it('should send the verifier findings back and keep the corrected text', async () => {
    const { client, requests } = fakeClient([
      annotation('1.c4 e depois 2.b4 ganha espaço.'), // 2.b4 is not in the dossier
      annotation('1.c4 controla d5.'),
    ])
    const usage = new UsageTracker()
    const result = await processChapter(chapter, {
      enricher: new Enricher(new FakeEngine({}), new LichessExplorer(undefined, new DiskCache('.cache-test')), DEFAULT_ENRICH),
      engine: new FakeEngine({}),
      explorerAvailable: false,
      claude: { client, config: { model: 'claude-opus-5', reviewModel: 'claude-opus-5', effort: 'high' }, usage },
      styleExamples: '',
      cardOptions: DEFAULT_CARDS,
      fixRounds: 2,
      review: false,
      reviewFixRounds: 0,
      log: () => {},
    })

    expect(result.report.rounds).toEqual([
      { label: '1ª escrita', issues: 1 },
      { label: 'correção 1', issues: 0 },
    ])
    // The fix went into the same conversation: first turn, assistant answer, findings.
    expect(requests[1].messages).toHaveLength(3)
    expect(JSON.stringify(requests[1].messages[2])).toContain('2.b4')

    const pgn = writePgn(result.outputs)
    expect(pgn).toContain('{1.c4 controla d5.}')
    expect(pgn).toContain('{Plano: Pressionar as casas brancas do centro.}')
    expect(pgn).not.toContain('[REVISAR')
    expect(usage.summary()[0].usd).toBeCloseTo((2 * 1000 * 5 + 2 * 500 * 25) / 1e6)
  })

  it('should mark what is still wrong after the last round', async () => {
    const bad = annotation('Depois 2.b4 ganha espaço.')
    const { client } = fakeClient([bad, bad])
    const result = await processChapter(chapter, {
      enricher: new Enricher(new FakeEngine({}), new LichessExplorer(undefined, new DiskCache('.cache-test')), DEFAULT_ENRICH),
      engine: new FakeEngine({}),
      explorerAvailable: false,
      claude: { client, config: { model: 'claude-opus-5', reviewModel: 'claude-opus-5', effort: 'high' }, usage: new UsageTracker() },
      styleExamples: '',
      cardOptions: DEFAULT_CARDS,
      fixRounds: 1,
      review: false,
      reviewFixRounds: 0,
      log: () => {},
    })

    const firstMove = mainline(chapter)[0].id
    const note = result.outputs[0].notes.get(firstMove)
    expect(note?.text).toMatch(/^\[REVISAR: "2\.b4"/)
    expect(result.report.flagged).toBe(1)
  })

  it('should send the reviewer findings back to the author before the final review', async () => {
    const reviewWithIssue: ReviewResult = {
      issues: [{ nodeId: mainline(chapter)[0].id, severity: 'warning', problem: 'impreciso' }],
    }
    const cleanReview: ReviewResult = { issues: [] }
    const { client, requests } = fakeClient([
      annotation('1.c4 controla d5.'),
      reviewWithIssue,
      annotation('1.c4 controla d5 e prepara Cc3.'),
      cleanReview,
    ])
    const result = await processChapter(chapter, {
      enricher: new Enricher(new FakeEngine({}), new LichessExplorer(undefined, new DiskCache('.cache-test')), DEFAULT_ENRICH),
      engine: new FakeEngine({}),
      explorerAvailable: false,
      claude: { client, config: { model: 'claude-opus-5', reviewModel: 'claude-opus-5', effort: 'high' }, usage: new UsageTracker() },
      styleExamples: '',
      cardOptions: DEFAULT_CARDS,
      fixRounds: 2,
      review: true,
      reviewFixRounds: 1,
      log: () => {},
    })

    expect(requests).toHaveLength(4)
    // The fix request carries the reviewer's finding, in the author's own conversation.
    expect(JSON.stringify(requests[2].messages[requests[2].messages.length - 1])).toContain('(revisor, aviso) impreciso')
    expect(result.report.review).toEqual([])
    expect(writePgn(result.outputs)).toContain('{1.c4 controla d5 e prepara Cc3.}')
  })
})
