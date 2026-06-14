import { Injectable, BadRequestException } from '@nestjs/common'

@Injectable()
export class LichessImporterService {
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
