import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface User {
  id: string
  username: string
  email?: string
  name: string
  roles: string[]
}

export const useAuthStore = defineStore(
  'auth',
  () => {
    const user = ref<User | null>(null)
    const isAuthenticated = ref(false)
    // totpToken is intentionally NOT persisted — in-memory only
    const totpToken = ref<string | null>(null)

    const isAdmin = computed(() => user.value?.roles?.includes('ADMINISTRATOR') ?? false)

    const isKomitePusat = computed(() => user.value?.roles?.includes('KOMITE_PUSAT') ?? false)

    const canViewDashboard = computed(
      () =>
        (user.value?.roles?.includes('ADMINISTRATOR') ||
          user.value?.roles?.includes('KOMITE_PUSAT')) ??
        false,
    )

    function setUser(u: User) {
      user.value = u
      isAuthenticated.value = true
    }

    function setTotpToken(token: string) {
      totpToken.value = token
    }

    function clearTotpToken() {
      totpToken.value = null
    }

    function logout() {
      user.value = null
      isAuthenticated.value = false
      totpToken.value = null
    }

    return {
      user,
      isAuthenticated,
      isAdmin,
      isKomitePusat,
      canViewDashboard,
      totpToken,
      setUser,
      setTotpToken,
      clearTotpToken,
      logout,
    }
  },
  {
    persist: {
      pick: ['user', 'isAuthenticated'],
    },
  },
)
