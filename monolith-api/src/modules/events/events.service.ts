import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateEventDto,
  UpdateEventDto,
  EventResponseDto,
  RejectEventDto,
  QueryEventsDto,
  PaginatedEventsDto,
  EventSortField,
} from './dto';
import { EventStatus, UserRole, Prisma } from '@prisma/client';
import { EventBusService } from '../../common/events';
import {
  EventSubmittedEvent,
  EventApprovedEvent,
  EventRejectedEvent,
} from './events';

@Injectable()
export class EventsService {
  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
  ) {}

  async create(
    createEventDto: CreateEventDto,
    userId: string,
    organizationId: string,
  ): Promise<EventResponseDto> {
    // Validate dates
    const startDate = new Date(createEventDto.startDate);
    const endDate = new Date(createEventDto.endDate);

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    const event = await this.prisma.event.create({
      data: {
        title: createEventDto.title,
        description: createEventDto.description,
        location: createEventDto.location,
        startDate,
        endDate,
        status: EventStatus.DRAFT,
        organizationId,
        createdById: userId,
      },
    });

    return new EventResponseDto(event);
  }

  async findAll(
    organizationId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<EventResponseDto[]> {
    // Regular users see only their own events
    // Moderators and admins see all events in their org
    const where =
      userRole === UserRole.USER
        ? { organizationId, createdById: userId }
        : { organizationId };

    const events = await this.prisma.event.findMany({
      where,
      orderBy: { startDate: 'asc' },
    });

    return events.map((event) => new EventResponseDto(event));
  }

  async findAllPaginated(
    query: QueryEventsDto,
    organizationId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<PaginatedEventsDto> {
    // Build base where clause for org scoping and user role
    const baseWhere: Prisma.EventWhereInput =
      userRole === UserRole.USER
        ? { organizationId, createdById: userId }
        : { organizationId };

    // Build filters
    const where: Prisma.EventWhereInput = {
      ...baseWhere,
      ...(query.status && { status: query.status }),
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
      ...(query.startDateFrom && {
        startDate: { gte: new Date(query.startDateFrom) },
      }),
      ...(query.startDateTo && {
        startDate: { lte: new Date(query.startDateTo) },
      }),
    };

    // Handle date range filters together if both provided
    if (query.startDateFrom && query.startDateTo) {
      where.startDate = {
        gte: new Date(query.startDateFrom),
        lte: new Date(query.startDateTo),
      };
    }

    // Build orderBy
    const orderByMap: Record<EventSortField, Prisma.EventOrderByWithRelationInput> = {
      [EventSortField.CREATED_AT]: { createdAt: query.sortOrder },
      [EventSortField.START_DATE]: { startDate: query.sortOrder },
      [EventSortField.TITLE]: { title: query.sortOrder },
      [EventSortField.STATUS]: { status: query.sortOrder },
    };

    const orderBy = orderByMap[query.sortBy || EventSortField.START_DATE];

    // Calculate pagination
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    // Execute queries
    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.event.count({ where }),
    ]);

    const eventDtos = events.map((event) => new EventResponseDto(event));

    return new PaginatedEventsDto(eventDtos, page, limit, total);
  }

  async findOne(
    id: string,
    organizationId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<EventResponseDto> {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check organization scoping
    if (event.organizationId !== organizationId) {
      throw new ForbiddenException('Access denied to this event');
    }

    // Regular users can only see their own events
    if (userRole === UserRole.USER && event.createdById !== userId) {
      throw new ForbiddenException('Access denied to this event');
    }

    return new EventResponseDto(event);
  }

  async update(
    id: string,
    updateEventDto: UpdateEventDto,
    organizationId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<EventResponseDto> {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check organization scoping
    if (event.organizationId !== organizationId) {
      throw new ForbiddenException('Access denied to this event');
    }

    // Only owner can edit their own draft events
    // Moderators and admins can edit any event in their org
    if (userRole === UserRole.USER) {
      if (event.createdById !== userId) {
        throw new ForbiddenException('You can only edit your own events');
      }
      if (event.status !== EventStatus.DRAFT) {
        throw new ForbiddenException('You can only edit draft events');
      }
    }

    // Validate dates if provided
    if (updateEventDto.startDate || updateEventDto.endDate) {
      const startDate = updateEventDto.startDate
        ? new Date(updateEventDto.startDate)
        : event.startDate;
      const endDate = updateEventDto.endDate
        ? new Date(updateEventDto.endDate)
        : event.endDate;

      if (endDate <= startDate) {
        throw new BadRequestException('End date must be after start date');
      }
    }

    const updatedEvent = await this.prisma.event.update({
      where: { id },
      data: {
        ...(updateEventDto.title && { title: updateEventDto.title }),
        ...(updateEventDto.description && {
          description: updateEventDto.description,
        }),
        ...(updateEventDto.location !== undefined && {
          location: updateEventDto.location,
        }),
        ...(updateEventDto.startDate && {
          startDate: new Date(updateEventDto.startDate),
        }),
        ...(updateEventDto.endDate && {
          endDate: new Date(updateEventDto.endDate),
        }),
      },
    });

    return new EventResponseDto(updatedEvent);
  }

  async remove(
    id: string,
    organizationId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<void> {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check organization scoping
    if (event.organizationId !== organizationId) {
      throw new ForbiddenException('Access denied to this event');
    }

    // Only owner can delete their own draft events
    // Admins can delete any event in their org
    if (userRole === UserRole.USER) {
      if (event.createdById !== userId) {
        throw new ForbiddenException('You can only delete your own events');
      }
      if (event.status !== EventStatus.DRAFT) {
        throw new ForbiddenException('You can only delete draft events');
      }
    } else if (userRole === UserRole.MODERATOR) {
      throw new ForbiddenException('Moderators cannot delete events');
    }

    await this.prisma.event.delete({
      where: { id },
    });
  }

  // Moderation workflow methods

  async submit(
    id: string,
    organizationId: string,
    userId: string,
  ): Promise<EventResponseDto> {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check organization scoping
    if (event.organizationId !== organizationId) {
      throw new ForbiddenException('Access denied to this event');
    }

    // Only owner can submit their event
    if (event.createdById !== userId) {
      throw new ForbiddenException('You can only submit your own events');
    }

    // Validate state transition
    if (event.status !== EventStatus.DRAFT) {
      throw new ConflictException(
        `Cannot submit event with status ${event.status}. Only DRAFT events can be submitted.`,
      );
    }

    const updatedEvent = await this.prisma.event.update({
      where: { id },
      data: {
        status: EventStatus.SUBMITTED,
        rejectionReason: null, // Clear any previous rejection reason
      },
    });

    // Publish domain event
    await this.eventBus.publish(
      new EventSubmittedEvent(updatedEvent.id, {
        title: updatedEvent.title,
        organizationId: updatedEvent.organizationId,
        createdById: updatedEvent.createdById,
        submittedAt: updatedEvent.updatedAt,
      }),
    );

    return new EventResponseDto(updatedEvent);
  }

  async approve(
    id: string,
    organizationId: string,
    userRole: UserRole,
    approvedBy?: string,
  ): Promise<EventResponseDto> {
    // Only moderators and admins can approve
    if (userRole === UserRole.USER) {
      throw new ForbiddenException(
        'Only moderators and admins can approve events',
      );
    }

    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check organization scoping
    if (event.organizationId !== organizationId) {
      throw new ForbiddenException('Access denied to this event');
    }

    // Validate state transition
    if (event.status !== EventStatus.SUBMITTED) {
      throw new ConflictException(
        `Cannot approve event with status ${event.status}. Only SUBMITTED events can be approved.`,
      );
    }

    const updatedEvent = await this.prisma.event.update({
      where: { id },
      data: {
        status: EventStatus.APPROVED,
        rejectionReason: null,
      },
    });

    // Publish domain event
    await this.eventBus.publish(
      new EventApprovedEvent(updatedEvent.id, {
        title: updatedEvent.title,
        organizationId: updatedEvent.organizationId,
        createdById: updatedEvent.createdById,
        approvedAt: updatedEvent.updatedAt,
        approvedBy: approvedBy || 'system',
      }),
    );

    return new EventResponseDto(updatedEvent);
  }

  async reject(
    id: string,
    rejectDto: RejectEventDto,
    organizationId: string,
    userRole: UserRole,
    rejectedBy?: string,
  ): Promise<EventResponseDto> {
    // Only moderators and admins can reject
    if (userRole === UserRole.USER) {
      throw new ForbiddenException(
        'Only moderators and admins can reject events',
      );
    }

    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check organization scoping
    if (event.organizationId !== organizationId) {
      throw new ForbiddenException('Access denied to this event');
    }

    // Validate state transition
    if (event.status !== EventStatus.SUBMITTED) {
      throw new ConflictException(
        `Cannot reject event with status ${event.status}. Only SUBMITTED events can be rejected.`,
      );
    }

    const updatedEvent = await this.prisma.event.update({
      where: { id },
      data: {
        status: EventStatus.REJECTED,
        rejectionReason: rejectDto.reason,
      },
    });

    // Publish domain event
    await this.eventBus.publish(
      new EventRejectedEvent(updatedEvent.id, {
        title: updatedEvent.title,
        organizationId: updatedEvent.organizationId,
        createdById: updatedEvent.createdById,
        rejectedAt: updatedEvent.updatedAt,
        rejectedBy: rejectedBy || 'system',
        reason: rejectDto.reason,
      }),
    );

    return new EventResponseDto(updatedEvent);
  }
}

