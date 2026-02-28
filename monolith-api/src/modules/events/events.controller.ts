import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { EventsService } from './events.service';
import {
  CreateEventDto,
  UpdateEventDto,
  EventResponseDto,
  QueryEventsDto,
  PaginatedEventsDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('events')
@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({
    status: 201,
    description: 'Event created successfully',
    type: EventResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @Body() createEventDto: CreateEventDto,
    @CurrentUser() user: any,
  ): Promise<EventResponseDto> {
    return this.eventsService.create(
      createEventDto,
      user.id,
      user.organizationId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all events with filtering, sorting, and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated events for the user',
    type: PaginatedEventsDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Query() query: QueryEventsDto,
    @CurrentUser() user: any,
  ): Promise<PaginatedEventsDto> {
    return this.eventsService.findAllPaginated(
      query,
      user.organizationId,
      user.id,
      user.role,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the event',
    type: EventResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<EventResponseDto> {
    return this.eventsService.findOne(
      id,
      user.organizationId,
      user.id,
      user.role,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update event' })
  @ApiResponse({
    status: 200,
    description: 'Event updated successfully',
    type: EventResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @CurrentUser() user: any,
  ): Promise<EventResponseDto> {
    return this.eventsService.update(
      id,
      updateEventDto,
      user.organizationId,
      user.id,
      user.role,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete event' })
  @ApiResponse({ status: 204, description: 'Event deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<void> {
    return this.eventsService.remove(
      id,
      user.organizationId,
      user.id,
      user.role,
    );
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit event for review' })
  @ApiResponse({
    status: 200,
    description: 'Event submitted successfully',
    type: EventResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 409, description: 'Invalid state transition' })
  submit(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<EventResponseDto> {
    return this.eventsService.submit(id, user.organizationId, user.id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve submitted event' })
  @ApiResponse({
    status: 200,
    description: 'Event approved successfully',
    type: EventResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 409, description: 'Invalid state transition' })
  approve(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<EventResponseDto> {
    return this.eventsService.approve(
      id,
      user.organizationId,
      user.role,
      user.id,
    );
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject submitted event' })
  @ApiResponse({
    status: 200,
    description: 'Event rejected successfully',
    type: EventResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 409, description: 'Invalid state transition' })
  reject(
    @Param('id') id: string,
    @Body() rejectDto: any,
    @CurrentUser() user: any,
  ): Promise<EventResponseDto> {
    return this.eventsService.reject(
      id,
      rejectDto,
      user.organizationId,
      user.role,
      user.id,
    );
  }
}
