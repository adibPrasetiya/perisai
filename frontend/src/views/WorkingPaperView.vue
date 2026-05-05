<template>
  <div class="wp-page">

    <!-- ─── Page header ──────────────────────────────────────────────────────── -->
    <div class="wp-page-header">
      <div>
        <h1 class="wp-page-title">Kertas Kerja</h1>
        <p class="wp-page-desc">
          Buat dan kelola kertas kerja manajemen risiko berdasarkan program kerja aktif unit kerja Anda.
        </p>
      </div>
      <Button label="Buat Kertas Kerja" icon="pi pi-plus" size="small" @click="openCreate" />
    </div>

    <!-- ─── Filter row ────────────────────────────────────────────────────────── -->
    <div class="wp-filter-row">
      <select v-model="filterYear" class="wp-select" @change="onFilterChange">
        <option value="">Semua Tahun</option>
        <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
      </select>

      <select v-model="filterStatus" class="wp-select" @change="onFilterChange">
        <option value="">Semua Status</option>
        <option v-for="(label, val) in WORKING_PAPER_STATUS_LABELS" :key="val" :value="val">
          {{ label }}
        </option>
      </select>
    </div>

    <!-- ─── Table ─────────────────────────────────────────────────────────────── -->
    <div class="wp-table-wrap">
      <div v-if="loading" class="wp-loading">
        <ProgressSpinner style="width: 32px; height: 32px" />
      </div>
      <div v-else-if="fetchError" class="wp-error-banner">
        <i class="pi pi-exclamation-circle" />
        {{ fetchError }}
      </div>
      <template v-else>
        <table class="wp-table">
          <thead>
            <tr>
              <th>Judul Kertas Kerja</th>
              <th>Program</th>
              <th class="wp-th-center">Tahun</th>
              <th class="wp-th-center">Status</th>
              <th class="wp-th-center">Entri Risiko</th>
              <th class="wp-th-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="workingPapers.length === 0">
              <td colspan="6">
                <div class="wp-empty">
                  <i class="pi pi-inbox" />
                  <span>Tidak ada kertas kerja ditemukan</span>
                </div>
              </td>
            </tr>
            <tr v-for="wp in workingPapers" :key="wp.id">
              <td class="wp-td-name">
                <span class="wp-name">{{ wp.title }}</span>
              </td>
              <td class="wp-td-program">
                <span class="wp-program-name">{{ wp.program?.name ?? '—' }}</span>
              </td>
              <td class="wp-td-center">
                <span class="wp-year-badge">{{ wp.program?.year ?? '—' }}</span>
              </td>
              <td class="wp-td-center">
                <span class="wp-status-chip" :class="`chip-${wp.status.toLowerCase()}`">
                  {{ WORKING_PAPER_STATUS_LABELS[wp.status] }}
                </span>
              </td>
              <td class="wp-td-center">
                <span class="wp-count-badge">
                  {{ wp._count?.riskEntries ?? 0 }}
                  <span class="wp-count-label">entri</span>
                </span>
              </td>
              <td class="wp-td-center wp-td-actions">
                <button
                  class="btn-icon"
                  type="button"
                  title="Lihat Detail"
                  @click="goToDetail(wp.id)"
                >
                  <i class="pi pi-eye" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div v-if="pagination && pagination.totalPages > 1" class="wp-pagination">
          <button
            class="wp-page-btn"
            type="button"
            :disabled="!pagination.hasPrevPage"
            @click="changePage(currentPage - 1)"
          >
            <i class="pi pi-chevron-left" />
          </button>
          <button
            v-for="p in pageNumbers"
            :key="String(p)"
            class="wp-page-btn"
            type="button"
            :class="{ 'is-active': p === currentPage, 'is-ellipsis': p === '...' }"
            :disabled="p === '...'"
            @click="typeof p === 'number' && changePage(p)"
          >
            {{ p }}
          </button>
          <button
            class="wp-page-btn"
            type="button"
            :disabled="!pagination.hasNextPage"
            @click="changePage(currentPage + 1)"
          >
            <i class="pi pi-chevron-right" />
          </button>
        </div>

        <div v-if="pagination" class="wp-total-count">
          Menampilkan {{ workingPapers.length }} dari {{ pagination.totalItems }} kertas kerja
        </div>
      </template>
    </div>

    <!-- ─── Create Dialog ──────────────────────────────────────────────────────── -->
    <Dialog
      v-model:visible="showCreateDialog"
      modal
      header="Buat Kertas Kerja"
      :style="{ width: '520px' }"
    >
      <form class="wp-form" @submit.prevent="submitCreate">

        <div class="form-group">
          <label class="form-label">Program Kerja <span class="req">*</span></label>
          <select
            v-model="form.programId"
            class="wp-field-input wp-field-select"
            :class="{ 'is-error': formErrors.programId }"
          >
            <option value="">— Pilih Program Kerja —</option>
            <option v-for="prog in activePrograms" :key="prog.id" :value="prog.id">
              {{ prog.name }} ({{ prog.year }})
            </option>
          </select>
          <span v-if="formErrors.programId" class="form-err">{{ formErrors.programId }}</span>
          <span v-if="activePrograms.length === 0 && !programsLoading" class="form-hint">
            Tidak ada program kerja berstatus Aktif yang tersedia.
          </span>
        </div>

        <div class="form-group">
          <label class="form-label">Judul Kertas Kerja <span class="form-opt">(opsional)</span></label>
          <input
            v-model="form.title"
            class="wp-field-input"
            type="text"
            placeholder="Kosongkan untuk judul otomatis"
            maxlength="255"
            autocomplete="off"
          />
        </div>

        <div class="wp-info-box">
          <i class="pi pi-info-circle" />
          <span>Judul akan dibuat otomatis berdasarkan nama program jika tidak diisi.</span>
        </div>

        <div v-if="formApiError" class="wp-alert-error">
          <i class="pi pi-exclamation-triangle" />
          {{ formApiError }}
        </div>

        <div class="wp-form-actions">
          <Button
            label="Batal"
            severity="secondary"
            type="button"
            :disabled="formLoading"
            @click="showCreateDialog = false"
          />
          <Button
            label="Buat"
            type="submit"
            :loading="formLoading"
          />
        </div>
      </form>
    </Dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'
import { workingPaperApi, WORKING_PAPER_STATUS_LABELS, type WorkingPaper } from '@/api/workingPaper'
import { riskProgramApi, type RiskProgram } from '@/api/riskProgram'
import { extractApiError } from '@/utils/apiError'
import { usePagination } from '@/composables/usePagination'

const toast = useToast()
const router = useRouter()

// ─── Year options ─────────────────────────────────────────────────────────────

const currentYear = new Date().getFullYear()
const yearOptions = computed(() => {
  const years: number[] = []
  for (let y = currentYear + 1; y >= 2020; y--) years.push(y)
  return years
})

// ─── List state ───────────────────────────────────────────────────────────────

const workingPapers = ref<WorkingPaper[]>([])
const loading = ref(false)
const fetchError = ref('')
const filterYear = ref<number | ''>('')
const filterStatus = ref('')
const { currentPage, pagination, pageNumbers, PAGE_LIMIT } = usePagination()

// ─── Create dialog state ──────────────────────────────────────────────────────

const showCreateDialog = ref(false)
const formLoading = ref(false)
const formApiError = ref('')
const form = reactive({ programId: '', title: '' })
const formErrors = reactive({ programId: '' })

const activePrograms = ref<RiskProgram[]>([])
const programsLoading = ref(false)

// ─── Navigation ───────────────────────────────────────────────────────────────

function goToDetail(id: string) {
  router.push({ name: 'working-paper-detail', params: { id } })
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchData() {
  loading.value = true
  fetchError.value = ''
  try {
    const params: Record<string, any> = { page: currentPage.value, limit: PAGE_LIMIT }
    if (filterYear.value !== '') params.year = filterYear.value
    if (filterStatus.value) params.status = filterStatus.value

    const res = await workingPaperApi.search(params)
    workingPapers.value = res.data.data ?? []
    pagination.value = res.data.pagination ?? null
  } catch (err: any) {
    fetchError.value = extractApiError(err, 'Gagal memuat data kertas kerja.')
  } finally {
    loading.value = false
  }
}

function onFilterChange() {
  currentPage.value = 1
  fetchData()
}

function changePage(page: number) {
  currentPage.value = page
  fetchData()
}

// ─── Create ───────────────────────────────────────────────────────────────────

async function fetchActivePrograms() {
  programsLoading.value = true
  try {
    const res = await riskProgramApi.search({ status: 'ACTIVE', limit: 100 })
    activePrograms.value = res.data.data ?? []
  } catch {
    // non-critical
  } finally {
    programsLoading.value = false
  }
}

function openCreate() {
  form.programId = ''
  form.title = ''
  formErrors.programId = ''
  formApiError.value = ''
  showCreateDialog.value = true
  fetchActivePrograms()
}

async function submitCreate() {
  formErrors.programId = ''
  if (!form.programId) {
    formErrors.programId = 'Program kerja wajib dipilih'
    return
  }

  formLoading.value = true
  formApiError.value = ''
  try {
    const payload: { programId: string; title?: string } = { programId: form.programId }
    if (form.title.trim()) payload.title = form.title.trim()

    const res = await workingPaperApi.create(payload)
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Kertas kerja berhasil dibuat', life: 3000 })
    showCreateDialog.value = false
    router.push({ name: 'working-paper-detail', params: { id: res.data.data.id } })
  } catch (err: any) {
    formApiError.value = extractApiError(err, 'Terjadi kesalahan. Coba lagi.')
  } finally {
    formLoading.value = false
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
/* ─── Page layout ─────────────────────────────────────────────────────────── */

.wp-page {
  padding: 2rem;
  max-width: 1100px;
  margin: 0 auto;
}

.wp-page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.75rem;
}

.wp-page-title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text);
  margin: 0 0 0.35rem;
}

.wp-page-desc {
  font-size: 13px;
  color: var(--color-text-dim);
  margin: 0;
}

/* ─── Filter row ──────────────────────────────────────────────────────────── */

.wp-filter-row {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.wp-select {
  padding: 7px 10px;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 13px;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s;
}

.wp-select:focus {
  border-color: var(--color-accent);
}

/* ─── Table ───────────────────────────────────────────────────────────────── */

.wp-table-wrap {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.wp-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.wp-table th {
  text-align: left;
  padding: 10px 16px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  background: rgba(22, 40, 68, 0.6);
  border-bottom: 1px solid var(--color-border);
}

.wp-th-center {
  text-align: center;
}

.wp-table td {
  padding: 12px 16px;
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.wp-table tbody tr:last-child td {
  border-bottom: none;
}

.wp-table tbody tr:hover td {
  background: rgba(0, 229, 184, 0.02);
}

.wp-td-name {
  max-width: 300px;
}

.wp-name {
  display: block;
  font-weight: 500;
}

.wp-td-program {
  max-width: 200px;
}

.wp-program-name {
  font-size: 12px;
  color: var(--color-text-dim);
}

.wp-td-center {
  text-align: center;
}

.wp-td-actions {
  white-space: nowrap;
}

.wp-year-badge {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}

.wp-count-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  justify-content: center;
  padding: 2px 10px;
  font-size: 11px;
  font-family: var(--font-mono);
  font-weight: 600;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: 100px;
  color: var(--color-text-dim);
}

.wp-count-label {
  font-family: var(--font-body);
  font-weight: 400;
  color: var(--color-text-muted);
}

.wp-status-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  font-size: 11px;
  font-weight: 500;
  border-radius: 100px;
  letter-spacing: 0.04em;
}

.chip-draft {
  background: rgba(100, 116, 139, 0.12);
  color: #94a3b8;
  border: 1px solid rgba(100, 116, 139, 0.25);
}

.chip-submitted {
  background: rgba(96, 165, 250, 0.12);
  color: #60a5fa;
  border: 1px solid rgba(96, 165, 250, 0.25);
}

.chip-revision {
  background: rgba(251, 146, 60, 0.12);
  color: #fb923c;
  border: 1px solid rgba(251, 146, 60, 0.25);
}

.chip-approved {
  background: rgba(0, 229, 184, 0.12);
  color: var(--color-accent);
  border: 1px solid rgba(0, 229, 184, 0.25);
}

.chip-locked {
  background: rgba(167, 139, 250, 0.12);
  color: #a78bfa;
  border: 1px solid rgba(167, 139, 250, 0.25);
}

/* ─── Pagination ──────────────────────────────────────────────────────────── */

.wp-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--color-border);
}

.wp-page-btn {
  min-width: 30px;
  height: 30px;
  padding: 0 6px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  color: var(--color-text-dim);
  font-size: 12px;
  font-family: var(--font-mono);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.wp-page-btn:hover:not(:disabled) {
  background: var(--color-accent-glow);
  border-color: rgba(0, 229, 184, 0.2);
  color: var(--color-accent);
}

.wp-page-btn.is-active {
  background: var(--color-accent-glow);
  border-color: rgba(0, 229, 184, 0.3);
  color: var(--color-accent);
  font-weight: 600;
}

.wp-page-btn.is-ellipsis,
.wp-page-btn:disabled {
  cursor: default;
  opacity: 0.4;
}

.wp-total-count {
  padding: 0.6rem 1rem;
  font-size: 11px;
  color: var(--color-text-muted);
  text-align: right;
  border-top: 1px solid var(--color-border);
}

/* ─── State indicators ────────────────────────────────────────────────────── */

.wp-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;
}

.wp-error-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.25rem;
  font-size: 13px;
  color: #ff8fa3;
  background: var(--color-danger-dim);
  border-radius: var(--radius-md);
  margin: 1rem;
}

.wp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
  font-size: 13px;
}

.wp-empty .pi {
  font-size: 1.75rem;
  opacity: 0.4;
}

/* ─── Form (inside dialog) ────────────────────────────────────────────────── */

.wp-form {
  display: flex;
  flex-direction: column;
  padding: 0.25rem 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 1rem;
}

.form-label {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-dim);
}

.req {
  color: var(--color-danger);
}

.form-opt {
  font-size: 10px;
  color: var(--color-text-muted);
  font-weight: 400;
  letter-spacing: 0;
  text-transform: none;
}

.form-hint {
  font-size: 11px;
  color: var(--color-text-muted);
  font-style: italic;
}

.wp-field-input {
  padding: 8px 10px;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  width: 100%;
}

.wp-field-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px var(--color-accent-glow);
}

.wp-field-input::placeholder {
  color: var(--color-text-muted);
}

.wp-field-input.is-error {
  border-color: var(--color-danger);
}

.wp-field-select {
  cursor: pointer;
}

.form-err {
  font-size: 11px;
  color: #ff8fa3;
}

.wp-info-box {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.65rem 0.875rem;
  font-size: 12px;
  color: var(--color-text-dim);
  background: rgba(0, 229, 184, 0.05);
  border: 1px solid rgba(0, 229, 184, 0.15);
  border-radius: var(--radius-sm);
  margin-bottom: 1rem;
  line-height: 1.5;
}

.wp-info-box .pi {
  color: var(--color-accent);
  margin-top: 1px;
  flex-shrink: 0;
}

.wp-alert-error {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  font-size: 12px;
  color: #ff8fa3;
  background: var(--color-danger-dim);
  border: 1px solid rgba(255, 77, 109, 0.3);
  border-radius: var(--radius-sm);
  margin-bottom: 1rem;
  white-space: pre-line;
}

.wp-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
</style>
