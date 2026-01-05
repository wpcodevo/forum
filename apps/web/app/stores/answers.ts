import type { QueryAnswerByUserId, Answer, PaginateResponse } from "~/types/question"
import { useAnswerApi } from "~/composables/useAnswerApi"


export const useUserAnswersQuery = (params: QueryAnswerByUserId | ComputedRef<QueryAnswerByUserId> = {}) => {
  const { fetchUserAnswers } = useAnswerApi()

  const normalizedParams = computed(() => {
    const resolved = toValue(params)
    return {
      page: resolved.page || 1,
      limit: resolved.limit || 10,
      ...resolved
    }
  })

  return useQuery({
    queryKey: ['answers', 'user', normalizedParams],
    queryFn: (): Promise<PaginateResponse<Answer>> => fetchUserAnswers(normalizedParams.value),
    select: (data: PaginateResponse<Answer>) => ({
      items: data.items,
      total: data.total,
      page: data.page,
      limit: data.limit,
      totalPages: data.totalPages
    })
  })
}

export const useAnswerStore = defineStore('answers', () => {
  const { submitAnswer: submitAnswerApi, updateAnswer: updateAnswerApi, voteAnswer: voteAnswerApi, acceptAnswer: acceptAnswerApi } = useAnswerApi()
  const queryClient = useQueryClient()
  const auth = useAuthStore()

  const submitAnswerMutation = useMutation({
    mutationFn: ({ questionId, content }: { questionId: string; content: string }): Promise<void> =>
      submitAnswerApi(questionId, content),
    onSuccess: (_data: void, variables: { questionId: string; content: string }) => {
      // Invalidate the question to show the new answer
      queryClient.invalidateQueries({ queryKey: ['question', variables.questionId] })
    }
  })

  const voteAnswerMutation = useMutation({
    mutationFn: ({ answerId, questionId, value }: { answerId: string; questionId: string; value: 1 | -1 }): Promise<Answer> => {
      return voteAnswerApi(answerId, value)
    },
    onSuccess: (_data: Answer, variables: { answerId: string; questionId: string; value: 1 | -1 }) => {
      // Invalidate the question to show updated vote counts
      queryClient.invalidateQueries({ queryKey: ['question', variables.questionId] })
    }
  })

  const updateAnswerMutation = useMutation({
    mutationFn: ({ answerId, questionId, content }: { answerId: string; questionId: string; content: string }): Promise<Answer> =>
      updateAnswerApi(answerId, content),
    onSuccess: (_data: Answer, variables: { answerId: string; questionId: string; content: string }) => {
      // Invalidate the question to show updated answer content
      queryClient.invalidateQueries({ queryKey: ['question', variables.questionId] })
    }
  })

  const acceptAnswerMutation = useMutation({
    mutationFn: ({ answerId, questionId }: { answerId: string; questionId: string }): Promise<Answer> =>
      acceptAnswerApi(answerId),
    onSuccess: (_data: Answer, variables: { answerId: string; questionId: string }) => {
      // Invalidate the question to show updated accepted status
      queryClient.invalidateQueries({ queryKey: ['question', variables.questionId] })
    }
  })

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

  async function voteAnswer(answerId: string, questionId: string, value: 1 | -1) {
    if (!auth.isAuthenticated) {
      return {
        success: false,
        error: 'You must be logged in to vote'
      }
    }

    try {
      await voteAnswerMutation.mutateAsync({ answerId, questionId, value })
      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to vote'
      }
    }
  }

  async function updateAnswer(answerId: string, questionId: string, content: string) {
    if (!auth.isAuthenticated) {
      return {
        success: false,
        error: 'You must be logged in to update answers'
      }
    }

    try {
      await updateAnswerMutation.mutateAsync({ answerId, questionId, content })
      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to update answer'
      }
    }
  }

  async function acceptAnswer(answerId: string, questionId: string) {
    if (!auth.isAuthenticated) {
      return {
        success: false,
        error: 'You must be logged in to accept answers'
      }
    }

    try {
      await acceptAnswerMutation.mutateAsync({ answerId, questionId })
      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to accept answer'
      }
    }
  }

  return {
    submitAnswer,
    voteAnswer,
    updateAnswer,
    acceptAnswer,
    submitAnswerMutation,
    voteAnswerMutation,
    updateAnswerMutation,
    acceptAnswerMutation
  }
})

