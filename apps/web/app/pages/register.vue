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
  name: '',
  username: '',
  email: '',
  password: ''
})


useHead({
  title: 'Sign Up - DevFlow',
  meta: [
    { name: 'description', content: 'Create a DevFlow account to start asking questions and helping other developers' }
  ]
})

async function handleRegister() {
  loading.value = true
  const result = await auth.register(form)
  loading.value = false

  if (result.success) {
    navigateTo("/login")
  } else {
    showError(result.error)
  }
}

</script>

<template>
  <div class="flex items-center justify-center min-h-[calc(100vh-12rem)]">
    <Card class="w-full max-w-md">
      <CardHeader>
        <CardTitle class="text-2xl font-bold">Create an account</CardTitle>
        <CardDescription>Enter your details to register as a new member</CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleRegister" class="space-y-4">
          <div class="space-y-2">
            <Label for="name">Full Name</Label>
            <Input id="name" v-model="form.name" placeholder="John Doe" required />
          </div>
          <div class="space-y-2">
            <Label for="username">Username</Label>
            <Input id="username" v-model="form.username" placeholder="johndoe" required />
          </div>
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
            Create Account
          </Button>
        </form>
        <div class="mt-4 text-center text-sm">
          Already have an account? <NuxtLink class="text-primary hover:underline" to="/login">Log in</NuxtLink>
        </div>
      </CardContent>
    </Card>
  </div>
</template>