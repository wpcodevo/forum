<script setup lang="ts">
import { Button } from '~/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs';


</script>

<template>
  <div class="space-y-8">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="space-y-1">
        <h1 class="text-3xl font-bold tracking-tight">Top Questions</h1>
        <p class="text-muted-foreground">Explore the latest technical challenges from the community.</p>
      </div>
      <Button size="lg">
        <NuxtLink to="/questions/new">Ask Question</NuxtLink>
      </Button>
    </div>
    <Tabs default-value="newest">
      <TabsList>
        <TabsTrigger value="newest">
          Newest
        </TabsTrigger>
        <TabsTrigger value="active">
          Active
        </TabsTrigger>
        <TabsTrigger value="unanswered">
          Unanswered
        </TabsTrigger>
        <TabsTrigger value="popular">
          Popular
        </TabsTrigger>
      </TabsList>
    </Tabs>
  </div>
</template>
