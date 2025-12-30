import { BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import bcrypt from "bcrypt"
import { Exclude } from "class-transformer";
import { env } from 'node:process';
import { Question } from "./question.entity";
import { Answer } from "./answer.entity";


@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ unique: true })
  email: string

  @Column()
  @Exclude()
  password: string

  @Column()
  username: string

  @Column({ nullable: true })
  bio?: string

  @Column({ nullable: true })
  avatar?: string

  @Column({ default: 0 })
  reputation: number

  @OneToMany(() => Question, (question) => question.author)
  questions: Question[]

  @OneToMany(() => Answer, (answer) => answer.author)
  answers: Answer[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && this.password.length < 100) {
      const saltRounds = parseInt(env.BCRYPT_ROUNDS || '12', 10)
      this.password = await bcrypt.hash(this.password, saltRounds)
    }
  }

  async verifyPassword(password: string): Promise<boolean> {
    if (!this.password) return false
    return bcrypt.compare(password, this.password)
  }

  toJSON() {
    const user = { ...this }
    delete user.password
    return user
  }
}