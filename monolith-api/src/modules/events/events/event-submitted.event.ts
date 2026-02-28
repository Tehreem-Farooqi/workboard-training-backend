import { DomainEvent } from '../../../common/events';

export class EventSubmittedEvent extends DomainEvent {
  constructor(
    eventId: string,
    payload: {
      title: string;
      organizationId: string;
      createdById: string;
      submittedAt: Date;
    },
  ) {
    super('event.submitted', eventId, 'Event', payload);
  }
}
