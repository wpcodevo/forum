import { NestFactory } from '@nestjs/core';

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configServer = app.get(ConfigService)

  const apiPrefix = configServer.get<string>("API_PREFIX", "api")
  app.setGlobalPrefix(apiPrefix)

  const config = new DocumentBuilder()
    .setTitle('Q&A Forum API')
    .setDescription('Mini Q&A Forum API')
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth()
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory);

  app.enableCors({ credentials: true });
  app.use(cookieParser());
  app.useGlobalFilters(new GlobalExceptionFilter())
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true
    }
  }))
  await app.listen(configServer.get("PORT") ?? 8000);
}

void bootstrap();
