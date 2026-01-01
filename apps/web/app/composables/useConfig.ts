export function useConfig() {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBaseUrl + '/api'

  return {
    baseURL
  }
}