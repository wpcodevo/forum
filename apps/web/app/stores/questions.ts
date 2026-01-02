import type { QueryQuestionByUserId, QueryQuestionParam, Question, PaginateResponse } from "~/types/question"
import { useQuestionApi } from "~/composables/useQuestionApi"


export const useQuestionsQuery = (params: QueryQuestionParam | ComputedRef<QueryQuestionParam> = {}) => {
  const { fetchQuestions } = useQuestionApi()
  const resolvedParams = computed(() => toValue(params))

  const normalizedParams = computed(() => ({
    page: resolvedParams.value.page || 1,
    limit: resolvedParams.value.limit || 10,
    sort: resolvedParams.value.sort || 'newest',
    ...resolvedParams.value
  }))

  return useQuery({
    queryKey: ['questions', normalizedParams],
    queryFn: (): Promise<PaginateResponse<Question>> => fetchQuestions(normalizedParams.value),
    select: (data: PaginateResponse<Question>) => ({
      items: data.items,
      total: data.total,
      page: data.page,
      limit: data.limit,
      totalPages: data.totalPages
    })
  })
}


export const useUserQuestionsQuery = (params: QueryQuestionByUserId | ComputedRef<QueryQuestionByUserId> = {}) => {
  const { fetchUserQuestions } = useQuestionApi()
  const resolvedParams = computed(() => toValue(params))

  const normalizedParams = computed(() => ({
    page: resolvedParams.value.page || 1,
    limit: resolvedParams.value.limit || 10,
    includeAnswers: resolvedParams.value.includeAnswers || false,
    ...resolvedParams.value
  }))

  return useQuery({
    queryKey: ['questions', 'user', normalizedParams],
    queryFn: (): Promise<PaginateResponse<Question>> => fetchUserQuestions(normalizedParams.value),
    select: (data: PaginateResponse<Question>) => ({
      items: data.items,
      total: data.total,
      page: data.page,
      limit: data.limit,
      totalPages: data.totalPages
    })
  })
}


export const useQuestionQuery = (id: string | ComputedRef<string>) => {
  const { fetchQuestion } = useQuestionApi()
  const questionId = computed(() => toValue(id))

  return useQuery({
    queryKey: ['question', questionId],
    queryFn: (): Promise<Question> => fetchQuestion(questionId.value),
    enabled: computed(() => !!questionId.value)
  })
}


export const useQuestionStore = defineStore('questions', () => {
  const { voteQuestion: voteQuestionApi, createQuestion: createQuestionApi, submitAnswer: submitAnswerApi, updateQuestion: updateQuestionApi } = useQuestionApi()
  const queryClient = useQueryClient()
  const auth = useAuthStore()

  const voteQuestionMutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: 1 | -1 }): Promise<Question> => voteQuestionApi(id, value),
    onSuccess: (_data: Question, variables: { id: string; value: 1 | -1 }) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ['question', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['questions'] })
    }
  })

  const createQuestionMutation = useMutation({
    mutationFn: (payload: { title: string; content: string; tags: string[] }): Promise<Question> => createQuestionApi(payload),
    onSuccess: () => {
      // Invalidate questions list to show the new question
      queryClient.invalidateQueries({ queryKey: ['questions'] })
    }
  })

  const submitAnswerMutation = useMutation({
    mutationFn: ({ questionId, content }: { questionId: string; content: string }): Promise<void> =>
      submitAnswerApi(questionId, content),
    onSuccess: (_data: void, variables: { questionId: string; content: string }) => {
      // Invalidate the question to show the new answer
      queryClient.invalidateQueries({ queryKey: ['question', variables.questionId] })
    }
  })

  async function voteQuestion(id: string, value: 1 | -1) {
    if (!auth.isAuthenticated) {
      return {
        success: false,
        error: 'You must be logged in to vote'
      }
    }

    try {
      await voteQuestionMutation.mutateAsync({ id, value })
      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to vote'
      }
    }
  }

  async function createQuestion(payload: { title: string; content: string; tags: string[] }) {
    try {
      const data = await createQuestionMutation.mutateAsync(payload)
      return { success: true, data }
    } catch (error: any) {
      return {
        success: false,
        error: error.data?.message || 'Failed to post question'
      }
    }
  }

  async function submitAnswer(questionId: string, content: string) {
    try {
      await submitAnswerMutation.mutateAsync({ questionId, content })
      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.data?.message || 'Failed to submit answer'
      }
    }
  }

  const updateQuestionMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { title?: string; content?: string } }): Promise<Question> =>
      updateQuestionApi(id, payload),
    onSuccess: (_data: Question, variables: { id: string; payload: { title?: string; content?: string } }) => {
      // Invalidate questions list and the specific question
      queryClient.invalidateQueries({ queryKey: ['question', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['questions'] })
    }
  })

  async function updateQuestion(id: string, payload: { title?: string; content?: string }) {
    try {
      const data = await updateQuestionMutation.mutateAsync({ id, payload })
      return { success: true, data }
    } catch (error: any) {
      return {
        success: false,
        error: error.data?.message || 'Failed to update question'
      }
    }
  }

  return {
    voteQuestion,
    createQuestion,
    submitAnswer,
    updateQuestion,
    voteQuestionMutation,
    createQuestionMutation,
    submitAnswerMutation,
    updateQuestionMutation
  }
})