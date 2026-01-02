import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['shadcn-nuxt', '@pinia/nuxt', 'nuxt-lucide-icons', '@peterbud/nuxt-query'],
  nuxtQuery: {
    autoImports: ['useQuery', 'useMutation', 'useQueryClient'],
    devtools: true,
    queryClientOptions: {
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
          staleTime: 1000 * 60, // 1 minute
        }
      },
    },
  },
  css: ['./app/assets/css/main.css'],
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
  app: {
    head: {
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1",
      title: "DevFlow - Developer Q&A Community",
      meta: [{ name: "description", content: "Ask technical questions and get answers from the developer community" }]
    }
  },
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
      wsUrl: process.env.NUXT_PUBLIC_WS_URL || "http://localhost:8000",
    }
  }
})