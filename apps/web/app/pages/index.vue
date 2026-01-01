<script setup lang="ts">
import { LucideInbox } from 'lucide-vue-next';
import QuestionCard from '~/components/QuestionCard.vue';
import { Button } from '~/components/ui/button';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationNext, PaginationPrevious } from '~/components/ui/pagination';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Skeleton } from '~/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs';


const questionStore = useQuestionStore()
const pageOptions = reactive({
  page: 1,
  limit: 10
})
const pageSizeOptions = [10, 20, 30, 40, 50]
const sortBy = ref<'newest' | 'recentlyAnswered' | 'unanswered' | 'popular'>('newest')

const queryParams = computed(() => ({
  page: pageOptions.page,
  limit: pageOptions.limit,
  sort: sortBy.value
}))

const { data: questionsData, total, pending: loading } = questionStore.useQuestions(queryParams)

watch([sortBy, () => pageOptions.limit], () => {
  pageOptions.page = 1
}, { immediate: false })
</script>

<template>
  <div class="space-y-8">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="space-y-1">
        <h1 class="text-3xl font-bold tracking-tight">Top Questions</h1>
        <p class="text-muted-foreground">Explore the latest technical challenges from the community.</p>
      </div>
      <Button size="lg">
        <NuxtLink to="/questions/new">Ask Question</NuxtLink>
      </Button>
    </div>
    <Tabs v-model="sortBy">
      <TabsList>
        <TabsTrigger value="newest">
          Newest
        </TabsTrigger>
        <TabsTrigger value="recentlyAnswered">
          Recently Answered
        </TabsTrigger>
        <TabsTrigger value="unanswered">
          Unanswered
        </TabsTrigger>
        <TabsTrigger value="popular">
          Popular
        </TabsTrigger>
      </TabsList>
    </Tabs>

    <div v-if="loading" class="space-y-4">
      <Skeleton v-for="i in 3" :key="i" class="h-40 w-full rounded-2xl" />
    </div>
    <div v-else class="grid gap-6">
      <QuestionCard v-for="q in questionsData" :key="q.id" :question="q" />

      <div v-if="questionsData.length === 0"
        class="text-center py-24 bg-muted/20 border-2 border-dashed rounded-3xl border-muted">
        <div class="max-w-[320px] mx-auto space-y-4">
          <div class="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto">
            <LucideInbox class="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 class="text-xl font-bold">
              No questions found
            </h3>
            <p class="text-muted-foreground leading-relaxed">It looks like there are no questions yet</p>
          </div>
          <Button as-child variant="outline" class="px-8">
            <NuxtLink to="/questions/new">Be the first to ask</NuxtLink>
          </Button>
        </div>
      </div>
    </div>

    <div v-if="questionsData.length > 0" class="pt-10 border-t">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-2 order-2 sm:order-1">
          <span class="text-sm text-muted-foreground">Show</span>
          <Select v-model="pageOptions.limit">
            <SelectTrigger class="w-[70px]">
              <SelectValue :placeholder="pageOptions.limit.toString()" />
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
          <Pagination v-slot="{ page }" :items-per-page="pageOptions.limit" :total="total"
            v-model:page="pageOptions.page">
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
  </div>
</template>
