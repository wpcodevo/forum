import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Question } from 'src/database/entities/question.entity';
import { Answer } from 'src/database/entities/answer.entity';
import { QuestionVote } from 'src/database/entities/question-vote.entity';
import { Repository } from 'typeorm';
import { CreateQuestionDto } from './dtos/create-question.dto';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { updateQuestionDto } from './dtos/update-question.dto';
import { removeUndefinedAndNull } from 'src/common/utils/object.util';
import { UsersService } from '../users/users.service';
import { VoteAnswerDto } from '../answers/dtos/answer.dto';
import { QueryQuestionByUserIdDto, SortBy } from './dtos/query-question.dto';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question) private questionsRepository: Repository<Question>,
    @InjectRepository(QuestionVote) private questionVotesRepository: Repository<QuestionVote>,
    private eventEmitter: EventEmitter2,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private usersService: UsersService
  ) { }

  async create(data: CreateQuestionDto, user: any) {
    const question = this.questionsRepository.create({
      ...data,
      author: { id: user.sub }
    })

    const saved = await this.questionsRepository.save(question)

    const questionWithAuthor = await this.questionsRepository.findOne({
      where: { id: saved.id },
      relations: ["author"]
    })

    if (questionWithAuthor) {
      this.eventEmitter.emit("question.created", questionWithAuthor)
    }

    await this.clearQuestionCache()

    return saved
  }

  async findAll(page = 1, limit = 10, search?: string, sort: SortBy = 'newest', userId?: string) {
    const cacheKey = `questions_list_p${page}_l${limit}_s${search || ""}_${sort}_u${userId || ""}`
    const cachedData = await this.cacheManager.get(cacheKey)

    if (cachedData) {
      return cachedData
    }

    // Create base query
    const queryBuilder = this.questionsRepository
      .createQueryBuilder("question")
      .leftJoinAndSelect("question.author", "author")

    if (search) {
      queryBuilder.where("question.title ILIKE :search OR question.content ILIKE :search", {
        search: `%${search}%`
      })
    }

    switch (sort) {
      case 'newest':
        queryBuilder.orderBy("question.createdAt", "DESC")
        break
      case 'popular':
        queryBuilder.orderBy("question.views", "DESC")
        break
      case 'unanswered':
        queryBuilder
          .andWhere(
            "NOT EXISTS (SELECT 1 FROM answers WHERE answers.\"questionId\" = question.id)"
          )
          .orderBy("question.createdAt", "DESC")
        break
      case 'recentlyAnswered':
        queryBuilder
          .addSelect('MAX(answers.createdAt)', 'max_answer_date')
          .leftJoin("question.answers", "answers")
          .groupBy('question.id')
          .addGroupBy('author.id')
          .orderBy('max_answer_date', 'DESC', 'NULLS LAST')
          .addOrderBy('question.createdAt', 'DESC')
        break
      default:
        queryBuilder.orderBy("question.createdAt", "DESC")
    }

    queryBuilder.skip((page - 1) * limit).take(limit)
    const [items, total] = await queryBuilder.getManyAndCount()

    // Get answer counts for all questions
    const questionIds = items.map(item => item.id)
    const answerCounts: Record<string, number> = {}

    if (questionIds.length > 0) {
      const counts = await this.questionsRepository
        .createQueryBuilder("question")
        .leftJoin("question.answers", "answers")
        .select("question.id", "questionId")
        .addSelect("COUNT(answers.id)", "answerCount")
        .where("question.id IN (:...questionIds)", { questionIds })
        .groupBy("question.id")
        .getRawMany()

      counts.forEach(item => {
        answerCounts[item.questionId] = parseInt(item.answerCount as string) || 0
      })
    }

    // Get user votes if userId is provided
    const userVotes: Record<string, number> = {}
    if (userId && questionIds.length > 0) {
      const votes = await this.questionVotesRepository
        .createQueryBuilder("vote")
        .leftJoinAndSelect("vote.question", "question")
        .where("vote.user.id = :userId", { userId })
        .andWhere("question.id IN (:...questionIds)", { questionIds })
        .getMany()

      votes.forEach(vote => {
        userVotes[vote.question.id] = vote.value
      })
    }

    const result = {
      items: items.map(i => {
        const { author, ...rest } = i
        return {
          ...rest,
          author: author ? { id: author.id, username: author.username, name: author.name } : null,
          answerCount: answerCounts[i.id] || 0,
          userVote: userId ? (userVotes[i.id] || null) : null
        }
      }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }

    await this.cacheManager.set(cacheKey, result, 60000)

    return result
  }

  async findOne(id: string, userId?: string) {
    const cacheKey = `question_${id}_u${userId || ""}`
    const cachedData = await this.cacheManager.get(cacheKey)

    if (cachedData) {
      await this.incrementViews(id)
      return cachedData
    }

    const question = await this.questionsRepository.findOne({ where: { id }, relations: ["author", "answers", "answers.author"] })

    if (!question) throw new NotFoundException("Question not found")

    await this.incrementViews(id)

    let userVote: number | null = null
    if (userId) {
      const vote = await this.questionVotesRepository.findOne({
        where: {
          question: { id },
          user: { id: userId }
        }
      })
      userVote = vote ? vote.value : null
    }

    // Format question author
    const { author: questionAuthor, answers, ...questionRest } = question
    const formattedQuestionAuthor = questionAuthor ? {
      id: questionAuthor.id,
      username: questionAuthor.username,
      name: questionAuthor.name
    } : null

    // Format answers with author information
    const formattedAnswers = answers?.map(answer => {
      const { author, ...answerRest } = answer
      return {
        ...answerRest,
        author: author ? {
          id: author.id,
          username: author.username,
          name: author.name
        } : null
      }
    }) || []

    const result = {
      ...questionRest,
      author: formattedQuestionAuthor,
      answers: formattedAnswers,
      userVote
    }

    await this.cacheManager.set(cacheKey, result, 60000)

    return result
  }

  async vote(id: string, data: VoteAnswerDto, userId: string) {
    const question = await this.questionsRepository.findOne({ where: { id }, relations: ["author"] })

    if (!question) throw new NotFoundException("Question not found")

    if (question.author.id === userId) {
      throw new ForbiddenException("You cannot vote on your own question")
    }

    // Find existing vote from this user
    const existingVote = await this.questionVotesRepository.findOne({
      where: {
        question: { id },
        user: { id: userId }
      }
    })

    let oldVoteValue = 0
    let newVoteValue = data.value

    if (existingVote) {
      oldVoteValue = existingVote.value

      // If clicking the same vote again, remove it (toggle off)
      if (data.value === existingVote.value) {
        await this.questionVotesRepository.remove(existingVote)
        newVoteValue = 0
      } else {
        // Change vote to opposite direction
        existingVote.value = data.value
        await this.questionVotesRepository.save(existingVote)
      }
    } else if (data.value !== 0) {
      // Create new vote
      const newVote = this.questionVotesRepository.create({
        user: { id: userId },
        question: { id },
        value: data.value
      })
      await this.questionVotesRepository.save(newVote)
    }

    // Recalculate total votes from all vote records
    const voteSum = await this.questionVotesRepository
      .createQueryBuilder("vote")
      .select("COALESCE(SUM(vote.value), 0)", "sum")
      .where("vote.question.id = :questionId", { questionId: id })
      .getRawOne()

    question.votes = parseInt(String(voteSum?.sum || 0), 10) || 0
    await this.questionsRepository.save(question)

    // Handle reputation changes based on vote transitions
    // Upvote: +10 reputation, Downvote: -2 reputation
    if (oldVoteValue === 0 && newVoteValue === 1) {
      // New upvote
      await this.usersService.incrementReputation(question.author.id, 10)
    } else if (oldVoteValue === 0 && newVoteValue === -1) {
      // New downvote
      await this.usersService.incrementReputation(question.author.id, -2)
    } else if (oldVoteValue === 1 && newVoteValue === 0) {
      // Upvote removed
      await this.usersService.incrementReputation(question.author.id, -10)
    } else if (oldVoteValue === -1 && newVoteValue === 0) {
      // Downvote removed
      await this.usersService.incrementReputation(question.author.id, 2)
    } else if (oldVoteValue === 1 && newVoteValue === -1) {
      // Upvote changed to downvote: -10 (remove) + -2 (add) = -12
      await this.usersService.incrementReputation(question.author.id, -12)
    } else if (oldVoteValue === -1 && newVoteValue === 1) {
      // Downvote changed to upvote: +2 (remove) + +10 (add) = +12
      await this.usersService.incrementReputation(question.author.id, 12)
    }

    await this.clearQuestionCache()

    return question
  }

  async update(id: string, data: updateQuestionDto, userId: string) {
    const question = await this.questionsRepository.findOne({ where: { id }, relations: ["author"] })

    if (!question) throw new NotFoundException("Question not found")

    if (question.author.id !== userId) {
      throw new ForbiddenException("You can only edit your own questions")
    }

    const updateData = removeUndefinedAndNull(data)

    Object.assign(question, updateData)
    const saved = await this.questionsRepository.save(question)

    await this.clearQuestionCache()

    return saved
  }

  async remove(id: string, userId: string) {
    const question = await this.questionsRepository.findOne({ where: { id }, relations: ["author"] })

    if (!question) throw new NotFoundException("Question not found")

    if (question.author.id !== userId) {
      throw new ForbiddenException("You can only delete your own questions")
    }

    await this.questionsRepository.remove(question)

    await this.clearQuestionCache()
  }

  async findByUserId({ page, limit, includeAnswers }: QueryQuestionByUserIdDto, userId: string) {
    const cacheKey = `questions_user_${userId}_p${page}_l${limit}_ia${includeAnswers}`

    const cachedData = await this.cacheManager.get(cacheKey)
    if (cachedData) {
      return cachedData
    }

    const queryBuilder = this.questionsRepository.createQueryBuilder("question").leftJoinAndSelect("question.author", "author").where("author.id = :userId", { userId })

    if (includeAnswers) {
      queryBuilder.leftJoinAndSelect("question.answers", "answers").leftJoinAndSelect("answers.author", "answerAuthor")
    }

    queryBuilder.orderBy("question.createdAt", "DESC")
    queryBuilder.skip((page - 1) * limit).take(limit)

    const [items, total] = await queryBuilder.getManyAndCount()

    const questionIds = items.map(item => item.id)
    const answerCounts: Record<string, number> = {}

    if (questionIds.length > 0 && !includeAnswers) {
      const counts = await this.questionsRepository
        .createQueryBuilder("question")
        .leftJoin("question.answers", "answers")
        .select("question.id", "questionId")
        .addSelect("COUNT(answers.id)", "answerCount")
        .where("question.id IN (:...questionIds)", { questionIds })
        .groupBy("question.id")
        .getRawMany()

      counts.forEach(item => {
        answerCounts[item.questionId] = parseInt(item.answerCount as string) || 0
      })
    }

    const result = {
      items: items.map(i => {
        const { author, answers, ...rest } = i;

        const formattedAuthor = author ? {
          id: author.id,
          username: author.username,
          name: author.name
        } : null


        let formattedAnswers: Array<Omit<Answer, 'author' | 'question'> & {
          author: { id: string; username: string; name: string } | null;
        }> | undefined;
        if (includeAnswers && answers) {
          formattedAnswers = answers.map(answer => {
            const { author: answerAuthor, ...answerRest } = answer

            return {
              ...answerRest,
              author: answerAuthor ? {
                id: answerAuthor.id,
                username: answerAuthor.username,
                name: answerAuthor.name
              } : null
            }
          })
        }

        return {
          ...rest,
          author: formattedAuthor,
          answers: includeAnswers ? formattedAnswers : undefined,
          answerCount: includeAnswers ? answers.length || 0 : answerCounts[i.id] || 0
        }
      }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }

    await this.cacheManager.set(cacheKey, result, 60000)

    return result
  }

  private async incrementViews(id: string) {
    await this.questionsRepository.increment({ id }, "views", 1)
  }

  private async clearQuestionCache() {
    await this.cacheManager.clear()
  }
}
