import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EventsService } from './events.service';
import { IdempotencyService } from '../common/services/idempotency.service';

@Controller()
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  @MessagePattern({ cmd: 'events.create' })
  async create(@Payload() data: { dto: any; userId: string; organizationId: string; correlationId?: string; idempotencyKey?: string }) {
    const { correlationId, idempotencyKey } = data;
    console.log(`[${correlationId || 'N/A'}] events.create - userId: ${data.userId}`);

    return this.idempotencyService.checkAndStore(idempotencyKey, async () => {
      return this.eventsService.create(data.dto, data.userId, data.organizationId);
    });
  }

  @MessagePattern({ cmd: 'events.findAll' })
  async findAll(@Payload() data: { query: any; userId: string; organizationId: string; role: string; correlationId?: string }) {
    const { correlationId } = data;
    console.log(`[${correlationId || 'N/A'}] events.findAll - userId: ${data.userId}, role: ${data.role}`);
    return this.eventsService.findAllPaginated(data.query, data.organizationId, data.userId, data.role);
  }

  @MessagePattern({ cmd: 'events.findOne' })
  async findOne(@Payload() data: { id: string; userId: string; organizationId: string; role: string; correlationId?: string }) {
    const { correlationId } = data;
    console.log(`[${correlationId || 'N/A'}] events.findOne - eventId: ${data.id}, userId: ${data.userId}`);
    return this.eventsService.findOne(data.id, data.organizationId, data.userId, data.role);
  }

  @MessagePattern({ cmd: 'events.update' })
  async update(@Payload() data: { id: string; dto: any; userId: string; organizationId: string; role: string; correlationId?: string }) {
    const { correlationId } = data;
    console.log(`[${correlationId || 'N/A'}] events.update - eventId: ${data.id}, userId: ${data.userId}`);
    return this.eventsService.update(data.id, data.dto, data.organizationId, data.userId, data.role);
  }

  @MessagePattern({ cmd: 'events.delete' })
  async remove(@Payload() data: { id: string; userId: string; organizationId: string; role: string; correlationId?: string }) {
    const { correlationId } = data;
    console.log(`[${correlationId || 'N/A'}] events.delete - eventId: ${data.id}, userId: ${data.userId}`);
    return this.eventsService.remove(data.id, data.organizationId, data.userId, data.role);
  }

  @MessagePattern({ cmd: 'events.submit' })
  async submit(@Payload() data: { id: string; userId: string; organizationId: string; correlationId?: string; idempotencyKey?: string }) {
    const { correlationId, idempotencyKey } = data;
    console.log(`[${correlationId || 'N/A'}] events.submit - eventId: ${data.id}, userId: ${data.userId}`);

    return this.idempotencyService.checkAndStore(idempotencyKey, async () => {
      return this.eventsService.submit(data.id, data.organizationId, data.userId);
    });
  }

  @MessagePattern({ cmd: 'events.approve' })
  async approve(@Payload() data: { id: string; organizationId: string; role: string; approvedBy: string; correlationId?: string; idempotencyKey?: string }) {
    const { correlationId, idempotencyKey } = data;
    console.log(`[${correlationId || 'N/A'}] events.approve - eventId: ${data.id}, approvedBy: ${data.approvedBy}`);

    return this.idempotencyService.checkAndStore(idempotencyKey, async () => {
      return this.eventsService.approve(data.id, data.organizationId, data.role, data.approvedBy);
    });
  }

  @MessagePattern({ cmd: 'events.reject' })
  async reject(@Payload() data: { id: string; rejectDto: any; organizationId: string; role: string; rejectedBy: string; correlationId?: string; idempotencyKey?: string }) {
    const { correlationId, idempotencyKey } = data;
    console.log(`[${correlationId || 'N/A'}] events.reject - eventId: ${data.id}, rejectedBy: ${data.rejectedBy}`);

    return this.idempotencyService.checkAndStore(idempotencyKey, async () => {
      return this.eventsService.reject(data.id, data.rejectDto, data.organizationId, data.role, data.rejectedBy);
    });
  }
}
