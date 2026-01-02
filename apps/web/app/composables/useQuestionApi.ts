import type { PaginateResponse, QueryQuestionByUserId, QueryQuestionParam, Question } from "~/types/question"
import { useApi } from "./useApi"

export const useQuestionApi = () => {
  const { $fetchApi } = useApi()

  const fetchQuestions = async (params: QueryQuestionParam = {}): Promise<PaginateResponse<Question>> => {
    const queryParams = new URLSearchParams()

    if (params.page) queryParams.append('page', params.page.toString())
    if (params.limit) queryParams.append('limit', params.limit.toString())
    if (params.search) queryParams.append('search', params.search)
    if (params.sort) queryParams.append('sort', params.sort)

    const queryString = queryParams.toString()
    return await $fetchApi<PaginateResponse<Question>>(`/questions${queryString ? `?${queryString}` : ''}`)
  }

  const fetchQuestion = async (id: string): Promise<Question> => {
    return await $fetchApi<Question>(`/questions/${id}`)
  }

  const fetchUserQuestions = async (params: QueryQuestionByUserId = {}): Promise<PaginateResponse<Question>> => {
    const queryParams = new URLSearchParams()

    if (params.page) queryParams.append('page', params.page.toString())
    if (params.limit) queryParams.append('limit', params.limit.toString())
    if (params.includeAnswers !== undefined) queryParams.append('includeAnswers', params.includeAnswers.toString())

    const queryString = queryParams.toString()
    return await $fetchApi<PaginateResponse<Question>>(`/questions/user${queryString ? `?${queryString}` : ''}`)
  }

  const voteQuestion = async (id: string, value: 1 | -1): Promise<Question> => {
    return await $fetchApi<Question>(`/questions/${id}/vote`, {
      method: 'PATCH',
      body: { value }
    })
  }

  const createQuestion = async (payload: { title: string; content: string; tags: string[] }): Promise<Question> => {
    return await $fetchApi<Question>(`/questions`, {
      method: 'POST',
      body: payload
    })
  }

  const submitAnswer = async (questionId: string, content: string): Promise<void> => {
    await $fetchApi(`/answers/question/${questionId}`, {
      method: 'POST',
      body: { content }
    })
  }

  const updateQuestion = async (id: string, payload: { title?: string; content?: string }): Promise<Question> => {
    return await $fetchApi<Question>(`/questions/${id}`, {
      method: 'PATCH',
      body: payload
    })
  }

  return {
    fetchQuestions,
    fetchQuestion,
    fetchUserQuestions,
    voteQuestion,
    createQuestion,
    submitAnswer,
    updateQuestion
  }
}

