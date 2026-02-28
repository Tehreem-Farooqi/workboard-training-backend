import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: parseInt(process.env.PORT || '3001'),
      },
    },
  );

  await app.listen();
  console.log(`🔐 Auth Service listening on TCP port ${process.env.PORT || 3001}`);
}

void bootstrap();
