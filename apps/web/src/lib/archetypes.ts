import { Target, Shield, BrainCircuit, Check, type LucideIcon } from 'lucide-react'

// The persisted value (DB, session, localStorage) is the style key — never the
// display name — so it can be matched directly against Opening.styleTags.
export type StyleArchetype = 'Aggressive' | 'Solid' | 'Positional' | 'Universal'

interface ArchetypeInfo {
  name: string
  description: string
  icon: LucideIcon
  color: string
}

export const ARCHETYPES: Record<StyleArchetype, ArchetypeInfo> = {
  Aggressive: {
    name: 'O Predador Tático',
    description:
      'Você prospera no caos. Prefere posições agudas e táticas, onde o cálculo e a iniciativa reinam. Não tem medo de sacrificar material por um ataque demolidor.',
    icon: Target,
    color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
  },
  Solid: {
    name: 'A Muralha de Ferro',
    description:
      'Segurança em primeiro lugar. Você constrói estruturas inquebráveis e espera o adversário se expor. Seu jogo profilático o torna incrivelmente difícil de bater.',
    icon: Shield,
    color: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
  },
  Positional: {
    name: 'O Estrategista',
    description:
      'Você joga o jogo longo. Entende de estruturas de peões, casas avançadas e manobras de peças. Sufoca lentamente o adversário até que não reste nenhum bom lance.',
    icon: BrainCircuit,
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  },
  Universal: {
    name: 'O Jogador Universal',
    description:
      'Você é flexível e adaptável. Joga tanto o xadrez tático quanto o posicional, conforme a posição exige. Você é imprevisível.',
    icon: Check,
    color: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
  },
}

const STYLE_KEYS = Object.keys(ARCHETYPES) as StyleArchetype[]

export function isStyleArchetype(value: string | null | undefined): value is StyleArchetype {
  return !!value && (STYLE_KEYS as string[]).includes(value)
}

// Dominant style from quiz answers; defaults to Universal on empty/tie.
export function dominantStyle(answers: string[]): StyleArchetype {
  const counts = new Map<string, number>()
  for (const answer of answers) counts.set(answer, (counts.get(answer) ?? 0) + 1)

  let best: StyleArchetype = 'Universal'
  let bestCount = 0
  for (const key of STYLE_KEYS) {
    const count = counts.get(key) ?? 0
    if (count > bestCount) {
      bestCount = count
      best = key
    }
  }
  return best
}
