import { Module } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { EnvConfig } from 'src/config/env.config';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvConfig>) => ({
        secret: config.get("JWT_SECRET"),
        signOptions: { expiresIn: "1d" }
      })
    }),
    ConfigModule
  ],
  providers: [NotificationsGateway],
  exports: [NotificationsGateway]
})
export class NotificationsModule { }
