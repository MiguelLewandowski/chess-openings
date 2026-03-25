import { NextResponse } from 'next/server';
import { LichessImporterService } from '@/services/ingestor/lichess-importer.service';
import { IngestorService } from '@/services/ingestor/ingestor.service';

// Timeout estendido para a Vercel/Next.js caso a importação demore
export const maxDuration = 60; // 60 segundos (limite do plano hobby da Vercel)

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, openingName, chapterLimit, specificChapter } = body;

    if (!url) {
      return NextResponse.json({ error: "A URL do estudo é obrigatória." }, { status: 400 });
    }

    console.log(`[API] Iniciando importação do URL: ${url}`);

    // 1. Fetch do PGN via API do Lichess
    const pgnString = await LichessImporterService.getStudyPgn(url);

    // 2. Ingestão e Processamento
    const opening = await IngestorService.ingestStudy(pgnString, {
      openingName,
      chapterLimit: chapterLimit ? parseInt(chapterLimit) : undefined,
      specificChapter: specificChapter ? parseInt(specificChapter) : undefined,
    });

    return NextResponse.json({ 
      success: true, 
      message: `Abertura '${opening.name}' importada com sucesso!`,
      openingId: opening.id
    });

  } catch (error: any) {
    console.error("[API] Erro na importação:", error);
    return NextResponse.json({ 
      error: error.message || "Erro desconhecido durante a importação." 
    }, { status: 500 });
  }
}
