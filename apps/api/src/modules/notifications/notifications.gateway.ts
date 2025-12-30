import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { env } from 'node:process';
import { Server, Socket } from 'socket.io';
import { EnvConfig } from 'src/config/env.config';
import { Answer } from 'src/database/entities/answer.entity';
import { Question } from 'src/database/entities/question.entity';

@WebSocketGateway({
  cors: {
    origin: env.CLIENT_URL || "http://localhost:3000",
    credentials: true
  }
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  private logger = new Logger()
  private userSockets = new Map<string, string>() // userId -> socketId
  private socketUsers = new Map<string, string>() // socketId -> userId

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService<EnvConfig>
  ) { }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(" ")[1]

      if (!token) {
        this.logger.warn(`Client ${client.id} attempted connection without token`)
        client.disconnect()
        return
      }

      const payload = await this.jwtService.verifyAsync(token as string, {
        secret: this.configService.get("JWT_SECRET")
      })

      const userId = payload.sub as string
      this.userSockets.set(userId, client.id)
      this.socketUsers.set(client.id, userId)

      this.logger.log(`Client connected: ${client.id} (User: ${userId})`)

      await client.join(`user:${userId}`)
    } catch (error: any) {
      this.logger.error(`Authentication failed for client ${client.id}: ${error.message}`)
      client.disconnect()
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.socketUsers.get(client.id)

    if (userId) {
      this.userSockets.delete(userId)
      this.socketUsers.delete(client.id)
      this.logger.log(`Client discounted: ${client.id} (User: ${userId})`)
    } else {
      this.logger.log(`Client discounted: ${client.id}`)
    }
  }

  @OnEvent("question.created")
  handleQuestionCreated(payload: Question) {
    this.logger.log(`Broadcasting new question: ${payload.id}`)
    this.server.emit("newQuestion", {
      message: "A new question has been posted",
      question: {
        id: payload.id,
        title: payload.title,
        author: {
          id: payload.author.id,
          username: payload.author.username
        },
        createdAt: payload.createdAt
      }
    })
  }

  @OnEvent("answer.created")
  handleAnswerCreated(payload: { answer: Answer; questionId: string, questionAuthorId: string }) {
    this.logger.log(`Broadcasting new answer for question: ${payload.questionId}`)

    const questionAuthorSocketId = this.userSockets.get(payload.questionAuthorId)
    if (questionAuthorSocketId) {
      this.server.to(questionAuthorSocketId).emit("answerNotification", {
        message: `${payload.answer.author.id} answered your question`,
        answer: {
          id: payload.answer.id,
          content: payload.answer.content.substring(0, 100),
          questionId: payload.questionId,
          author: payload.answer.author.username
        }
      })
    }

    this.server.emit("newAnswer", {
      questionId: payload.questionId,
      answer: {
        id: payload.answer.id,
        content: payload.answer.content,
        votes: payload.answer.votes,
        author: {
          id: payload.answer.author.id,
          username: payload.answer.author.id,
        },
        createdAt: payload.answer.createdAt
      }
    })
  }

  @OnEvent("answer.voted")
  handleAnswerVoted(payload: { answerId: string; votes: number; questionId: string }) {
    this.logger.log(`Broadcasting vote update for answer: ${payload.answerId}`)
    this.server.emit("answerVoteUpdate", {
      answerId: payload.answerId,
      votes: payload.votes,
      questionId: payload.questionId
    })
  }

  @OnEvent("answer.accepted")
  handleAnswerAccepted(payload: { answerId: string; questionId: string; authorId: string }) {
    this.logger.log(`Broadcasting accepted answer: ${payload.answerId}`)

    // Notify the answer author
    const answerAuthorSocketId = this.userSockets.get(payload.answerId)
    if (answerAuthorSocketId) {
      this.server.to(answerAuthorSocketId).emit("answerAcceptedNotification", {
        message: "Your answer was accepted!",
        answerId: payload.answerId,
        questionId: payload.questionId
      })
    }

    // Broadcast to all viewers
    this.server.emit("answerAccepted", {
      answerId: payload.answerId,
      questionId: payload.questionId
    })
  }
}
