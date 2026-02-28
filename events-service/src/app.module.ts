import { Module } from '@nestjs/common';
import { EventsController } from './events/events.controller';
import { EventsService } from './events/events.service';
import { PrismaService } from './prisma/prisma.service';
import { IdempotencyService } from './common/services/idempotency.service';

@Module({
  controllers: [EventsController],
  providers: [EventsService, PrismaService, IdempotencyService],
})
export class AppModule {}
