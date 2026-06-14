'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, BrainCircuit } from 'lucide-react';
import { Chessground } from 'chessground';
import type { Key } from 'chessground/types';
import { Chess } from 'chess.js';
import { saveUserArchetype } from '@/app/actions/auth.actions';
import { ARCHETYPES, dominantStyle } from '@/lib/archetypes';

const QUESTIONS = [
  {
    id: 1,
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3', // e4 e5 Nf3 Nc6
    title: 'A escolha de abertura',
    description: 'Você joga de brancas. Como desenvolve seu bispo?',
    options: [
      { move: 'Bc4', label: 'Abertura Italiana (Ativa e direta)', style: 'Aggressive' },
      { move: 'Bb5', label: 'Ruy Lopez (Pressão estratégica)', style: 'Positional' },
      { move: 'Nc3', label: 'Três Cavalos (Desenvolvimento sólido)', style: 'Solid' }
    ]
  },
  {
    id: 2,
    fen: 'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1', // d4
    title: 'Reagindo a 1.d4',
    description: 'Seu adversário joga 1.d4. Qual é a sua resposta?',
    options: [
      { move: 'Nf6', label: 'Defesa Índia (Flexível)', style: 'Positional' },
      { move: 'd5', label: 'Jogo do Peão da Dama (Centro sólido)', style: 'Solid' },
      { move: 'f5', label: 'Defesa Holandesa (Assimétrica)', style: 'Aggressive' }
    ]
  },
  {
    id: 3,
    fen: 'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3', // Ruy Lopez Bb5
    title: 'A tortura espanhola',
    description: 'As brancas jogam a Ruy Lopez. Como você defende?',
    options: [
      { move: 'a6', label: 'Defesa Morphy (Desafia o bispo)', style: 'Positional' },
      { move: 'Nf6', label: 'Defesa Berlim (Contra-ataque sólido)', style: 'Solid' },
      { move: 'f5', label: 'Defesa Schliemann (Gambito selvagem)', style: 'Aggressive' }
    ]
  },
  {
    id: 4,
    fen: 'rnbqkb1r/pppppppp/5n2/8/2P5/8/PP1PPPPP/RNBQKBNR w KQkq - 1 2', // c4 Nf6
    title: 'A Abertura Inglesa',
    description: 'Você jogou 1.c4 e as pretas respondem 1...Cf6. Qual é o seu plano?',
    options: [
      { move: 'Nc3', label: 'Desenvolver o cavalo (Sólido)', style: 'Solid' },
      { move: 'g3', label: 'Fianqueto (Posicional e lento)', style: 'Positional' },
      { move: 'd4', label: 'Transpor para linhas de d4 (Direto)', style: 'Aggressive' }
    ]
  },
  {
    id: 5,
    fen: 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2', // e4 c5
    title: 'Enfrentando a Siciliana',
    description: 'As pretas jogam a Defesa Siciliana. Como você procede?',
    options: [
      { move: 'Nf3', label: 'Siciliana Aberta (Principal e tática)', style: 'Aggressive' },
      { move: 'Nc3', label: 'Siciliana Fechada (Esquema posicional)', style: 'Positional' },
      { move: 'c3', label: 'Variante Alapin (Controle sólido do centro)', style: 'Solid' },
    ]
  },
  {
    id: 6,
    fen: 'rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2', // e4 c5 Nf3
    title: 'Defesa Siciliana',
    description: 'As brancas jogam Cf3. Qual é a sua escolha na Siciliana?',
    options: [
      { move: 'd6', label: 'Esquema Najdorf/Dragão (Flexível)', style: 'Positional' },
      { move: 'Nc6', label: 'Sveshnikov/Pelikan (Luta pelo centro)', style: 'Aggressive' },
      { move: 'e6', label: 'Kan/Taimanov (Sólido e compacto)', style: 'Solid' }
    ]
  },
  {
    id: 7,
    fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2', // e4 e5
    title: 'Jogo do Peão do Rei',
    description: 'Após 1.e4 e5, qual é o seu 2º lance preferido para as brancas?',
    options: [
      { move: 'Nf3', label: 'Desenvolvimento principal', style: 'Positional' },
      { move: 'f4', label: 'Gambito do Rei (Sacrifício pelo ataque)', style: 'Aggressive' },
      { move: 'Nc3', label: 'Jogo Vienense (Sólido)', style: 'Solid' }
    ]
  },
  {
    id: 8,
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // Start
    title: 'O primeiro lance',
    description: 'Você tem as peças brancas. Como abre o jogo?',
    options: [
      { move: 'e4', label: 'Peão do Rei (Tático e aberto)', style: 'Aggressive' },
      { move: 'd4', label: 'Peão da Dama (Posicional e fechado)', style: 'Positional' },
      { move: 'c4', label: 'Abertura Inglesa (Sólida e de flanco)', style: 'Solid' },
    ]
  },
  {
    id: 9,
    fen: 'rnbqkb1r/pppp1ppp/4pn2/8/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3', // d4 Nf6 c4 e6
    title: 'Defesa Nimzo-Índia',
    description: 'As pretas jogam e6. Qual é a sua estratégia?',
    options: [
      { move: 'Nc3', label: 'Permitir a Nimzo-Índia (Complexa)', style: 'Positional' },
      { move: 'Nf3', label: 'Bogo-Índia/Índia da Dama (Sólida)', style: 'Solid' },
      { move: 'g3', label: 'Catalã (Controle posicional)', style: 'Positional' } // giving more weight to positional here
    ]
  },
  {
    id: 10,
    fen: 'rnbqkbnr/ppppp1pp/8/5p2/4P3/8/PPPP1PPP/RNBQKBNR w KQkq f6 0 2', // e4 f5
    title: 'A Defesa Holandesa',
    description: 'As pretas desafiam seu peão de e4 com f5. Como você reage?',
    options: [
      { move: 'exf5', label: 'Aceitar o gambito (Tático)', style: 'Aggressive' },
      { move: 'd3', label: 'Defender o peão (Sólido)', style: 'Solid' },
      { move: 'Nc3', label: 'Desenvolver e preparar o ataque', style: 'Positional' }
    ]
  }
];

export default function StyleQuizPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [archetype, setArchetype] = useState<(typeof ARCHETYPES)[keyof typeof ARCHETYPES] | null>(null);

  const calculateArchetype = async (finalAnswers: string[]) => {
    const style = dominantStyle(finalAnswers);

    if (typeof window !== 'undefined') {
      localStorage.setItem('chess_style_archetype', style);
    }

    setArchetype(ARCHETYPES[style]);
    setIsFinished(true);

    // Save the style key to the database if the user is logged in
    try {
      await saveUserArchetype(style);
    } catch (e) {
      console.error('Could not save archetype to db', e);
    }
  };

  const handleAnswer = (style: string) => {
    const newAnswers = [...answers, style];
    setAnswers(newAnswers);

    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      calculateArchetype(newAnswers);
    }
  };

  // Initialize board for the current question
  useEffect(() => {
    if (isFinished || currentStep >= QUESTIONS.length) return;

    const el = document.getElementById('quiz-board');
    if (el) {
      const q = QUESTIONS[currentStep];
      const chess = new Chess(q.fen);
      const isWhiteTurn = chess.turn() === 'w';
      
      // Calculate legal dests only for the allowed options
      const dests = new Map<Key, Key[]>();
      
      q.options.forEach(opt => {
        try {
          // We need to figure out the from and to squares for the move string (e.g., 'Bc4')
          // The easiest way is to use chess.js to make the move on a clone
          const clone = new Chess(q.fen);
          const moveObj = clone.move(opt.move);
          if (moveObj) {
            const from = moveObj.from as Key
            const existing = dests.get(from) || []
            existing.push(moveObj.to as Key)
            dests.set(from, existing)
          }
        } catch (e) {
          console.error("Invalid move in options:", opt.move, e);
        }
      });

      const cg = Chessground(el, {
        fen: q.fen,
        orientation: isWhiteTurn ? 'white' : 'black',
        coordinates: false,
        turnColor: isWhiteTurn ? 'white' : 'black',
        movable: {
          color: isWhiteTurn ? 'white' : 'black',
          free: false,
          dests: dests,
        },
        events: {
          move: (orig, dest) => {
            // Find which option was played
            const clone = new Chess(q.fen);
            const moves = clone.moves({ verbose: true });
            const playedMove = moves.find(m => m.from === orig && m.to === dest);
            
            if (playedMove) {
              // Find the corresponding option
              // The options might be in SAN ('Bc4') or just standard. Let's match by comparing SAN.
              const matchedOption = q.options.find(opt => {
                const testClone = new Chess(q.fen);
                const testMoveObj = testClone.move(opt.move);
                return testMoveObj && testMoveObj.from === orig && testMoveObj.to === dest;
              });

              if (matchedOption) {
                setTimeout(() => handleAnswer(matchedOption.style), 500); // small delay for dopamine
              } else {
                // Should not happen if dests are strictly limited, but just in case
                setTimeout(() => cg.set({ fen: q.fen }), 200);
              }
            }
          }
        }
      });

      return () => {
        cg.destroy();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, isFinished]);



  if (isFinished && archetype) {
    const Icon = archetype.icon;
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 max-w-lg w-full text-center shadow-2xl shadow-black/50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-violet-500 to-fuchsia-500" />
          
          <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 border ${archetype.color}`}>
            <Icon className="w-12 h-12" />
          </div>
          
          <h2 className="text-sm font-bold tracking-widest text-slate-400 uppercase mb-2">Seu estilo de jogo</h2>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-4">{archetype.name}</h1>
          <p className="text-slate-300 leading-relaxed mb-8">
            {archetype.description}
          </p>

          <Link 
            href="/openings"
            className="inline-flex items-center justify-center gap-2 w-full py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold shadow-lg shadow-violet-500/25 transition-all active:scale-95"
          >
            Ir para o repertório
            <ChevronRight className="w-5 h-5" />
          </Link>
          
          <button 
            onClick={() => {
              setCurrentStep(0);
              setAnswers([]);
              setIsFinished(false);
            }}
            className="mt-4 text-sm text-slate-400 hover:text-slate-200 font-medium transition-colors"
          >
            Refazer teste
          </button>
        </div>
      </div>
    );
  }

  const question = QUESTIONS[currentStep];
  const progress = Math.round(((currentStep) / QUESTIONS.length) * 100);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-violet-500/30 flex flex-col">
      
      {/* Header / Progress */}
      <header className="border-b border-white/5 bg-slate-950/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
            <BrainCircuit className="w-5 h-5 text-violet-400" />
            Perfil de estilo
          </div>
          <div className="text-sm font-bold text-slate-400">
            {currentStep + 1} / {QUESTIONS.length}
          </div>
        </div>
        <div className="h-1 w-full bg-slate-900">
          <div 
            className="h-full bg-violet-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* Main Quiz Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16">
        
        {/* Board Side */}
        <div className="w-full max-w-[400px] lg:max-w-[450px] aspect-square rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl shadow-black/50 bg-slate-900 flex-shrink-0">
           <div id="quiz-board" className="w-full h-full" />
        </div>

        {/* Question Side */}
        <div className="flex-1 w-full max-w-md flex flex-col">
          <h2 className="text-2xl font-bold tracking-tight text-white mb-2">{question.title}</h2>
          <p className="text-slate-400 mb-8">{question.description}</p>
          
          <div className="mb-4 flex items-center gap-2 text-sm text-violet-400 bg-violet-500/10 p-3 rounded-lg border border-violet-500/20">
            <BrainCircuit className="w-4 h-4" />
            <p>Jogue seu lance no tabuleiro ou escolha uma opção abaixo.</p>
          </div>

          <div className="space-y-3">
            {question.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(opt.style)}
                className="w-full text-left p-4 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 hover:border-violet-500/50 transition-all group relative overflow-hidden"
              >
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <span className="inline-block px-2 py-1 bg-slate-950 text-slate-300 text-xs font-bold rounded mb-2 border border-slate-800">
                      Jogar {opt.move}
                    </span>
                    <p className="font-medium text-slate-200 group-hover:text-white transition-colors">
                      {opt.label}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-violet-400 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
