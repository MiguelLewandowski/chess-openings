import { Logger, type OnModuleInit } from '@nestjs/common'
import { Interval } from '@nestjs/schedule'
import {
  type OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import type { Server, WebSocket } from 'ws'
import {
  LichessImporterService,
  type LichessTvChannels,
} from '../../infrastructure/services/lichess-importer.service'

// Gateway WebSocket que transmite o feed da TV do Lichess aos clientes conectados.
// O transporte mora aqui; a busca dos dados é delegada ao LichessImporterService.
@WebSocketGateway({ path: '/live' })
export class LiveGateway implements OnGatewayConnection, OnModuleInit {
  private readonly logger = new Logger(LiveGateway.name)

  @WebSocketServer()
  private server!: Server

  // Último dado buscado do Lichess, guardado em memória.
  private lastSnapshot: LichessTvChannels | null = null

  constructor(private readonly lichess: LichessImporterService) {}

  // Busca uma vez no arranque para o primeiro cliente não esperar um ciclo.
  async onModuleInit(): Promise<void> {
    await this.refresh()
  }

  // Ao conectar, envia o último dado conhecido na hora.
  handleConnection(client: WebSocket): void {
    if (this.lastSnapshot) client.send(JSON.stringify(this.lastSnapshot))
  }

  // Faz polling do Lichess a cada 5s e empurra o resultado para todos os clientes.
  @Interval(5000)
  async refresh(): Promise<void> {
    try {
      this.lastSnapshot = await this.lichess.getTvChannels()
    } catch (error) {
      this.logger.warn(`Ciclo ignorado, falha ao buscar a TV do Lichess: ${String(error)}`)
      return
    }

    const message = JSON.stringify(this.lastSnapshot)
    this.server?.clients.forEach((client) => {
      if (client.readyState === client.OPEN) client.send(message)
    })
  }
}
