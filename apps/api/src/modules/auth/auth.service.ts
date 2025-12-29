import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RegisterUserDto } from './dtos/register.dto';
import { LoginUserDto } from './dtos/login.dto';
import { User } from 'src/database/entities/user.entity';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private userService: UsersService, private jwtService: JwtService) { }

  register(data: RegisterUserDto) {
    return this.userService.create(data)
  }

  async login(user: User) {
    const payload = { sub: user.id, email: user.email, username: user.username }

    return {
      access_token: this.jwtService.sign(payload),
      user
    }
  }

  async validateUser(data: LoginUserDto) {
    const user = await this.userService.findByEmail(data.email)

    if (!user || !(await user.verifyPassword(data.password))) {
      throw new UnauthorizedException("Invalid email or password")
    }

    return user
  }
}
