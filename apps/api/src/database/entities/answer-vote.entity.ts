import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { User } from "./user.entity";
import { Answer } from "./answer.entity";

@Entity("answer_votes")
@Unique(["user", "answer"])
@Index(["answer"])
@Index(["user"])
export class AnswerVote {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  user: User

  @ManyToOne(() => Answer, (answer) => answer.voteRecords, { onDelete: "CASCADE" })
  answer: Answer

  @Column({ type: "int" })
  value: number // 1 for upvote, -1 for downvote

  @CreateDateColumn()
  createdAt: Date
}

