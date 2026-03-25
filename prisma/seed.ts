import { IngestorService } from '../src/services/ingestor/ingestor.service';

const sampleItalianPgn = `
[Event "Italian Game: Giuoco Piano"]
[Site "Chess Openings"]
[Date "2026.03.25"]
[Round "1"]
[White "Teoria"]
[Black "Prática"]
[Result "*"]
[FEN "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 { [%cal Gc4f7] Desenvolvemos o bispo para a diagonal mais ativa, mirando o ponto fraco de f7. } 3... Bc5 4. c3 Nf6 5. d3 { Uma abordagem sólida, preparando para rocar e consolidar o centro sem pressa. } *
`;

async function main() {
  console.log("🌱 Iniciando o Seed do Chess Openings...");
  
  try {
    // Vamos chamar o nosso Ingestor para ler este PGN mockado e guardar na BD
    await IngestorService.ingestStudy(sampleItalianPgn, "Abertura Italiana (Giuoco Piano)");
    
    console.log("✅ Seed concluído com sucesso!");
  } catch (error) {
    console.error("❌ Erro durante o seed:", error);
  }
}

main();
