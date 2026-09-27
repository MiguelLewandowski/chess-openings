import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import type { z } from 'zod'
import { ChapterAnnotation, ReviewResult } from './schema'

export type Effort = 'low' | 'medium' | 'high' | 'xhigh' | 'max'

// Per million tokens (Anthropic first-party prices at the time of writing). Cache reads
// bill at 10% of input; cache writes at 1.25x (5-minute) or 2x (1-hour).
const PRICES: Record<string, { input: number; output: number }> = {
  'claude-opus-5': { input: 5, output: 25 },
  'claude-fable-5-1': { input: 10, output: 50 },
  'claude-sonnet-5': { input: 2, output: 10 },
}

export class UsageTracker {
  private readonly totals = new Map<
    string,
    { input: number; output: number; cacheRead: number; cacheWrite5m: number; cacheWrite1h: number }
  >()

  add(model: string, usage: Anthropic.Beta.BetaUsage): void {
    const t = this.totals.get(model) ?? { input: 0, output: 0, cacheRead: 0, cacheWrite5m: 0, cacheWrite1h: 0 }
    t.input += usage.input_tokens
    t.output += usage.output_tokens
    t.cacheRead += usage.cache_read_input_tokens ?? 0
    // The system prompt is cached for 1 hour and the dossier for 5 minutes; they bill
    // differently, so use the per-TTL breakdown when the API reports it.
    const breakdown = usage.cache_creation
    if (breakdown) {
      t.cacheWrite5m += breakdown.ephemeral_5m_input_tokens
      t.cacheWrite1h += breakdown.ephemeral_1h_input_tokens
    } else {
      t.cacheWrite5m += usage.cache_creation_input_tokens ?? 0
    }
    this.totals.set(model, t)
  }

  summary(): { model: string; input: number; output: number; cacheRead: number; usd: number | null }[] {
    return [...this.totals.entries()].map(([model, t]) => {
      const price = PRICES[model]
      const usd = price
        ? (t.input * price.input +
            t.cacheRead * price.input * 0.1 +
            t.cacheWrite5m * price.input * 1.25 +
            t.cacheWrite1h * price.input * 2 +
            t.output * price.output) /
          1e6
        : null
      return { model, input: t.input, output: t.output, cacheRead: t.cacheRead, usd }
    })
  }
}

export class RefusalError extends Error {}

export interface ClaudeConfig {
  model: string
  reviewModel: string
  effort: Effort
}

// One authoring conversation per chapter: the first turn writes the annotation; each fix
// round appends the verifier's findings as a new user turn. History is append-only, so the
// cached prefix (system prompt + dossier) is reused on every round.
export class ChapterConversation {
  private readonly messages: Anthropic.Beta.BetaMessageParam[]

  constructor(
    private readonly client: Anthropic,
    private readonly config: ClaudeConfig,
    private readonly system: string,
    dossier: string,
    private readonly usage: UsageTracker,
  ) {
    this.messages = [
      {
        role: 'user',
        content: [
          { type: 'text', text: `DOSSIÊ DO CAPÍTULO\n${dossier}`, cache_control: { type: 'ephemeral' } },
          { type: 'text', text: 'Escreva as anotações do capítulo seguindo as regras.' },
        ],
      },
    ]
  }

  async write(): Promise<ChapterAnnotation> {
    return this.ask(ChapterAnnotation)
  }

  async fix(issues: string[]): Promise<ChapterAnnotation> {
    this.messages.push({
      role: 'user',
      content:
        'O verificador encontrou estes problemas. Corrija-os e devolva as anotações completas do capítulo ' +
        '(todas as notas, não só as corrigidas). Se não houver como afirmar algo com base no dossiê, remova a afirmação.\n\n' +
        issues.map((i) => `- ${i}`).join('\n'),
    })
    return this.ask(ChapterAnnotation)
  }

  private async ask<T extends z.ZodType>(schema: T): Promise<z.infer<T>> {
    const message = await request(this.client, this.config.model, this.config.effort, this.system, this.messages, schema)
    this.usage.add(this.config.model, message.usage)
    // Keep the whole assistant turn (thinking included) so the next round continues it.
    this.messages.push({ role: 'assistant', content: message.content })
    return parseJson(message, schema)
  }
}

export async function reviewChapter(
  client: Anthropic,
  config: ClaudeConfig,
  system: string,
  dossier: string,
  annotation: ChapterAnnotation,
  usage: UsageTracker,
): Promise<ReviewResult> {
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    {
      role: 'user',
      content: `DOSSIÊ\n${dossier}\n\nCOMENTÁRIOS GERADOS\n${JSON.stringify(annotation, null, 1)}`,
    },
  ]
  const message = await request(client, config.reviewModel, config.effort, system, messages, ReviewResult)
  usage.add(config.reviewModel, message.usage)
  return parseJson(message, ReviewResult)
}

async function request(
  client: Anthropic,
  model: string,
  effort: Effort,
  system: string,
  messages: Anthropic.Beta.BetaMessageParam[],
  schema: z.ZodType,
): Promise<Anthropic.Beta.BetaMessage> {
  // Streaming: a whole chapter with thinking can take minutes and long outputs.
  const stream = client.beta.messages.stream({
    model,
    max_tokens: 64_000,
    ...fallbackParams(model),
    thinking: { type: 'adaptive' },
    output_config: { effort, format: zodOutputFormat(schema) },
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral', ttl: '1h' } }],
    messages,
  })
  const message = await stream.finalMessage()

  if (message.stop_reason === 'refusal') throw new RefusalError('O modelo recusou a solicitação.')
  if (message.stop_reason === 'max_tokens') throw new Error('A resposta atingiu o limite de tokens; divida o capítulo.')
  return message
}

// If a safety classifier declines, Anthropic re-runs the request on its recommended fallback
// model instead of returning a refusal. Only models known to allow it get the parameter:
// elsewhere it can be rejected with a 400, and a refusal about chess is very unlikely anyway.
const MODELS_WITH_FALLBACK = new Set(['claude-opus-5', 'claude-fable-5-1'])

function fallbackParams(model: string): { betas?: string[]; fallbacks?: 'default' } {
  return MODELS_WITH_FALLBACK.has(model) ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' } : {}
}

function parseJson<T extends z.ZodType>(message: Anthropic.Beta.BetaMessage, schema: T): z.infer<T> {
  const text = message.content.find((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')?.text
  if (!text) throw new Error('A resposta não trouxe texto.')
  return schema.parse(JSON.parse(text))
}
