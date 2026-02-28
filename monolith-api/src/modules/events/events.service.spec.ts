import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { PrismaService } from '../../database/prisma.service';
import { EventStatus, UserRole } from '@prisma/client';

describe('EventsService', () => {
  let service: EventsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    event: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockUser = {
    id: 'user-123',
    organizationId: 'org-123',
    role: UserRole.USER,
  };

  const mockModerator = {
    id: 'mod-123',
    organizationId: 'org-123',
    role: UserRole.MODERATOR,
  };

  const mockAdmin = {
    id: 'admin-123',
    organizationId: 'org-123',
    role: UserRole.ADMIN,
  };

  const mockEvent = {
    id: 'event-123',
    title: 'Test Event',
    description: 'Test Description',
    location: 'Test Location',
    startDate: new Date('2026-05-01T10:00:00Z'),
    endDate: new Date('2026-05-01T16:00:00Z'),
    status: EventStatus.DRAFT,
    rejectionReason: null,
    organizationId: 'org-123',
    createdById: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      title: 'New Event',
      description: 'Event Description',
      location: 'Event Location',
      startDate: '2026-05-01T10:00:00Z',
      endDate: '2026-05-01T16:00:00Z',
    };

    it('should create event successfully', async () => {
      mockPrismaService.event.create.mockResolvedValue(mockEvent);

      const result = await service.create(
        createDto,
        mockUser.id,
        mockUser.organizationId,
      );

      expect(result).toBeDefined();
      expect(mockPrismaService.event.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: createDto.title,
          status: EventStatus.DRAFT,
          organizationId: mockUser.organizationId,
          createdById: mockUser.id,
        }),
      });
    });

    it('should throw BadRequestException if end date is before start date', async () => {
      const invalidDto = {
        ...createDto,
        startDate: '2026-05-01T16:00:00Z',
        endDate: '2026-05-01T10:00:00Z',
      };

      await expect(
        service.create(invalidDto, mockUser.id, mockUser.organizationId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return only user events for regular user', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([mockEvent]);

      await service.findAll(
        mockUser.organizationId,
        mockUser.id,
        UserRole.USER,
      );

      expect(mockPrismaService.event.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: mockUser.organizationId,
          createdById: mockUser.id,
        },
        orderBy: { startDate: 'asc' },
      });
    });

    it('should return all org events for moderator', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([mockEvent]);

      await service.findAll(
        mockModerator.organizationId,
        mockModerator.id,
        UserRole.MODERATOR,
      );

      expect(mockPrismaService.event.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: mockModerator.organizationId,
        },
        orderBy: { startDate: 'asc' },
      });
    });

    it('should return all org events for admin', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([mockEvent]);

      await service.findAll(
        mockAdmin.organizationId,
        mockAdmin.id,
        UserRole.ADMIN,
      );

      expect(mockPrismaService.event.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: mockAdmin.organizationId,
        },
        orderBy: { startDate: 'asc' },
      });
    });
  });

  describe('State Transitions', () => {
    describe('submit', () => {
      it('should submit draft event successfully', async () => {
        const draftEvent = { ...mockEvent, status: EventStatus.DRAFT };
        mockPrismaService.event.findUnique.mockResolvedValue(draftEvent);
        mockPrismaService.event.update.mockResolvedValue({
          ...draftEvent,
          status: EventStatus.SUBMITTED,
        });

        const result = await service.submit(
          mockEvent.id,
          mockUser.organizationId,
          mockUser.id,
        );

        expect(result.status).toBe(EventStatus.SUBMITTED);
        expect(mockPrismaService.event.update).toHaveBeenCalledWith({
          where: { id: mockEvent.id },
          data: {
            status: EventStatus.SUBMITTED,
            rejectionReason: null,
          },
        });
      });

      it('should throw NotFoundException if event not found', async () => {
        mockPrismaService.event.findUnique.mockResolvedValue(null);

        await expect(
          service.submit(mockEvent.id, mockUser.organizationId, mockUser.id),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw ForbiddenException if not event owner', async () => {
        mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);

        await expect(
          service.submit(mockEvent.id, mockUser.organizationId, 'other-user'),
        ).rejects.toThrow(ForbiddenException);
      });

      it('should throw ConflictException if event is not DRAFT', async () => {
        const submittedEvent = { ...mockEvent, status: EventStatus.SUBMITTED };
        mockPrismaService.event.findUnique.mockResolvedValue(submittedEvent);

        await expect(
          service.submit(mockEvent.id, mockUser.organizationId, mockUser.id),
        ).rejects.toThrow(ConflictException);
      });
    });

    describe('approve', () => {
      it('should approve submitted event as moderator', async () => {
        const submittedEvent = { ...mockEvent, status: EventStatus.SUBMITTED };
        mockPrismaService.event.findUnique.mockResolvedValue(submittedEvent);
        mockPrismaService.event.update.mockResolvedValue({
          ...submittedEvent,
          status: EventStatus.APPROVED,
        });

        const result = await service.approve(
          mockEvent.id,
          mockModerator.organizationId,
          UserRole.MODERATOR,
        );

        expect(result.status).toBe(EventStatus.APPROVED);
      });

      it('should approve submitted event as admin', async () => {
        const submittedEvent = { ...mockEvent, status: EventStatus.SUBMITTED };
        mockPrismaService.event.findUnique.mockResolvedValue(submittedEvent);
        mockPrismaService.event.update.mockResolvedValue({
          ...submittedEvent,
          status: EventStatus.APPROVED,
        });

        const result = await service.approve(
          mockEvent.id,
          mockAdmin.organizationId,
          UserRole.ADMIN,
        );

        expect(result.status).toBe(EventStatus.APPROVED);
      });

      it('should throw ForbiddenException if user is not moderator/admin', async () => {
        await expect(
          service.approve(
            mockEvent.id,
            mockUser.organizationId,
            UserRole.USER,
          ),
        ).rejects.toThrow(ForbiddenException);
      });

      it('should throw ConflictException if event is not SUBMITTED', async () => {
        const draftEvent = { ...mockEvent, status: EventStatus.DRAFT };
        mockPrismaService.event.findUnique.mockResolvedValue(draftEvent);

        await expect(
          service.approve(
            mockEvent.id,
            mockModerator.organizationId,
            UserRole.MODERATOR,
          ),
        ).rejects.toThrow(ConflictException);
      });
    });

    describe('reject', () => {
      const rejectDto = {
        reason: 'Event does not meet quality standards',
      };

      it('should reject submitted event as moderator', async () => {
        const submittedEvent = { ...mockEvent, status: EventStatus.SUBMITTED };
        mockPrismaService.event.findUnique.mockResolvedValue(submittedEvent);
        mockPrismaService.event.update.mockResolvedValue({
          ...submittedEvent,
          status: EventStatus.REJECTED,
          rejectionReason: rejectDto.reason,
        });

        const result = await service.reject(
          mockEvent.id,
          rejectDto,
          mockModerator.organizationId,
          UserRole.MODERATOR,
        );

        expect(result.status).toBe(EventStatus.REJECTED);
        expect(mockPrismaService.event.update).toHaveBeenCalledWith({
          where: { id: mockEvent.id },
          data: {
            status: EventStatus.REJECTED,
            rejectionReason: rejectDto.reason,
          },
        });
      });

      it('should throw ForbiddenException if user is not moderator/admin', async () => {
        await expect(
          service.reject(
            mockEvent.id,
            rejectDto,
            mockUser.organizationId,
            UserRole.USER,
          ),
        ).rejects.toThrow(ForbiddenException);
      });

      it('should throw ConflictException if event is not SUBMITTED', async () => {
        const approvedEvent = { ...mockEvent, status: EventStatus.APPROVED };
        mockPrismaService.event.findUnique.mockResolvedValue(approvedEvent);

        await expect(
          service.reject(
            mockEvent.id,
            rejectDto,
            mockModerator.organizationId,
            UserRole.MODERATOR,
          ),
        ).rejects.toThrow(ConflictException);
      });
    });
  });

  describe('update', () => {
    it('should allow user to update own draft event', async () => {
      const draftEvent = { ...mockEvent, status: EventStatus.DRAFT };
      mockPrismaService.event.findUnique.mockResolvedValue(draftEvent);
      mockPrismaService.event.update.mockResolvedValue({
        ...draftEvent,
        title: 'Updated Title',
      });

      const result = await service.update(
        mockEvent.id,
        { title: 'Updated Title' },
        mockUser.organizationId,
        mockUser.id,
        UserRole.USER,
      );

      expect(result.title).toBe('Updated Title');
    });

    it('should throw ForbiddenException if user tries to edit non-draft event', async () => {
      const submittedEvent = { ...mockEvent, status: EventStatus.SUBMITTED };
      mockPrismaService.event.findUnique.mockResolvedValue(submittedEvent);

      await expect(
        service.update(
          mockEvent.id,
          { title: 'Updated' },
          mockUser.organizationId,
          mockUser.id,
          UserRole.USER,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to update any event', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.event.update.mockResolvedValue({
        ...mockEvent,
        title: 'Admin Updated',
      });

      const result = await service.update(
        mockEvent.id,
        { title: 'Admin Updated' },
        mockAdmin.organizationId,
        mockAdmin.id,
        UserRole.ADMIN,
      );

      expect(result.title).toBe('Admin Updated');
    });
  });

  describe('remove', () => {
    it('should allow user to delete own draft event', async () => {
      const draftEvent = { ...mockEvent, status: EventStatus.DRAFT };
      mockPrismaService.event.findUnique.mockResolvedValue(draftEvent);
      mockPrismaService.event.delete.mockResolvedValue(draftEvent);

      await service.remove(
        mockEvent.id,
        mockUser.organizationId,
        mockUser.id,
        UserRole.USER,
      );

      expect(mockPrismaService.event.delete).toHaveBeenCalledWith({
        where: { id: mockEvent.id },
      });
    });

    it('should throw ForbiddenException if moderator tries to delete', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);

      await expect(
        service.remove(
          mockEvent.id,
          mockModerator.organizationId,
          mockModerator.id,
          UserRole.MODERATOR,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to delete any event', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.event.delete.mockResolvedValue(mockEvent);

      await service.remove(
        mockEvent.id,
        mockAdmin.organizationId,
        mockAdmin.id,
        UserRole.ADMIN,
      );

      expect(mockPrismaService.event.delete).toHaveBeenCalled();
    });
  });
});
