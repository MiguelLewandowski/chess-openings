import { prisma } from "@/lib/prisma";

export async function getAllOpenings(){
    const openings = await prisma.opening.findMany({
        include: {
            lessons: true
        },
    })
    return openings
}

export async function getOpeningBySlug(slug: string) {
    const openingBySlug = await prisma.opening.findUnique({
        where: { slug },
        include: { lessons: true }
    });
    return openingBySlug
}