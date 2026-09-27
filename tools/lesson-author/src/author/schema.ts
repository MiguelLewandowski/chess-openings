import { z } from 'zod'

// What the model returns for one chapter. Every statement about the board that can be
// checked by the program goes into `claims`, separately from the prose, so the verifier
// does not have to understand Portuguese to catch a wrong one.

const MarkerColor = z.enum(['G', 'R', 'Y', 'B'])

export const Claim = z.object({
  kind: z.enum(['controls', 'attacks', 'defends', 'evaluation']),
  // Piece in Portuguese notation plus its square after the move ("Cf3"), or a bare square
  // for a pawn ("e4"). Null for evaluation claims.
  piece: z.string().nullable(),
  // Squares the piece controls / enemy pieces it attacks / own pieces it defends.
  targets: z.array(z.string()),
  verdict: z.enum(['student_better', 'balanced', 'student_worse', 'decisive_for_student']).nullable(),
})

export const MoveNote = z.object({
  nodeId: z.string(),
  comment: z.string(),
  claims: z.array(Claim),
  arrows: z.array(z.object({ from: z.string(), to: z.string(), color: MarkerColor })),
  highlights: z.array(z.object({ square: z.string(), color: MarkerColor })),
})

export const WhyNot = z.object({
  nodeId: z.string(),
  alternativeId: z.string(),
  text: z.string(),
})

export const CardPrompt = z.object({
  cardId: z.string(),
  prompt: z.string(),
})

export const ChapterAnnotation = z.object({
  notes: z.array(MoveNote),
  whyNot: z.array(WhyNot),
  cards: z.array(CardPrompt),
  plan: z.string(),
})

export const ReviewResult = z.object({
  issues: z.array(
    z.object({
      nodeId: z.string(),
      severity: z.enum(['error', 'warning']),
      problem: z.string(),
    }),
  ),
})

export type Claim = z.infer<typeof Claim>
export type MoveNote = z.infer<typeof MoveNote>
export type WhyNot = z.infer<typeof WhyNot>
export type ChapterAnnotation = z.infer<typeof ChapterAnnotation>
export type ReviewResult = z.infer<typeof ReviewResult>
