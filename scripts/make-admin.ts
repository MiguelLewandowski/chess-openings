import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]
  if (!email) {
    console.error('Usage: pnpm make-admin <email>')
    process.exit(1)
  }

  const user = await prisma.user.update({
    where: { email },
    data: { role: 'ADMIN' },
  })

  console.log(`✅ ${user.email} is now ADMIN. Log out and back in to refresh the session.`)
}

main()
  .catch((error) => {
    console.error('❌ Failed to promote user:', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
