<script setup lang="ts">
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css' // You can change the theme

const props = defineProps<{
  content: string
}>()

// Configure marked renderer once on component setup
const renderer = new marked.Renderer()
renderer.code = function ({ text, lang, escaped }) {
  if (lang && hljs.getLanguage(lang)) {
    try {
      const highlighted = hljs.highlight(text, { language: lang }).value
      return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`
    } catch (err) {
      console.error('Highlighting error:', err)
    }
  }
  const highlighted = hljs.highlightAuto(text).value
  return `<pre><code class="hljs">${highlighted}</code></pre>`
}

// Configure marked options once
marked.setOptions({
  breaks: true,
  gfm: true,
  renderer,
})

const htmlContent = computed(() => {
  if (!props.content) return ''
  const parsed = marked.parse(props.content)
  return typeof parsed === 'string' ? parsed : ''
})
</script>

<template>
  <div class="prose prose-slate dark:prose-invert max-w-none" v-html="htmlContent" />
</template>
