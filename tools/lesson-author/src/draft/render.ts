import { formatLine } from '../chess/notation'
import { STARTING_FEN, type Color } from '../chess/types'
import type { DraftChapter } from './chapters'

export interface RenderInput {
  name: string
  student: Color
  chapters: DraftChapter[]
  settings: string[] // how it was generated, as comment lines
}

// Writes the draft in the repertoire .txt format that `lessons:generate` reads
// (see pgn/lines.ts). Everything that is not a move goes in // comments, which the reader
// ignores, so the file can be edited and fed straight to the generator.
export function renderRepertoire({ name, student, chapters, settings }: RenderInput): string {
  const out: string[] = [
    `# ${name}`,
    `cor: ${student === 'w' ? 'brancas' : 'pretas'}`,
    '',
    '// Rascunho gerado por lessons:draft — lances do adversário pelo que se joga na faixa de',
    '// rating abaixo; nossos lances pela engine (preferindo os dos mestres) ou pelo repertório base.',
    ...settings.map((s) => `// ${s}`),
    '// Revise antes de gerar as lições: corte linhas, troque lances, renomeie capítulos.',
  ]

  for (const chapter of chapters) {
    out.push('', `## ${chapter.title}`)
    out.push(`// ${Math.round(chapter.reach * 1000) / 10}% das partidas passam por aqui`)
    for (const line of chapter.lines) {
      if (line.note) out.push(`// ${line.note}`)
      out.push(formatLine(STARTING_FEN, line.sans))
    }
  }
  return out.join('\n') + '\n'
}
