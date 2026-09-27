import { apiClient, type DueReview } from "@/lib/api-client"
import Link from "next/link";
import { PlusCircle, Search, BookOpen } from "lucide-react";
import OpeningCard from "./OpeningCard";
import UserProfile from "./UserProfile";
import DueToday from "@/components/DueToday";
import { getSession } from "@/lib/session";
import { buttonClasses } from "@/components/ui";

export default async function OpeningsCatalogPage() {
    const [openings, session] = await Promise.all([
        apiClient.openings.findAll(),
        getSession(),
    ]);

    let dueReviews: DueReview[] = [];
    let userStreak = 0;
    let userXp = 0;

    if (session) {
        const [reviews, user] = await Promise.all([
            apiClient.progress.dueReviews(session.apiToken),
            apiClient.auth.me(session.apiToken),
        ]);
        dueReviews = reviews;
        userStreak = user.streak;
        userXp = user.xp;
    }

    return (
        <div className="min-h-screen bg-surface-app text-ink-900 font-body">

            <header className="border-b border-border-subtle bg-surface-card/90 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center gap-2 no-underline">
                            <div className="w-8 h-8 bg-ink-900 rounded-[9px] flex items-center justify-center text-[18px]">♞</div>
                            <span className="hidden sm:block font-display font-extrabold text-[15px] tracking-tight text-ink-900">Chess Openings</span>
                        </Link>

                        <div className="hidden sm:flex items-center gap-2 ml-3 pl-4 border-l border-border-subtle text-ink-500">
                            <Search className="w-4 h-4" />
                            <span className="text-[14px] font-semibold text-ink-700">Galeria de aberturas</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <UserProfile sessionArchetype={session?.styleArchetype || null} />

                        <Link href="/admin/import" className={buttonClasses({ variant: 'primary', size: 'sm' })}>
                            <PlusCircle className="w-4 h-4" />
                            <span className="hidden sm:inline">Nova abertura</span>
                            <span className="sm:hidden">Nova</span>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 md:px-8 py-10">

                {session && (
                    <DueToday
                        reviews={dueReviews}
                        streak={userStreak}
                        xp={userXp}
                    />
                )}

                {openings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-surface-card border border-dashed border-border-default rounded-[16px]">
                        <div className="w-16 h-16 bg-surface-sunken rounded-full flex items-center justify-center mb-5">
                            <BookOpen className="w-8 h-8 text-ink-400" />
                        </div>
                        <h2 className="font-display font-bold text-[22px] tracking-tight text-ink-900 mb-2">Nenhuma abertura ainda</h2>
                        <p className="text-ink-500 max-w-md mb-2 leading-relaxed text-[14px]">
                            Seu repertório está vazio. Importe um estudo público do Lichess para gerar lições interativas, comentários do treinador com IA e treino por repetição espaçada.
                        </p>
                        <p className="text-ink-400 max-w-md mb-8 text-[13px]">
                            Após importar, cada capítulo vira uma lição com os modos Teoria e Prática.
                        </p>
                        <Link href="/admin/import" className={buttonClasses({ variant: 'primary' })}>
                            <PlusCircle className="w-5 h-5" />
                            Importar primeiro estudo
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {openings.map((opening) => (
                            <OpeningCard key={opening.id} opening={opening} />
                        ))}
                    </div>
                )}

            </main>
        </div>
    );
}
