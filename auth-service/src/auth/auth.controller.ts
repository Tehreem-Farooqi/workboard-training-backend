import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern({ cmd: 'auth.signup' })
  async signup(@Payload() data: any) {
    const { correlationId, ...signupDto } = data;
    console.log(`[${correlationId || 'N/A'}] auth.signup - email: ${signupDto.email}`);
    return this.authService.signup(signupDto);
  }

  @MessagePattern({ cmd: 'auth.login' })
  async login(@Payload() data: any) {
    const { correlationId, ...loginDto } = data;
    console.log(`[${correlationId || 'N/A'}] auth.login - email: ${loginDto.email}`);
    return this.authService.login(loginDto);
  }

  @MessagePattern({ cmd: 'auth.getMe' })
  async getMe(@Payload() data: { userId: string; correlationId?: string }) {
    const { correlationId, userId } = data;
    console.log(`[${correlationId || 'N/A'}] auth.getMe - userId: ${userId}`);
    return this.authService.getMe(userId);
  }

  @MessagePattern({ cmd: 'auth.validateUser' })
  async validateUser(@Payload() data: { userId: string; correlationId?: string }) {
    const { correlationId, userId } = data;
    console.log(`[${correlationId || 'N/A'}] auth.validateUser - userId: ${userId}`);
    return this.authService.validateUser(userId);
  }
}
