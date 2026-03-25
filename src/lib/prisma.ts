import { PrismaClient } from "@prisma/client";

// Previne múltiplas instâncias do Prisma Client em ambiente de desenvolvimento (hot-reloading do Next.js)
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

// Declaração global para que o TypeScript saiba que esta variável pode existir no objeto `globalThis`
declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

// Em produção, cria sempre uma nova instância.
// Em desenvolvimento, reutiliza a instância global existente ou cria uma nova e guarda-a.
export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma
}
