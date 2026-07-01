'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Sparkles } from 'lucide-react';
import { ARCHETYPES, isStyleArchetype } from '@/lib/archetypes';

export default function UserProfile({ sessionArchetype }: { sessionArchetype?: string | null }) {
    const [archetype, setArchetype] = useState<string | null>(sessionArchetype || null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);

        if (sessionArchetype) {
            localStorage.setItem('chess_style_archetype', sessionArchetype);
        } else {
            const saved = localStorage.getItem('chess_style_archetype');
            if (saved) setArchetype(saved);
        }
    }, [sessionArchetype]);

    if (!mounted) return null;

    const name = isStyleArchetype(archetype) ? ARCHETYPES[archetype].name : null;

    return (
        <div className="flex items-center gap-3">
            {name ? (
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-accent-soft border border-accent/20 rounded-lg text-accent text-[13px] font-bold">
                    <Sparkles className="w-4 h-4" />
                    {name}
                </div>
            ) : (
                <Link
                    href="/style-quiz"
                    className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-surface-sunken hover:bg-surface-app border border-border-default rounded-lg text-ink-600 hover:text-ink-900 text-[13px] font-bold transition-colors"
                >
                    <User className="w-4 h-4" />
                    Descubra seu estilo
                </Link>
            )}
        </div>
    );
}
