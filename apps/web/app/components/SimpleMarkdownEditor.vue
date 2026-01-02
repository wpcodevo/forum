<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { Link } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: string
  placeholder?: string
  rows?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const textarea = ref<HTMLTextAreaElement>()
const previewMode = ref(false)
const previewContent = ref('')

// Configure marked renderer once
let markedRenderer: any = null

const getMarkedRenderer = async () => {
  if (!markedRenderer) {
    const { marked } = await import('marked')
    const { default: hljs } = await import('highlight.js')

    marked.setOptions({
      breaks: true,
      gfm: true,
    })

    markedRenderer = new marked.Renderer()
    markedRenderer.code = function ({ text, lang, escaped }: { text: string; lang?: string; escaped?: boolean }) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          const highlighted = hljs.highlight(text, { language: lang }).value
          return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`
        } catch (err) { }
      }
      const highlighted = hljs.highlightAuto(text).value
      return `<pre><code class="hljs">${highlighted}</code></pre>`
    }
    marked.setOptions({ renderer: markedRenderer })
  }
  return markedRenderer
}

const insertCodeBlock = () => {
  if (!textarea.value) return

  const start = textarea.value.selectionStart ?? 0
  const end = textarea.value.selectionEnd ?? 0
  const selectedText = props.modelValue.substring(start, end)

  const codeBlock = selectedText
    ? `\`\`\`\n${selectedText}\n\`\`\``
    : `\`\`\`\n// Enter your code here\n\`\`\``

  const newValue =
    props.modelValue.substring(0, start) +
    codeBlock +
    props.modelValue.substring(end)

  emit('update:modelValue', newValue)

  // Restore focus and cursor position
  nextTick(() => {
    if (textarea.value) {
      const newPosition = start + (selectedText ? codeBlock.length : 15)
      textarea.value.focus()
      textarea.value.setSelectionRange(newPosition, newPosition)
    }
  })
}

const insertInlineCode = () => {
  if (!textarea.value) return

  const start = textarea.value.selectionStart ?? 0
  const end = textarea.value.selectionEnd ?? 0
  const selectedText = props.modelValue.substring(start, end)

  const inlineCode = selectedText ? `\`${selectedText}\`` : '``'

  const newValue =
    props.modelValue.substring(0, start) +
    inlineCode +
    props.modelValue.substring(end)

  emit('update:modelValue', newValue)

  nextTick(() => {
    if (textarea.value) {
      const newPosition = start + inlineCode.length - (selectedText ? 0 : 1)
      textarea.value.focus()
      textarea.value.setSelectionRange(newPosition, newPosition)
    }
  })
}

const insertMarkdown = (before: string, after: string = '', placeholder: string = '') => {
  if (!textarea.value) return

  const start = textarea.value.selectionStart ?? 0
  const end = textarea.value.selectionEnd ?? 0
  const selectedText = props.modelValue.substring(start, end)
  const text = selectedText || placeholder

  const newValue =
    props.modelValue.substring(0, start) +
    before + text + after +
    props.modelValue.substring(end)

  emit('update:modelValue', newValue)

  nextTick(() => {
    if (textarea.value) {
      const newPosition = start + before.length + text.length + (selectedText ? 0 : -placeholder.length)
      textarea.value.focus()
      textarea.value.setSelectionRange(newPosition, newPosition)
    }
  })
}

const insertHeading = (level: number) => {
  if (!textarea.value) return
  const start = textarea.value.selectionStart ?? 0
  const end = textarea.value.selectionEnd ?? 0
  const selectedText = props.modelValue.substring(start, end)
  const prefix = '#'.repeat(level) + ' '
  const newValue =
    props.modelValue.substring(0, start) +
    prefix + selectedText +
    props.modelValue.substring(end)
  emit('update:modelValue', newValue)
  nextTick(() => {
    if (textarea.value) {
      const newPosition = start + prefix.length + selectedText.length
      textarea.value.focus()
      textarea.value.setSelectionRange(newPosition, newPosition)
    }
  })
}

const insertList = (ordered: boolean = false) => {
  if (!textarea.value) return
  const start = textarea.value.selectionStart ?? 0
  const end = textarea.value.selectionEnd ?? 0
  const selectedText = props.modelValue.substring(start, end)

  if (selectedText) {
    // Wrap selected text in list items
    const lines = selectedText.split('\n').filter(line => line.trim())
    const listItems = lines.map((line, index) => {
      const prefix = ordered ? `${index + 1}. ` : '- '
      return prefix + line.trim()
    }).join('\n')
    const newValue =
      props.modelValue.substring(0, start) +
      listItems + '\n' +
      props.modelValue.substring(end)
    emit('update:modelValue', newValue)
    nextTick(() => {
      if (textarea.value) {
        const newPosition = start + listItems.length + 1
        textarea.value.focus()
        textarea.value.setSelectionRange(newPosition, newPosition)
      }
    })
  } else {
    // Insert a new list item
    const prefix = ordered ? '1. ' : '- '
    const newValue =
      props.modelValue.substring(0, start) +
      prefix + '\n' +
      props.modelValue.substring(end)
    emit('update:modelValue', newValue)
    nextTick(() => {
      if (textarea.value) {
        const newPosition = start + prefix.length
        textarea.value.focus()
        textarea.value.setSelectionRange(newPosition, newPosition)
      }
    })
  }
}

const insertLink = () => {
  if (!textarea.value) return
  const start = textarea.value.selectionStart ?? 0
  const end = textarea.value.selectionEnd ?? 0
  const selectedText = props.modelValue.substring(start, end)
  const linkText = selectedText || 'link text'
  const link = `[${linkText}](url)`
  const newValue =
    props.modelValue.substring(0, start) +
    link +
    props.modelValue.substring(end)
  emit('update:modelValue', newValue)
  nextTick(() => {
    if (textarea.value) {
      const urlStart = start + linkText.length + 3
      const urlEnd = urlStart + 3
      textarea.value.focus()
      textarea.value.setSelectionRange(urlStart, urlEnd)
    }
  })
}

const togglePreview = async () => {
  if (!previewMode.value) {
    await getMarkedRenderer()
    const { marked } = await import('marked')
    const parsed = await marked.parse(props.modelValue || '')
    previewContent.value = typeof parsed === 'string' ? parsed : await parsed
  }
  previewMode.value = !previewMode.value
}
</script>

<template>
  <div class="border rounded-lg overflow-hidden">
    <!-- Toolbar -->
    <div class="border-b bg-gray-50 p-2 flex flex-wrap gap-1 items-center">
      <!-- Text Formatting -->
      <button type="button" @click="insertMarkdown('**', '**', 'bold text')"
        class="px-2 py-1 rounded text-sm font-medium hover:bg-gray-200" title="Bold">
        <strong>B</strong>
      </button>
      <button type="button" @click="insertMarkdown('*', '*', 'italic text')"
        class="px-2 py-1 rounded text-sm font-medium hover:bg-gray-200" title="Italic">
        <em>I</em>
      </button>
      <button type="button" @click="insertMarkdown('~~', '~~', 'strikethrough')"
        class="px-2 py-1 rounded text-sm font-medium hover:bg-gray-200" title="Strikethrough">
        <span class="line-through">S</span>
      </button>
      <div class="w-px h-6 bg-gray-300 mx-1" />

      <!-- Headings -->
      <button type="button" @click="insertHeading(2)" class="px-2 py-1 rounded text-sm font-medium hover:bg-gray-200"
        title="Heading 2">
        H2
      </button>
      <button type="button" @click="insertHeading(3)" class="px-2 py-1 rounded text-sm font-medium hover:bg-gray-200"
        title="Heading 3">
        H3
      </button>
      <div class="w-px h-6 bg-gray-300 mx-1" />

      <!-- Lists -->
      <button type="button" @click="insertList(false)" class="px-2 py-1 rounded text-sm font-medium hover:bg-gray-200"
        title="Bullet List">
        •
      </button>
      <button type="button" @click="insertList(true)" class="px-2 py-1 rounded text-sm font-medium hover:bg-gray-200"
        title="Numbered List">
        1.
      </button>
      <button type="button" @click="insertMarkdown('> ', '', 'Blockquote')"
        class="px-2 py-1 rounded text-sm font-medium hover:bg-gray-200" title="Blockquote">
        "
      </button>
      <div class="w-px h-6 bg-gray-300 mx-1" />

      <!-- Code -->
      <button type="button" @click="insertInlineCode()" class="px-2 py-1 rounded text-sm font-medium hover:bg-gray-200"
        title="Inline code">
        &lt;/&gt;
      </button>
      <button type="button" @click="insertCodeBlock()" class="px-2 py-1 rounded text-sm font-medium hover:bg-gray-200"
        title="Code block">
        {{ '{}' }}
      </button>
      <button type="button" @click="insertLink()"
        class="px-2 py-1 rounded text-sm font-medium hover:bg-gray-200 flex items-center" title="Link">
        <Link class="w-3.5 h-3.5" />
      </button>
      <div class="w-px h-6 bg-gray-300 mx-1" />

      <!-- Preview -->
      <button type="button" @click="togglePreview" :class="[
        'px-2 py-1 rounded text-sm font-medium',
        previewMode ? 'bg-gray-200' : 'hover:bg-gray-200'
      ]">
        {{ previewMode ? 'Edit' : 'Preview' }}
      </button>
      <span class="text-xs text-gray-500 ml-auto">
        Markdown supported
      </span>
    </div>

    <!-- Editor or Preview -->
    <div v-if="!previewMode" class="relative">
      <textarea ref="textarea" :value="modelValue"
        @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
        :placeholder="placeholder || 'Start typing... Use the toolbar above to format your text with **bold**, *italic*, lists, headings, links, code blocks, and more'"
        :rows="typeof rows === 'number' ? rows : 15"
        class="w-full p-4 border-0 resize-none focus:outline-none font-mono text-sm leading-relaxed" />
    </div>

    <div v-else class="p-4 prose prose-slate max-w-none min-h-[300px]" v-html="previewContent" />
  </div>
</template>
