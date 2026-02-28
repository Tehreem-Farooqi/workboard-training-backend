import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthController } from './auth/auth.controller';
import { EventsController } from './events/events.controller';
import { JwtStrategy } from './auth/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '1h' },
    }),
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.AUTH_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.AUTH_SERVICE_PORT || '3001'),
        },
      },
      {
        name: 'EVENTS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.EVENTS_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.EVENTS_SERVICE_PORT || '3002'),
        },
      },
    ]),
  ],
  controllers: [AuthController, EventsController],
  providers: [JwtStrategy],
})
export class AppModule {}
