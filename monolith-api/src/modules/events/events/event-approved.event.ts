import { DomainEvent } from '../../../common/events';

export class EventApprovedEvent extends DomainEvent {
  constructor(
    eventId: string,
    payload: {
      title: string;
      organizationId: string;
      createdById: string;
      approvedAt: Date;
      approvedBy: string;
    },
  ) {
    super('event.approved', eventId, 'Event', payload);
  }
}
