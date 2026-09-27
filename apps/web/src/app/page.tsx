import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { MATURE_INTERVAL_DAYS, PRACTICE_PENALTY, practiceQuality, type PracticeAttempt } from "@chess-openings/domain";
import { getSession } from "@/lib/session";
import { formatDayList, formatDays, reviewSchedule, reviewsToMaster } from "@/lib/review-schedule";
import DemoSection from "@/components/chess/DemoSection";
import { BrandMark, buttonClasses } from "@/components/ui";

// Every number on this page comes from the domain's own rules (SM-2 and the practice score),
// so the page cannot promise something the app does not do.
const PERFECT = reviewSchedule(5, 4);

const SCORE_EXAMPLES: { label: string; attempt: PracticeAttempt }[] = [
  { label: "Sem erros e sem dicas", attempt: { mistakes: 0, pieceHints: 0, revealedMoves: 0 } },
  { label: "Um erro", attempt: { mistakes: 1, pieceHints: 0, revealedMoves: 0 } },
  { label: "Precisou ver um lance", attempt: { mistakes: 0, pieceHints: 0, revealedMoves: 1 } },
  { label: "Um erro e precisou ver um lance", attempt: { mistakes: 1, pieceHints: 0, revealedMoves: 1 } },
];

const STEPS = [
  {
    title: "Veja a linha",
    text: "Cada lance vem com o porquê: o plano, a casa-chave, a ameaça. Setas e casas destacadas mostram a ideia no tabuleiro.",
  },
  {
    title: "Jogue de memória",
    text: "O adversário responde sozinho e você joga os seus lances sem ver os comentários. Travou? A dica mostra primeiro a peça e, só se precisar, o lance.",
  },
  {
    title: "Revise no dia certo",
    text: "Erros e dicas viram uma nota de 0 a 5, e é ela que decide quando a linha volta: amanhã, se foi difícil; cada vez mais tarde, se você acertou.",
  },
];

const EXTRAS = [
  {
    title: "Primeiros passos",
    text: "Um tutorial de como as peças se movem, com roque, en passant e promoção, para quem está começando.",
  },
  {
    title: "Trilhas por abertura",
    text: "As lições seguem uma ordem, e cada uma destrava a próxima.",
  },
  {
    title: "Cartões de treino",
    text: "As armadilhas e as posições críticas de cada lição têm revisões próprias, no ritmo de cada uma.",
  },
  {
    title: "Contra o Stockfish",
    text: "Leve qualquer posição da lição para uma partida livre contra o engine, direto no navegador.",
  },
  {
    title: "Progresso",
    text: "XP, níveis, sequência de dias de estudo e as revisões do dia, reunidos no seu perfil.",
  },
];

export default async function Home() {
  // The landing page is for visitors; a signed-in user goes straight to the app.
  if (await getSession()) redirect("/profile");

  return (
    <div className="min-h-screen bg-surface-app text-ink-900 font-body">
      <header className="border-b border-border-subtle bg-surface-card/90 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <BrandMark />
            <span className="font-display font-extrabold text-[16px] sm:text-[17px] tracking-tight text-ink-900">Chess Openings</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/login" className={buttonClasses({ variant: "ghost", size: "sm" })}>
              Entrar
            </Link>
            <Link href="/register" className={buttonClasses({ size: "sm" })}>
              Criar conta
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-20 sm:pb-28 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-7">
            <p className="text-[12px] font-bold tracking-[0.14em] uppercase text-ink-400 mb-5">
              Aberturas de xadrez com repetição espaçada
            </p>
            <h1 className="font-display font-extrabold text-[40px] sm:text-[56px] tracking-tight leading-[1.04] text-ink-900">
              Estude cada linha uma vez. Revise no dia certo.
            </h1>
            <p className="mt-6 text-[16px] sm:text-[18px] text-ink-500 leading-relaxed max-w-xl">
              Você vê a linha comentada, joga de memória e o algoritmo de repetição espaçada marca a próxima revisão pelo
              seu desempenho. Se precisou de muita ajuda, revê amanhã. Se acertou, o intervalo cresce:{" "}
              {formatDayList(PERFECT)}.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row gap-3">
              <Link href="/register" className={buttonClasses({ size: "lg" })}>
                Criar conta grátis
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="#demo" className={buttonClasses({ variant: "secondary", size: "lg" })}>
                Experimentar sem conta
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5">
            <ScheduleCard />
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-border-subtle bg-surface-card">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
            <h2 className="font-display font-extrabold text-[30px] sm:text-[40px] tracking-tight leading-[1.1] max-w-2xl">
              Uma lição, três passos
            </h2>
            <ol className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
              {STEPS.map((step, i) => (
                <li key={step.title} className="border-t border-ink-900 pt-5">
                  <p className="font-mono text-[13px] text-ink-400">{String(i + 1).padStart(2, "0")}</p>
                  <h3 className="font-display font-bold text-[20px] tracking-tight mt-2">{step.title}</h3>
                  <p className="text-[15px] text-ink-500 leading-relaxed mt-2">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* The algorithm */}
        <section className="border-t border-border-subtle">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-5">
              <h2 className="font-display font-extrabold text-[30px] sm:text-[40px] tracking-tight leading-[1.1]">
                A nota decide o intervalo
              </h2>
              <p className="mt-5 text-[16px] text-ink-500 leading-relaxed">
                O agendamento usa o SM-2, o algoritmo de repetição espaçada criado para o SuperMemo, que serviu de base
                ao Anki. A ideia é rever cada linha perto do momento em que você a esqueceria, e não todo dia.
              </p>
              <ul className="mt-8 space-y-4 text-[15px] text-ink-700 leading-relaxed">
                <li className="border-l-2 border-ink-900 pl-4">
                  Cada linha e cada posição-chave tem a própria agenda. O que você já sabe some da frente; o que você
                  erra volta logo.
                </li>
                <li className="border-l-2 border-ink-900 pl-4">
                  Quando o intervalo passa de {MATURE_INTERVAL_DAYS} dias, a linha conta como dominada. Sem erros, isso
                  acontece na {reviewsToMaster(5)}ª revisão.
                </li>
                <li className="border-l-2 border-ink-900 pl-4">As revisões do dia ficam no seu perfil.</li>
              </ul>
            </div>

            <div className="lg:col-span-7">
              <div className="rounded-[14px] border border-border-default bg-surface-card overflow-hidden">
                <table className="w-full text-left text-[14px]">
                  <thead className="bg-surface-sunken text-[12px] uppercase tracking-[0.08em] text-ink-500">
                    <tr>
                      <th className="px-4 sm:px-5 py-3 font-bold">Na prática</th>
                      <th className="px-3 py-3 font-bold">Nota</th>
                      <th className="px-4 sm:px-5 py-3 font-bold">Próximas revisões</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {SCORE_EXAMPLES.map(({ label, attempt }) => {
                      const quality = practiceQuality(attempt);
                      return (
                        <tr key={label} className="align-top">
                          <td className="px-4 sm:px-5 py-4 text-ink-900 font-medium">{label}</td>
                          <td className="px-3 py-4 font-mono text-ink-900">{quality}</td>
                          <td className="px-4 sm:px-5 py-4 text-ink-700">
                            {quality >= 3
                              ? formatDayList(reviewSchedule(quality, 4))
                              : "amanhã, até você acertar"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-[13px] text-ink-400 leading-relaxed">
                Intervalos a partir da primeira vez que você joga a linha, repetindo a mesma nota a cada revisão. Cada erro
                tira {PRACTICE_PENALTY.mistake} ponto da nota, cada dica de peça {PRACTICE_PENALTY.pieceHint} e cada lance revelado{" "}
                {PRACTICE_PENALTY.revealedMove}.
              </p>
            </div>
          </div>
        </section>

        <DemoSection />

        {/* What else is there */}
        <section className="border-t border-border-subtle bg-surface-card">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
            <h2 className="font-display font-extrabold text-[30px] sm:text-[40px] tracking-tight leading-[1.1]">Também no app</h2>
            <dl className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
              {EXTRAS.map((item) => (
                <div key={item.title} className="border-t border-border-default pt-4">
                  <dt className="font-display font-bold text-[17px] tracking-tight text-ink-900">{item.title}</dt>
                  <dd className="mt-1.5 text-[15px] text-ink-500 leading-relaxed">{item.text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Closing call to action */}
        <section className="border-t border-border-subtle">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 flex flex-col sm:flex-row sm:items-end justify-between gap-8">
            <h2 className="font-display font-extrabold text-[30px] sm:text-[40px] tracking-tight leading-[1.1] max-w-xl">
              Sua primeira revisão já pode ser amanhã.
            </h2>
            <Link href="/register" className={buttonClasses({ size: "lg", className: "shrink-0" })}>
              Criar conta grátis
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border-subtle">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between text-[13px] text-ink-400">
          <span className="flex items-center gap-2">
            <BrandMark className="w-5 h-5" />
            Chess Openings
          </span>
          <Link href="/login" className="hover:text-ink-900 transition-colors">
            Entrar
          </Link>
        </div>
      </footer>
    </div>
  );
}

// A line's review calendar with a perfect score every time: the bars grow with the interval.
function ScheduleCard() {
  const max = Math.sqrt(PERFECT[PERFECT.length - 1]);
  return (
    <div className="rounded-[16px] border border-border-default bg-surface-card p-6 sm:p-7 shadow-sm">
      <p className="text-[12px] font-bold tracking-[0.14em] uppercase text-ink-400">Uma linha, sem erros</p>
      <p className="font-display font-bold text-[18px] tracking-tight text-ink-900 mt-1">Quando ela volta para revisão</p>
      <ol className="mt-6 space-y-4">
        {PERFECT.map((days, i) => (
          <li key={i} className="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-3">
            <span className="text-[13px] text-ink-500">{i + 1}ª revisão</span>
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex-1 min-w-0">
                <div
                  className={i + 1 >= (reviewsToMaster(5) ?? Infinity) ? "h-2 rounded-full bg-success" : "h-2 rounded-full bg-ink-900"}
                  style={{ width: `${Math.max(6, (Math.sqrt(days) / max) * 100)}%` }}
                />
              </div>
              <span className="font-mono text-[13px] text-ink-900 shrink-0">+{formatDays(days)}</span>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-6 pt-4 border-t border-border-subtle text-[13px] text-ink-500 leading-relaxed">
        Em verde: intervalo acima de {MATURE_INTERVAL_DAYS} dias, a linha está dominada.
      </p>
    </div>
  );
}
