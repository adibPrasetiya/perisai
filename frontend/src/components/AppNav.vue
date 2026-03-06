<template>
  <nav class="dashboard-nav">
    <!-- Sisi kiri: tombol back + brand + breadcrumb -->
    <div class="nav-left-group">
      <Button
        v-if="showBack"
        icon="pi pi-arrow-left"
        text
        size="small"
        style="color: var(--color-text-dim);"
        @click="handleBack"
      />
      <span class="nav-brand">PERISAI</span>
      <span v-if="breadcrumb" class="nav-breadcrumb">/ {{ breadcrumb }}</span>
    </div>

    <!-- Sisi kanan: tombol user dengan dropdown -->
    <div class="nav-user-wrap">
      <button class="nav-user-btn" @click="menu?.toggle($event)">
        <div class="nav-user-avatar">{{ userInitial }}</div>
        <div class="nav-user-info">
          <span class="nav-user-name">{{ displayName }}</span>
          <span class="nav-user-handle">@{{ auth.user?.username }}</span>
        </div>
        <i class="pi pi-chevron-down nav-chevron" />
      </button>

      <Menu ref="menu" :model="menuItems" :popup="true" />
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Menu from 'primevue/menu'
import { useAuthStore } from '@/stores/auth'
import { authApi } from '@/api/auth'

const props = withDefaults(defineProps<{
  breadcrumb?: string
  showBack?: boolean
  backTo?: string | object
}>(), {
  showBack: false,
})

const router = useRouter()
const auth = useAuthStore()
const menu = ref()
const logoutLoading = ref(false)

const userInitial = computed(() =>
  (auth.user?.name ?? auth.user?.username ?? '?').charAt(0).toUpperCase()
)

const displayName = computed(() =>
  auth.user?.name ?? auth.user?.username ?? 'Pengguna'
)

const menuItems = computed(() => [
  {
    label: 'Profil Saya',
    icon: 'pi pi-user',
    command: () => {
      router.push({ name: 'profile' })
    },
  },
  { separator: true },
  {
    label: logoutLoading.value ? 'Keluar...' : 'Keluar',
    icon: logoutLoading.value ? 'pi pi-spin pi-spinner' : 'pi pi-sign-out',
    disabled: logoutLoading.value,
    command: handleLogout,
  },
])

function handleBack() {
  if (props.backTo) {
    if (typeof props.backTo === 'string') {
      router.push({ name: props.backTo })
    } else {
      router.push(props.backTo as any)
    }
  } else {
    router.back()
  }
}

async function handleLogout() {
  logoutLoading.value = true
  try {
    await authApi.logout()
  } catch {
    // abaikan error jaringan — tetap logout sisi klien
  } finally {
    auth.logout()
    router.push({ name: 'login' })
  }
}
</script>

<style scoped>
.nav-left-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.nav-breadcrumb {
  font-size: 13px;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
}

/* ─── User button ─── */
.nav-user-wrap {
  position: relative;
}

.nav-user-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 5px 10px 5px 6px;
  cursor: pointer;
  color: var(--color-text);
  transition: border-color 0.2s, background 0.2s;
}

.nav-user-btn:hover {
  border-color: var(--color-accent);
  background: var(--color-accent-glow);
}

.nav-user-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--color-accent-glow);
  border: 1px solid rgba(0, 229, 184, 0.3);
  color: var(--color-accent);
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nav-user-info {
  display: flex;
  flex-direction: column;
  gap: 0;
  text-align: left;
}

.nav-user-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  line-height: 1.25;
  white-space: nowrap;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-user-handle {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-text-muted);
  line-height: 1.25;
}

.nav-chevron {
  font-size: 10px;
  color: var(--color-text-muted);
  flex-shrink: 0;
}
</style>
