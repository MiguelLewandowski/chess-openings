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
        <div className="flex items-center gap-1 bg-surface-sunken border border-border-subtle rounded-[10px] p-1">
            <button
                onClick={() => router.push(`${pathname}?mode=theory`)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[13px] font-bold transition-all ${
                    currentMode === 'THEORY'
                        ? 'bg-accent text-white shadow-sm'
                        : 'text-ink-500 hover:text-ink-900'
                }`}
            >
                <BookOpen className="w-3.5 h-3.5" />
                Teoria
            </button>
            <button
                onClick={() => router.push(`${pathname}?mode=practice`)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[13px] font-bold transition-all ${
                    currentMode === 'PRACTICE'
                        ? 'bg-accent text-white shadow-sm'
                        : 'text-ink-500 hover:text-ink-900'
                }`}
            >
                <Swords className="w-3.5 h-3.5" />
                Prática
            </button>
        </div>
    )
}
