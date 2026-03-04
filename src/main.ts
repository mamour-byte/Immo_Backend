import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const corsOriginsRaw =
    process.env.CORS_ORIGINS ||
    process.env.FRONTEND_URL ||
    'http://localhost:5173,http://localhost:3000';
  const corsOrigins = corsOriginsRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // allow non-browser requests (curl/postman) that have no Origin
      if (!origin) return callback(null, true);
      if (corsOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
    maxAge: 86400,
  });
  
  // Configuration globale de ValidationPipe pour transformer les types
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Transforme automatiquement les types
      transformOptions: {
        enableImplicitConversion: true, // Conversion implicite des types
      },
      whitelist: true, // Supprime les propriétés non définies dans le DTO
    }),
  );
  
  await app.listen(process.env.PORT ?? 3000);
  }
bootstrap();
