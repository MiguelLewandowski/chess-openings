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
        setMounted(true);
        const saved = localStorage.getItem('chess_style_archetype');
        if (isStyleArchetype(saved)) setUserStyle(saved);
    }, []);

    const isMatch = userStyle && opening.styleTags?.includes(userStyle);

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();

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
            className={`group relative flex flex-col justify-between bg-surface-card border rounded-[12px] p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 overflow-hidden ${mounted && isMatch ? 'border-[#2EA05D]/40' : 'border-border-subtle'}`}
        >
            {mounted && isMatch && (
                <div className="absolute top-0 right-0 bg-success text-white text-[10px] font-black px-3 py-1 rounded-bl-[10px] z-20">
                    COMBINA COM VOCÊ
                </div>
            )}

            <div className="relative z-10 flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                    <div className="bg-accent-soft p-2.5 rounded-[8px] border border-accent/15 group-hover:bg-accent/15 transition-colors">
                        <BookOpen className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                        <h2 className="font-display font-bold text-[17px] tracking-tight text-ink-900 group-hover:text-accent transition-colors">
                            {opening.name}
                        </h2>
                        {opening.styleTags && opening.styleTags.length > 0 && (
                            <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wider text-accent bg-accent-soft px-2 py-0.5 rounded border border-accent/20">
                                {opening.styleTags[0]}
                            </span>
                        )}
                    </div>
                </div>

                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="p-2 text-ink-400 hover:text-danger hover:bg-danger-soft rounded-[6px] transition-colors z-20"
                    title="Excluir abertura"
                >
                    {isDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Trash2 className="w-4 h-4" />
                    )}
                </button>
            </div>

            <div className="relative z-10 flex-1">
                <p className="text-ink-500 text-[13px] leading-relaxed line-clamp-2 mb-5">
                    {opening.description || "Sem descrição disponível."}
                </p>
            </div>

            <div className="relative z-10 flex items-center justify-between pt-4 border-t border-border-subtle">
                <span className="text-[12px] font-medium text-ink-500 bg-surface-sunken px-2.5 py-1 rounded-full border border-border-subtle">
                    {opening.lessons.length} {opening.lessons.length === 1 ? 'lição' : 'lições'}
                </span>

                <div className="flex items-center gap-1 text-[13px] font-semibold text-accent opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 duration-200">
                    Estudar
                    <ChevronRight className="w-4 h-4" />
                </div>
            </div>
        </Link>
    );
}
