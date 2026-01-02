<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { createLowlight } from 'lowlight'

// Initialize lowlight with common languages
const lowlight = createLowlight()

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      // Disable the default CodeBlock from StarterKit since we're using CodeBlockLowlight
      codeBlock: false,
    }),
    CodeBlockLowlight.configure({
      lowlight,
    }),
  ],
  content: props.modelValue || '',
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  },
  editorProps: {
    attributes: {
      class: 'prose prose-slate max-w-none focus:outline-none min-h-[300px] p-4',
    },
  },
})

watch(() => props.modelValue, (value) => {
  if (!editor.value) return
  // Compare HTML content
  const currentHTML = editor.value.getHTML()
  if (currentHTML !== value) {
    // Set content from HTML
    editor.value.commands.setContent(value || '')
  }
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<template>
  <div class="border rounded-lg overflow-hidden">
    <!-- Toolbar -->
    <div class="border-b bg-gray-50 p-2 flex flex-wrap gap-1">
      <button type="button" @click="editor?.chain().focus().toggleBold().run()" :class="[
        'px-2 py-1 rounded text-sm font-medium',
        editor?.isActive('bold') ? 'bg-gray-200' : 'hover:bg-gray-100'
      ]">
        <strong>B</strong>
      </button>
      <button type="button" @click="editor?.chain().focus().toggleItalic().run()" :class="[
        'px-2 py-1 rounded text-sm font-medium',
        editor?.isActive('italic') ? 'bg-gray-200' : 'hover:bg-gray-100'
      ]">
        <em>I</em>
      </button>
      <button type="button" @click="editor?.chain().focus().toggleCode().run()" :class="[
        'px-2 py-1 rounded text-sm font-medium',
        editor?.isActive('code') ? 'bg-gray-200' : 'hover:bg-gray-100'
      ]">
        &lt;/&gt;
      </button>
      <div class="w-px h-6 bg-gray-300 mx-1" />
      <button type="button" @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()" :class="[
        'px-2 py-1 rounded text-sm font-medium',
        editor?.isActive('heading', { level: 2 }) ? 'bg-gray-200' : 'hover:bg-gray-100'
      ]">
        H2
      </button>
      <button type="button" @click="editor?.chain().focus().toggleHeading({ level: 3 }).run()" :class="[
        'px-2 py-1 rounded text-sm font-medium',
        editor?.isActive('heading', { level: 3 }) ? 'bg-gray-200' : 'hover:bg-gray-100'
      ]">
        H3
      </button>
      <button type="button" @click="editor?.chain().focus().toggleBulletList().run()" :class="[
        'px-2 py-1 rounded text-sm font-medium',
        editor?.isActive('bulletList') ? 'bg-gray-200' : 'hover:bg-gray-100'
      ]">
        •
      </button>
      <div class="w-px h-6 bg-gray-300 mx-1" />
      <button type="button" @click="editor?.chain().focus().toggleCodeBlock().run()" :class="[
        'px-2 py-1 rounded text-sm font-medium',
        editor?.isActive('codeBlock') ? 'bg-gray-200' : 'hover:bg-gray-100'
      ]">
        {{ '{}' }}
      </button>
    </div>

    <!-- Editor -->
    <EditorContent :editor="editor" class="min-h-[300px]" />

    <!-- Placeholder -->
    <div v-if="!editor?.getHTML() || editor?.isEmpty"
      class="absolute top-[60px] left-4 text-gray-400 pointer-events-none">
      {{ placeholder || 'Start typing...' }}
    </div>
  </div>
</template>

<style>
/* Tiptap Editor Styles */
.ProseMirror {
  outline: none;
  min-height: 300px;
}

.ProseMirror code {
  background-color: #f4f4f5;
  color: #e11d48;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
}

.ProseMirror pre {
  background: #1e293b;
  color: #e2e8f0;
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 1rem 0;
  overflow-x: auto;
}

.ProseMirror pre code {
  background: transparent;
  color: inherit;
  padding: 0;
  font-size: 0.875rem;
}

.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #9ca3af;
  pointer-events: none;
  height: 0;
}

/* Syntax highlighting will be added by lowlight */
</style>
