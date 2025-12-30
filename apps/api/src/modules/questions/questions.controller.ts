import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateQuestionDto } from './dtos/create-question.dto';
import { updateQuestionDto } from './dtos/update-question.dto';
import { QueryQuestionDto } from './dtos/query-question.dto';
import { QuestionsService } from './questions.service';
import { VoteAnswerDto } from '../answers/dtos/answer.dto';

@Controller('questions')
@UseGuards(ThrottlerGuard)
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) { }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(@Body() body: CreateQuestionDto, @Req() req: any) {
    return this.questionsService.create(body, req.user)
  }

  @Get()
  findAll(@Query() query: QueryQuestionDto) {
    return this.questionsService.findAll(query.page || 1, query.limit || 10, query.search)
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.questionsService.findOne(id)
  }

  @Patch(":id/vote")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  vote(@Param("id", ParseUUIDPipe) id: string, @Body() body: VoteAnswerDto, @Req() req: any) {
    return this.questionsService.vote(id, body, req.user.sub as string)
  }

  @Patch(":id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  update(@Param("id", ParseUUIDPipe) id: string, @Body() body: updateQuestionDto, @Req() req: any) {
    return this.questionsService.update(id, body, req.user.sub as string)
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  remove(@Param("id", ParseUUIDPipe) id: string, @Req() req: any) {
    return this.questionsService.remove(id, req.user.sub as string)
  }
}
