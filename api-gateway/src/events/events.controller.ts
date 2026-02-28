import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Inject,
  HttpCode,
  HttpStatus,
  Req,
  Headers,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { firstValueFrom } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { retryWithBackoff } from '../common/utils/retry.util';

@ApiTags('events')
@Controller('events')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EventsController {
  constructor(
    @Inject('EVENTS_SERVICE') private eventsClient: ClientProxy,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create event' })
  async create(
    @Body() createEventDto: any,
    @CurrentUser() user: any,
    @Req() req: any,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return firstValueFrom(
      this.eventsClient
        .send(
          { cmd: 'events.create' },
          {
            dto: createEventDto,
            userId: user.id,
            organizationId: user.organizationId,
            correlationId: req.correlationId,
            idempotencyKey,
          },
        )
        .pipe(timeout(10000), retryWithBackoff({ maxAttempts: 1 })),
    );
  }

  @Get()
  @ApiOperation({ summary: 'List events' })
  async findAll(@Query() query: any, @CurrentUser() user: any, @Req() req: any) {
    return firstValueFrom(
      this.eventsClient
        .send(
          { cmd: 'events.findAll' },
          {
            query,
            userId: user.id,
            organizationId: user.organizationId,
            role: user.role,
            correlationId: req.correlationId,
          },
        )
        .pipe(timeout(10000), retryWithBackoff({ maxAttempts: 3 })),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any, @Req() req: any) {
    return firstValueFrom(
      this.eventsClient
        .send(
          { cmd: 'events.findOne' },
          {
            id,
            userId: user.id,
            organizationId: user.organizationId,
            role: user.role,
            correlationId: req.correlationId,
          },
        )
        .pipe(timeout(5000), retryWithBackoff({ maxAttempts: 3 })),
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update event' })
  async update(
    @Param('id') id: string,
    @Body() updateEventDto: any,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    return firstValueFrom(
      this.eventsClient
        .send(
          { cmd: 'events.update' },
          {
            id,
            dto: updateEventDto,
            userId: user.id,
            organizationId: user.organizationId,
            role: user.role,
            correlationId: req.correlationId,
          },
        )
        .pipe(timeout(10000), retryWithBackoff({ maxAttempts: 1 })),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete event' })
  async remove(@Param('id') id: string, @CurrentUser() user: any, @Req() req: any) {
    return firstValueFrom(
      this.eventsClient
        .send(
          { cmd: 'events.delete' },
          {
            id,
            userId: user.id,
            organizationId: user.organizationId,
            role: user.role,
            correlationId: req.correlationId,
          },
        )
        .pipe(timeout(10000), retryWithBackoff({ maxAttempts: 1 })),
    );
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit event for review' })
  async submit(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Req() req: any,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return firstValueFrom(
      this.eventsClient
        .send(
          { cmd: 'events.submit' },
          {
            id,
            userId: user.id,
            organizationId: user.organizationId,
            correlationId: req.correlationId,
            idempotencyKey,
          },
        )
        .pipe(timeout(10000), retryWithBackoff({ maxAttempts: 1 })),
    );
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve event' })
  async approve(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Req() req: any,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return firstValueFrom(
      this.eventsClient
        .send(
          { cmd: 'events.approve' },
          {
            id,
            organizationId: user.organizationId,
            role: user.role,
            approvedBy: user.id,
            correlationId: req.correlationId,
            idempotencyKey,
          },
        )
        .pipe(timeout(10000), retryWithBackoff({ maxAttempts: 1 })),
    );
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject event' })
  async reject(
    @Param('id') id: string,
    @Body() rejectDto: any,
    @CurrentUser() user: any,
    @Req() req: any,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return firstValueFrom(
      this.eventsClient
        .send(
          { cmd: 'events.reject' },
          {
            id,
            rejectDto,
            organizationId: user.organizationId,
            role: user.role,
            rejectedBy: user.id,
            correlationId: req.correlationId,
            idempotencyKey,
          },
        )
        .pipe(timeout(10000), retryWithBackoff({ maxAttempts: 1 })),
    );
  }
}
