import BlunderTrainer from '@/components/chess/BlunderTrainer'
import { getPuzzlesForSession } from '@/services/puzzle.service'
import { getSession } from '@/lib/session'
import { getAllOpenings } from '@/services/opening.service'
import { ChevronLeft, Swords } from 'lucide-react'
import Link from 'next/link'

export default async function BlunderTrainingPage() {
    const session = await getSession()

    // Se o utilizador tem aberturas no repertório, filtra puzzles por elas.
    // Caso contrário (ou sem login), devolve puzzles de abertura aleatórios.
    let openingNames: string[] = []
    if (session) {
        const openings = await getAllOpenings()
        openingNames = openings.map((o) => o.name)
    }

    const puzzles = await getPuzzlesForSession(openingNames, 10)

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-violet-500/30">

            <header className="border-b border-white/5 bg-slate-950/80 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
                    <Link
                        href="/openings"
                        className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
                    >
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 transition-all">
                            <ChevronLeft className="w-4 h-4" />
                        </div>
                        <span className="hidden sm:inline">Dashboard</span>
                    </Link>

                    <div className="flex items-center gap-3">
                        <div className="bg-rose-500/10 p-2 rounded-lg text-rose-400">
                            <Swords className="w-5 h-5" />
                        </div>
                        <h1 className="font-bold tracking-tight text-slate-100">Punishment Mode</h1>
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
