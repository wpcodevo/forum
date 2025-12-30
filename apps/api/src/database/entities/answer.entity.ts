import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "./user.entity";
import { Question } from "./question.entity";

@Entity("answers")
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

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}