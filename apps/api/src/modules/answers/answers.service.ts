import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Answer } from 'src/database/entities/answer.entity';
import { Question } from 'src/database/entities/question.entity';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { CreateAnswerDto, VoteAnswerDto } from './dtos/answer.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class AnswersService {
  constructor(
    @InjectRepository(Answer) private answersRepository: Repository<Answer>,
    @InjectRepository(Question) private questionsRepository: Repository<Question>,
    private usersService: UsersService,
    private eventEmitter: EventEmitter2
  ) { }

  async create(questionId: string, data: CreateAnswerDto, user: any) {
    const question = await this.questionsRepository.findOne({ where: { id: questionId }, relations: ["author"] })

    if (!question) throw new NotFoundException("Question not found")

    const answer = this.answersRepository.create({
      content: data.content,
      question: { id: questionId },
      author: { id: user.sub }
    })

    const saved = await this.answersRepository.save(answer)

    const fullAnswer = await this.answersRepository.findOne({ where: { id: saved.id }, relations: ["author", "question"] })

    if (!fullAnswer) {
      throw new NotFoundException("Failed to retrieve created answer")
    }

    if (question.author?.id) {
      this.eventEmitter.emit("answer.created", { answer: fullAnswer, questionId, questionAuthorId: question.author.id })
    }

    return fullAnswer
  }

  async findByQuestion(questionId: string) {
    return this.answersRepository.find({
      where: { question: { id: questionId } }, relations: ["author"], order: { votes: "DESC", createdAt: "DESC" }
    })
  }

  async findOne(id: string) {
    const answer = await this.answersRepository.findOne({
      where: { id },
      relations: ["author", "question"]
    })

    if (!answer) throw new NotFoundException("Answer not found")

    return answer
  }

  async vote(id: string, data: VoteAnswerDto, userId: string) {
    const answer = await this.answersRepository.findOne({ where: { id }, relations: ["author", "question"] })

    if (!answer) throw new NotFoundException("Answer not found")

    if (answer.author.id === userId) {
      throw new ForbiddenException("You cannot vote on your own answer")
    }

    answer.votes += data.value
    // Ensure votes don't go below 0
    if (answer.votes < 0) {
      answer.votes = 0
    }
    await this.answersRepository.save(answer)

    if (data.value === 1) {
      await this.usersService.incrementReputation(answer.author.id, 10)
    } else if (data.value === -1) {
      await this.usersService.incrementReputation(answer.author.id, -2)
    }

    this.eventEmitter.emit("answer.voted", { answerId: answer.id, votes: answer.votes, questionId: answer.question.id })

    return answer
  }

  async update(id: string, content: string, userId: string) {
    const answer = await this.findOne(id)

    if (answer.author.id !== userId) {
      throw new ForbiddenException("You can only update your own answers")
    }

    answer.content = content

    return this.answersRepository.save(answer)
  }

  async remove(id: string, userId: string) {
    const answer = await this.findOne(id)

    if (answer.author.id !== userId) {
      throw new ForbiddenException("You can only delete your own answers")
    }

    await this.answersRepository.remove(answer)
  }

  async markAsAccepted(id: string, userId: string) {
    const answer = await this.answersRepository.findOne({
      where: { id },
      relations: ["author", "question", "question.author"]
    })

    if (!answer) throw new NotFoundException("Answer not found")

    if (!answer.question?.author) {
      throw new NotFoundException("Question author not found")
    }

    if (answer.question.author.id !== userId) {
      throw new ForbiddenException("Only the question author can accept an answer")
    }

    // Unmark other accepted answers for this question
    await this.answersRepository.update({ question: { id: answer.question.id }, isAccepted: true }, { isAccepted: false })

    answer.isAccepted = true
    await this.answersRepository.save(answer)

    // Reward the answer author with bonus reputation
    await this.usersService.incrementReputation(answer.author.id, 15)

    this.eventEmitter.emit("answer.accepted", {
      answerId: answer.id, questionId: answer.question.id, authorId: answer.author.id
    })

    return answer
  }
}
