import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Question } from 'src/database/entities/question.entity';
import { Repository } from 'typeorm';
import { CreateQuestionDto } from './dtos/create-question.dto';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { updateQuestionDto } from './dtos/update-question.dto';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question) private questionsRepository: Repository<Question>,
    private eventEmitter: EventEmitter2,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
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

  async findAll(page = 1, limit = 10, search?: string) {
    const cacheKey = `questions_list_p${page}_l${limit}_s${search || ""}`
    const cachedData = await this.cacheManager.get(cacheKey)

    if (cachedData) {
      return cachedData
    }

    const queryBuilder = this.questionsRepository
      .createQueryBuilder("question")
      .leftJoinAndSelect("question.author", "author")
      .leftJoinAndSelect("question.answers", "answers")
      .orderBy("question.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit)

    if (search) {
      queryBuilder.where("question.title ILIKE :search OR question.content ILIKE :search", { search: `%${search}%` })
    }

    const [items, total] = await queryBuilder.getManyAndCount()

    const result = {
      items: items.map(i => {
        const { author, ...rest } = i
        return {
          ...rest,
          author: author ? { id: author.id, username: author.username } : null,
          answerCount: i.answers?.length || 0
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

  async findOne(id: string) {
    const cacheKey = `question_${id}`
    const cachedData = await this.cacheManager.get<Question>(cacheKey)

    if (cachedData) {
      await this.incrementViews(id)
      return cachedData
    }

    const question = await this.questionsRepository.findOne({ where: { id }, relations: ["author", "answers", "answers.author"] })

    if (!question) throw new NotFoundException("Question not found")

    await this.incrementViews(id)

    await this.cacheManager.set(cacheKey, question, 60000)

    return question
  }

  async update(id: string, data: updateQuestionDto, userId: string) {
    const question = await this.questionsRepository.findOne({ where: { id }, relations: ["author"] })

    if (!question) throw new NotFoundException("Question not found")

    if (question.author.id !== userId) {
      throw new ForbiddenException("You can only edit your own questions")
    }

    Object.assign(question, data)
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

  private async incrementViews(id: string) {
    await this.questionsRepository.increment({ id }, "views", 1)
  }

  private async clearQuestionCache() {
    await this.cacheManager.clear()
  }
}
