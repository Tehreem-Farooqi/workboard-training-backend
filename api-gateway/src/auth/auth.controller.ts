import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Inject,
  Req,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { firstValueFrom } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { retryWithBackoff } from '../common/utils/retry.util';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject('AUTH_SERVICE') private authClient: ClientProxy,
  ) {}

  @Post('signup')
  @ApiOperation({ summary: 'Create new user account' })
  async signup(@Body() signupDto: any, @Req() req: any) {
    return firstValueFrom(
      this.authClient
        .send(
          { cmd: 'auth.signup' },
          { ...signupDto, correlationId: req.correlationId },
        )
        .pipe(timeout(5000), retryWithBackoff({ maxAttempts: 2 })),
    );
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  async login(@Body() loginDto: any, @Req() req: any) {
    return firstValueFrom(
      this.authClient
        .send(
          { cmd: 'auth.login' },
          { ...loginDto, correlationId: req.correlationId },
        )
        .pipe(timeout(5000), retryWithBackoff({ maxAttempts: 2 })),
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  async getMe(@CurrentUser() user: any, @Req() req: any) {
    return firstValueFrom(
      this.authClient
        .send(
          { cmd: 'auth.getMe' },
          { userId: user.id, correlationId: req.correlationId },
        )
        .pipe(timeout(5000), retryWithBackoff({ maxAttempts: 3 })),
    );
  }
}
