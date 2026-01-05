import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Answer } from 'src/database/entities/answer.entity';
import { AnswerVote } from 'src/database/entities/answer-vote.entity';
import { Question } from 'src/database/entities/question.entity';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { CreateAnswerDto, VoteAnswerDto } from './dtos/answer.dto';
import { QueryAnswerByUserIdDto } from './dtos/query-answer.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class AnswersService {
  constructor(
    @InjectRepository(Answer) private answersRepository: Repository<Answer>,
    @InjectRepository(AnswerVote) private answerVotesRepository: Repository<AnswerVote>,
    @InjectRepository(Question) private questionsRepository: Repository<Question>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
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

    await this.clearAnswerCache()

    return fullAnswer
  }

  async getUserVotesForAnswers(answerIds: string[], userId: string): Promise<Record<string, number>> {
    if (answerIds.length === 0) return {}

    const votes = await this.answerVotesRepository
      .createQueryBuilder("vote")
      .leftJoinAndSelect("vote.answer", "answer")
      .where("vote.user.id = :userId", { userId })
      .andWhere("answer.id IN (:...answerIds)", { answerIds })
      .getMany()

    const userVotes: Record<string, number> = {}
    votes.forEach(vote => {
      userVotes[vote.answer.id] = vote.value
    })
    return userVotes
  }

  async findByQuestion(questionId: string, userId?: string) {
    const answers = await this.answersRepository.find({
      where: { question: { id: questionId } },
      relations: ["author"],
      order: { votes: "DESC", createdAt: "DESC" }
    })

    // Get user votes if userId is provided
    const userVotes = userId && answers.length > 0
      ? await this.getUserVotesForAnswers(answers.map(a => a.id), userId)
      : {}

    // Format answers with userVote
    return answers.map(answer => {
      const { author, ...rest } = answer
      return {
        ...rest,
        author: author ? {
          id: author.id,
          username: author.username,
          name: author.name
        } : null,
        userVote: userId ? (userVotes[answer.id] || null) : null
      }
    })
  }

  async findByUserId({ page = 1, limit = 10 }: QueryAnswerByUserIdDto, userId: string) {
    const queryBuilder = this.answersRepository
      .createQueryBuilder("answer")
      .leftJoinAndSelect("answer.author", "author")
      .leftJoinAndSelect("answer.question", "question")
      .leftJoinAndSelect("question.author", "questionAuthor")
      .where("author.id = :userId", { userId })
      .orderBy("answer.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit)

    const [items, total] = await queryBuilder.getManyAndCount()

    // Get user votes for answers
    const answerUserVotes = items.length > 0
      ? await this.getUserVotesForAnswers(items.map(a => a.id), userId)
      : {}

    // Format answers with author, question, and userVote
    const formattedAnswers = items.map(answer => {
      const { author, question, ...answerRest } = answer
      return {
        ...answerRest,
        author: author ? {
          id: author.id,
          username: author.username,
          name: author.name
        } : null,
        question: question ? {
          id: question.id,
          title: question.title,
          author: question.author ? {
            id: question.author.id,
            username: question.author.username,
            name: question.author.name
          } : null
        } : null,
        userVote: answerUserVotes[answer.id] || null
      }
    })

    return {
      items: formattedAnswers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }

  async findOne(id: string, userId?: string) {
    const answer = await this.answersRepository.findOne({
      where: { id },
      relations: ["author", "question"]
    })

    if (!answer) throw new NotFoundException("Answer not found")

    // Get user vote if userId is provided
    let userVote: number | null = null
    if (userId) {
      const vote = await this.answerVotesRepository.findOne({
        where: {
          answer: { id },
          user: { id: userId }
        }
      })
      userVote = vote ? vote.value : null
    }

    const { author, ...rest } = answer
    return {
      ...rest,
      author: author ? {
        id: author.id,
        username: author.username,
        name: author.name
      } : null,
      userVote
    }
  }

  async vote(id: string, data: VoteAnswerDto, userId: string) {
    const answer = await this.answersRepository.findOne({ where: { id }, relations: ["author", "question"] })

    if (!answer) throw new NotFoundException("Answer not found")

    if (answer.author.id === userId) {
      throw new ForbiddenException("You cannot vote on your own answer")
    }

    // Find existing vote from this user
    const existingVote = await this.answerVotesRepository.findOne({
      where: {
        answer: { id },
        user: { id: userId }
      }
    })

    let oldVoteValue = 0
    let newVoteValue = data.value

    if (existingVote) {
      oldVoteValue = existingVote.value

      // If clicking the same vote again, remove it (toggle off)
      if (data.value === existingVote.value) {
        await this.answerVotesRepository.remove(existingVote)
        newVoteValue = 0
      } else {
        // Change vote to opposite direction
        existingVote.value = data.value
        await this.answerVotesRepository.save(existingVote)
      }
    } else if (data.value !== 0) {
      // Create new vote
      const newVote = this.answerVotesRepository.create({
        user: { id: userId },
        answer: { id },
        value: data.value
      })
      await this.answerVotesRepository.save(newVote)
    }

    // Recalculate total votes from all vote records
    const voteSum = await this.answerVotesRepository
      .createQueryBuilder("vote")
      .select("COALESCE(SUM(vote.value), 0)", "sum")
      .where("vote.answer.id = :answerId", { answerId: id })
      .getRawOne()

    answer.votes = parseInt(String(voteSum?.sum || 0), 10) || 0
    await this.answersRepository.save(answer)

    // Handle reputation changes based on vote transitions
    // Upvote: +10 reputation, Downvote: -2 reputation
    if (oldVoteValue === 0 && newVoteValue === 1) {
      // New upvote
      await this.usersService.incrementReputation(answer.author.id, 10)
    } else if (oldVoteValue === 0 && newVoteValue === -1) {
      // New downvote
      await this.usersService.incrementReputation(answer.author.id, -2)
    } else if (oldVoteValue === 1 && newVoteValue === 0) {
      // Upvote removed
      await this.usersService.incrementReputation(answer.author.id, -10)
    } else if (oldVoteValue === -1 && newVoteValue === 0) {
      // Downvote removed
      await this.usersService.incrementReputation(answer.author.id, 2)
    } else if (oldVoteValue === 1 && newVoteValue === -1) {
      // Upvote changed to downvote: -10 (remove) + -2 (add) = -12
      await this.usersService.incrementReputation(answer.author.id, -12)
    } else if (oldVoteValue === -1 && newVoteValue === 1) {
      // Downvote changed to upvote: +2 (remove) + +10 (add) = +12
      await this.usersService.incrementReputation(answer.author.id, 12)
    }

    this.eventEmitter.emit("answer.voted", { answerId: answer.id, votes: answer.votes, questionId: answer.question.id })

    await this.clearAnswerCache()

    // Get the updated answer with userVote field
    return this.findOne(id, userId)
  }

  async update(id: string, content: string, userId: string) {
    const answer = await this.answersRepository.findOne({
      where: { id },
      relations: ["author"]
    })

    if (!answer) throw new NotFoundException("Answer not found")

    if (answer.author.id !== userId) {
      throw new ForbiddenException("You can only update your own answers")
    }

    answer.content = content
    await this.answersRepository.save(answer)

    await this.clearAnswerCache()

    // Return formatted answer
    return this.findOne(id, userId)
  }

  async remove(id: string, userId: string) {
    const answer = await this.answersRepository.findOne({
      where: { id },
      relations: ["author"]
    })

    if (!answer) throw new NotFoundException("Answer not found")

    if (answer.author.id !== userId) {
      throw new ForbiddenException("You can only delete your own answers")
    }

    await this.answersRepository.remove(answer)

    await this.clearAnswerCache()
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

    await this.clearAnswerCache()

    return answer
  }

  private async clearAnswerCache() {
    await this.cacheManager.clear()
  }
}
