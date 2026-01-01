<script setup lang="ts">
import { LucideSettings } from 'lucide-vue-next';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Button } from '~/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Skeleton } from '~/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { Textarea } from '~/components/ui/textarea';
import { formatDate } from '~/lib/utils';

const auth = useAuthStore()
const questionStore = useQuestionStore()
const pageSizeOptions = [10, 20, 30, 40, 50]
const pageOptions = reactive({
  page: 1,
  limit: 10,
})

const params = computed(() => ({
  page: pageOptions.page,
  limit: pageOptions.limit
}))

const { pending: loading, data: questions } = questionStore.useUserQuestions(params)
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

          <Dialog>
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

              <div class="grid gap-6 py-6">
                <div class="space-y-2">
                  <Label for="name" class="font-bold">Name</Label>
                  <Input id="name" class="h-12" placeholder="John Doe" />
                </div>
                <div class="space-y-2">
                  <Label for="username" class="font-bold">Username</Label>
                  <Input id="username" class="h-12" placeholder="johndoe" />
                </div>
                <div class="space-y-2">
                  <Label for="bio" class="font-bold">Bio</Label>
                  <Textarea id="bio" class="h-12"
                    placeholder="Describe your technical expertise, areas of interest, and experience. What kind of questions can you help with?" />
                </div>
                <div class="space-y-2">
                  <Label for="avatar" class="font-bold">Upload Avatar</Label>
                  <Input id="avatar" type="file" />
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" size="lg" class="w-full sm:w-auto px-8">
                  Save
                </Button>
              </DialogFooter>
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
        <template v-if="loading">
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
        </template>
      </TabsContent>

      <TabsContent value="answers" class="py-10">
        <div class="text-center py-24 bg-muted/10 rounded-3xl border-2 border-dashed border-muted">
          <p class="text-xl font-medium text-muted-foreground">
            Detailed activity tracking coming soon!
          </p>
        </div>
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