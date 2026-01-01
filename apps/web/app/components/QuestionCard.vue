<script setup lang="ts">
import type { Question } from '~/types/question';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { LucideChevronUp, LucideChevronDown, LucideMessageSquare, LucideEye } from 'lucide-vue-next';

const props = defineProps<{ question: Question }>()

const formattedDate = computed(() => {
  if (!props.question.createdAt) return ''

  const date = new Date(props.question.createdAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `${diffMins} mins ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hours ago`;
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
})
</script>

<template>
  <Card
    class="hover:border-primary/50 transition-all duration-300 hover:shadow-md rounded-lg overflow-hidden border border-gray-200 bg-white">
    <CardHeader class="flex flex-row items-start gap-4 space-x-0 p-4 pb-3">
      <div class="flex flex-col items-center gap-1.5 text-muted-foreground w-12 shrink-0">
        <div class="text-xs text-gray-500 font-medium">Votes</div>
        <div class="text-lg font-bold text-gray-800">{{ question.votes }}</div>
        <div class="flex gap-1 mt-1">
          <Button variant="ghost" size="icon" class="h-6 w-6 hover:bg-green-50 hover:text-green-600 p-0">
            <LucideChevronUp class="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" class="h-6 w-6 hover:bg-red-50 hover:text-red-600 p-0">
            <LucideChevronDown class="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div class="flex-1 space-y-2.5 min-w-0">
        <CardTitle class="text-lg font-semibold leading-tight text-gray-900 mb-1">
          <NuxtLink :to="`/questions/${question.id}`" class="hover:text-blue-600 transition-colors text-[#1a0dab]">
            {{ question.title }}
          </NuxtLink>
        </CardTitle>

        <CardDescription class="line-clamp-2 text-sm leading-relaxed text-gray-600 mb-3">
          {{ question.content }}
        </CardDescription>

        <div class="flex flex-wrap gap-1.5">
          <Badge v-for="tag in question.tags" :key="tag"
            class="font-medium text-xs px-2 py-0.5 rounded-sm bg-blue-50 text-blue-700 hover:bg-blue-100 border-0">
            {{ tag }}
          </Badge>
        </div>

        <div class="flex items-center justify-between pt-2">
          <div class="flex items-center gap-1.5 text-xs text-gray-500">
            <div class="flex items-center gap-1">
              <Avatar class="h-5 w-5 border border-gray-200">
                <AvatarImage :src="question.author.avatar || ''" :alt="question.author.name" />
                <AvatarFallback class="text-[9px] bg-gray-100">
                  {{ question.author.name?.charAt(0) || '?' }}
                </AvatarFallback>
              </Avatar>
              <span class="font-medium text-gray-700 hover:text-blue-600 cursor-pointer">
                {{ question.author.name || 'Anonymous' }}
              </span>
              <span class="text-gray-400">•</span>
              <span class="text-gray-500">{{ formattedDate }}</span>
            </div>
          </div>

          <div class="flex items-center gap-4 text-xs text-gray-500">
            <div class="flex items-center gap-1">
              <LucideMessageSquare class="h-3.5 w-3.5" />
              <span class="font-medium">{{ question.answerCount || 0 }} answers</span>
            </div>
            <div class="flex items-center gap-1">
              <LucideEye class="h-3.5 w-3.5" />
              <span class="font-medium">{{ question.views || 0 }} views</span>
            </div>
          </div>
        </div>
      </div>
    </CardHeader>
  </Card>
</template>