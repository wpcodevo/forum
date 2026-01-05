<script setup lang="ts">
import { Loader2, LucideCalendar, LucideCheckCircle, LucideHelpCircle, LucideMessageSquare, LucideSettings, LucideStar } from 'lucide-vue-next';
import MarkdownRenderer from '~/components/MarkdownRenderer.vue';
import QuestionCard from '~/components/QuestionCard.vue';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Button } from '~/components/ui/button';
import { Card, CardHeader } from '~/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationNext, PaginationPrevious } from '~/components/ui/pagination';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Skeleton } from '~/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { Textarea } from '~/components/ui/textarea';
import { useAnswerApi } from '~/composables/useAnswerApi';
import { useQuestionApi } from '~/composables/useQuestionApi';
import { useToast } from '~/composables/useToast';
import { formatDate, formatTimeAgo } from '~/lib/utils';
import { useUserAnswersQuery } from '~/stores/answers';
import { useUserQuestionsQuery } from '~/stores/questions';
import type { QueryAnswerByUserId, QueryQuestionByUserId } from '~/types/question';

const auth = useAuthStore()
const { showPromise, showError } = useToast()

const isSettingsOpen = ref(false)
const updatingProfile = ref(false)
const profileForm = reactive({
  name: '',
  username: '',
  bio: ''
})

const isFormValid = computed(() => {
  return profileForm.name.trim().length >= 3 &&
    profileForm.username.trim().length >= 3 &&
    (!profileForm.bio || profileForm.bio.length <= 500)
})


watch(isSettingsOpen, (isOpen) => {
  if (isOpen && auth.user) {
    profileForm.name = auth.user.name || ''
    profileForm.username = auth.user.username || ''
    profileForm.bio = auth.user.bio || ''
  }
})

const handleUpdateProfile = async () => {
  if (!isFormValid.value) {
    showError('Please fill in all required fields correctly')
    return
  }

  updatingProfile.value = true

  const updatePromise = auth.updateProfile({
    name: profileForm.name.trim(),
    username: profileForm.username.trim(),
    bio: profileForm.bio.trim() || undefined
  }).then((result) => {
    if (result.success) {
      return result
    } else {
      throw new Error(result.error || 'Failed to update profile')
    }
  })

  showPromise(updatePromise, {
    loading: 'Updating your profile...',
    success: () => {
      updatingProfile.value = false
      isSettingsOpen.value = false
      return 'Your profile has been updated successfully!'
    },
    error: (error: Error) => {
      updatingProfile.value = false
      return error.message || 'Failed to update profile. Please try again.'
    },
  })
}
const pageSizeOptions = [10, 20, 30, 40, 50]
const questionPageOptions = reactive({
  page: 1,
  limit: 10,
})
const answerPageOptions = reactive({
  page: 1,
  limit: 10,
})

const questionParams = computed<QueryQuestionByUserId>(() => ({
  page: questionPageOptions.page,
  limit: questionPageOptions.limit
}))

const answerParams = computed<QueryAnswerByUserId>(() => ({
  page: answerPageOptions.page,
  limit: answerPageOptions.limit
}))

const { data: questionsData, isLoading: questionsLoading } = useUserQuestionsQuery(questionParams)
const { data: answersData, isLoading: answersLoading } = useUserAnswersQuery(answerParams)

const questions = computed(() => questionsData.value?.items || [])
const answers = computed(() => answersData.value?.items || [])
const questionsTotal = computed(() => questionsData.value?.total || 0)
const answersTotal = computed(() => answersData.value?.total || 0)

onServerPrefetch(async () => {
  const queryClient = useQueryClient()
  const { fetchUserQuestions } = useQuestionApi()
  const { fetchUserAnswers } = useAnswerApi()

  const resolvedQuestionParams = toValue(questionParams)
  const normalizedQuestionParams: QueryQuestionByUserId = {
    ...resolvedQuestionParams,
    page: resolvedQuestionParams.page || 1,
    limit: resolvedQuestionParams.limit || 10,
    includeAnswers: resolvedQuestionParams.includeAnswers ?? false
  }

  const resolvedAnswerParams = toValue(answerParams)
  const normalizedAnswerParams: QueryAnswerByUserId = {
    ...resolvedAnswerParams,
    page: resolvedAnswerParams.page || 1,
    limit: resolvedAnswerParams.limit || 10
  }

  await Promise.all([
    queryClient.ensureQueryData({
      queryKey: ['questions', 'user', normalizedQuestionParams],
      queryFn: () => fetchUserQuestions(normalizedQuestionParams)
    }),
    queryClient.ensureQueryData({
      queryKey: ['answers', 'user', normalizedAnswerParams],
      queryFn: () => fetchUserAnswers(normalizedAnswerParams)
    })
  ])
})
</script>

<template>
  <div v-if="auth.user" class="max-w-5xl mx-auto space-y-12">
    <div class="flex flex-col md:flex-row gap-10 items-start">
      <div class="flex flex-col items-center gap-6">
        <div class="relative group">
          <Avatar class="h-40 w-40 border-8 border-background shadow-2xl ring-1">
            <AvatarImage :src="auth.user.avatar ?? ''" :alt="auth.user.name" />
            <AvatarFallback class="text-5xl font-bold bg-primary text-primary-foreground">
              {{ auth.user.name[0] }}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div class="flex-1 space-y-6">
        <div class="flex flex-wrap items-center justify-between gap-6">
          <div class="space-y-1">
            <h1 class="text-4xl font-extrabold tracking-tight">
              {{ auth.user.name }}
            </h1>
            <p class="text-lg text-muted-foreground">
              @{{ auth.user.username }}
            </p>
          </div>

          <Dialog v-model:open="isSettingsOpen">
            <DialogTrigger as-child>
              <Button variant="outline" class="gap-2 h-11 px-6 font-semibold">
                <LucideSettings class="h-4 w-4" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent class="sm:max-w-[500px] rounded-3xl">
              <DialogHeader>
                <DialogTitle>Profile Settings</DialogTitle>
                <DialogDescription>Update your personal information</DialogDescription>
              </DialogHeader>

              <form @submit.prevent="handleUpdateProfile">
                <div class="grid gap-6 py-6">
                  <div class="space-y-2">
                    <Label for="name" class="font-bold">Name</Label>
                    <Input id="name" v-model="profileForm.name" class="h-12" placeholder="John Doe" required
                      minlength="3" maxlength="50" />
                  </div>
                  <div class="space-y-2">
                    <Label for="username" class="font-bold">Username</Label>
                    <Input id="username" v-model="profileForm.username" class="h-12" placeholder="johndoe" required
                      minlength="3" maxlength="30" />
                  </div>
                  <div class="space-y-2">
                    <Label for="bio" class="font-bold">Bio</Label>
                    <Textarea id="bio" v-model="profileForm.bio" class="min-h-[120px]"
                      placeholder="Describe your technical expertise, areas of interest, and experience. What kind of questions can you help with?"
                      maxlength="500" />
                    <p class="text-xs text-muted-foreground">{{ (profileForm.bio || '').length }} / 500</p>
                  </div>
                  <div class="space-y-2">
                    <Label for="avatar" class="font-bold">Upload Avatar</Label>
                    <Input id="avatar" type="file" accept="image/*" disabled class="opacity-50" />
                    <p class="text-xs text-muted-foreground">Avatar upload coming soon</p>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" @click="isSettingsOpen = false" :disabled="updatingProfile">
                    Cancel
                  </Button>
                  <Button type="submit" size="lg" class="w-full sm:w-auto px-8"
                    :disabled="updatingProfile || !isFormValid">
                    <Loader2 v-if="updatingProfile" class="mr-2 h-4 w-4 animate-spin" />
                    {{ updatingProfile ? 'Saving...' : 'Save Changes' }}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div class="flex gap-4 text-sm">
          <div
            class="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20 font-bold">
            <LucideStar class="h-5 w-5 fill-yellow-500" />
            <span>{{ auth.user.reputation }} rep</span>
          </div>
          <div class="flex items-center gap-1">
            <LucideMessageSquare class="h-5 w-5 text-blue-500" />
            <span class="font-bold">{{ 0 }}</span>
            <span class="text-muted-foreground">questions</span>
          </div>
          <div class="flex items-center gap-1">
            <LucideCheckCircle class="w-5 h-5 text-green-500" />
            <span class="font-bold">{{ 0 }}</span>
            <span class="text-muted-foreground">answers</span>
          </div>
        </div>

        <p class="text-sm leading-relaxed max-w-2xl">
          {{ auth.user.bio || 'No bio provided yet. Add a bio to tell the community about yourself!' }}
        </p>

        <div class="flex items-center gap-4 text-sm text-muted-foreground">
          <div class="flex items-center gap-1">
            <LucideCalendar class="h-4 w-4" />
            <span>Joined {{ formatDate(auth.user.createdAt) }}</span>
          </div>
        </div>
      </div>
    </div>

    <Tabs default-value="questions" class="w-full">
      <TabsList class="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 gap-8">
        <TabsTrigger value="questions"
          class="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 font-bold text-base transition-all">
          Questions
        </TabsTrigger>
        <TabsTrigger value="answers"
          class="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 font-bold text-base transition-all">
          Answers
        </TabsTrigger>
      </TabsList>

      <TabsContent value="questions" class="py-10">
        <template v-if="questionsLoading">
          <div class="space-y-6">
            <Skeleton v-for="i in 3" :key="i" class="h-40 w-full rounded-2xl" />
          </div>
        </template>
        <template v-else>
          <div class="grid gap-6">
            <QuestionCard v-for="q in questions" :key="q.id" :question="q" />
          </div>

          <template v-if="questions.length === 0">
            <div class="text-center py-24 border-2 border-dashed rounded-3xl border-muted bg-muted/10">
              <div class="max-w-[320px] mx-auto space-y-6">
                <div class="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto shadow-inner">
                  <LucideHelpCircle class="h-10 w-10 text-muted-foreground" />
                </div>
                <div class="space-y-2">
                  <h3 class="text-xl font-bold">
                    No questions yet
                  </h3>
                  <p class="text-muted-foreground leading-relaxed">Your curiosity hasn't turned into a public question
                    yet. Start exploring!</p>
                </div>
                <Button as-child variant="secondary" size="lg" class="px-8 shadow-sm">
                  <NuxtLink to="questions/new">Ask your first question</NuxtLink>
                </Button>
              </div>
            </div>
          </template>

          <div v-if="questions.length > 0" class="pt-10 border-t mt-10">
            <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div class="flex items-center gap-2 order-2 sm:order-1">
                <span class="text-sm text-muted-foreground">Show</span>
                <Select v-model="questionPageOptions.limit">
                  <SelectTrigger class="w-[70px]">
                    <SelectValue :placeholder="questionPageOptions.limit.toString()" />
                  </SelectTrigger>
                  <SelectContent class="min-w-[70px]">
                    <SelectGroup>
                      <SelectItem v-for="size in pageSizeOptions" :key="size" :value="size">
                        {{ size }}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <span class="text-sm text-muted-foreground">per page</span>
              </div>

              <div class="order-1 sm:order-2">
                <Pagination v-slot="{ page }" :items-per-page="questionPageOptions.limit" :total="questionsTotal"
                  v-model:page="questionPageOptions.page">
                  <PaginationContent v-slot="{ items }">
                    <PaginationPrevious />

                    <template v-for="(item, index) in items" :key="index">
                      <PaginationItem v-if="item.type === 'page'" :value="item.value" :is-active="item.value === page">
                        {{ item.value }}
                      </PaginationItem>
                    </template>

                    <PaginationEllipsis :index="4" />

                    <PaginationNext />
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          </div>
        </template>
      </TabsContent>

      <TabsContent value="answers" class="py-10">
        <template v-if="answersLoading">
          <div class="space-y-6">
            <Skeleton v-for="i in 3" :key="i" class="h-40 w-full rounded-2xl" />
          </div>
        </template>
        <template v-else>
          <div class="space-y-6">
            <Card v-for="answer in answers" :key="answer.id" :class="{
              'border-primary': answer.isAccepted
            }">
              <CardHeader class="space-y-4">
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1 space-y-3">
                    <div>
                      <NuxtLink :to="`/questions/${answer.question?.id}`"
                        class="text-lg font-semibold hover:text-primary transition-colors">
                        {{ answer.question?.title || 'Question' }}
                      </NuxtLink>
                    </div>
                    <div class="prose prose-sm max-w-none">
                      <MarkdownRenderer :content="answer.content" />
                    </div>
                  </div>
                  <div class="flex flex-col items-center gap-1 shrink-0">
                    <div class="text-xs text-muted-foreground">Votes</div>
                    <div class="text-lg font-bold">{{ answer.votes }}</div>
                    <LucideCheckCircle v-if="answer.isAccepted" class="h-5 w-5 text-primary mt-1" />
                  </div>
                </div>
                <div class="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
                  <span>{{ formatTimeAgo(answer.createdAt) }}</span>
                  <NuxtLink :to="`/questions/${answer.question?.id}`" class="text-primary hover:underline">
                    View question →
                  </NuxtLink>
                </div>
              </CardHeader>
            </Card>
          </div>

          <template v-if="answers.length === 0">
            <div class="text-center py-24 border-2 border-dashed rounded-3xl border-muted bg-muted/10">
              <div class="max-w-[320px] mx-auto space-y-6">
                <div class="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto shadow-inner">
                  <LucideMessageSquare class="h-10 w-10 text-muted-foreground" />
                </div>
                <div class="space-y-2">
                  <h3 class="text-xl font-bold">
                    No answers yet
                  </h3>
                  <p class="text-muted-foreground leading-relaxed">You haven't answered any questions yet. Start helping
                    the community!</p>
                </div>
                <Button as-child variant="secondary" size="lg" class="px-8 shadow-sm">
                  <NuxtLink to="/">Browse Questions</NuxtLink>
                </Button>
              </div>
            </div>
          </template>

          <div v-if="answers.length > 0" class="pt-10 border-t mt-10">
            <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div class="flex items-center gap-2 order-2 sm:order-1">
                <span class="text-sm text-muted-foreground">Show</span>
                <Select v-model="answerPageOptions.limit">
                  <SelectTrigger class="w-[70px]">
                    <SelectValue :placeholder="answerPageOptions.limit.toString()" />
                  </SelectTrigger>
                  <SelectContent class="min-w-[70px]">
                    <SelectGroup>
                      <SelectItem v-for="size in pageSizeOptions" :key="size" :value="size">
                        {{ size }}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <span class="text-sm text-muted-foreground">per page</span>
              </div>

              <div class="order-1 sm:order-2">
                <Pagination v-slot="{ page }" :items-per-page="answerPageOptions.limit" :total="answersTotal"
                  v-model:page="answerPageOptions.page">
                  <PaginationContent v-slot="{ items }">
                    <PaginationPrevious />

                    <template v-for="(item, index) in items" :key="index">
                      <PaginationItem v-if="item.type === 'page'" :value="item.value" :is-active="item.value === page">
                        {{ item.value }}
                      </PaginationItem>
                    </template>

                    <PaginationEllipsis :index="4" />

                    <PaginationNext />
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          </div>
        </template>
      </TabsContent>
    </Tabs>
  </div>
  <div v-else class="text-center py-20">
    <p>Please log in to view your profile</p>
    <Button as-child variant="link">
      <NuxtLink to="/login">Go to Login</NuxtLink>
    </Button>
  </div>
</template>