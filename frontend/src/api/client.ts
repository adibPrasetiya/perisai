import axios, { type InternalAxiosRequestConfig } from 'axios'
import router from '@/router'
import { useAuthStore } from '@/stores/auth'

const apiClient = axios.create({
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─── Token refresh state ──────────────────────────────────────────────────────

let isRefreshing = false
let failedQueue: Array<{
  resolve: () => void
  reject: (err: unknown) => void
}> = []

function processQueue(error: unknown) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve()
  })
  failedQueue = []
}

function forceLogout() {
  const auth = useAuthStore()
  auth.logout()
  if (router.currentRoute.value.name !== 'login') {
    router.push({ name: 'login' })
  }
}

// ─── Response interceptor ─────────────────────────────────────────────────────

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Hanya tangani 401
    if (error.response?.status !== 401) {
      return Promise.reject(error)
    }

    // Jika request yang gagal adalah /auth/refresh itu sendiri,
    // atau sudah pernah di-retry → refresh token habis, paksa logout
    if (original._retry || original.url === '/auth/refresh') {
      processQueue(error)
      forceLogout()
      return Promise.reject(error)
    }

    // Jika sedang refresh, antrikan request ini
    if (isRefreshing) {
      return new Promise<void>((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
        .then(() => apiClient(original))
        .catch((err) => Promise.reject(err))
    }

    original._retry = true
    isRefreshing = true

    try {
      await apiClient.post('/auth/refresh')
      processQueue(null)
      return apiClient(original)
    } catch (refreshError) {
      processQueue(refreshError)
      forceLogout()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export default apiClient
