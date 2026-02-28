import { DomainEvent } from '../../../common/events';

export class EventRejectedEvent extends DomainEvent {
  constructor(
    eventId: string,
    payload: {
      title: string;
      organizationId: string;
      createdById: string;
      rejectedAt: Date;
      rejectedBy: string;
      reason: string;
    },
  ) {
    super('event.rejected', eventId, 'Event', payload);
  }
}
