import { prisma } from "@/lib/prisma";

export async function getAllOpenings(){
    const openings = await prisma.opening.findMany({
        include: {
            lessons: true
        },
    })
    return openings
}