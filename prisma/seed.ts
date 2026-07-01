import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Demo accounts created for local development and for the presentation.
// Passwords are hashed with bcrypt (cost 10), matching the AuthService.
// Re-running the seed resets these accounts to the documented credentials.
const DEMO_USERS = [
  { email: 'admin@chess.dev', password: 'admin123', name: 'Admin', role: 'ADMIN' as const },
  { email: 'aluno@chess.dev', password: 'aluno123', name: 'Aluno Demo', role: 'STUDENT' as const },
]

async function main() {
  for (const { email, password, name, role } of DEMO_USERS) {
    const hashed = await bcrypt.hash(password, 10)
    await prisma.user.upsert({
      where: { email },
      update: { password: hashed, name, role },
      create: { email, password: hashed, name, role },
    })
    console.log(`✅ ${role.padEnd(7)} ${email}  (senha: ${password})`)
  }
  console.log('\nSeed concluído. Faça login com uma das contas acima.')
}

main()
  .catch((error) => {
    console.error('❌ Seed falhou:', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
