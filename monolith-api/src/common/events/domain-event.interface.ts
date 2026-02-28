/**
 * Base interface for all domain events
 * Domain events represent something that happened in the domain
 */
export interface IDomainEvent {
  /**
   * Unique identifier for this event instance
   */
  eventId: string;

  /**
   * Type of the event (e.g., 'event.submitted', 'event.approved')
   */
  eventType: string;

  /**
   * When the event occurred
   */
  occurredAt: Date;

  /**
   * ID of the aggregate that generated this event
   */
  aggregateId: string;

  /**
   * Type of the aggregate (e.g., 'Event', 'User')
   */
  aggregateType: string;

  /**
   * Event payload data
   */
  payload: Record<string, any>;
}

/**
 * Base class for domain events
 */
export abstract class DomainEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly occurredAt: Date;

  constructor(
    public readonly eventType: string,
    public readonly aggregateId: string,
    public readonly aggregateType: string,
    public readonly payload: Record<string, any>,
  ) {
    this.eventId = this.generateEventId();
    this.occurredAt = new Date();
  }

  private generateEventId(): string {
    return `${this.eventType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
