import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import * as cors from 'cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  
  // Enable CORS
  app.use(cors());
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Set global prefix
  app.setGlobalPrefix('api/v1', { exclude: ['health'] });

  const port = config.get('PORT') || 4000;
  await app.listen(port);
  
  console.log(`🚀 API Server running on http://localhost:${port}`);
}

bootstrap();