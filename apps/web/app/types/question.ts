import type { User } from "./user";

export type SortBy = 'newest' | 'popular' | 'unanswered' | 'recentlyAnswered'
export interface QueryQuestionParam {
  page?: number;
  limit?: number;
  search?: string;
  sort?: SortBy
}

export interface Answer {
  id: string;
  content: string;
  votes: number;
  isAccepted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Question {
  id: string;
  title: string;
  content: string;
  tags: string[],
  views: number;
  votes: number;
  answers: Answer[],
  answerCount: number
  author: User,
  updatedAt: Date;
  createdAt: Date
}

export interface QueryQuestionByUserId {
  page?: number;
  limit?: number;
  includeAnswers?: boolean
}

export interface PaginateResponse<T> {
  items: T[],
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}