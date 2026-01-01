import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/database/entities/user.entity';
import { Repository } from 'typeorm';
import { RegisterUserDto } from '../auth/dtos/register.dto';
import { UpdateUserDto } from './dtos/users.dto';
import { removeUndefinedAndNull } from 'src/common/utils/object.util';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>
  ) { }

  async create(data: RegisterUserDto): Promise<User> {
    const { name, email, username, password } = data
    const existingUser = await this.usersRepository.findOne({ where: [{ email }, { username }] })

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException("Email already exists")
      }
      throw new ConflictException("Username already taken")
    }

    const user = this.usersRepository.create({
      name, email, username, password
    })

    return this.usersRepository.save(user)
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({ select: ['id', 'name', 'email', 'username', 'bio', 'reputation', 'avatar', 'createdAt'] })
  }

  async findOne(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id }, relations: ["questions", "answers"], select: ["id", 'name', "email", "username", "bio", 'reputation', "avatar", "createdAt"] })
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email }, select: ['id', 'name', 'email', 'password', 'username', 'bio', 'reputation', 'avatar', 'createdAt'] })
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username }, relations: ["questions", "answers"], select: ['id', 'name', 'email', 'username', 'reputation', 'bio', 'avatar', 'createdAt'] })
  }

  async update(id: string, data: UpdateUserDto) {
    const user = await this.findOne(id)

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`)
    }

    if (data.username && data.username !== user.username) {
      const existingUser = await this.usersRepository.findOne({ where: { username: data.username } })

      if (existingUser) {
        throw new ConflictException("Username already taken")
      }
    }

    const updateData = removeUndefinedAndNull(data)

    Object.assign(user, updateData)

    return this.usersRepository.save(user)
  }

  async remove(id: string) {
    const user = await this.findOne(id)

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`)
    }

    await this.usersRepository.remove(user)
  }

  async incrementReputation(userId: string, amount: number) {
    await this.usersRepository.increment({ id: userId }, "reputation", amount)
  }
}
