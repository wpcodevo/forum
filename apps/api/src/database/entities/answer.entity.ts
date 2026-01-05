import { Column, CreateDateColumn, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "./user.entity";
import { Question } from "./question.entity";
import { AnswerVote } from "./answer-vote.entity";

@Entity("answers")
@Index(["question"])
@Index(["author"])
@Index(["createdAt"])
@Index(["votes"])
export class Answer {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column("text")
  content: string

  @Column({ default: 0 })
  votes: number

  @Column({ default: false })
  isAccepted: boolean

  @ManyToOne(() => User, (user) => user.answers)
  author: User

  @ManyToOne(() => Question, (question) => question.answers, { onDelete: "CASCADE" })
  question: Question

  @OneToMany(() => AnswerVote, (vote) => vote.answer)
  voteRecords: AnswerVote[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}