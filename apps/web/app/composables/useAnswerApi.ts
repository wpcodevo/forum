import type { PaginateResponse, QueryAnswerByUserId, Answer } from "~/types/question"
import { useApi } from "./useApi"

export const useAnswerApi = () => {
  const { $fetchApi } = useApi()

  const fetchUserAnswers = async (params: QueryAnswerByUserId = {}): Promise<PaginateResponse<Answer>> => {
    const queryParams = new URLSearchParams()

    if (params.page) queryParams.append('page', params.page.toString())
    if (params.limit) queryParams.append('limit', params.limit.toString())

    const queryString = queryParams.toString()
    return await $fetchApi<PaginateResponse<Answer>>(`/answers/user?${queryString}`)
  }

  const fetchAnswer = async (id: string): Promise<Answer> => {
    return await $fetchApi<Answer>(`/answers/${id}`)
  }

  const fetchAnswersByQuestion = async (questionId: string): Promise<Answer[]> => {
    return await $fetchApi<Answer[]>(`/answers/question/${questionId}`)
  }

  const submitAnswer = async (questionId: string, content: string): Promise<void> => {
    await $fetchApi(`/answers/question/${questionId}`, {
      method: 'POST',
      body: { content }
    })
  }

  const updateAnswer = async (id: string, content: string): Promise<Answer> => {
    return await $fetchApi<Answer>(`/answers/${id}`, {
      method: 'PATCH',
      body: { content }
    })
  }

  const voteAnswer = async (id: string, value: 1 | -1): Promise<Answer> => {
    return await $fetchApi<Answer>(`/answers/${id}/vote`, {
      method: 'PATCH',
      body: { value }
    })
  }

  const acceptAnswer = async (id: string): Promise<Answer> => {
    return await $fetchApi<Answer>(`/answers/${id}/accept`, {
      method: 'PATCH'
    })
  }

  return {
    fetchUserAnswers,
    fetchAnswer,
    fetchAnswersByQuestion,
    submitAnswer,
    updateAnswer,
    voteAnswer,
    acceptAnswer
  }
}

