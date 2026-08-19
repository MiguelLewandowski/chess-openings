import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Demo accounts created for local development and for the presentation.
// Passwords are hashed with bcrypt (cost 10), matching the AuthService.
// Re-running the seed resets these accounts to the documented credentials.
//
// The admin password is published in the README, so in production it must come from the
// environment instead: a deployed instance seeded with a known password is an open door to
// the study importer. The student account stays a demo login either way.
const ADMIN_EMAIL = 'admin@chess.dev'
const isProduction = process.env.NODE_ENV === 'production'

function adminPassword(): string {
  const fromEnv = process.env.SEED_ADMIN_PASSWORD

  if (isProduction) {
    if (!fromEnv) {
      throw new Error(
        'SEED_ADMIN_PASSWORD is required when seeding with NODE_ENV=production. ' +
          'Set it to a strong value before running the seed.',
      )
    }
    if (fromEnv.length < 12) {
      throw new Error('SEED_ADMIN_PASSWORD must be at least 12 characters long.')
    }
  }

  return fromEnv ?? 'admin123'
}

async function main() {
  const users = [
    { email: ADMIN_EMAIL, password: adminPassword(), name: 'Admin', role: 'ADMIN' as const },
    { email: 'aluno@chess.dev', password: 'aluno123', name: 'Aluno Demo', role: 'STUDENT' as const },
  ]

  for (const { email, password, name, role } of users) {
    const hashed = await bcrypt.hash(password, 10)
    await prisma.user.upsert({
      where: { email },
      update: { password: hashed, name, role },
      create: { email, password: hashed, name, role },
    })

    // Never echo a password that came from the environment — seed output ends up in
    // deployment logs.
    const shown = isProduction && role === 'ADMIN' ? '(definida via SEED_ADMIN_PASSWORD)' : `(senha: ${password})`
    console.log(`✅ ${role.padEnd(7)} ${email}  ${shown}`)
  }

  console.log('\nSeed concluído. Faça login com uma das contas acima.')
}

main()
  .catch((error) => {
    console.error('❌ Seed falhou:', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
