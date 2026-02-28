import { ApiProperty } from '@nestjs/swagger';
import { EventStatus } from '@prisma/client';

export class EventResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ required: false, nullable: true })
  location?: string | null;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty({ enum: EventStatus })
  status: EventStatus;

  @ApiProperty({ required: false, nullable: true })
  rejectionReason?: string | null;

  @ApiProperty()
  organizationId: string;

  @ApiProperty()
  createdById: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(partial: Partial<EventResponseDto>) {
    Object.assign(this, partial);
  }
}
