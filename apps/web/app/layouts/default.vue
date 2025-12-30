<script setup lang="ts">
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';

</script>

<template>
  <div class="min-h-screen bg-background flex flex-col">
    <header class="sticky top-0 z-50 w-full border-b bg-background/95 supports-[backdrop-filter]:">
      <div class="container mx-auto flex h-14 items-center justify-between">
        <div class="flex items-center gap-6">
          <NuxtLink to="/">
            <LucideLayoutGrid class="h-6 w-6 text-primary" />
            <span class="font-bold sm:inline-block">DevFlow</span>
          </NuxtLink>
          <nav class="flex items-center space-x-6 text-sm font-medium">
            <NuxtLink to="/questions" class="transition-colors hover:text-foreground/80 text-foreground/60">Questions
            </NuxtLink>
            <NuxtLink to="/tags" class="transition-colors hover:text-foreground/80 text-foreground/60">Tags</NuxtLink>
          </nav>
        </div>

        <div class="flex flex-1 items-center justify-end space-x-4">
          <div class="w-full flex-1 md:w-auto md:flex-none">
            <div class="relative">
              <LucideSearch class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search questions..." class="pl-8 md:w-[300px] lg:w-[400px]" />
            </div>
          </div>
          <nav class="flex items-center gap-2">
            <Button variant="ghost" size="icon" as-child>
              <NuxtLink to="/profile">
                <LucideUser class="h-5 w-5" />
              </NuxtLink>
              <Button variant="outline" size="sm">
                Log out
              </Button>
              <div class="flex items-center gap-2">
                <Button variant="ghost" size="sm" as-child>
                  <NuxtLink to="/login">Log in</NuxtLink>
                </Button>
                <Button size="sm" as-child>
                  <NuxtLink to="/register">Sign up</NuxtLink>
                </Button>
              </div>
            </Button>
          </nav>
        </div>
      </div>
    </header>

    <main class="flex-1 container mx-auto py-8">
      <slot />
    </main>

    <footer class="border-t py-6 md:py-0">
      <div class="container mx-auto flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
        <p class="text-center text-sm leading-loose text-muted-foreground md:text-left">
          Built with Nuxt 4 and shadcn-vue
        </p>
      </div>
    </footer>
  </div>
</template>