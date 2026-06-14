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

        // If we already have it from the server, sync it to localStorage; otherwise read it back.
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
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-lg text-violet-400 text-sm font-bold">
                    <Sparkles className="w-4 h-4" />
                    {name}
                </div>
            ) : (
                <Link 
                    href="/style-quiz"
                    className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 hover:text-white text-sm font-bold transition-colors"
                >
                    <User className="w-4 h-4" />
                    Descubra seu estilo
                </Link>
            )}
        </div>
    );
}