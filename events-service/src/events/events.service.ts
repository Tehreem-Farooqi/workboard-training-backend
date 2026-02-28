import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventStatus, Prisma } from '@prisma/client';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async create(createEventDto: any, userId: string, organizationId: string) {
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

    return event;
  }

  async findAllPaginated(query: any, organizationId: string, userId: string, userRole: string) {
    const baseWhere: Prisma.EventWhereInput =
      userRole === 'USER'
        ? { organizationId, createdById: userId }
        : { organizationId };

    const where: Prisma.EventWhereInput = {
      ...baseWhere,
      ...(query.status && { status: query.status }),
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: 'asc' },
      }),
      this.prisma.event.count({ where }),
    ]);

    return {
      data: events,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasPrevious: page > 1,
        hasNext: page < Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, organizationId: string, userId: string, userRole: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.organizationId !== organizationId) {
      throw new ForbiddenException('Access denied to this event');
    }

    if (userRole === 'USER' && event.createdById !== userId) {
      throw new ForbiddenException('Access denied to this event');
    }

    return event;
  }

  async update(id: string, updateEventDto: any, organizationId: string, userId: string, userRole: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.organizationId !== organizationId) {
      throw new ForbiddenException('Access denied to this event');
    }

    if (userRole === 'USER') {
      if (event.createdById !== userId) {
        throw new ForbiddenException('You can only edit your own events');
      }
      if (event.status !== EventStatus.DRAFT) {
        throw new ForbiddenException('You can only edit draft events');
      }
    }

    const updatedEvent = await this.prisma.event.update({
      where: { id },
      data: {
        ...(updateEventDto.title && { title: updateEventDto.title }),
        ...(updateEventDto.description && { description: updateEventDto.description }),
        ...(updateEventDto.location !== undefined && { location: updateEventDto.location }),
        ...(updateEventDto.startDate && { startDate: new Date(updateEventDto.startDate) }),
        ...(updateEventDto.endDate && { endDate: new Date(updateEventDto.endDate) }),
      },
    });

    return updatedEvent;
  }

  async remove(id: string, organizationId: string, userId: string, userRole: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.organizationId !== organizationId) {
      throw new ForbiddenException('Access denied to this event');
    }

    if (userRole === 'USER') {
      if (event.createdById !== userId) {
        throw new ForbiddenException('You can only delete your own events');
      }
      if (event.status !== EventStatus.DRAFT) {
        throw new ForbiddenException('You can only delete draft events');
      }
    } else if (userRole === 'MODERATOR') {
      throw new ForbiddenException('Moderators cannot delete events');
    }

    await this.prisma.event.delete({ where: { id } });
  }

  async submit(id: string, organizationId: string, userId: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.organizationId !== organizationId) {
      throw new ForbiddenException('Access denied to this event');
    }

    if (event.createdById !== userId) {
      throw new ForbiddenException('You can only submit your own events');
    }

    if (event.status !== EventStatus.DRAFT) {
      throw new ConflictException(`Cannot submit event with status ${event.status}`);
    }

    const updatedEvent = await this.prisma.event.update({
      where: { id },
      data: { status: EventStatus.SUBMITTED, rejectionReason: null },
    });

    return updatedEvent;
  }

  async approve(id: string, organizationId: string, userRole: string, approvedBy?: string) {
    if (userRole === 'USER') {
      throw new ForbiddenException('Only moderators and admins can approve events');
    }

    const event = await this.prisma.event.findUnique({ where: { id } });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.organizationId !== organizationId) {
      throw new ForbiddenException('Access denied to this event');
    }

    if (event.status !== EventStatus.SUBMITTED) {
      throw new ConflictException(`Cannot approve event with status ${event.status}`);
    }

    const updatedEvent = await this.prisma.event.update({
      where: { id },
      data: { status: EventStatus.APPROVED, rejectionReason: null },
    });

    return updatedEvent;
  }

  async reject(id: string, rejectDto: any, organizationId: string, userRole: string, rejectedBy?: string) {
    if (userRole === 'USER') {
      throw new ForbiddenException('Only moderators and admins can reject events');
    }

    const event = await this.prisma.event.findUnique({ where: { id } });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.organizationId !== organizationId) {
      throw new ForbiddenException('Access denied to this event');
    }

    if (event.status !== EventStatus.SUBMITTED) {
      throw new ConflictException(`Cannot reject event with status ${event.status}`);
    }

    const updatedEvent = await this.prisma.event.update({
      where: { id },
      data: { status: EventStatus.REJECTED, rejectionReason: rejectDto.reason },
    });

    return updatedEvent;
  }
}
