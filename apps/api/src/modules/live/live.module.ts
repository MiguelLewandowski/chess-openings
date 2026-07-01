import { Module } from '@nestjs/common'
import { LichessImporterService } from '../../infrastructure/services/lichess-importer.service'
import { LiveGateway } from './live.gateway'

@Module({
  providers: [LiveGateway, LichessImporterService],
})
export class LiveModule {}
