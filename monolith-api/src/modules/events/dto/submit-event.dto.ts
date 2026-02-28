import { ApiProperty } from '@nestjs/swagger';

export class SubmitEventDto {
  @ApiProperty({
    description: 'Confirmation message',
    example: 'Event submitted for review',
  })
  message: string;
}
