import type { ChapterReport } from './pipeline'
import type { UsageTracker } from './author/claude'

// Rough size of the prompt per chapter, for the dry-run cost estimate: JSON in Portuguese
// runs at about 3 characters per token.
const CHARS_PER_TOKEN = 3
const SYSTEM_TOKENS = 1_500
// Notes are short, but adaptive thinking on a whole chapter adds several thousand tokens.
const OUTPUT_TOKENS_PER_NODE = 180
const THINKING_TOKENS_PER_CHAPTER = 8_000

export function estimateChapterTokens(report: ChapterReport): { input: number; output: number } {
  const cardNodes = report.cards.reduce((sum, c) => sum + countNodes(c.roots), 0)
  return {
    input: SYSTEM_TOKENS + Math.round(report.dossierChars / CHARS_PER_TOKEN),
    output: (report.nodes + cardNodes) * OUTPUT_TOKENS_PER_NODE + THINKING_TOKENS_PER_CHAPTER,
  }
}

function countNodes(roots: { children: unknown[] }[]): number {
  return roots.reduce((sum, n) => sum + 1 + countNodes(n.children as { children: unknown[] }[]), 0)
}

export function renderReport(input: {
  source: string
  output: string
  model: string | null
  engine: string
  explorer: boolean
  chapters: ChapterReport[]
  usage: UsageTracker | null
}): string {
  const lines: string[] = []
  lines.push(`# Relatório de geração — ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`)
  lines.push('')
  lines.push(`- Fonte: \`${input.source}\``)
  lines.push(`- PGN gerado: \`${input.output}\``)
  lines.push(`- Modelo: ${input.model ?? 'nenhum (simulação, sem IA)'}`)
  lines.push(`- Engine: ${input.engine}`)
  lines.push(`- Explorer da Lichess: ${input.explorer ? 'sim' : 'não (defina LICHESS_TOKEN para estatísticas e cartões)'}`)
  lines.push('')
  lines.push('## Como revisar')
  lines.push('')
  lines.push('1. Na Lichess, crie um estudo novo e importe o PGN gerado (cada partida vira um capítulo).')
  lines.push('2. Corrija o que precisar direto no editor do estudo. Procure por `[REVISAR` — cada marca diz o motivo.')
  lines.push('3. Apague as marcas `[REVISAR ...]` que resolver. O app **recusa** importar um estudo que ainda tenha alguma.')
  lines.push('4. No app, em Importar estudo, marque "Usar os comentários do estudo como estão" e importe a URL do estudo revisado.')
  lines.push('')

  for (const chapter of input.chapters) {
    lines.push(`## ${chapter.title}`)
    lines.push('')
    lines.push(`- Lances comentados: ${chapter.nodes}`)
    if (chapter.rounds.length > 0) {
      lines.push(`- Verificação (problemas por etapa): ${chapter.rounds.map((r) => `${r.label}: ${r.issues}`).join(' → ')}`)
    }
    lines.push(`- Marcados para revisão: ${chapter.flagged}`)
    if (!input.usage) {
      const est = estimateChapterTokens(chapter)
      lines.push(`- Tamanho estimado da chamada: ~${est.input.toLocaleString('pt-BR')} tokens de entrada, ~${est.output.toLocaleString('pt-BR')} de saída`)
    }
    if (chapter.cards.length > 0) {
      lines.push('')
      lines.push('**Cartões**')
      lines.push('')
      for (const card of chapter.cards) lines.push(`- ${card.title} — ${card.reason}`)
    }
    if (chapter.unresolved.length > 0) {
      lines.push('')
      lines.push('**Problemas que o verificador não conseguiu resolver** (já marcados no PGN)')
      lines.push('')
      for (const issue of chapter.unresolved) lines.push(`- \`${issue.nodeId}\`: ${issue.message}`)
    }
    if (chapter.review.length > 0) {
      lines.push('')
      lines.push('**Revisão independente** (erros marcados no PGN; avisos só aqui)')
      lines.push('')
      for (const issue of chapter.review) lines.push(`- ${issue.severity === 'error' ? 'ERRO' : 'aviso'} \`${issue.nodeId}\`: ${issue.problem}`)
    }
    lines.push('')
  }

  lines.push('## Custo')
  lines.push('')
  if (input.usage) {
    let total = 0
    for (const row of input.usage.summary()) {
      total += row.usd ?? 0
      lines.push(
        `- ${row.model}: ${row.input.toLocaleString('pt-BR')} tokens de entrada, ${row.cacheRead.toLocaleString('pt-BR')} lidos do cache, ` +
          `${row.output.toLocaleString('pt-BR')} de saída — ${row.usd !== null ? `US$ ${row.usd.toFixed(2)}` : 'preço desconhecido'}`,
      )
    }
    lines.push(`- **Total: US$ ${total.toFixed(2)}**`)
  } else {
    const tokens = input.chapters.map(estimateChapterTokens)
    const inTok = tokens.reduce((s, t) => s + t.input, 0)
    const outTok = tokens.reduce((s, t) => s + t.output, 0)
    // Author pass plus a similar-sized review pass, at Claude Opus 5 prices.
    const usd = ((inTok * 5 + outTok * 25) * 2) / 1e6
    lines.push(`- Estimativa com claude-opus-5 (escrita + revisão): **~US$ ${usd.toFixed(2)}**, sem contar rodadas de correção.`)
  }
  lines.push('')
  return lines.join('\n')
}
