'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteOpening(id: string) {
    try {
        await prisma.opening.delete({
            where: { id }
        });
        revalidatePath('/openings');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete opening:", error);
        return { success: false, error: "Falha ao excluir abertura" };
    }
}
