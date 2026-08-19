import 'dotenv/config'
import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { WsAdapter } from '@nestjs/platform-ws'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { getWebOrigin, requireEnv } from './common/env'

async function bootstrap() {
  // Fail before opening the port if a required secret is missing in production, so a
  // misconfigured deploy crashes loudly instead of running with insecure defaults.
  requireEnv('SESSION_SECRET', 'chess-dev-secret')
  requireEnv('DATABASE_URL', '')

  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  // Behind Railway's proxy every request arrives from the same socket address. Without
  // this, the rate limiter would key all clients to one bucket and lock everyone out at
  // the same time.
  app.set('trust proxy', 1)

  // Use the native `ws` adapter for WebSocket gateways (see LiveGateway).
  app.useWebSocketAdapter(new WsAdapter(app))

  app.setGlobalPrefix('api')
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))
  app.useGlobalFilters(new HttpExceptionFilter())
  // Only `/blunder` reaches the API from the browser; everything else is server-side, where
  // CORS does not apply. Restricting the origin costs nothing and closes the browser path.
  app.enableCors({ origin: getWebOrigin(), credentials: true })

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
