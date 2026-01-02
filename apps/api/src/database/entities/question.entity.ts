import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "./user.entity";
import { Answer } from "./answer.entity";
import { QuestionVote } from "./question-vote.entity";

@Entity("questions")
export class Question {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column()
  title: string

  @Column("text")
  content: string

  @Column("simple-array", { nullable: true })
  tags: string[]

  @Column({ default: 0 })
  views: number

  @Column({ default: 0 })
  votes: number

  @ManyToOne(() => User, (user) => user.questions)
  author: User

  @OneToMany(() => Answer, (answer) => answer.question)
  answers: Answer[]

  @OneToMany(() => QuestionVote, (vote) => vote.question)
  voteRecords: QuestionVote[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}