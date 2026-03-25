export const LichessImporterService = {
  /**
   * Extrai o ID do estudo a partir de um URL do Lichess.
   * Exemplo: https://lichess.org/study/xYzA123b -> xYzA123b
   */
  extractStudyId(url: string): string | null {
    try {
      const match = url.match(/lichess\.org\/study\/([a-zA-Z0-9]+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  },

  /**
   * Faz o fetch do PGN completo de um estudo usando a API pública do Lichess.
   */
  async getStudyPgn(urlOrId: string): Promise<string> {
    const studyId = urlOrId.includes('lichess.org') 
      ? this.extractStudyId(urlOrId) 
      : urlOrId;

    if (!studyId) {
      throw new Error("URL ou ID do estudo Lichess inválido.");
    }

    // A API do Lichess permite exportar o PGN com comentários e avaliações.
    // source=true garante que trazemos as variações e tags
    const endpoint = `https://lichess.org/api/study/${studyId}.pgn?source=true`;
    
    console.log(`📡 Baixando PGN do Lichess: ${endpoint}`);
    
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error(`Falha ao baixar o estudo. Status: ${response.status}`);
    }

    const pgnString = await response.text();
    
    if (!pgnString || pgnString.trim() === '') {
      throw new Error("O Lichess retornou um PGN vazio.");
    }

    return pgnString;
  }
};
