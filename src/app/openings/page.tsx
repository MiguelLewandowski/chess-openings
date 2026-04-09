import { getAllOpenings } from "@/services/opening.service"
import Link from "next/link";
import { PlusCircle, Search, BookOpen, ChevronLeft } from "lucide-react";
import OpeningCard from "./OpeningCard";
import UserProfile from "./UserProfile";
import { getSession } from "@/lib/session";

export default async function OpeningsCatalogPage() {
    const openings = await getAllOpenings();
    const session = await getSession();

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-violet-500/30">
            
            {/* Header da Galeria */}
            <header className="border-b border-white/5 bg-slate-950/80 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link 
                            href="/" 
                            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-all"
                            title="Voltar para a Página Inicial"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        
                        <div className="hidden sm:flex items-center gap-3 ml-2 border-l border-slate-800 pl-6">
                            <div className="bg-violet-500/10 p-2.5 rounded-xl text-violet-400">
                                <Search className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-slate-100">Openings Gallery</h1>
                                <p className="text-sm text-slate-400 font-medium">Your personal chess repertoire</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex sm:hidden items-center gap-3">
                        <h1 className="text-xl font-bold tracking-tight text-slate-100">Gallery</h1>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <UserProfile sessionArchetype={session?.styleArchetype || null} />
                        
                        <Link 
                            href="/admin/import" 
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium shadow-lg shadow-violet-500/25 transition-all duration-200 active:scale-95"
                        >
                            <PlusCircle className="w-5 h-5" />
                            <span className="hidden sm:inline">New Opening</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Conteúdo Principal */}
            <main className="max-w-6xl mx-auto px-4 md:px-8 py-12">
                
                {openings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-slate-900/50 border border-slate-800/50 rounded-3xl border-dashed">
                        <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                            <BookOpen className="w-12 h-12 text-slate-500" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-200 mb-3">No openings found</h2>
                        <p className="text-slate-400 max-w-md mb-8 leading-relaxed">
                            Your repertoire is empty. Import a PGN study from Lichess to start creating interactive lessons and training your variations.
                        </p>
                        <Link 
                            href="/admin/import" 
                            className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium shadow-lg shadow-violet-500/25 transition-all duration-200 active:scale-95"
                        >
                            <PlusCircle className="w-5 h-5" />
                            Import First Study
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
