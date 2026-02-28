import { NestFactory, Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import {
  LoggingInterceptor,
  TimingInterceptor,
  ResponseEnvelopeInterceptor,
} from './common/interceptors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Use Pino logger
  app.useLogger(app.get(Logger));

  // Get ConfigService
  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port', 3000);
  const appName = configService.get<string>('app.appName', 'EventBoard API');
  const enableEnvelope = configService.get<boolean>(
    'app.enableEnvelope',
    false,
  );

  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Enable global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Enable global interceptors (order matters!)
  app.useGlobalInterceptors(new TimingInterceptor());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Optional: Enable response envelope
  if (enableEnvelope) {
    const reflector = app.get(Reflector);
    app.useGlobalInterceptors(new ResponseEnvelopeInterceptor(reflector));
  }

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('EventBoard Monolith API')
    .setDescription('A production-ready NestJS backend for managing events')
    .setVersion('0.0.1')
    .addTag('app', 'Application endpoints')
    .addTag('auth', 'Authentication endpoints')
    .addTag('events', 'Event management endpoints')
    .addTag('health', 'Health check endpoints')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Enable CORS (configure properly for production)
  app.enableCors();

  await app.listen(port);
  console.log(`🚀 ${appName} is running on: http://localhost:${port}`);
  console.log(`📋 Health check: http://localhost:${port}/health`);
  console.log(`📋 Liveness: http://localhost:${port}/health/live`);
  console.log(`📋 Readiness: http://localhost:${port}/health/ready`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api`);
  console.log(
    `📦 Response envelope: ${enableEnvelope ? 'enabled' : 'disabled'}`,
  );
}

void bootstrap();
