<template>
  <div class="dashboard-layout">
    <AppNav
      :breadcrumb="route.meta.breadcrumb"
      :show-back="route.meta.showBack"
      :back-to="route.meta.backTo"
    />
    <div class="dashboard-main">
      <RouterView />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import AppNav from '@/components/AppNav.vue'

const route = useRoute()
</script>
