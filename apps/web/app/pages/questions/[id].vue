<script setup lang="ts">
import { CheckCircle, Edit, FileQuestion, Loader2, X } from 'lucide-vue-next'
import MarkdownRenderer from '~/components/MarkdownRenderer.vue'
import SimpleMarkdownEditor from '~/components/SimpleMarkdownEditor.vue'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Separator } from '~/components/ui/separator'
import { Skeleton } from '~/components/ui/skeleton'
import { useToast } from '~/composables/useToast'
import { formatTimeAgo } from '~/lib/utils'

const route = useRoute()
const id = route.params.id as string
const questionStore = useQuestionStore()
const auth = useAuthStore()
const { showPromise, showError } = useToast()
const queryClient = useQueryClient()

const submitting = ref(false)
const answerForm = reactive({ content: '' })
const isEditing = ref(false)
const editForm = reactive({
  title: '',
  content: '',
})
const updatingQuestion = ref(false)

const { data: question, isLoading, error } = useQuestionQuery(id)

const isNotFound = computed(() => {
  if (!error.value) return false
  const err = error.value as any
  return err?.statusCode === 404 || err?.status === 404 || err?.data?.statusCode === 404
})

useHead({
  title: () => question.value?.title || 'Question',
  meta: [
    { name: 'description', content: () => question.value?.content.substring(0, 60) || "View this question on DevFlow" },
    {
      property: "og:title",
      content: () => question.value?.title || "Question"
    },
    {
      property: "og:description",
      content: () => question.value?.content.substring(0, 160) || "View this question on DevFlow"
    }
  ]
})

async function submitAnswer() {
  if (!answerForm.content.trim()) {
    showError('Please enter an answer')
    return
  }

  submitting.value = true

  try {
    const result = await questionStore.submitAnswer(id, answerForm.content)

    if (result.success) {
      answerForm.content = ''
      await queryClient.invalidateQueries({ queryKey: ['question', id] })

      const { showSuccess } = useToast()
      showSuccess('Your answer has been posted successfully!')
    } else {
      showError(result.error || 'Failed to submit answer')
    }
  } catch (error: any) {
    showError(error.message || 'Failed to submit answer')
  } finally {
    submitting.value = false
  }
}

const userVote = computed(() => question.value?.userVote ?? null)
const isUpvoted = computed(() => userVote.value === 1)
const isDownvoted = computed(() => userVote.value === -1)

// Check if current user is the author of the question
const isAuthor = computed(() => {
  return auth.isAuthenticated && question.value && auth.user?.id === question.value.author?.id
})

const handleVote = async (value: 1 | -1) => {
  if (!auth.isAuthenticated) {
    showError('Please log in to vote')
    return
  }

  const result = await questionStore.voteQuestion(id, value)

  if (result.success) {
    await queryClient.invalidateQueries({ queryKey: ['questions'] })
    await queryClient.invalidateQueries({ queryKey: ['question', id] })
  }
}

const startEditing = () => {
  if (!question.value) return
  editForm.title = question.value.title
  editForm.content = question.value.content
  isEditing.value = true
}

const cancelEditing = () => {
  isEditing.value = false
  editForm.title = ''
  editForm.content = ''
}

const saveQuestion = async () => {
  if (!editForm.title.trim() || !editForm.content.trim()) {
    showError('Please fill in all required fields')
    return
  }

  updatingQuestion.value = true

  const questionPromise = questionStore.updateQuestion(id, {
    title: editForm.title,
    content: editForm.content
  }).then((result) => {
    if (result.success && result.data) {
      return result.data
    } else {
      throw new Error(result.error || 'Failed to update your question')
    }
  })

  showPromise(questionPromise, {
    loading: 'Updating your question...',
    success: () => {
      updatingQuestion.value = false
      isEditing.value = false
      queryClient.invalidateQueries({ queryKey: ['question', id] })
      return 'Your question has been updated successfully!'
    },
    error: (error: Error) => {
      updatingQuestion.value = false
      return error.message || 'Failed to update your question. Please try again.'
    },
  })
}


onServerPrefetch(async () => {
  const { fetchQuestion } = useQuestionApi()
  const queryClient = useQueryClient()

  try {
    await queryClient.ensureQueryData({
      queryKey: ['question', id],
      queryFn: () => fetchQuestion(id)
    })
  } catch (err: any) {
    if (err?.statusCode === 404 || err?.status === 404) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Question not found',
        message: 'The question you are looking for does not exist or has been removed.'
      })
    }
    throw err
  }
})
</script>

<template>
  <div v-if="question" class="grid grid-cols-1 lg:grid-cols-4 gap-8">
    <div class="lg:col-span-3 space-y-8">
      <section class="space-y-4">
        <div class="flex items-start gap-4">
          <div class="flex flex-col items-center gap-1">
            <Button variant="ghost" size="icon" @click="handleVote(1)" :disabled="isUpvoted" :class="[
              'h-6 w-6 p-0 transition-colors',
              isUpvoted
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'hover:bg-green-50 hover:text-green-600'
            ]">
              <LucideChevronUp class="h-6 w-6" />
            </Button>
            <span class="text-xl font-bold">{{ question.votes }}</span>
            <Button variant="ghost" size="icon" @click="handleVote(-1)" :class="[
              'h-6 w-6 p-0 transition-colors',
              isDownvoted
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'hover:bg-red-50 hover:text-red-600'
            ]">
              <LucideChevronDown class="h-6 w-6" />
            </Button>
          </div>

          <div class="flex-1 space-y-2">
            <!-- View Mode -->
            <template v-if="!isEditing">
              <div class="flex items-start justify-between gap-4">
                <h1 class="text-3xl font-bold flex-1">{{ question.title }}</h1>
                <Button v-if="isAuthor && !isEditing" variant="outline" size="sm" @click="startEditing">
                  <Edit class="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
              <div class="flex flex-wrap gap-2 py-2">
                <Badge v-for="tag in question.tags" :key="tag" variant="outline">
                  {{ tag }}
                </Badge>
              </div>
              <MarkdownRenderer :content="question.content" />
            </template>

            <!-- Edit Mode -->
            <template v-else>
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <Label class="text-base font-semibold">Edit Question</Label>
                  <Button variant="ghost" size="sm" @click="cancelEditing" :disabled="updatingQuestion">
                    <X class="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
                <div class="space-y-3">
                  <div>
                    <Label for="edit-title">Title</Label>
                    <Input id="edit-title" v-model="editForm.title" class="h-10 mt-1" />
                  </div>
                  <div>
                    <Label for="edit-content">Body</Label>
                    <SimpleMarkdownEditor id="edit-content" v-model="editForm.content" :rows="15" class="mt-1" />
                  </div>
                  <div>
                    <Label>Tags</Label>
                    <div class="flex flex-wrap gap-2 mt-2">
                      <Badge v-for="tag in question.tags" :key="tag" variant="secondary">
                        {{ tag }}
                      </Badge>
                    </div>
                    <p class="text-xs text-muted-foreground mt-1">
                      Tags cannot be edited.
                    </p>
                  </div>
                  <div class="flex justify-end gap-2 pt-2">
                    <Button variant="outline" @click="cancelEditing" :disabled="updatingQuestion">
                      Cancel
                    </Button>
                    <Button @click="saveQuestion"
                      :disabled="updatingQuestion || !editForm.title.trim() || !editForm.content.trim()">
                      <Loader2 v-if="updatingQuestion" class="mr-2 h-4 w-4 animate-spin" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </section>

      <Separator />

      <!-- Answer Form -->
      <section v-if="auth.isAuthenticated" class="space-y-4">
        <h2 class="text-xl font-semibold">Your Answer</h2>
        <Card>
          <CardContent class="pt-6">
            <div class="space-y-4">
              <SimpleMarkdownEditor v-model="answerForm.content"
                placeholder="Write your answer here... You can use **bold**, *italic*, `code`, and code blocks"
                :rows="12" />
              <div class="flex justify-end">
                <Button @click="submitAnswer" :disabled="submitting || !answerForm.content.trim()" size="lg">
                  <Loader2 v-if="submitting" class="mr-2 h-4 w-4 animate-spin" />
                  Post Answer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator />

      <section class="space-y-6">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold">{{ question.answers.length }} Answers</h2>
          <div class="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Sort by:</span>
            <Select default-value="votes">
              <SelectTrigger class="w-[120px]">
                <SelectValue placeholder="votes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="votes">Votes</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="space-y-6">
          <Card v-for="answer in question.answers" :key="answer.id" :class="{
            'border-primary': answer.isAccepted
          }">
            <CardHeader class="flex flex-row items-start gap-4 space-y-0">
              <div class="flex flex-col items-center gap-1">
                <Button variant="ghost" size="icon">
                  <LucideChevronUp class="h-5 w-5" />
                </Button>
                <span class="text-sm font-bold">
                  {{ answer.votes }}
                </span>
                <Button variant="ghost" size="icon">
                  <LucideChevronDown class="h-5 w-5" />
                </Button>
                <CheckCircle v-if="answer.isAccepted" class="h-6 w-6 text-primary mt-2" />
              </div>
              <div class="flex-1 space-y-2">
                <MarkdownRenderer :content="answer.content" />
                <div class="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                  <span>By {{ answer.author?.name || 'Anonymous' }}</span>
                  <span>•</span>
                  <span>{{ formatTimeAgo(answer.createdAt) }}</span>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </section>

    </div>
  </div>
  <div v-else-if="isLoading" class="space-y-8 py-10">
    <Skeleton class="h-12 w-2/3" />
    <Skeleton class="h-64 w-full" />
  </div>
  <div v-else-if="isNotFound" class="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center">
    <FileQuestion class="h-16 w-16 text-muted-foreground" />
    <h1 class="text-3xl font-bold">Question Not Found</h1>
    <p class="text-muted-foreground max-w-md">
      The question you are looking for does not exist or has been removed.
    </p>
    <div class="flex gap-4 mt-4">
      <Button as-child variant="outline">
        <NuxtLink to="/">Browse Questions</NuxtLink>
      </Button>
      <Button as-child>
        <NuxtLink to="/questions/new">Ask a Question</NuxtLink>
      </Button>
    </div>
  </div>
</template>