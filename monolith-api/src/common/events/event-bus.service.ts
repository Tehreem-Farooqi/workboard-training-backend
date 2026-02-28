import { Injectable, Logger } from '@nestjs/common';
import { IDomainEvent } from './domain-event.interface';

/**
 * In-process event bus for domain events
 * Enables loose coupling between modules through event-driven communication
 */
@Injectable()
export class EventBusService {
  private readonly logger = new Logger(EventBusService.name);
  private readonly handlers = new Map<
    string,
    Array<(event: IDomainEvent) => Promise<void>>
  >();

  /**
   * Register a handler for a specific event type
   */
  on(
    eventType: string,
    handler: (event: IDomainEvent) => Promise<void>,
  ): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }

    this.handlers.get(eventType)!.push(handler);
    this.logger.log(`Registered handler for event type: ${eventType}`);
  }

  /**
   * Publish a domain event to all registered handlers
   */
  async publish(event: IDomainEvent): Promise<void> {
    this.logger.log(
      `Publishing event: ${event.eventType} (${event.eventId})`,
    );

    const handlers = this.handlers.get(event.eventType) || [];

    if (handlers.length === 0) {
      this.logger.warn(`No handlers registered for event: ${event.eventType}`);
      return;
    }

    // Execute all handlers in parallel
    const results = await Promise.allSettled(
      handlers.map((handler) => handler(event)),
    );

    // Log any handler failures
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        this.logger.error(
          `Handler ${index} failed for event ${event.eventType}: ${result.reason}`,
        );
      }
    });

    this.logger.log(
      `Event ${event.eventType} processed by ${handlers.length} handler(s)`,
    );
  }

  /**
   * Remove all handlers for a specific event type
   */
  off(eventType: string): void {
    this.handlers.delete(eventType);
    this.logger.log(`Removed all handlers for event type: ${eventType}`);
  }

  /**
   * Get count of registered handlers for an event type
   */
  getHandlerCount(eventType: string): number {
    return this.handlers.get(eventType)?.length || 0;
  }

  /**
   * Clear all registered handlers (useful for testing)
   */
  clear(): void {
    this.handlers.clear();
    this.logger.log('Cleared all event handlers');
  }
}
