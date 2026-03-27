'use server';
import { prisma } from "@/lib/prisma";

export async function getExpectedResponse(currentFen: string) {
    const currentNode = await prisma.move.findFirst({
        where: { fen: currentFen },
        include: { children: true }
    })
    if(!currentNode || currentNode.children.length === 0){
        return null;
    }

    return currentNode.children[0]

}