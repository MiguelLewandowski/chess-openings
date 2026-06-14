import Link from "next/link";
import { BookOpen, Target, Sparkles, ChevronRight, BrainCircuit, Lock } from "lucide-react";
import { getSession } from "@/lib/session";
import { logoutAction } from "@/app/actions/auth.actions";
import DemoSection from "@/components/chess/DemoSection";

export default async function Home() {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-violet-500/30 overflow-hidden relative">
      
      {/* Efeitos de Fundo (Glow) */}
      <div className="absolute top-[-10%] left-[-10%] w-2/5 h-2/5 bg-violet-600/20 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-2/5 h-2/5 bg-fuchsia-600/10 blur-3xl rounded-full pointer-events-none" />

      {/* Navegação Superior */}
      <header className="relative z-10 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-violet-500 p-2 rounded-xl shadow-lg shadow-violet-500/30">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white">
              Chess<span className="text-violet-400">Openings</span>
            </span>
          </div>
          <nav className="flex items-center gap-4 sm:gap-6">
            <Link href="/admin/import" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-white transition-colors">
              <Lock className="w-3.5 h-3.5" />
              Administração
            </Link>
            
            {session ? (
              <div className="flex items-center gap-4">
                <span className="hidden sm:inline-block text-sm font-bold text-violet-300">
                  {session.name || session.email}
                </span>
                <Link 
                  href="/openings" 
                  className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm font-bold text-white transition-all shadow-lg shadow-violet-500/20 active:scale-95"
                >
                  Painel
                </Link>
                <form action={logoutAction} className="inline">
                  <button type="submit" className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-all active:scale-95">
                    Sair
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link 
                  href="/login" 
                  className="px-5 py-2.5 text-sm font-bold text-slate-300 hover:text-white transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-all active:scale-95"
                >
                  Criar conta
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-32 flex flex-col items-center text-center">
        
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm font-medium mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
          </span>
          Seu treinador de aberturas inteligente
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.1] mb-8">
          Domine o tabuleiro com <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
            Master Gambito
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed">
          Treine aberturas de forma interativa. Importe seus estudos do Lichess e aprenda os conceitos por trás de cada lance com feedback pedagógico personalizado.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link 
            href="/openings" 
            className="group flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-violet-600/25 transition-all duration-200 active:scale-95"
          >
            Começar a treinar
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link 
            href="/style-quiz" 
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-slate-600 rounded-2xl font-bold text-lg transition-all duration-200 active:scale-95"
          >
            <BrainCircuit className="w-5 h-5 text-violet-400" />
            Teste de estilo
          </Link>
          <Link 
            href="/admin/import" 
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 hover:border-slate-700 rounded-2xl font-bold text-lg transition-all duration-200 active:scale-95"
          >
            <BookOpen className="w-5 h-5 text-slate-500" />
            Importar estudo
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 text-left w-full">
          <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-sm">
            <div className="bg-emerald-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
              <Target className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Repetição espaçada</h3>
            <p className="text-slate-400 leading-relaxed">
              Nosso algoritmo sabe exatamente quando você deve revisar uma variação para que a memória se torne permanente.
            </p>
          </div>

          <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Sparkles className="w-32 h-32 text-violet-400" />
            </div>
            <div className="bg-violet-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
              <Sparkles className="w-6 h-6 text-violet-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Análises socráticas</h3>
            <p className="text-slate-400 leading-relaxed">
              A IA não entrega só a resposta. Ela explica os conceitos e as casas-chave, preservando o conhecimento original.
            </p>
          </div>

          <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-sm">
            <div className="bg-sky-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
              <BookOpen className="w-6 h-6 text-sky-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Trilhas estilo Duolingo</h3>
            <p className="text-slate-400 leading-relaxed">
              Avance na teoria e na prática de forma gamificada e visual, desbloqueando conhecimento passo a passo.
            </p>
          </div>
        </div>

      </main>

      <DemoSection />
    </div>
  );
}
