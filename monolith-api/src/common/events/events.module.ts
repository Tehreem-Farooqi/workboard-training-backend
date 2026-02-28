import { Global, Module } from '@nestjs/common';
import { EventBusService } from './event-bus.service';

/**
 * Global module for domain events
 * Makes EventBusService available throughout the application
 */
@Global()
@Module({
  providers: [EventBusService],
  exports: [EventBusService],
})
export class EventsModule {}
