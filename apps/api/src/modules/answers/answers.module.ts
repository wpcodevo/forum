import { Module } from '@nestjs/common';
import { AnswersService } from './answers.service';
import { AnswersController } from './answers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Answer } from 'src/database/entities/answer.entity';
import { Question } from 'src/database/entities/question.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Answer, Question]), UsersModule],
  controllers: [AnswersController],
  providers: [AnswersService],
  exports: [AnswersService]
})
export class AnswersModule { }
