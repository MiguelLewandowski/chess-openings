import { getOpeningBySlug } from "@/services/opening.service";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Star, Lock, BookOpen } from "lucide-react";

export default async function OpeningTrackPage({ params }: { params: { slug: string } }) {
  const resolvedParams = await params;
  
  const opening = await getOpeningBySlug(resolvedParams.slug);

  if (!opening) {
    notFound();
  }

  // Ordenar as lições para garantir a trilha sequencial correta
  const sortedLessons = [...opening.lessons].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-violet-500/30">
      
      {/* Header Fixo */}
      <header className="border-b border-white/5 bg-slate-950/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link 
            href="/openings" 
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Gallery</span>
          </Link>
          
          <h1 className="font-bold tracking-tight text-slate-100 truncate px-4">
            {opening.name}
          </h1>
          
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/10 text-violet-400 rounded-lg font-bold text-sm">
            <Star className="w-4 h-4 fill-violet-400" />
            <span>0</span>
          </div>
        </div>
      </header>

      {/* Trilha (Path) */}
      <main className="max-w-3xl mx-auto px-4 py-16 flex flex-col items-center">
        
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight mb-3">Your Path</h2>
          <p className="text-slate-400 max-w-md mx-auto">
            {opening.description || "Complete the lessons in order to master this opening."}
          </p>
        </div>

        <div className="relative w-full flex flex-col items-center pb-24">
          
          {sortedLessons.map((lesson, index) => {
            // Lógica para o zig-zag do Duolingo (ex: Centro, Direita, Centro, Esquerda)
            const cycle = index % 4;
            let translateX = "translate-x-0";
            if (cycle === 1) translateX = "translate-x-12 sm:translate-x-20";
            if (cycle === 3) translateX = "-translate-x-12 sm:-translate-x-20";

            // Linha SVG de conexão para o próximo nó
            const hasNext = index < sortedLessons.length - 1;
            const nextCycle = (index + 1) % 4;
            
            // Variáveis de estado (Simulação - no futuro virá da tabela UserProgress)
            const isUnlocked = index === 0; // Por agora, só a primeira lição está "desbloqueada" para efeito visual
            const isCompleted = false;

            return (
              <div key={lesson.id} className={`relative flex flex-col items-center w-full ${translateX} mb-12`}>
                
                {/* Título Flutuante acima do botão */}
                <div className="absolute -top-10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-slate-800 text-slate-200 text-sm font-bold py-1.5 px-4 rounded-xl shadow-xl border border-white/10 relative">
                    {lesson.title}
                    {/* Seta do tooltip */}
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-800 border-b border-r border-white/10 rotate-45"></div>
                  </div>
                </div>

                {/* Nó/Botão da Lição */}
                <Link 
                  href={isUnlocked || isCompleted ? `/lessons/${lesson.id}` : '#'}
                  className={`group relative z-10 flex items-center justify-center w-20 h-20 rounded-full border-b-8 active:border-b-0 active:translate-y-2 transition-all duration-150 ${
                    isCompleted 
                      ? 'bg-emerald-500 border-emerald-700 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                      : isUnlocked
                      ? 'bg-violet-500 border-violet-700 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:bg-violet-400'
                      : 'bg-slate-800 border-slate-900 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isCompleted ? (
                    <Star className="w-8 h-8 fill-white" />
                  ) : isUnlocked ? (
                    <BookOpen className="w-8 h-8" />
                  ) : (
                    <Lock className="w-7 h-7" />
                  )}

                  {/* Coroa/Indicador de Progresso (opcional) */}
                  {isUnlocked && !isCompleted && (
                    <div className="absolute -top-2 -right-2 bg-white text-violet-600 text-xs font-black w-7 h-7 flex items-center justify-center rounded-full shadow-lg border-2 border-violet-500">
                      {lesson.order}
                    </div>
                  )}
                </Link>

                {/* Texto estático abaixo para ecrãs onde o tooltip hover não funciona bem (mobile) */}
                <span className="mt-4 text-sm font-bold text-slate-300 text-center max-w-[150px] leading-tight">
                  {lesson.title}
                </span>

                {/* Linha Conectora SVG (desenha a curva até ao próximo botão) */}
                {hasNext && (
                  <div className="absolute top-20 -z-10 h-28 w-full flex justify-center pointer-events-none opacity-20">
                    <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                      {/* Curvas baseadas no zig-zag */}
                      {cycle === 0 && nextCycle === 1 && (
                         <path d="M 50,0 Q 50,50 75,50 T 100,100" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="10 10" />
                      )}
                      {cycle === 1 && nextCycle === 2 && (
                         <path d="M 50,0 Q 50,50 25,50 T 0,100" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="10 10" />
                      )}
                      {cycle === 2 && nextCycle === 3 && (
                         <path d="M 50,0 Q 50,50 25,50 T 0,100" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="10 10" />
                      )}
                      {cycle === 3 && nextCycle === 0 && (
                         <path d="M 50,0 Q 50,50 75,50 T 100,100" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="10 10" />
                      )}
                    </svg>
                  </div>
                )}
              </div>
            );
          })}

          {/* Troféu Final */}
          <div className="relative flex flex-col items-center mt-8">
            <div className="w-24 h-24 bg-slate-900 border-4 border-slate-800 rounded-full flex items-center justify-center shadow-2xl">
              <Star className="w-10 h-10 text-slate-600" />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}