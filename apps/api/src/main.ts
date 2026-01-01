import { NestFactory } from '@nestjs/core';

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/exception.filter';
import { EnvConfig } from './config/env.config';
import helmet from 'helmet';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get<ConfigService<EnvConfig>>(ConfigService)

  const apiPrefix = configService.get<string>("API_PREFIX")
  app.setGlobalPrefix(apiPrefix)

  app.enableCors({
    origin: configService.get("FRONTEND_URL"),
    credentials: true,
  });

  app.use(helmet());

  app.use(compression())
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

  const config = new DocumentBuilder()
    .setTitle('Q&A Forum API')
    .setDescription('Mini Q&A Forum API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory);

  await app.listen(configService.get<number>("PORT") ?? 8000);
}

void bootstrap();
