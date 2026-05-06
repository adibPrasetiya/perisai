<template>
  <div class="settings-section">
    <div class="al-header">
      <div>
        <h2 class="settings-section-title">Log Aktivitas</h2>
        <p class="settings-section-desc">
          Pantau aktivitas sistem berdasarkan aksi, level, pengguna, dan rentang waktu.
        </p>
      </div>
    </div>

    <div class="settings-section-divider" />

    <div class="al-filter-wrap">
      <input
        v-model="draft.username"
        class="al-input"
        type="text"
        placeholder="Cari username..."
        @keyup.enter="applyFilters"
      />
      <select v-model="draft.actionType" class="al-select">
        <option value="">Semua Action Type</option>
        <option value="CREATE">CREATE</option>
        <option value="UPDATE">UPDATE</option>
        <option value="DELETE">DELETE</option>
        <option value="AUTH">AUTH</option>
      </select>
      <select v-model="draft.level" class="al-select">
        <option value="">Semua Level</option>
        <option value="info">info</option>
        <option value="notice">notice</option>
        <option value="warning">warning</option>
      </select>
      <input v-model="draft.startDate" class="al-input" type="date" />
      <input v-model="draft.endDate" class="al-input" type="date" />
      <Button
        class="al-commit-btn"
        label="Filter"
        size="small"
        :disabled="loading"
        @click="applyFilters"
      />
    </div>

    <div class="al-table-wrap">
      <div v-if="loading" class="al-loading">
        <ProgressSpinner style="width: 32px; height: 32px" />
      </div>

      <div v-else-if="errorMsg" class="al-error-banner">
        <i class="pi pi-exclamation-circle" />
        {{ errorMsg }}
      </div>

      <template v-else>
        <table class="al-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Operasi</th>
              <th>Aksi</th>
              <th>Metadata</th>
              <th>Date</th>
              <th class="al-th-menu"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="logs.length === 0">
              <td colspan="6">
                <div class="al-empty">
                  <i class="pi pi-inbox" />
                  <span>Tidak ada log ditemukan</span>
                </div>
              </td>
            </tr>
            <tr v-for="log in logs" :key="log.id">
              <td>
                <div class="al-user-cell">
                  <div>{{ log.username || '-' }}</div>
                  <small>{{ log.userId || '-' }}</small>
                </div>
              </td>
              <td>
                <div class="al-operasi-cell">
                  <span class="al-type-badge">{{ log.actionType }}</span>
                  <span class="al-level-badge" :class="`is-${log.level}`">{{ log.level }}</span>
                </div>
              </td>
              <td>{{ log.action }}</td>
              <td>
                <code class="al-meta">{{ formatMetadata(log.metadata) }}</code>
              </td>
              <td>{{ formatDate(log.createdAt) }}</td>
              <td class="al-action-cell">
                <div class="al-menu-wrap">
                  <button class="al-row-action-btn" type="button" @click="toggleRowMenu(log.id)">
                    Aksi <i class="pi pi-chevron-down" />
                  </button>
                  <div v-if="openMenuId === log.id" class="al-row-menu">
                    <button
                      type="button"
                      class="al-row-menu-item"
                      :disabled="!log.userId"
                      @click="handleNonaktifkan(log.userId)"
                    >
                      Nonaktifkan Pengguna
                    </button>
                    <button type="button" class="al-row-menu-item is-danger" @click="handleHapus(log.id)">Hapus Sesi Aktif</button>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="pagination && pagination.totalPages > 1" class="al-pagination">
          <button class="al-page-btn" type="button" :disabled="!pagination.hasPrevPage" @click="changePage(currentPage - 1)">
            <i class="pi pi-chevron-left" />
          </button>
          <button
            v-for="p in pageNumbers"
            :key="String(p)"
            class="al-page-btn"
            type="button"
            :class="{ 'is-active': p === currentPage, 'is-ellipsis': p === '...' }"
            :disabled="p === '...'"
            @click="typeof p === 'number' && changePage(p)"
          >
            {{ p }}
          </button>
          <button class="al-page-btn" type="button" :disabled="!pagination.hasNextPage" @click="changePage(currentPage + 1)">
            <i class="pi pi-chevron-right" />
          </button>
        </div>

        <div v-if="pagination" class="al-total-count">
          Menampilkan {{ logs.length }} dari {{ pagination.totalItems }} log aktivitas
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import { activityLogApi, type ActivityLogItem, type ActivityLogQuery } from '@/api/activityLog'
import { usersApi } from '@/api/users'
import { usePagination } from '@/composables/usePagination'
import { extractApiError } from '@/utils/apiError'
import { useToast } from 'primevue/usetoast'

const loading = ref(false)
const errorMsg = ref('')
const logs = ref<ActivityLogItem[]>([])
const openMenuId = ref<string | null>(null)
const toast = useToast()

const { currentPage, pagination, pageNumbers, PAGE_LIMIT } = usePagination(20)

const draft = reactive({
  username: '',
  actionType: '',
  level: '',
  startDate: '',
  endDate: '',
})

const applied = reactive({ ...draft })

function buildParams(): ActivityLogQuery {
  return {
    username: applied.username || undefined,
    actionType: (applied.actionType || undefined) as ActivityLogQuery['actionType'],
    level: (applied.level || undefined) as ActivityLogQuery['level'],
    startDate: toIso(applied.startDate, false),
    endDate: toIso(applied.endDate, true),
    page: currentPage.value,
    limit: PAGE_LIMIT,
  }
}

function toIso(value: string, endOfDay: boolean) {
  if (!value) return undefined
  const date = new Date(value)
  if (endOfDay) {
    date.setHours(23, 59, 59, 999)
  } else {
    date.setHours(0, 0, 0, 0)
  }
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

async function fetchLogs() {
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await activityLogApi.list(buildParams())
    logs.value = res.data.data ?? []
    pagination.value = res.data.pagination ?? null

    if (pagination.value && pagination.value.totalPages > 0 && currentPage.value > pagination.value.totalPages) {
      currentPage.value = pagination.value.totalPages
      await fetchLogs()
      return
    }
  } catch (err: any) {
    errorMsg.value = extractApiError(err, 'Gagal memuat log aktivitas.')
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  Object.assign(applied, draft)
  currentPage.value = 1
  openMenuId.value = null
  fetchLogs()
}

function changePage(page: number) {
  currentPage.value = page
  openMenuId.value = null
  fetchLogs()
}

function toggleRowMenu(id: string) {
  openMenuId.value = openMenuId.value === id ? null : id
}

async function handleNonaktifkan(userId: string | null) {
  openMenuId.value = null
  if (!userId) {
    toast.add({ severity: 'warn', summary: 'Info', detail: 'User pada log tidak tersedia', life: 2500 })
    return
  }

  try {
    await usersApi.deactivate(userId)
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Pengguna berhasil dinonaktifkan', life: 2500 })
    await fetchLogs()
  } catch (err: any) {
    toast.add({ severity: 'error', summary: 'Gagal', detail: extractApiError(err, 'Gagal menonaktifkan pengguna'), life: 3000 })
  }
}

function handleHapus(id: string) {
  openMenuId.value = null
  toast.add({ severity: 'warn', summary: 'Info', detail: `Hapus log ${id} belum tersedia`, life: 2500 })
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function formatMetadata(metadata: Record<string, unknown> | null) {
  if (!metadata) return '-'
  const json = JSON.stringify(metadata)
  return json.length > 80 ? `${json.slice(0, 80)}...` : json
}

onMounted(fetchLogs)
</script>

<style scoped>
.al-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.settings-section-title {
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text);
  margin: 0 0 0.4rem;
}

.settings-section-desc {
  font-size: 13px;
  color: var(--color-text-dim);
  margin: 0;
}

.settings-section-divider {
  height: 1px;
  background: var(--color-border);
  margin-bottom: 1.5rem;
}

.al-filter-wrap {
  display: grid;
  grid-template-columns: repeat(5, minmax(170px, 1fr)) auto;
  gap: 0.75rem;
  margin-bottom: 1rem;
  align-items: center;
}

.al-input,
.al-select {
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-size: 12px;
  padding: 8px 10px;
}

.al-input:focus,
.al-select:focus {
  outline: none;
  border-color: var(--color-accent);
}

.al-commit-btn {
  justify-self: end;
  min-width: 132px;
}

.al-table-wrap {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: visible;
}

.al-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.al-table th,
.al-table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-border);
  text-align: left;
  vertical-align: top;
}

.al-table th {
  font-size: 11px;
  text-transform: uppercase;
  color: var(--color-text-muted);
  letter-spacing: 0.08em;
  background: rgba(22, 40, 68, 0.6);
}

.al-th-menu {
  width: 96px;
}

.al-type-badge,
.al-level-badge {
  display: inline-block;
  border-radius: 100px;
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.al-type-badge {
  background: rgba(96, 165, 250, 0.12);
  border: 1px solid rgba(96, 165, 250, 0.3);
  color: #93c5fd;
}

.al-level-badge.is-info {
  color: #86efac;
  border: 1px solid rgba(134, 239, 172, 0.35);
  background: rgba(134, 239, 172, 0.1);
}

.al-level-badge.is-notice {
  color: #fcd34d;
  border: 1px solid rgba(252, 211, 77, 0.35);
  background: rgba(252, 211, 77, 0.1);
}

.al-level-badge.is-warning {
  color: #fda4af;
  border: 1px solid rgba(253, 164, 175, 0.35);
  background: rgba(253, 164, 175, 0.1);
}

.al-user-cell small {
  display: block;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  margin-top: 2px;
}

.al-operasi-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.al-meta {
  color: var(--color-text-muted);
  font-size: 11px;
  white-space: pre-wrap;
}

.al-empty,
.al-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
}

.al-error-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  color: #ff8fa3;
  background: var(--color-danger-dim);
  border: 1px solid rgba(255, 77, 109, 0.3);
  margin: 1rem;
  border-radius: var(--radius-sm);
}

.al-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0.75rem;
  border-top: 1px solid var(--color-border);
}

.al-page-btn {
  min-width: 30px;
  height: 30px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--color-text-dim);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.al-page-btn.is-active {
  background: var(--color-accent-glow);
  color: var(--color-accent);
  border-color: rgba(0, 229, 184, 0.2);
}

.al-page-btn:disabled,
.al-page-btn.is-ellipsis {
  opacity: 0.5;
  cursor: default;
}

.al-total-count {
  padding: 0.6rem 1rem;
  font-size: 11px;
  color: var(--color-text-muted);
  text-align: right;
  border-top: 1px solid var(--color-border);
}

.al-action-cell {
  text-align: right;
}

.al-menu-wrap {
  position: relative;
  display: inline-block;
}

.al-row-action-btn {
  height: 30px;
  padding: 0 10px;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(117, 138, 170, 0.5);
  background: rgba(15, 28, 50, 0.9);
  color: var(--color-text-dim);
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.al-row-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 6px);
  min-width: 190px;
  background: #061833;
  border: 1px solid rgba(52, 80, 116, 0.8);
  border-radius: 10px;
  overflow: hidden;
  z-index: 2147483646;
}

.al-row-menu-item {
  width: 100%;
  border: none;
  background: transparent;
  color: #c0d6f1;
  text-align: left;
  font-size: 12px;
  padding: 10px 12px;
  cursor: pointer;
}

.al-row-menu-item:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.al-row-menu-item:hover {
  background: rgba(255, 255, 255, 0.04);
}

.al-row-menu-item:disabled:hover {
  background: transparent;
}

.al-row-menu-item.is-danger {
  color: #ff7f96;
}

@media (max-width: 1280px) {
  .al-filter-wrap {
    grid-template-columns: repeat(3, minmax(170px, 1fr));
  }

  .al-commit-btn {
    justify-self: stretch;
  }
}
</style>
