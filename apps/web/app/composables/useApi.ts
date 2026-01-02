import type { UseFetchOptions } from "#app"

export const useApi = () => {
  const { baseURL } = useConfig()

  const $fetchApi = async <T>(endpoint: string, options: UseFetchOptions<T> = {}): Promise<T> => {
    // Forward cookies on server side for SSR
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>
    }

    if (import.meta.server) {
      const requestHeaders = useRequestHeaders(['cookie'])
      if (requestHeaders.cookie) {
        headers.cookie = requestHeaders.cookie
      }
    }

    return await $fetch<T>(`${baseURL}${endpoint}`, {
      credentials: 'include',
      ...options,
      headers
    } as any)
  }

  return { $fetchApi }
}