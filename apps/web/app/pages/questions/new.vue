<script setup lang="ts">
import { Lightbulb, Loader2, X } from 'lucide-vue-next';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '~/components/ui/accordion';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import SimpleMarkdownEditor from '~/components/SimpleMarkdownEditor.vue';
import type { Question } from '~/types/question';

const questionStore = useQuestionStore()
const { showPromise, showError } = useToast()
const tagInput = ref('')
const submitting = ref(false)
const form = reactive({
  title: '',
  content: '',
  tags: [] as string[]
})

async function handleSubmit() {
  submitting.value = true

  const questionPromise = questionStore.createQuestion(form).then((result) => {
    if (result.success && result.data) {
      return result.data
    } else {
      throw new Error(result.error || 'Failed to post your question')
    }
  })

  showPromise(questionPromise, {
    loading: 'Posting your question...',
    success: (data: Question) => {
      submitting.value = false
      navigateTo(`/questions/${data.id}`)
      return 'Your question has been posted successfully!'
    },
    error: (error: Error) => {
      submitting.value = false
      return error.message || 'Failed to post your question. Please try again.'
    },
  })
}

function removeTag(tag: string) {
  form.tags = form.tags.filter(t => t !== tag)
}

function addTag() {
  const tag = tagInput.value.trim().toLowerCase()
  if (!tag) return
  if (form.tags.includes(tag)) return
  if (form.tags.length >= 5) return
  form.tags.push(tag)
  tagInput.value = ''
}

useHead({
  title: 'Ask a Question - DevFlow',
  meta: [
    { name: 'description', content: 'Ask your technical question and get answers from the developer community' },
    { name: 'robots', content: 'noindex' }
  ]
})
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-8">
    <div class="space-y-1">
      <h1 class="text-3xl font-bold tracking-tight">
        Ask a public question
      </h1>
      <p class="text-muted-foreground">
        Be specific and imagine you're asking a question to another person
      </p>
    </div>

    <Accordion type="single" collapsible class="bg-primary/5 rounded-xl border border-primary/10 overflow-hidden">
      <AccordionItem value="tips" class="border-none">
        <AccordionTrigger class="px-6 py-4 hover:no-underline">
          <div class="flex items-center gap-2 font-semibold text-primary">
            <Lightbulb class="w-5 h-5" />
            <span>Writing a good post</span>
          </div>
        </AccordionTrigger>
        <AccordionContent class="px-6 pb-6 pt-0 space-y-3 text-sm leading-relaxed">
          <p class="font-medium">Steps for a great question:</p>
          <ul class="list-disc pl-5 space-y-2 text-muted-foreground">
            <li>Summarize your problem clearly</li>
            <li>Describe your problem in detail</li>
            <li>Use code blocks for code snippets</li>
            <li>Add relevant tags</li>
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>

    <Card class="shadow-lg">
      <CardContent class="pt-8">
        <form @submit.prevent="handleSubmit" class="space-y-8">
          <div class="space-y-3">
            <Label for="title">Title</Label>
            <Input id="title" v-model="form.title" placeholder="e.g. Is there an R function for finding the index?"
              class="h-12" required />
          </div>
          <div class="space-y-3">
            <Label for="content">Body</Label>
            <SimpleMarkdownEditor id="content" v-model="form.content"
              placeholder="Explain your problem... Use the toolbar to format your text with bold, italic, lists, headings, code blocks, and more"
              :rows="15" />
          </div>
          <div class="space-y-3">
            <Label for="tags">Tags</Label>
            <Input id="tags" v-model="tagInput" placeholder="e.g. javascript, react" class="h-12"
              @keydown.enter.prevent="addTag" />
            <div class="flex flex-wrap gap-2 mb-2 min-h-[32px]">
              <Badge v-for="tag in form.tags" :key="tag" variant="secondary"
                class="flex items-center gap-1.5 py-1 rounded-full text-sm font-medium">
                {{ tag }}
                <Button variant="ghost" size="icon" class="h-auto w-auto p-0" @click="removeTag(tag)">
                  <X class="h-3.5 w-3.5 cursor-pointer hover:text-destructive" />
                </Button>
              </Badge>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row justify-end gap-4 pt-4 border-t">
            <Button variant="ghost" type="button" size="lg" @click="$router.back()">
              Cancel
            </Button>
            <Button type="submit" size="lg" :disabled="submitting" class="px-8">
              <Loader2 v-if="submitting" class="mr-2 h-4 w-4 animate-spin" />
              Post Question
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>