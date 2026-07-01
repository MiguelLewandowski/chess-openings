import { Injectable, BadRequestException } from '@nestjs/common'

//Modelo de um canal da tv do lichess
export interface LichessTvChannel {
  user: { name: string; title?: string }
  rating: number
  gameId: string
}

// Endpoint da TV do lichess retorna por tipo de jogo
export type LichessTvChannels = Record<string, LichessTvChannel>

@Injectable()
export class LichessImporterService {
  // Fetches the currently featured game per variant from the public Lichess API.
  async getTvChannels(): Promise<LichessTvChannels> {
    const response = await fetch('https://lichess.org/api/tv/channels')
    if (!response.ok) {
      throw new BadRequestException(`Failed to fetch Lichess TV channels. Status: ${response.status}`)
    }
    return (await response.json()) as LichessTvChannels
  }

  async getStudyPgn(urlOrId: string): Promise<string> {
    const studyId = urlOrId.includes('lichess.org') ? this.extractStudyId(urlOrId) : urlOrId
    if (!studyId) throw new BadRequestException('Invalid Lichess study URL or ID.')

    const endpoint = `https://lichess.org/api/study/${studyId}.pgn?source=true`
    const response = await fetch(endpoint)

    if (!response.ok) throw new BadRequestException(`Failed to fetch study. Status: ${response.status}`)

    const pgn = await response.text()
    if (!pgn?.trim()) throw new BadRequestException('Lichess returned an empty PGN.')

    return pgn
  }

  private extractStudyId(url: string): string | null {
    const match = url.match(/lichess\.org\/study\/([a-zA-Z0-9]+)/)
    return match ? match[1] : null
  }
}
