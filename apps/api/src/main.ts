import 'dotenv/config'
import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { WsAdapter } from '@nestjs/platform-ws'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Use the native `ws` adapter for WebSocket gateways (see LiveGateway).
  app.useWebSocketAdapter(new WsAdapter(app))

  app.setGlobalPrefix('api')
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))
  app.useGlobalFilters(new HttpExceptionFilter())
  app.enableCors()

  const config = new DocumentBuilder()
    .setTitle('Chess Openings API')
    .setDescription('REST API para o sistema de aprendizado de aberturas de xadrez com repetição espaçada (SM-2).')
    .setVersion('1.0')
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('docs', app, document)

  const port = process.env.PORT ?? 3001
  await app.listen(port)
  console.log(`API running on http://localhost:${port}/api`)
  console.log(`Swagger docs: http://localhost:${port}/docs`)
}

bootstrap()
