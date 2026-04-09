'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, BrainCircuit, Target, Shield, Check } from 'lucide-react';
import { Chessground } from 'chessground';
import { Chess } from 'chess.js';
import { saveUserArchetype } from '@/app/actions/auth.actions';

const QUESTIONS = [
  {
    id: 1,
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3', // e4 e5 Nf3 Nc6
    title: 'The Opening Choice',
    description: 'You are playing White. How do you develop your bishop?',
    options: [
      { move: 'Bc4', label: 'Italian Game (Active & Direct)', style: 'Aggressive' },
      { move: 'Bb5', label: 'Ruy Lopez (Strategic Pressure)', style: 'Positional' },
      { move: 'Nc3', label: 'Three Knights (Solid Development)', style: 'Solid' }
    ]
  },
  {
    id: 2,
    fen: 'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1', // d4
    title: 'Reacting to d4',
    description: 'Your opponent plays 1.d4. What is your response?',
    options: [
      { move: 'Nf6', label: 'Indian Defense (Flexible)', style: 'Positional' },
      { move: 'd5', label: 'Queen\'s Pawn Game (Solid Center)', style: 'Solid' },
      { move: 'f5', label: 'Dutch Defense (Asymmetrical)', style: 'Aggressive' }
    ]
  },
  {
    id: 3,
    fen: 'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3', // Ruy Lopez Bb5
    title: 'The Spanish Torture',
    description: 'White plays the Ruy Lopez. How do you defend?',
    options: [
      { move: 'a6', label: 'Morphy Defense (Challenge the Bishop)', style: 'Positional' },
      { move: 'Nf6', label: 'Berlin Defense (Solid Counterattack)', style: 'Solid' },
      { move: 'f5', label: 'Schliemann Defense (Wild Gambit)', style: 'Aggressive' }
    ]
  },
  {
    id: 4,
    fen: 'rnbqkb1r/pppppppp/5n2/8/2P5/8/PP1PPPPP/RNBQKBNR w KQkq - 1 2', // c4 Nf6
    title: 'The English Opening',
    description: 'You played 1.c4 and Black replies with 1...Nf6. What is your plan?',
    options: [
      { move: 'Nc3', label: 'Develop the Knight (Solid)', style: 'Solid' },
      { move: 'g3', label: 'Fianchetto (Positional & Slow)', style: 'Positional' },
      { move: 'd4', label: 'Transposing to d4 lines (Direct)', style: 'Aggressive' }
    ]
  },
  {
    id: 5,
    fen: 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2', // e4 c5
    title: 'Facing the Sicilian',
    description: 'Black plays the Sicilian Defense. How do you proceed?',
    options: [
      { move: 'Nf3', label: 'Open Sicilian (Mainline & Tactical)', style: 'Aggressive' },
      { move: 'Nc3', label: 'Closed Sicilian (Positional setup)', style: 'Positional' },
      { move: 'c3', label: 'Alapin Variation (Solid Center Control)', style: 'Solid' },
    ]
  },
  {
    id: 6,
    fen: 'rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2', // e4 c5 Nf3
    title: 'Sicilian Defense',
    description: 'White plays Nf3. What is your choice in the Sicilian?',
    options: [
      { move: 'd6', label: 'Najdorf/Dragon setup (Flexible)', style: 'Positional' },
      { move: 'Nc6', label: 'Sveshnikov/Pelikan (Fight for center)', style: 'Aggressive' },
      { move: 'e6', label: 'Kan/Taimanov (Solid & Compact)', style: 'Solid' }
    ]
  },
  {
    id: 7,
    fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2', // e4 e5
    title: 'King\'s Pawn Game',
    description: 'After 1.e4 e5, what is your preferred 2nd move for White?',
    options: [
      { move: 'Nf3', label: 'Mainline development', style: 'Positional' },
      { move: 'f4', label: 'King\'s Gambit (Sacrifice for attack)', style: 'Aggressive' },
      { move: 'Nc3', label: 'Vienna Game (Solid)', style: 'Solid' }
    ]
  },
  {
    id: 8,
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // Start
    title: 'The First Move',
    description: 'You have the white pieces. How do you open the game?',
    options: [
      { move: 'e4', label: 'King\'s Pawn (Tactical & Open)', style: 'Aggressive' },
      { move: 'd4', label: 'Queen\'s Pawn (Positional & Closed)', style: 'Positional' },
      { move: 'c4', label: 'English Opening (Solid & Flank attack)', style: 'Solid' },
    ]
  },
  {
    id: 9,
    fen: 'rnbqkb1r/pppp1ppp/4pn2/8/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3', // d4 Nf6 c4 e6
    title: 'Nimzo-Indian Defense',
    description: 'Black plays e6. What is your strategy?',
    options: [
      { move: 'Nc3', label: 'Allow the Nimzo-Indian (Complex)', style: 'Positional' },
      { move: 'Nf3', label: 'Bogo-Indian/Queen\'s Indian (Solid)', style: 'Solid' },
      { move: 'g3', label: 'Catalan (Positional control)', style: 'Positional' } // giving more weight to positional here
    ]
  },
  {
    id: 10,
    fen: 'rnbqkbnr/ppppp1pp/8/5p2/4P3/8/PPPP1PPP/RNBQKBNR w KQkq f6 0 2', // e4 f5
    title: 'The Dutch Defense',
    description: 'Black challenges your e4 pawn with f5. How do you react?',
    options: [
      { move: 'exf5', label: 'Accept the gambit (Tactical)', style: 'Aggressive' },
      { move: 'd3', label: 'Defend the pawn (Solid)', style: 'Solid' },
      { move: 'Nc3', label: 'Develop and prepare to attack', style: 'Positional' }
    ]
  }
];

export default function StyleQuizPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [archetype, setArchetype] = useState<{name: string, description: string, icon: React.ElementType, color: string} | null>(null);

  const calculateArchetype = async (finalAnswers: string[]) => {
    const counts = finalAnswers.reduce((acc, style) => {
      acc[style] = (acc[style] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    let maxStyle = 'Universal';
    let maxCount = 0;

    for (const [style, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        maxStyle = style;
      }
    }

    let result;
    switch (maxStyle) {
      case 'Aggressive':
        result = {
          name: 'The Tactical Predator',
          description: 'You thrive in chaos. You prefer sharp, tactical positions where calculation and initiative are king. You are not afraid to sacrifice material for a crushing attack.',
          icon: Target,
          color: 'text-rose-500 bg-rose-500/10 border-rose-500/20'
        };
        break;
      case 'Solid':
        result = {
          name: 'The Iron Wall',
          description: 'Safety first. You build unbreakable structures and wait for your opponent to overextend. Your prophylactic play makes you incredibly tough to beat.',
          icon: Shield,
          color: 'text-sky-500 bg-sky-500/10 border-sky-500/20'
        };
        break;
      case 'Positional':
        result = {
          name: 'The Strategic Mastermind',
          description: 'You play the long game. You understand pawn structures, outposts, and piece maneuvering. You slowly squeeze your opponents until they have no good moves left.',
          icon: BrainCircuit,
          color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
        };
        break;
      default:
        result = {
          name: 'The Universal Player',
          description: 'You are flexible and adaptable. You can play both tactical and positional chess depending on what the position demands. You are unpredictable.',
          icon: Check,
          color: 'text-violet-500 bg-violet-500/10 border-violet-500/20'
        };
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('chess_style_archetype', result.name);
    }

    setArchetype(result);
    setIsFinished(true);

    // Save to database if user is logged in
    try {
      await saveUserArchetype(result.name);
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
      const dests = new Map<string, string[]>();
      
      q.options.forEach(opt => {
        try {
          // We need to figure out the from and to squares for the move string (e.g., 'Bc4')
          // The easiest way is to use chess.js to make the move on a clone
          const clone = new Chess(q.fen);
          const moveObj = clone.move(opt.move);
          if (moveObj) {
            const existing = dests.get(moveObj.from) || [];
            existing.push(moveObj.to);
            dests.set(moveObj.from, existing);
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
          
          <h2 className="text-sm font-bold tracking-widest text-slate-400 uppercase mb-2">Your Playing Style</h2>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-4">{archetype.name}</h1>
          <p className="text-slate-300 leading-relaxed mb-8">
            {archetype.description}
          </p>

          <Link 
            href="/openings"
            className="inline-flex items-center justify-center gap-2 w-full py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold shadow-lg shadow-violet-500/25 transition-all active:scale-95"
          >
            Go to Repertoire
            <ChevronRight className="w-5 h-5" />
          </Link>
          
          <button 
            onClick={() => {
              setCurrentStep(0);
              setAnswers([]);
              setIsFinished(false);
            }}
            className="mt-4 text-sm text-slate-500 hover:text-slate-300 font-medium transition-colors"
          >
            Retake Quiz
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
            Style Profiler
          </div>
          <div className="text-sm font-bold text-slate-500">
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
            <p>Play your move on the board, or select an option below.</p>
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
                      Play {opt.move}
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
