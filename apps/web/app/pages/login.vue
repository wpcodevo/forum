<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';

const auth = useAuthStore()
const { showError } = useToast()
const loading = ref(false)
const form = reactive({
  email: '',
  password: ''
})

async function handleLogin() {
  loading.value = true
  const result = await auth.login(form)
  loading.value = false

  if (result.success) {
    navigateTo("/")
  } else {
    showError(result.error)
  }
}

useHead({
  title: "Login - DevFlow",
  meta: [
    { name: "description", content: "Log in to your DevFlow account to ask questions and engage with the developer community" }
  ]
})
</script>

<template>
  <div class="flex items-center justify-center min-h-[calc(100vh-12rem)]">
    <Card class="w-full max-w-md">
      <CardHeader class="space-y-1">
        <CardTitle class="text-2xl font-bold">Log in</CardTitle>
        <CardDescription>Enter your email and password to access your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div class="space-y-2">
            <Label for="email">Email</Label>
            <Input id="email" v-model="form.email" type="email" placeholder="john.doe@example.com" required />
          </div>
          <div class="space-y-2">
            <Label for="password">Password</Label>
            <Input id="password" v-model="form.password" type="password" required />
          </div>
          <Button type="submit" class="w-full" :disabled="loading">
            <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
            Sign In
          </Button>
        </form>
        <div class="mt-4 text-center text-sm">
          Don't have an account?
          <NuxtLink to="/register" class="text-primary hover:underline">Sign up</NuxtLink>
        </div>
      </CardContent>
    </Card>
  </div>
</template>