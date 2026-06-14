import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.setGlobalPrefix('api')
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))
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
  console.log(`🚀 API running on http://localhost:${port}/api`)
  console.log(`📚 Swagger docs: http://localhost:${port}/docs`)
}

bootstrap()
