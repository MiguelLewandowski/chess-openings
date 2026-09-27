import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import SparringBoard from "@/components/chess/SparringBoard"
import { PageBody, PageHeader, PageTitle } from "@/components/layout/Page"
import { ChessWrapper } from "@/lib/chess"

export default async function PlayPage({
    searchParams,
}: {
    // `fen` and `color` come from the lesson's "play from this position" button; `from` is the
    // lesson to go back to.
    searchParams: Promise<{ fen?: string; color?: string; from?: string }>
}) {
    const { fen, color, from } = await searchParams
    const startFen = fen && ChessWrapper.isValidFen(fen) ? fen : ChessWrapper.STARTING_FEN
    const player = color === "black" ? "black" : "white"
    // Only a lesson path: `from` ends up in a link, and an arbitrary URL would make this page
    // an open redirect.
    const backHref = from && /^\/lessons\/[\w-]+$/.test(from) ? from : "/openings"

    return (
        <div className="flex-1">
            <PageHeader>
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <Link
                        href={backHref}
                        aria-label="Voltar à lição"
                        className="inline-flex items-center justify-center w-9 h-9 shrink-0 rounded-full text-ink-500 hover:text-ink-900 hover:bg-surface-sunken transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <PageTitle subtitle="Teste a posição da lição numa partida livre">Jogar contra o Stockfish</PageTitle>
                </div>
            </PageHeader>

            <PageBody>
                {/* Keyed by the position so opening another one starts a fresh game. */}
                <SparringBoard key={`${startFen}:${player}`} startFen={startFen} player={player} backHref={backHref} />
            </PageBody>
        </div>
    )
}
