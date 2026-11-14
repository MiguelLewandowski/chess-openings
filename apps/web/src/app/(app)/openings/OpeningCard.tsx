'use client'

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { BookOpen, Trash2, Loader2, ChevronRight, Route } from "lucide-react";
import { OPENING_STYLE_LABELS, type OpeningSummary } from "@chess-openings/domain";
import { deleteOpening } from "@/app/actions/opening.actions";
import { isStyleArchetype, type StyleArchetype } from "@/lib/archetypes";
import { percent, styleTagLabel } from "@/lib/profile";
import { pathsLabel } from "@/lib/opening-paths";
import { cn } from "@/lib/cn";

// The archetype lives in localStorage, which exists only in the browser. Reading it through
// useSyncExternalStore lets the server render `null` and the client render the stored value
// without a setState inside an effect — which would queue a second render on every card.
// Nothing writes the key while this page is mounted, so `subscribe` has nothing to observe.
const NEVER_CHANGES = () => () => {};
const readStoredStyle = () => localStorage.getItem('chess_style_archetype');
const noStyleOnServer = () => null;

// Deleting is an admin action; the API enforces it too, the flag only keeps the button
// away from students.
export default function OpeningCard({
    opening,
    completedLessons,
    canDelete,
}: {
    opening: OpeningSummary;
    // Lessons done on the chosen path; null when the student has not chosen one.
    completedLessons: number | null;
    canDelete: boolean;
}) {
    const [isDeleting, setIsDeleting] = useState(false);
    const saved = useSyncExternalStore(NEVER_CHANGES, readStoredStyle, noStyleOnServer);
    const userStyle: StyleArchetype | null = isStyleArchetype(saved) ? saved : null;

    const isMatch = userStyle && opening.styleTags?.includes(userStyle);

    // A family entry stands for one of its paths (the chosen one, or the calmest): deleting
    // removes that path only, so the confirmation names it.
    const hasPaths = opening.paths.length > 1;
    const deletedName = opening.paths.find((path) => path.id === opening.id)?.name ?? opening.name;
    const chosen = hasPaths ? opening.chosenStyle : null;
    const total = opening.lessons.length;

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();

        if (!window.confirm(`Tem certeza que deseja excluir "${deletedName}"? Esta ação não pode ser desfeita.`)) {
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
            className={`group relative flex flex-col justify-between bg-surface-card border rounded-[12px] p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 overflow-hidden ${isMatch ? 'border-[#2EA05D]/40' : 'border-border-subtle'}`}
        >
            {isMatch && (
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
                                {styleTagLabel(opening.styleTags[0])}
                            </span>
                        )}
                    </div>
                </div>

                {canDelete && (
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="p-2 text-ink-400 hover:text-danger hover:bg-danger-soft rounded-[6px] transition-colors z-20"
                        title={`Excluir ${deletedName}`}
                    >
                        {isDeleting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Trash2 className="w-4 h-4" />
                        )}
                    </button>
                )}
            </div>

            <div className="relative z-10 flex-1">
                <p className="text-ink-500 text-[13px] leading-relaxed line-clamp-2 mb-5">
                    {opening.description || "Sem descrição disponível."}
                </p>
                {hasPaths && (
                    <p className="flex items-start gap-1.5 text-[12px] text-ink-500 mb-5">
                        <Route className="w-3.5 h-3.5 mt-px shrink-0 text-ink-400" aria-hidden />
                        {chosen ? (
                            <span>
                                Seu caminho: <span className="font-semibold text-ink-900">{OPENING_STYLE_LABELS[chosen]}</span>
                            </span>
                        ) : (
                            <span>
                                <span className="font-semibold text-ink-700">{opening.paths.length} caminhos:</span>{" "}
                                {pathsLabel(opening.paths)}
                            </span>
                        )}
                    </p>
                )}
            </div>

            <div className="relative z-10 flex items-center justify-between gap-3 pt-4 border-t border-border-subtle">
                {chosen && completedLessons !== null ? (
                    <PathProgress done={completedLessons} total={total} />
                ) : (
                    <span className="text-[12px] font-medium text-ink-500 bg-surface-sunken px-2.5 py-1 rounded-full border border-border-subtle">
                        {hasPaths
                            ? "Escolha um caminho"
                            : `${total} ${total === 1 ? 'lição' : 'lições'}`}
                    </span>
                )}

                <div className="flex items-center gap-1 text-[13px] font-semibold text-accent opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 duration-200">
                    {hasPaths && !chosen ? "Escolher" : "Estudar"}
                    <ChevronRight className="w-4 h-4" />
                </div>
            </div>
        </Link>
    );
}

function PathProgress({ done, total }: { done: number; total: number }) {
    const value = percent(done, total);
    return (
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div
                className="h-1.5 w-full max-w-28 rounded-full bg-surface-sunken overflow-hidden"
                role="progressbar"
                aria-label="Progresso no caminho"
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={100}
            >
                <div className={cn("h-full rounded-full", done === total ? "bg-reward" : "bg-success")} style={{ width: `${value}%` }} />
            </div>
            <span className="text-[12px] font-medium text-ink-500 whitespace-nowrap">
                {done} de {total} {total === 1 ? 'lição' : 'lições'}
            </span>
        </div>
    );
}
