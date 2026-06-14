'use client'

import { useRouter, usePathname } from 'next/navigation'
import { BookOpen, Swords } from 'lucide-react'

interface ModeToggleProps {
    currentMode: 'THEORY' | 'PRACTICE'
    hasTheory: boolean
    hasPractice: boolean
}

export default function ModeToggle({ currentMode, hasTheory, hasPractice }: ModeToggleProps) {
    const router = useRouter()
    const pathname = usePathname()

    if (!hasTheory || !hasPractice) return null

    return (
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
                onClick={() => router.push(`${pathname}?mode=theory`)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                    currentMode === 'THEORY'
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                }`}
            >
                <BookOpen className="w-3.5 h-3.5" />
                Theory
            </button>
            <button
                onClick={() => router.push(`${pathname}?mode=practice`)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                    currentMode === 'PRACTICE'
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                }`}
            >
                <Swords className="w-3.5 h-3.5" />
                Practice
            </button>
        </div>
    )
}
