import { prisma } from "@/lib/prisma";

export async function getLessonById(id: string) {
    const lesson = prisma.lesson.findUnique({
        where: { id },
        include: {
            opening: {
                include: {
                    lessons: {
                        orderBy: { order: 'asc' }
                    }
                }
            },
            exercises: {
                include: { moves: true }
            }
        }
    })
    return lesson
}