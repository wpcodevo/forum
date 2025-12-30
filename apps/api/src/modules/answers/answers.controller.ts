import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AnswersService } from './answers.service';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateAnswerDto, VoteAnswerDto } from './dtos/answer.dto';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('answers')
@UseGuards(ThrottlerGuard)
export class AnswersController {
  constructor(private readonly answersService: AnswersService) { }

  @Post("question/:questionId")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(@Param("questionId", ParseUUIDPipe) questionId: string, @Body() body: CreateAnswerDto, @Req() req: any) {
    return this.answersService.create(questionId, body, req.user)
  }

  @Get("question/:questionId")
  findByQuestion(@Param("questionId", ParseUUIDPipe) questionId: string) {
    return this.answersService.findByQuestion(questionId)
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.answersService.findOne(id)
  }

  @Patch(":id/vote")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  vote(@Param("id", ParseUUIDPipe) id: string, @Body() body: VoteAnswerDto, @Req() req: any) {
    return this.answersService.vote(id, body, req.user.sub as string)
  }

  @Patch(":id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  update(@Param("id") id: string, @Body() body: CreateAnswerDto, @Req() req: any) {
    return this.answersService.update(id, body.content, req.user.sub as string)
  }

  @Patch(":id/accept")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  markAsAccepted(@Param("id") id: string, @Req() req: any) {
    return this.answersService.markAsAccepted(id, req.user.sub as string)
  }

  @Delete(":id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  remove(@Param("id") id: string, @Req() req: any) {
    return this.answersService.remove(id, req.user.sub as string)
  }
}
