import type { UseFetchOptions } from "#app"

export const useApi = () => {
  const { baseURL } = useConfig()

  const $fetchApi = async <T>(endpoint: string, options: UseFetchOptions<T> = {}): Promise<T> => {
    return await $fetch<T>(`${baseURL}${endpoint}`, {
      credentials: 'include',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    } as any)
  }

  return { $fetchApi }
}