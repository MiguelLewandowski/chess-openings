import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Seeds overdue SM-2 reviews so the "revisões pendentes" screen has data to show.
// It targets the demo student and marks every PRACTICE exercise as due in the past.
// The due-reviews endpoint filters on: type PRACTICE and nextReview <= now.
const TARGET_EMAIL = process.env.SEED_REVIEW_EMAIL ?? 'aluno@chess.dev'

const DAY_MS = 24 * 60 * 60 * 1000

async function main() {
  const user = await prisma.user.findUnique({ where: { email: TARGET_EMAIL } })
  if (!user) {
    throw new Error(
      `Usuário ${TARGET_EMAIL} não encontrado. Rode o seed principal (pnpm db:seed) primeiro.`,
    )
  }

  const exercises = await prisma.exercise.findMany({
    where: { type: 'PRACTICE' },
    select: { id: true, title: true },
  })

  if (exercises.length === 0) {
    throw new Error('Nenhum exercício PRACTICE encontrado. Importe conteúdo antes de rodar este seed.')
  }

  for (const [index, exercise] of exercises.entries()) {
    // Stagger the due dates so the list has a natural order (1, 2, 3... dias atrás).
    const nextReview = new Date(Date.now() - (index + 1) * DAY_MS)

    await prisma.userProgress.upsert({
      where: { userId_exerciseId: { userId: user.id, exerciseId: exercise.id } },
      update: { repetitions: 1, interval: 1, easinessFactor: 2.5, nextReview },
      create: {
        userId: user.id,
        exerciseId: exercise.id,
        repetitions: 1,
        interval: 1,
        easinessFactor: 2.5,
        nextReview,
      },
    })
    console.log(`✅ Revisão pendente: ${exercise.title} (vence ${nextReview.toLocaleString()})`)
  }

  console.log(`\n${exercises.length} revisão(ões) pendente(s) criada(s) para ${TARGET_EMAIL}.`)
}

main()
  .catch((error) => {
    console.error('❌ Seed de revisões falhou:', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
