import type { Metadata } from "next";
import { apiClient, type DueReview } from "@/lib/api-client"
import Link from "next/link";
import { PlusCircle, BookOpen } from "lucide-react";
import OpeningCard from "./OpeningCard";
import UserProfile from "./UserProfile";
import DueToday from "@/components/DueToday";
import { getSession } from "@/lib/session";
import { buttonClasses } from "@/components/ui";
import { PageBody, PageHeader, PageTitle } from "@/components/layout/Page";

export const metadata: Metadata = { title: "Aberturas" };

export default async function OpeningsCatalogPage() {
    const [openings, session] = await Promise.all([
        apiClient.openings.findAll(),
        getSession(),
    ]);

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

    const isAdmin = session?.role === 'ADMIN';

    return (
        <div className="flex-1">
            <PageHeader>
                <PageTitle subtitle={`${openings.length} ${openings.length === 1 ? 'abertura disponível' : 'aberturas disponíveis'}`}>
                    Galeria de aberturas
                </PageTitle>
                <UserProfile sessionArchetype={session?.styleArchetype || null} />
            </PageHeader>

            <PageBody>

                {session && (
                    <DueToday
                        reviews={dueReviews}
                        streak={userStreak}
                        xp={userXp}
                    />
                )}

                {openings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 sm:py-24 px-4 text-center bg-surface-card border border-dashed border-border-default rounded-[16px]">
                        <div className="w-16 h-16 bg-surface-sunken rounded-full flex items-center justify-center mb-5">
                            <BookOpen className="w-8 h-8 text-ink-400" />
                        </div>
                        <h2 className="font-display font-bold text-[22px] tracking-tight text-ink-900 mb-2">Nenhuma abertura ainda</h2>
                        {isAdmin ? (
                            <>
                                <p className="text-ink-500 max-w-md mb-2 leading-relaxed text-[14px]">
                                    O catálogo está vazio. Importe um estudo público do Lichess para gerar lições interativas, comentários do treinador com IA e treino por repetição espaçada.
                                </p>
                                <p className="text-ink-400 max-w-md mb-8 text-[13px]">
                                    Após importar, cada capítulo vira uma lição com os modos Teoria e Prática.
                                </p>
                            </>
                        ) : (
                            <p className="text-ink-500 max-w-md leading-relaxed text-[14px]">
                                Ainda não há aberturas disponíveis. Assim que novas trilhas forem publicadas, elas aparecem aqui.
                            </p>
                        )}
                        {isAdmin && (
                            <Link href="/admin/import" className={buttonClasses({ variant: 'primary' })}>
                                <PlusCircle className="w-5 h-5" />
                                Importar primeiro estudo
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 @2xl:grid-cols-2 @5xl:grid-cols-3 @7xl:grid-cols-4 @min-[100rem]:grid-cols-5 gap-4 sm:gap-5">
                        {openings.map((opening) => (
                            <OpeningCard key={opening.id} opening={opening} canDelete={isAdmin} />
                        ))}
                    </div>
                )}

            </PageBody>
        </div>
    );
}
