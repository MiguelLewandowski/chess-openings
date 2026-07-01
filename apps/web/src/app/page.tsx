import Link from "next/link";
import { BookOpen, Target, Sparkles, ChevronRight, BrainCircuit, Lock } from "lucide-react";
import { getSession } from "@/lib/session";
import { logoutAction } from "@/app/actions/auth.actions";
import DemoSection from "@/components/chess/DemoSection";
import { buttonClasses } from "@/components/ui";

export default async function Home() {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-surface-app text-ink-900 font-body">

      {/* Navegação Superior */}
      <header className="border-b border-border-subtle bg-surface-card/90 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-ink-900 rounded-[9px] flex items-center justify-center text-[20px]">
              ♞
            </div>
            <span className="font-display font-extrabold text-[17px] tracking-tight text-ink-900">
              Chess Openings
              <span className="block text-[10px] font-semibold tracking-[0.14em] uppercase text-ink-400 leading-none">
                Aprenda jogando
              </span>
            </span>
          </div>

          <nav className="flex items-center gap-4">
            <Link
              href="/admin/import"
              className="hidden sm:inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-500 hover:text-ink-900 transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              Administração
            </Link>

            {session ? (
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-block text-[13px] font-semibold text-ink-700">
                  {session.name || session.email}
                </span>
                <Link href="/openings" className={buttonClasses({ variant: 'primary', size: 'sm' })}>
                  Painel
                </Link>
                <form action={logoutAction} className="inline">
                  <button type="submit" className={buttonClasses({ variant: 'ghost', size: 'sm' })}>
                    Sair
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className={buttonClasses({ variant: 'ghost', size: 'sm' })}>
                  Entrar
                </Link>
                <Link href="/register" className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
                  Criar conta
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-6 pt-24 pb-32 flex flex-col items-center text-center">

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-soft border border-accent/20 text-accent text-[13px] font-semibold mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
          </span>
          Seu treinador de aberturas inteligente
        </div>

        <h1 className="font-display font-extrabold text-5xl md:text-[68px] tracking-tight text-ink-900 max-w-4xl leading-[1.05] mb-6">
          Domine o tabuleiro com{' '}
          <span className="text-accent">Master Gambito</span>
        </h1>

        <p className="text-[17px] text-ink-500 max-w-2xl mb-10 leading-relaxed">
          Treine aberturas de forma interativa. Importe seus estudos do Lichess e aprenda os conceitos por trás de cada lance com feedback pedagógico personalizado.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link href="/openings" className={buttonClasses({ variant: 'primary', size: 'lg' })}>
            Começar a treinar
            <ChevronRight className="w-5 h-5" />
          </Link>
          <Link href="/style-quiz" className={buttonClasses({ variant: 'secondary', size: 'lg' })}>
            <BrainCircuit className="w-5 h-5 text-accent" />
            Teste de estilo
          </Link>
          <Link href="/admin/import" className={buttonClasses({ variant: 'ghost', size: 'lg' })}>
            <BookOpen className="w-5 h-5" />
            Importar estudo
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-28 text-left w-full">
          <div className="bg-surface-card border border-border-subtle rounded-[12px] p-7 shadow-sm">
            <div className="w-11 h-11 bg-success-soft rounded-[8px] flex items-center justify-center mb-5">
              <Target className="w-5 h-5 text-success" />
            </div>
            <h3 className="font-display font-bold text-[17px] text-ink-900 mb-2">Repetição espaçada</h3>
            <p className="text-ink-500 leading-relaxed text-[14px]">
              Nosso algoritmo sabe exatamente quando você deve revisar uma variação para que a memória se torne permanente.
            </p>
          </div>

          <div className="bg-surface-card border border-accent/30 border-t-2 border-t-accent rounded-[12px] p-7 shadow-sm">
            <div className="w-11 h-11 bg-accent-soft rounded-[8px] flex items-center justify-center mb-5">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
            <h3 className="font-display font-bold text-[17px] text-ink-900 mb-2">Análises socráticas</h3>
            <p className="text-ink-500 leading-relaxed text-[14px]">
              A IA não entrega só a resposta. Ela explica os conceitos e as casas-chave, preservando o conhecimento original.
            </p>
          </div>

          <div className="bg-surface-card border border-border-subtle rounded-[12px] p-7 shadow-sm">
            <div className="w-11 h-11 bg-reward-soft rounded-[8px] flex items-center justify-center mb-5">
              <BookOpen className="w-5 h-5 text-reward-strong" />
            </div>
            <h3 className="font-display font-bold text-[17px] text-ink-900 mb-2">Trilhas gamificadas</h3>
            <p className="text-ink-500 leading-relaxed text-[14px]">
              Avance na teoria e na prática de forma visual, desbloqueando conhecimento passo a passo com XP e sequências.
            </p>
          </div>
        </div>
      </main>

      <DemoSection />
    </div>
  );
}
