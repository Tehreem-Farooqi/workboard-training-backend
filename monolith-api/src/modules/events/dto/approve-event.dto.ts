import { ApiProperty } from '@nestjs/swagger';

export class ApproveEventDto {
  @ApiProperty({
    description: 'Confirmation message',
    example: 'Event approved successfully',
  })
  message: string;
}
