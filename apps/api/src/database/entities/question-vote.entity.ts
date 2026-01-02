import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { User } from "./user.entity";
import { Question } from "./question.entity";

@Entity("question_votes")
@Unique(["user", "question"])
export class QuestionVote {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  user: User

  @ManyToOne(() => Question, (question) => question.voteRecords, { onDelete: "CASCADE" })
  question: Question

  @Column({ type: "int" })
  value: number // 1 for upvote, -1 for downvote

  @CreateDateColumn()
  createdAt: Date
}

