import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { QuestionsService } from './questions.service';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateQuestionDto } from './dtos/create-question.dto';
import { updateQuestionDto } from './dtos/update-question.dto';

@Controller('questions')
@UseGuards(ThrottlerGuard)
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) { }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(@Body() body: CreateQuestionDto, req: any) {
    return this.questionsService.create(body, req.user)
  }

  @Get()
  @ApiQuery({ name: 'page', required: false, type: String, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: String, description: 'Items per page' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search query' })
  findAll(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string
  ) {
    return this.questionsService.findAll(Number(page || "1"), Number(limit || "10"), search)
  }

  @Get(":id")
  fineOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.questionsService.findOne(id)
  }

  @Patch(":id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  update(@Param("id", ParseUUIDPipe) id: string, @Body() body: updateQuestionDto, @Req() res: any) {
    return this.questionsService.update(id, body, res.user.sub as string)
  }

  @Delete(":id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  remove(@Param("id") id: string, @Req() req: any) {
    return this.questionsService.remove(id, req.user.sub as string)
  }
}
