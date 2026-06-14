import { apiClient, type DueReview } from "@/lib/api-client"
import Link from "next/link";
import { PlusCircle, Search, BookOpen, ChevronLeft, Swords } from "lucide-react";
import OpeningCard from "./OpeningCard";
import UserProfile from "./UserProfile";
import DueToday from "@/components/DueToday";
import { getSession } from "@/lib/session";

export default async function OpeningsCatalogPage() {
    const [openings, session] = await Promise.all([
        apiClient.openings.findAll(),
        getSession(),
    ]);

    // SM-2 data — only fetched when logged in
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
        <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-violet-500/30">

            {/* Header da Galeria */}
            <header className="border-b border-white/5 bg-slate-950/80 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-all"
                            title="Voltar para a página inicial"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Link>

                        <div className="hidden sm:flex items-center gap-3 ml-2 border-l border-slate-800 pl-6">
                            <div className="bg-violet-500/10 p-2.5 rounded-xl text-violet-400">
                                <Search className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-slate-100">Galeria de aberturas</h1>
                                <p className="text-sm text-slate-400 font-medium">Seu repertório pessoal de xadrez</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex sm:hidden items-center gap-3">
                        <h1 className="text-xl font-bold tracking-tight text-slate-100">Galeria</h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <UserProfile sessionArchetype={session?.styleArchetype || null} />

                        <Link
                            href="/blunder"
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 rounded-xl font-medium transition-all duration-200 active:scale-95"
                            title="Modo Punição"
                        >
                            <Swords className="w-4 h-4" />
                            <span className="hidden sm:inline text-sm">Punir</span>
                        </Link>

                        <Link
                            href="/admin/import"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium shadow-lg shadow-violet-500/25 transition-all duration-200 active:scale-95"
                        >
                            <PlusCircle className="w-5 h-5" />
                            <span className="hidden sm:inline">Nova abertura</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Conteúdo Principal */}
            <main className="max-w-6xl mx-auto px-4 md:px-8 py-12">

                {/* SM-2 Dashboard — só para utilizadores logados */}
                {session && (
                    <DueToday
                        reviews={dueReviews}
                        streak={userStreak}
                        xp={userXp}
                    />
                )}

                {openings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-slate-900/50 border border-slate-800/50 rounded-3xl border-dashed">
                        <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                            <BookOpen className="w-12 h-12 text-slate-400" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-200 mb-3">Nenhuma abertura ainda</h2>
                        <p className="text-slate-400 max-w-md mb-2 leading-relaxed">
                            Seu repertório está vazio. Importe um estudo público do Lichess para gerar lições interativas, comentários do treinador com IA e treino por repetição espaçada.
                        </p>
                        <p className="text-slate-400 max-w-md mb-8 text-sm">
                            Após importar, cada capítulo vira uma lição com os modos Teoria e Prática.
                        </p>
                        <Link
                            href="/admin/import"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium shadow-lg shadow-violet-500/25 transition-all duration-200 active:scale-95"
                        >
                            <PlusCircle className="w-5 h-5" />
                            Importar primeiro estudo
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {openings.map((opening) => (
                            <OpeningCard key={opening.id} opening={opening} />
                        ))}
                    </div>
                )}

            </main>
        </div>
    );
}
