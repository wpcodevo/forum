import { defineStore } from "pinia";
import type { LoginInput, RegisterInput, User } from "~/types/user";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null)
  const isAuthenticated = computed(() => !!user.value)
  const { $fetchApi } = useApi()

  async function login(credentials: LoginInput) {
    try {
      const response = await $fetchApi<{ user: User }>('/auth/login', {
        method: 'POST',
        body: credentials
      })

      user.value = response.user
      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.data?.message || 'Login failed'
      }
    }
  }

  async function register(details: RegisterInput) {
    try {
      await $fetchApi('/auth/register', {
        method: 'POST',
        body: details
      })

      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.data?.message || 'Registration failed'
      }
    }
  }

  async function logout() {
    try {
      await $fetchApi('/auth/logout', {
        method: 'POST'
      })
    } finally {
      user.value = null
      navigateTo('/login')
    }
  }

  function setUser(authUser: User | null) {
    user.value = authUser
  }

  return {
    user,
    isAuthenticated,
    login,
    register,
    logout,
    setUser,
    $fetchApi
  }
})