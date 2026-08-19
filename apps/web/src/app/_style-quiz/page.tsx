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
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
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
    fen: 'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1',
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
    fen: 'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3',
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
    fen: 'rnbqkb1r/pppppppp/5n2/8/2P5/8/PP1PPPPP/RNBQKBNR w KQkq - 1 2',
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
    fen: 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2',
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
    fen: 'rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2',
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
    fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
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
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
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
    fen: 'rnbqkb1r/pppp1ppp/4pn2/8/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3',
    title: 'Defesa Nimzo-Índia',
    description: 'As pretas jogam e6. Qual é a sua estratégia?',
    options: [
      { move: 'Nc3', label: 'Permitir a Nimzo-Índia (Complexa)', style: 'Positional' },
      { move: 'Nf3', label: 'Bogo-Índia/Índia da Dama (Sólida)', style: 'Solid' },
      { move: 'g3', label: 'Catalã (Controle posicional)', style: 'Positional' }
    ]
  },
  {
    id: 10,
    fen: 'rnbqkbnr/ppppp1pp/8/5p2/4P3/8/PPPP1PPP/RNBQKBNR w KQkq f6 0 2',
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

  useEffect(() => {
    if (isFinished || currentStep >= QUESTIONS.length) return;

    const el = document.getElementById('quiz-board');
    if (el) {
      const q = QUESTIONS[currentStep];
      const chess = new Chess(q.fen);
      const isWhiteTurn = chess.turn() === 'w';

      const dests = new Map<Key, Key[]>();

      q.options.forEach(opt => {
        try {
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
            const clone = new Chess(q.fen);
            const moves = clone.moves({ verbose: true });
            const playedMove = moves.find(m => m.from === orig && m.to === dest);

            if (playedMove) {
              const matchedOption = q.options.find(opt => {
                const testClone = new Chess(q.fen);
                const testMoveObj = testClone.move(opt.move);
                return testMoveObj && testMoveObj.from === orig && testMoveObj.to === dest;
              });

              if (matchedOption) {
                setTimeout(() => handleAnswer(matchedOption.style), 500);
              } else {
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
      <div className="min-h-screen bg-surface-app flex items-center justify-center p-6">
        <div className="bg-surface-card border border-border-default rounded-[20px] p-10 max-w-lg w-full text-center shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-accent rounded-t-[20px]" />

          <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 border ${archetype.color}`}>
            <Icon className="w-12 h-12" />
          </div>

          <h2 className="text-[12px] font-bold tracking-widest text-ink-400 uppercase mb-2">Seu estilo de jogo</h2>
          <h1 className="font-display font-extrabold text-[30px] tracking-tight text-ink-900 mb-4">{archetype.name}</h1>
          <p className="text-ink-600 leading-relaxed mb-8 text-[15px]">
            {archetype.description}
          </p>

          <Link
            href="/openings"
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-accent hover:bg-accent-hover text-white rounded-[8px] font-bold transition-all active:scale-[0.98] text-[15px]"
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
            className="mt-4 text-[13px] text-ink-400 hover:text-ink-700 font-medium transition-colors"
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
    <div className="min-h-screen bg-surface-app font-body flex flex-col">

      <header className="border-b border-border-subtle bg-surface-card/90 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[14px] font-bold text-ink-700">
            <BrainCircuit className="w-5 h-5 text-accent" />
            Perfil de estilo
          </div>
          <div className="text-[13px] font-bold text-ink-500">
            {currentStep + 1} / {QUESTIONS.length}
          </div>
        </div>
        <div className="h-1 w-full bg-surface-sunken">
          <div
            className="h-full bg-accent transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16">

        <div className="w-full max-w-[400px] lg:max-w-[450px] aspect-square rounded-[16px] overflow-hidden ring-1 ring-border-default shadow-xl bg-surface-card flex-shrink-0">
          <div id="quiz-board" className="w-full h-full" />
        </div>

        <div className="flex-1 w-full max-w-md flex flex-col">
          <h2 className="font-display font-bold text-[24px] tracking-tight text-ink-900 mb-2">{question.title}</h2>
          <p className="text-ink-500 mb-6 text-[14px]">{question.description}</p>

          <div className="mb-5 flex items-center gap-2 text-[13px] text-accent bg-accent-soft p-3 rounded-[8px] border border-accent/20">
            <BrainCircuit className="w-4 h-4 flex-shrink-0" />
            <p>Jogue seu lance no tabuleiro ou escolha uma opção abaixo.</p>
          </div>

          <div className="space-y-2.5">
            {question.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(opt.style)}
                className="w-full text-left p-4 rounded-[10px] border border-border-default bg-surface-card hover:bg-surface-sunken hover:border-accent/40 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="inline-block px-2 py-0.5 bg-surface-app text-ink-500 text-[11px] font-bold rounded mb-1.5 border border-border-subtle font-mono">
                      {opt.move}
                    </span>
                    <p className="font-semibold text-[14px] text-ink-900 group-hover:text-accent transition-colors">
                      {opt.label}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-ink-300 group-hover:text-accent transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
