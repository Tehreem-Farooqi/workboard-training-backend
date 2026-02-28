import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { CreateSampleDto } from './common/dto';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get hello message' })
  @ApiResponse({ status: 200, description: 'Returns hello message' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('sample')
  @ApiOperation({ summary: 'Test validation with sample endpoint' })
  @ApiResponse({ status: 201, description: 'Sample created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  createSample(@Body() createSampleDto: CreateSampleDto) {
    return {
      success: true,
      message: 'Validation passed',
      data: createSampleDto,
    };
  }
}
