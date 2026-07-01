import BlunderTrainer from '@/components/chess/BlunderTrainer'
import { apiClient } from '@/lib/api-client'
import { getSession } from '@/lib/session'
import { ChevronLeft, Swords } from 'lucide-react'
import Link from 'next/link'

export default async function BlunderTrainingPage() {
    const session = await getSession()

    let openingNames: string[] = []
    if (session) {
        const openings = await apiClient.openings.findAll()
        openingNames = openings.map((o) => o.name)
    }

    const puzzles = await apiClient.puzzles.list(openingNames, 10)

    return (
        <div className="min-h-screen bg-surface-app font-body">

            <header className="border-b border-border-subtle bg-surface-card/90 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
                    <Link
                        href="/openings"
                        className="inline-flex items-center gap-2 text-[13px] font-semibold text-ink-500 hover:text-ink-900 transition-colors"
                    >
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-surface-sunken border border-border-default hover:border-border-strong transition-all">
                            <ChevronLeft className="w-4 h-4" />
                        </div>
                        <span className="hidden sm:inline">Painel</span>
                    </Link>

                    <div className="flex items-center gap-2.5">
                        <div className="bg-danger-soft p-2 rounded-[8px] text-danger">
                            <Swords className="w-5 h-5" />
                        </div>
                        <h1 className="font-display font-bold tracking-tight text-ink-900 text-[16px]">Modo Punição</h1>
                    </div>

                    <div className="w-20" />
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
                <BlunderTrainer puzzles={puzzles} />
            </main>
        </div>
    )
}
