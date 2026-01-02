import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from 'src/database/entities/question.entity';
import { QuestionVote } from 'src/database/entities/question-vote.entity';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Question, QuestionVote]), UsersModule],
  controllers: [QuestionsController],
  providers: [QuestionsService],
})
export class QuestionsModule { }
