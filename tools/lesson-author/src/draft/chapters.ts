import { formatLine } from '../chess/notation'
import { formatCp } from '../sources/engine'
import type { DraftNode } from './build'
import { labelOf } from './build'
import type { OpeningNames } from './names'

// Splits a repertoire tree into chapters (future lessons). A chapter is the subtree under
// one opponent decision; the biggest chapter is split at its first opponent branching until
// there are as many chapters as asked for (or nothing left to split). Punish-the-mistake
// lines come out as their own short chapters, which is what makes them memorable.

export interface DraftLine {
  sans: string[]
  note: string | null // shown as a // comment above the line
}

export interface DraftChapter {
  title: string
  openingName: string | null
  reach: number
  mistake: boolean
  lines: DraftLine[]
}

interface Group {
  prefix: DraftNode[] // from the first move of the game to the chapter's defining move
}

export function splitChapters(
  roots: DraftNode[],
  startLength: number,
  target: number,
  names: OpeningNames,
  ratingLabel: string,
): DraftChapter[] {
  const startChain = chainFromRoot(roots, startLength)
  let groups: Group[] = [{ prefix: startChain }]

  while (groups.length < target) {
    const splittable = groups
      .map((g) => ({ g, at: firstBranching(g.prefix[g.prefix.length - 1]) }))
      .filter((x): x is { g: Group; at: { chain: DraftNode[]; branch: DraftNode } } => x.at !== null)
    if (splittable.length === 0) break
    const { g, at } = splittable.sort((a, b) => size(b.g) - size(a.g))[0]
    const replaced = at.branch.children.map((child) => ({ prefix: [...g.prefix, ...at.chain, child] }))
    groups = groups.flatMap((x) => (x === g ? replaced : [x]))
  }

  return groups
    .map((g) => toChapter(g, startLength, names, ratingLabel))
    .sort((a, b) => b.reach - a.reach)
}

function toChapter(group: Group, startLength: number, names: OpeningNames, ratingLabel: string): DraftChapter {
  const last = group.prefix[group.prefix.length - 1]
  const prefixSans = group.prefix.map((n) => n.san)
  const paths = leafPaths(last).map((path) => [...group.prefix, ...path])
  const main = mainPath(last)
  const mainSans = [...prefixSans, ...main.map((n) => n.san)]

  const lines = paths
    .map((path) => ({ path, reach: Math.min(...path.map((n) => n.reach)) }))
    .sort((a, b) => {
      const aMain = sameLine(a.path, mainSans) ? 1 : 0
      const bMain = sameLine(b.path, mainSans) ? 1 : 0
      return bMain - aMain || b.reach - a.reach
    })
    .map(({ path }) => ({ sans: path.map((n) => n.san), note: noteFor(path, ratingLabel) }))

  // Continuous numbering ("2...Cf6 3.d3 Bc5"), from the position before the first defining move.
  const definingNodes = group.prefix.slice(startLength)
  const defining = definingNodes.length > 0 ? formatLine(definingNodes[0].fenBefore, definingNodes.map((n) => n.san)) : ''
  const mistake = last.mistake !== null
  const openingName = names.deepest(mainSans)
  const base = defining || 'Linha principal'
  const title = `${mistake ? 'Armadilha: ' : ''}${base}${mistake ? '?' : ''}${openingName ? ` — ${openingName}` : ''}`
  return { title, openingName, reach: last.reach, mistake, lines }
}

function noteFor(path: DraftNode[], ratingLabel: string): string | null {
  const mistake = path.find((n) => n.mistake)
  if (!mistake?.mistake) return null
  const pct = Math.round(mistake.share * 100)
  return `${labelOf(mistake)}? — ${pct}% dos jogadores de ${ratingLabel} jogam; depois dele, ${formatCp(mistake.mistake.evalAfterCp)} para nós`
}

function sameLine(path: DraftNode[], sans: string[]): boolean {
  return path.length === sans.length && path.every((n, i) => n.san === sans[i])
}

function chainFromRoot(roots: DraftNode[], length: number): DraftNode[] {
  const chain: DraftNode[] = []
  let node = roots[0]
  while (node && chain.length < length) {
    chain.push(node)
    node = node.children[0]
  }
  return chain
}

// Walks single-child links down from `from` to the first node with several children.
function firstBranching(from: DraftNode): { chain: DraftNode[]; branch: DraftNode } | null {
  const chain: DraftNode[] = []
  let node = from
  while (node.children.length === 1) {
    node = node.children[0]
    chain.push(node)
  }
  return node.children.length > 1 ? { chain, branch: node } : null
}

function size(group: Group): number {
  return count(group.prefix[group.prefix.length - 1])
}

function count(node: DraftNode): number {
  return 1 + node.children.reduce((s, c) => s + count(c), 0)
}

function leafPaths(node: DraftNode): DraftNode[][] {
  if (node.children.length === 0) return [[]]
  return node.children.flatMap((child) => leafPaths(child).map((path) => [child, ...path]))
}

// The most played continuation: at each opponent choice, the reply with the most games.
function mainPath(node: DraftNode): DraftNode[] {
  const path: DraftNode[] = []
  let current = node
  while (current.children.length > 0) {
    current = [...current.children].sort((a, b) => b.games - a.games)[0]
    path.push(current)
  }
  return path
}
