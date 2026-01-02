import type { User } from "~/types/user"

export default defineNuxtRouteMiddleware(async (to, from) => {
  const authStore = useAuthStore()
  const { baseURL } = useConfig()
  const authRoutes = ["/login", "/register"]

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/tags"]
  const publicRoutePatterns = [/^\/questions\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i] // /questions/:id (UUID format, viewing questions only, /questions/new requires auth)

  // Check if current route is public
  const isPublicRoute = publicRoutes.includes(to.path) ||
    publicRoutePatterns.some(pattern => pattern.test(to.path))

  // If already on an auth route, only redirect away if logged in
  if (authRoutes.includes(to.path)) {
    if (authStore.user) {
      return navigateTo("/")
    }
    // Don't check authentication if already on auth route (prevents redirect loop)
    return
  }

  // If user is already authenticated, continue
  if (authStore.user) {
    return
  }

  const headers = useRequestHeaders(['cookie'])

  const { data, error } = await useFetch<User>("/users/me", {
    baseURL,
    credentials: 'include',
    key: `auth-me`,
    server: true,
    headers,
  })

  if (error.value) {
    authStore.setUser(null)
    if (error.value.statusCode === 401) {
      // Only redirect to login if NOT on a public route
      if (!isPublicRoute) {
        if (import.meta.server) {
          throw createError({
            status: 302,
            statusMessage: 'Redirect to login',
            data: '/login'
          })
        } else {
          return navigateTo({
            path: "/login",
            query: { redirect: to.fullPath }
          })
        }
      }
      // On public routes, just return without redirecting
      return
    }
    return
  }

  if (data.value) {
    authStore.setUser(data.value)
  }
})