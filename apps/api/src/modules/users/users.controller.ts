import { Body, Controller, Delete, ForbiddenException, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateUserDto } from './dtos/users.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  findAll() {
    return this.usersService.findAll()
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id)
  }

  @Get("username/:username")
  findByUsername(@Param("username") username: string) {
    return this.usersService.findByUsername(username)
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  update(@Param("id", ParseUUIDPipe) id: string, @Body() body: UpdateUserDto, @Req() req: any) {
    if (req.user.sub !== id) {
      throw new ForbiddenException("You can only update your own profile")
    }

    return this.usersService.update(id, body)
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  remove(@Param("id", ParseUUIDPipe) id: string, @Req() req: any) {
    if (req.user.sub !== id) {
      throw new ForbiddenException("You can only delete your own account")
    }

    return this.usersService.remove(id)
  }
}
