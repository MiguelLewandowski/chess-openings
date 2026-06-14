'use client'

import { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, Trash2, Loader2, ChevronRight } from "lucide-react";
import { deleteOpening } from "@/app/actions/opening.actions";
import { isStyleArchetype, type StyleArchetype } from "@/lib/archetypes";

interface Opening {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    styleTags: string[];
    lessons: { id: string }[];
}

export default function OpeningCard({ opening }: { opening: Opening }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [userStyle, setUserStyle] = useState<StyleArchetype | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
        const saved = localStorage.getItem('chess_style_archetype');
        if (isStyleArchetype(saved)) setUserStyle(saved);
    }, []);

    const isMatch = userStyle && opening.styleTags?.includes(userStyle);

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigating to the link
        
        if (!window.confirm(`Tem certeza que deseja excluir "${opening.name}"? Esta ação não pode ser desfeita.`)) {
            return;
        }

        setIsDeleting(true);
        const result = await deleteOpening(opening.id);
        
        if (!result.success) {
            alert(result.error);
            setIsDeleting(false);
        }
    }

    return (
        <Link 
            href={`/openings/${opening.slug}`}
            className={`group relative flex flex-col justify-between bg-slate-900 border hover:border-violet-500/50 rounded-2xl p-6 shadow-xl shadow-black/20 hover:shadow-violet-500/10 transition-all duration-300 hover:-translate-y-1 overflow-hidden ${mounted && isMatch ? 'border-emerald-500/30' : 'border-slate-800'}`}
        >
            {mounted && isMatch && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl shadow-md z-20">
                    COMBINA COM VOCÊ
                </div>
            )}
            {/* Hover Gradient Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/0 via-transparent to-transparent group-hover:from-violet-500/5 transition-colors duration-500 pointer-events-none" />

            <div className="relative z-10 flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                    <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50 group-hover:bg-violet-500/10 group-hover:border-violet-500/20 transition-colors">
                        <BookOpen className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-slate-100 group-hover:text-white transition-colors">
                            {opening.name}
                        </h2>
                        {opening.styleTags && opening.styleTags.length > 0 && (
                            <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wider text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
                                {opening.styleTags[0]}
                            </span>
                        )}
                    </div>
                </div>

                <button 
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors z-20"
                    title="Excluir abertura"
                >
                    {isDeleting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Trash2 className="w-5 h-5" />
                    )}
                </button>
            </div>

            <div className="relative z-10 flex-1">
                <p className="text-slate-400 text-sm leading-relaxed line-clamp-2 mb-6">
                    {opening.description || "Sem descrição disponível."}
                </p>
            </div>

            <div className="relative z-10 flex items-center justify-between pt-4 border-t border-slate-800/50">
                <span className="text-xs font-medium text-slate-400 bg-slate-800/50 px-2.5 py-1 rounded-full">
                    {opening.lessons.length} {opening.lessons.length === 1 ? 'lição' : 'lições'}
                </span>

                <div className="flex items-center gap-1 text-sm font-medium text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0 duration-300">
                    Estudar
                    <ChevronRight className="w-4 h-4" />
                </div>
            </div>
        </Link>
    );
}
