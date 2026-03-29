import { PgnParserService, ParsedNode, ParsedChapter } from './pgn-parser.service';
import { EngineService, EngineEvaluation } from './engine.service';
import { CoachService, CoachRequest, CoachInsight } from './coach.service';
import { prisma } from '@/lib/prisma';

export interface IngestOptions {
  openingName?: string;
  chapterLimit?: number; // Ex: 3 (analisa os primeiros 3 capítulos)
  specificChapter?: number; // Ex: 2 (analisa apenas o capítulo 2, base 1)
}

export const IngestorService = {
  /**
   * Função principal que orquestra a ingestão de um estudo PGN.
   */
  async ingestStudy(pgnString: string, options: IngestOptions = {}) {
    console.log(`🚀 Iniciando ingestão do estudo...`);
    
    // 1. Parsing Estático (Muito rápido)
    let chapters = PgnParserService.parseStudy(pgnString);
    
    // 1.5 Aplicar Filtros de Capítulos
    if (options.specificChapter !== undefined && options.specificChapter > 0) {
      const index = options.specificChapter - 1; // Convertendo para base 0
      if (index >= 0 && index < chapters.length) {
        chapters = [chapters[index]];
        console.log(`🧹 Filtro Ativo: Analisando APENAS o capítulo ${options.specificChapter}`);
      } else {
        console.warn(`⚠️ Aviso: O capítulo ${options.specificChapter} não existe no PGN.`);
      }
    } else if (options.chapterLimit !== undefined && options.chapterLimit > 0) {
      chapters = chapters.slice(0, options.chapterLimit);
      console.log(`🧹 Filtro Ativo: Limitando a análise aos primeiros ${options.chapterLimit} capítulos.`);
    }

    if (chapters.length === 0) {
      throw new Error("Nenhum capítulo encontrado após a filtragem.");
    }

    const finalOpeningName = options.openingName || chapters[0].title || "Abertura Desconhecida";
    console.log(`✅ Parsing concluído. ${chapters.length} capítulos serão processados.`);

    // 2. Extrair todas as FENs para o Stockfish e Lances para o Gemini
    const { fensToEvaluate, coachRequests } = this.extractRequestsFromChapters(chapters);

    // 3. Processamento Paralelo (A Magia)
    console.log(`📡 Buscando ${fensToEvaluate.length} avaliações na Cloud e ${coachRequests.length} explicações do Gemini...`);
    
    const [evaluations, coachInsights] = await Promise.all([
      EngineService.getEvaluationsBatch(fensToEvaluate, 20), // Batch maior porque é uma API leve (Lichess)
      CoachService.generateExplanationsBatch(coachRequests, 10) // Batch de 10 para o Gemini
    ]);

    console.log(`✅ Enriquecimento concluído.`);

    // 4. Salvar na Base de Dados usando Nested Writes
    return this.persistToDatabase(finalOpeningName, chapters, evaluations, coachInsights);
  },

  /**
   * Percorre a árvore de todos os capítulos para coletar FENs e Lances que precisam de IA.
   */
  extractRequestsFromChapters(chapters: ParsedChapter[]) {
    const fensToEvaluate: string[] = [];
    const coachRequests: CoachRequest[] = [];

    const traverse = (node: ParsedNode, parentEvalCp: number | null, lessonColor: string) => {
      fensToEvaluate.push(node.fen);

      // Só pedimos insight ao Gemini para a Linha Principal (Theory)
      if (node.isMainLine) {
        // Determina a cor baseada no turno do lance na árvore (assumindo que o capítulo começa sempre de brancas ou a FEN indica)
        // Uma forma mais robusta é ler a FEN do lance ANTERIOR, mas o m.player (WHITE/BLACK) já foi extraído no PgnParser!
        const playerWhoMoved = node.player;
        
        coachRequests.push({
            id: node.id,
            san: node.san,
            cpChangeTheme: "Desenvolvimento", // Simplificação por agora (evita dependência estrita do eval anterior)
            originalComment: node.originalComment,
            isOpponentResponse: node.player !== lessonColor, // Se quem jogou é diferente da cor da lição, é o bot!
            playerColor: lessonColor as 'WHITE' | 'BLACK',
            tacticalContext: {
              pieceMoved: node.pieceMoved,
              capturedPiece: node.capturedPiece,
              isCheck: node.isCheck
            }
          });
      }

      for (const child of node.children) {
        traverse(child, null, lessonColor);
      }
    };

    for (const chapter of chapters) {
      fensToEvaluate.push(chapter.initialFen); // A posição inicial também precisa de eval

      // Se a lição é sobre a Abertura Branca, as Brancas são o Aluno. Se for Defesa, Pretas são o Aluno.
      const isBlackLesson = chapter.rootNodes[0]?.player === 'BLACK';
      const lessonColor = isBlackLesson ? 'BLACK' : 'WHITE';

      for (const root of chapter.rootNodes) {
        traverse(root, null, lessonColor);
      }
    }

    return { fensToEvaluate, coachRequests };
  },

  /**
   * Constrói o objeto Prisma e salva na base de dados
   */
  async persistToDatabase(
    openingName: string, 
    chapters: ParsedChapter[], 
    evaluations: Record<string, EngineEvaluation | null>, 
    coachInsights: Record<string, CoachInsight>
  ) {
    console.log(`💾 Guardando na Base de Dados...`);

    const slugify = (text: string) => {
      return text.toString().toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
    };

    const openingSlug = slugify(openingName);

    // O Prisma tem uma limitação arquitetural: quando crias aninhamentos profundos numa self-relation (Move -> Move), 
    // ele não consegue propagar automaticamente a relação do "Avô" (Exercise -> Move).
    // Para resolver isto, em vez de criar tudo num único statement aninhado, 
    // vamos primeiro criar a Abertura, Lição e Exercício, e depois inserimos os lances em batch ou aninhados com o ID do exercício explícito.

    // 1. Cria a Abertura e Lições
    const prismaOpening = await prisma.opening.upsert({
      where: { slug: openingSlug },
      update: {
        name: openingName
      }, 
      create: {
        name: openingName,
        slug: openingSlug,
        description: `Importado automaticamente`,
      }
    });

    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      
      const lesson = await prisma.lesson.create({
        data: {
          title: chapter.title,
          order: i + 1,
          openingId: prismaOpening.id
        }
      });

      // 2. Cria os Exercícios
      const theoryExercise = await prisma.exercise.create({
        data: { title: `${chapter.title} - Teoria`, type: 'THEORY', lessonId: lesson.id }
      });
      const practiceExercise = await prisma.exercise.create({
        data: { title: `${chapter.title} - Prática`, type: 'PRACTICE', lessonId: lesson.id }
      });

      // Função recursiva que insere no Prisma já passando o exerciseId para cada nó
      const insertMoves = async (nodes: ParsedNode[], exerciseId: string, parentId: string | null, isPractice: boolean) => {
        for (const node of nodes) {
          if (isPractice && !node.isMainLine) continue;

          const engineEval = evaluations[node.fen];
          const insight = coachInsights[node.id];

          const createdMove = await prisma.move.create({
            data: {
              san: node.san,
              fen: node.fen,
              absoluteCp: engineEval?.cp ?? null,
              complexity: engineEval?.complexity ?? 'BAIXA',
              visualMarkers: node.visualMarkers ? JSON.parse(JSON.stringify(node.visualMarkers)) : undefined,
              coachInsights: (!isPractice && insight) ? JSON.parse(JSON.stringify(insight)) : undefined,
              isOpponentResponse: node.player === 'BLACK',
              exerciseId: exerciseId,
              parentId: parentId
            }
          });

          if (node.children.length > 0) {
            await insertMoves(node.children, exerciseId, createdMove.id, isPractice);
          }
        }
      };

      // 3. Insere os lances
      await insertMoves(chapter.rootNodes, theoryExercise.id, null, false);
      await insertMoves(chapter.rootNodes, practiceExercise.id, null, true);
    }

    console.log(`🎉 Ingestão finalizada com sucesso! ID da Abertura: ${prismaOpening.id}`);
    return prismaOpening;
  }
};
