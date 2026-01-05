import { Body, Controller, Post, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { EnvConfig } from '../../config/env.config';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dtos/login.dto';
import { RegisterUserDto } from './dtos/register.dto';

@Controller('auth')
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

    res.cookie('token', access_token, {
      httpOnly: true,
      secure: this.configService.get("NODE_ENV") === 'production',
      sameSite: this.configService.get("NODE_ENV") === 'production' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000
    })
    return {
      access_token,
      user
    }
  }

  @Post("logout")
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie("token")
  }
}
