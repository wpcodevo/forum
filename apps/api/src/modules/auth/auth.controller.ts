import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dtos/register.dto';
import { LoginUserDto } from './dtos/login.dto';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from '../../config/env.config';

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly configService: ConfigService<EnvConfig>) { }

  @Post("register")
  async register(@Body() body: RegisterUserDto) {
    return this.authService.register(body)
  }

  @Post("login")
  async login(@Body() body: LoginUserDto, @Res({ passthrough: true }) res: Response) {
    const validatedUser = await this.authService.validateUser(body)
    const { access_token, user } = await this.authService.login(validatedUser)

    res.cookie('token', access_token, { httpOnly: true, secure: this.configService.get("NODE_ENV") === 'production', maxAge: 24 * 60 * 60 * 1000 })
    return {
      access_token,
      user
    }
  }
}
