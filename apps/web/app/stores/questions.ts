import type { PaginateResponse, QueryQuestionByUserId, QueryQuestionParam, Question } from "~/types/question"

export const useQuestionStore = defineStore('questions', () => {
  const questions = ref<Question[]>([])
  const currentQuestion = ref<Question | null>(null)
  const loading = ref(false)
  const total = ref(0)
  const { baseURL } = useConfig()

  const { $fetchApi } = useApi()
  const auth = useAuthStore()

  function useQuestions(params: QueryQuestionParam | ComputedRef<QueryQuestionParam> = {}) {
    const queryKey = computed(() => {
      const resolvedParams = toValue(params)
      const normalizedParams = {
        page: resolvedParams.page || 1,
        limit: resolvedParams.limit || 10,
        sort: resolvedParams.sort || 'newest',
        ...resolvedParams
      }

      return `questions:${JSON.stringify(normalizedParams)}`
    })

    const { data, pending, refresh, error } = useFetch<PaginateResponse<Question>>(`${baseURL}/questions`, {
      key: queryKey,
      query: computed(() => toValue(params)),
      credentials: 'include',
      getCachedData(key) {
        const nuxtApp = useNuxtApp()
        return nuxtApp.payload.data[key]
      },
      onResponse({ response }) {
        questions.value = response._data?.items || []
        total.value = response._data?.total || 0
      }
    })

    watch(data, (newData) => {
      if (newData) {
        questions.value = newData.items
        total.value = newData.total
      }
    })

    loading.value = pending.value

    return {
      data: computed(() => data.value?.items || []),
      total: computed(() => data.value?.total || 0),
      pending,
      refresh,
      error
    }
  }

  function useUserQuestions(params: QueryQuestionByUserId | ComputedRef<QueryQuestionByUserId> = {}) {
    const queryKey = computed(() => {
      const resolvedParams = toValue(params)
      const normalizedParams = {
        page: resolvedParams.page || 1,
        limit: resolvedParams.limit || 10,
        includeAnswers: resolvedParams.includeAnswers || false,
        ...resolvedParams
      }

      return `questions:user:${JSON.stringify(normalizedParams)}`
    })

    const { data, pending, refresh, error } = useFetch<PaginateResponse<Question>>(`${baseURL}/questions/user`, {
      key: queryKey,
      query: computed(() => toValue(params)),
      credentials: 'include',
      getCachedData(key) {
        const nuxtApp = useNuxtApp()
        return nuxtApp.payload.data[key]
      },
      onResponse({ response }) {
        questions.value = response._data?.items || []
        total.value = response._data?.total || 0
      }
    })

    watch(data, (newData) => {
      if (newData) {
        questions.value = newData.items
        total.value = newData.total
      }
    })

    loading.value = pending.value

    return {
      data: computed(() => data.value?.items || []),
      total: computed(() => data.value?.total || 0),
      pending,
      refresh,
      error
    }
  }

  function useQuestion(id: string) {
    const { data, pending, refresh, error } = useFetch<Question>(`${baseURL}/questions/${id}`, {
      key: `question:${id}`,
      credentials: 'include',
      getCachedData(key) {
        const nuxtAuth = useNuxtApp()
        return nuxtAuth.payload.data[key]
      },
      onResponse({ response }) {
        currentQuestion.value = response._data || null
      }
    })

    watch(data, (newData) => {
      currentQuestion.value = newData || null
    })

    loading.value = pending.value

    return {
      data, pending, refresh, error
    }
  }

  async function createQuestion(payload: { title: string; content: string; tags: string[] }) {
    try {
      const data = await $fetchApi<Question>('/questions', {
        method: 'POST',
        body: payload
      })
      questions.value.unshift(data)
      return { success: true, data }
    } catch (error: any) {
      return {
        success: false,
        error: error.data?.message || 'Failed to post question'
      }
    }
  }

  async function voteQuestion(id: string, value: 1 | -1) {
    if (!auth.user) {
      return navigateTo('/login')
    }

    try {
      await $fetchApi(`/questions/${id}/vote`, {
        method: 'PATCH',
        body: { value }
      })

      await refreshNuxtData(`question:${id}`)

      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.data?.message || 'Voting failed'
      }
    }
  }

  async function submitAnswer(questionId: string, content: string) {
    try {
      await $fetchApi(`/answers/question/${questionId}`, {
        method: 'POST',
        body: { content }
      })

      await refreshNuxtData(`question:${questionId}`)

      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.data?.message || 'Failed to submit answer'
      }
    }
  }

  function refreshQuestions(params: any = {}) {
    const queryKey = `questions:${JSON.stringify(params)}`
    return refreshNuxtData(queryKey)
  }

  return {
    questions,
    currentQuestion,
    loading,
    total,
    useQuestions,
    useUserQuestions,
    useQuestion,
    createQuestion,
    voteQuestion,
    submitAnswer,
    refreshQuestions
  }
})