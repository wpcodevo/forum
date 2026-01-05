import type { QueryQuestionByUserId, QueryQuestionParam, Question, PaginateResponse } from "~/types/question"
import { useQuestionApi } from "~/composables/useQuestionApi"


export const useQuestionsQuery = (params: QueryQuestionParam | ComputedRef<QueryQuestionParam> = {}) => {
  const { fetchQuestions } = useQuestionApi()

  const normalizedParams = computed(() => {
    const resolved = toValue(params)
    return {
      page: resolved.page || 1,
      limit: resolved.limit || 10,
      sort: resolved.sort || 'newest',
      ...resolved
    }
  })

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

  const normalizedParams = computed(() => {
    const resolved = toValue(params)
    return {
      page: resolved.page || 1,
      limit: resolved.limit || 10,
      includeAnswers: resolved.includeAnswers || false,
      ...resolved
    }
  })

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
    enabled: computed(() => !!questionId.value),
    staleTime: 1000 * 60 * 5, // 5 minutes - data is fresh for 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes - keep in cache for 10 minutes (formerly cacheTime)
  })
}


export const useQuestionStore = defineStore('questions', () => {
  const { voteQuestion: voteQuestionApi, createQuestion: createQuestionApi, updateQuestion: updateQuestionApi } = useQuestionApi()
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
    updateQuestion,
    voteQuestionMutation,
    createQuestionMutation,
    updateQuestionMutation
  }
})