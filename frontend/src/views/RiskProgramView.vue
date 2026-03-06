<template>
  <div class="rp-page">

    <!-- ─── Page header ──────────────────────────────────────────────────────── -->
    <div class="rp-page-header">
      <div>
        <h1 class="rp-page-title">Program Risiko</h1>
        <p class="rp-page-desc">
          Kelola program manajemen risiko berdasarkan framework dan tahun pelaksanaan.
        </p>
      </div>
      <Button label="Tambah Program" icon="pi pi-plus" size="small" @click="openCreate" />
    </div>

    <!-- ─── Filter row ────────────────────────────────────────────────────────── -->
    <div class="rp-filter-row">
      <div class="rp-search-wrap">
        <i class="pi pi-search rp-search-icon" />
        <input
          v-model="searchQuery"
          class="rp-input rp-search-input"
          type="text"
          placeholder="Cari nama program..."
          @input="onSearchInput"
        />
        <button v-if="searchQuery" class="rp-search-clear" type="button" @click="clearSearch">
          <i class="pi pi-times" />
        </button>
      </div>

      <select v-model="filterYear" class="rp-select" @change="onFilterChange">
        <option value="">Semua Tahun</option>
        <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
      </select>

      <select v-model="filterFrameworkId" class="rp-select" @change="onFilterChange">
        <option value="">Semua Framework</option>
        <option v-for="fw in frameworks" :key="fw.id" :value="fw.id">
          {{ fw.name }}
        </option>
      </select>

      <select v-model="filterStatus" class="rp-select" @change="onFilterChange">
        <option value="">Semua Status</option>
        <option v-for="(label, val) in RISK_PROGRAM_STATUS_LABELS" :key="val" :value="val">
          {{ label }}
        </option>
      </select>
    </div>

    <!-- ─── Table ─────────────────────────────────────────────────────────────── -->
    <div class="rp-table-wrap">
      <div v-if="loading" class="rp-loading">
        <ProgressSpinner style="width: 32px; height: 32px" />
      </div>
      <div v-else-if="fetchError" class="rp-error-banner">
        <i class="pi pi-exclamation-circle" />
        {{ fetchError }}
      </div>
      <template v-else>
        <table class="rp-table">
          <thead>
            <tr>
              <th>Nama Program</th>
              <th>Framework</th>
              <th class="rp-th-center">Tahun</th>
              <th class="rp-th-center">Konteks</th>
              <th class="rp-th-center">Status</th>
              <th class="rp-th-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="programs.length === 0">
              <td colspan="6">
                <div class="rp-empty">
                  <i class="pi pi-inbox" />
                  <span>Tidak ada program risiko ditemukan</span>
                </div>
              </td>
            </tr>
            <tr v-for="rp in programs" :key="rp.id">
              <td class="rp-td-name">
                <span class="rp-name">{{ rp.name }}</span>
                <span v-if="rp.description" class="rp-desc-snippet">{{ rp.description }}</span>
              </td>
              <td class="rp-td-framework">
                <span class="rp-fw-badge">{{ rp.framework?.code }}</span>
                <span class="rp-fw-name">{{ rp.framework?.name }}</span>
              </td>
              <td class="rp-td-center">
                <span class="rp-year-badge">{{ rp.year }}</span>
              </td>
              <td class="rp-td-center">
                <span class="rp-count-badge">{{ rp._count?.contexts ?? 0 }}</span>
              </td>
              <td class="rp-td-center">
                <span class="rp-status-chip" :class="`chip-${rp.status.toLowerCase()}`">
                  {{ RISK_PROGRAM_STATUS_LABELS[rp.status] }}
                </span>
              </td>
              <td class="rp-td-center rp-td-actions">
                <button class="btn-icon" type="button" title="Edit" @click="openEdit(rp)">
                  <i class="pi pi-pencil" />
                </button>
                <button
                  class="btn-icon btn-icon-danger"
                  type="button"
                  title="Hapus"
                  @click="openDelete(rp)"
                >
                  <i class="pi pi-trash" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div v-if="pagination && pagination.totalPages > 1" class="rp-pagination">
          <button
            class="rp-page-btn"
            type="button"
            :disabled="!pagination.hasPrevPage"
            @click="changePage(currentPage - 1)"
          >
            <i class="pi pi-chevron-left" />
          </button>
          <button
            v-for="p in pageNumbers"
            :key="String(p)"
            class="rp-page-btn"
            type="button"
            :class="{ 'is-active': p === currentPage, 'is-ellipsis': p === '...' }"
            :disabled="p === '...'"
            @click="typeof p === 'number' && changePage(p)"
          >
            {{ p }}
          </button>
          <button
            class="rp-page-btn"
            type="button"
            :disabled="!pagination.hasNextPage"
            @click="changePage(currentPage + 1)"
          >
            <i class="pi pi-chevron-right" />
          </button>
        </div>

        <div v-if="pagination" class="rp-total-count">
          Menampilkan {{ programs.length }} dari {{ pagination.totalItems }} program
        </div>
      </template>
    </div>

    <!-- ─── Create / Edit Dialog ──────────────────────────────────────────────── -->
    <Dialog
      v-model:visible="showFormDialog"
      modal
      :header="editTarget ? 'Edit Program Risiko' : 'Tambah Program Risiko'"
      :style="{ width: '540px' }"
    >
      <form class="rp-form" @submit.prevent="submitForm">

        <div class="form-group">
          <label class="form-label">Nama Program <span class="req">*</span></label>
          <input
            v-model="form.name"
            class="rp-field-input"
            :class="{ 'is-error': formErrors.name }"
            type="text"
            placeholder="Nama program manajemen risiko"
            autocomplete="off"
          />
          <span v-if="formErrors.name" class="form-err">{{ formErrors.name }}</span>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Tahun <span class="req">*</span></label>
            <input
              v-model.number="form.year"
              class="rp-field-input"
              :class="{ 'is-error': formErrors.year }"
              type="number"
              placeholder="2025"
              min="2000"
              max="2100"
              autocomplete="off"
            />
            <span v-if="formErrors.year" class="form-err">{{ formErrors.year }}</span>
          </div>

          <div class="form-group">
            <label class="form-label">Status</label>
            <select v-model="form.status" class="rp-field-input rp-field-select">
              <option v-for="(label, val) in RISK_PROGRAM_STATUS_LABELS" :key="val" :value="val">
                {{ label }}
              </option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Framework <span class="req">*</span></label>
          <select
            v-model="form.frameworkId"
            class="rp-field-input rp-field-select"
            :class="{ 'is-error': formErrors.frameworkId }"
          >
            <option value="">— Pilih Framework —</option>
            <option v-for="fw in activeFrameworks" :key="fw.id" :value="fw.id">
              {{ fw.code }} — {{ fw.name }}
            </option>
          </select>
          <span v-if="formErrors.frameworkId" class="form-err">{{ formErrors.frameworkId }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">Deskripsi <span class="form-opt">(opsional)</span></label>
          <textarea
            v-model="form.description"
            class="rp-field-input rp-field-textarea"
            placeholder="Deskripsi singkat mengenai program risiko ini..."
            rows="3"
            autocomplete="off"
          />
        </div>

        <div v-if="formApiError" class="rp-alert-error">
          <i class="pi pi-exclamation-triangle" />
          {{ formApiError }}
        </div>

        <div class="rp-form-actions">
          <Button
            label="Batal"
            severity="secondary"
            type="button"
            :disabled="formLoading"
            @click="showFormDialog = false"
          />
          <Button
            :label="editTarget ? 'Simpan Perubahan' : 'Tambah'"
            type="submit"
            :loading="formLoading"
          />
        </div>
      </form>
    </Dialog>

    <!-- ─── Delete Confirmation Dialog ───────────────────────────────────────── -->
    <Dialog
      v-model:visible="showDeleteDialog"
      modal
      header="Hapus Program Risiko"
      :style="{ width: '420px' }"
    >
      <div class="del-body">
        <div class="del-icon-wrap">
          <i class="pi pi-exclamation-triangle" />
        </div>
        <p class="del-text">
          Hapus program <strong>{{ deleteTarget?.name }}</strong>?
        </p>
        <p class="del-warn">
          Tindakan ini tidak dapat dibatalkan. Program tidak dapat dihapus jika masih memiliki
          konteks risiko yang terkait.
        </p>
        <div v-if="deleteApiError" class="rp-alert-error">
          <i class="pi pi-exclamation-triangle" />
          {{ deleteApiError }}
        </div>
      </div>
      <template #footer>
        <Button
          label="Batal"
          severity="secondary"
          :disabled="deleteLoading"
          @click="showDeleteDialog = false"
        />
        <Button
          label="Hapus"
          severity="danger"
          :loading="deleteLoading"
          @click="submitDelete"
        />
      </template>
    </Dialog>

    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import {
  riskProgramApi,
  RISK_PROGRAM_STATUS_LABELS,
  type RiskProgram,
  type PaginationMeta,
} from '@/api/riskProgram'
import { frameworkApi, type Framework } from '@/api/framework'
import { extractApiError } from '@/utils/apiError'

const toast = useToast()

// ─── Framework list (for dropdowns) ──────────────────────────────────────────

const frameworks = ref<Framework[]>([])

const activeFrameworks = computed(() => frameworks.value.filter((fw) => fw.isActive))

async function loadFrameworks() {
  try {
    const res = await frameworkApi.search({ limit: 100 })
    frameworks.value = res.data.data ?? []
  } catch {
    // non-critical; dropdown will be empty
  }
}

// ─── Year options ─────────────────────────────────────────────────────────────

const currentYear = new Date().getFullYear()
const yearOptions = computed(() => {
  const years: number[] = []
  for (let y = currentYear + 1; y >= 2020; y--) years.push(y)
  return years
})

// ─── List state ───────────────────────────────────────────────────────────────

const programs = ref<RiskProgram[]>([])
const pagination = ref<PaginationMeta | null>(null)
const loading = ref(false)
const fetchError = ref('')
const searchQuery = ref('')
const filterYear = ref<number | ''>('')
const filterFrameworkId = ref('')
const filterStatus = ref('')
const currentPage = ref(1)
const PAGE_LIMIT = 15

let searchTimer: ReturnType<typeof setTimeout> | null = null

// ─── Form / dialog state ──────────────────────────────────────────────────────

const showFormDialog = ref(false)
const editTarget = ref<RiskProgram | null>(null)
const formLoading = ref(false)
const formApiError = ref('')
const form = reactive({
  name: '',
  description: '',
  year: currentYear,
  frameworkId: '',
  status: 'DRAFT' as RiskProgram['status'],
})
const formErrors = reactive({ name: '', year: '', frameworkId: '' })

const showDeleteDialog = ref(false)
const deleteTarget = ref<RiskProgram | null>(null)
const deleteLoading = ref(false)
const deleteApiError = ref('')

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchData() {
  loading.value = true
  fetchError.value = ''
  try {
    const params: Record<string, any> = { page: currentPage.value, limit: PAGE_LIMIT }
    if (searchQuery.value) params.name = searchQuery.value
    if (filterYear.value !== '') params.year = filterYear.value
    if (filterFrameworkId.value) params.frameworkId = filterFrameworkId.value
    if (filterStatus.value) params.status = filterStatus.value

    const res = await riskProgramApi.search(params)
    programs.value = res.data.data ?? []
    pagination.value = res.data.pagination ?? null
  } catch (err: any) {
    fetchError.value = extractApiError(err, 'Gagal memuat data program risiko.')
  } finally {
    loading.value = false
  }
}

function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    fetchData()
  }, 400)
}

function onFilterChange() {
  currentPage.value = 1
  fetchData()
}

function clearSearch() {
  searchQuery.value = ''
  currentPage.value = 1
  fetchData()
}

function changePage(page: number) {
  currentPage.value = page
  fetchData()
}

// ─── Pagination numbers ───────────────────────────────────────────────────────

const pageNumbers = computed<(number | string)[]>(() => {
  if (!pagination.value) return []
  const total = pagination.value.totalPages
  const cur = currentPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | string)[] = [1]
  if (cur > 3) pages.push('...')
  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i)
  if (cur < total - 2) pages.push('...')
  pages.push(total)
  return pages
})

// ─── Create / Edit ────────────────────────────────────────────────────────────

function resetForm() {
  form.name = ''
  form.description = ''
  form.year = currentYear
  form.frameworkId = ''
  form.status = 'DRAFT'
  formErrors.name = ''
  formErrors.year = ''
  formErrors.frameworkId = ''
  formApiError.value = ''
}

function openCreate() {
  editTarget.value = null
  resetForm()
  showFormDialog.value = true
}

function openEdit(rp: RiskProgram) {
  editTarget.value = rp
  form.name = rp.name
  form.description = rp.description ?? ''
  form.year = rp.year
  form.frameworkId = rp.frameworkId
  form.status = rp.status
  formErrors.name = ''
  formErrors.year = ''
  formErrors.frameworkId = ''
  formApiError.value = ''
  showFormDialog.value = true
}

function validateForm(): boolean {
  formErrors.name = ''
  formErrors.year = ''
  formErrors.frameworkId = ''
  let valid = true

  if (!form.name.trim()) {
    formErrors.name = 'Nama program risiko wajib diisi'
    valid = false
  } else if (form.name.trim().length < 2) {
    formErrors.name = 'Nama minimal 2 karakter'
    valid = false
  }

  if (!form.year) {
    formErrors.year = 'Tahun wajib diisi'
    valid = false
  } else if (form.year < 2000 || form.year > 2100) {
    formErrors.year = 'Tahun harus antara 2000 dan 2100'
    valid = false
  }

  if (!form.frameworkId) {
    formErrors.frameworkId = 'Framework wajib dipilih'
    valid = false
  }

  return valid
}

async function submitForm() {
  if (!validateForm()) return
  formLoading.value = true
  formApiError.value = ''
  try {
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      year: form.year,
      frameworkId: form.frameworkId,
      status: form.status,
    }

    if (editTarget.value) {
      await riskProgramApi.update(editTarget.value.id, payload)
      toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Program risiko berhasil diperbarui', life: 3000 })
    } else {
      await riskProgramApi.create(payload)
      toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Program risiko berhasil ditambahkan', life: 3000 })
    }
    showFormDialog.value = false
    fetchData()
  } catch (err: any) {
    formApiError.value = extractApiError(err, 'Terjadi kesalahan. Coba lagi.')
  } finally {
    formLoading.value = false
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

function openDelete(rp: RiskProgram) {
  deleteTarget.value = rp
  deleteApiError.value = ''
  showDeleteDialog.value = true
}

async function submitDelete() {
  if (!deleteTarget.value) return
  deleteLoading.value = true
  deleteApiError.value = ''
  try {
    await riskProgramApi.remove(deleteTarget.value.id)
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Program risiko berhasil dihapus', life: 3000 })
    showDeleteDialog.value = false
    if (programs.value.length === 1 && currentPage.value > 1) currentPage.value--
    fetchData()
  } catch (err: any) {
    deleteApiError.value = extractApiError(err, 'Gagal menghapus program risiko.')
  } finally {
    deleteLoading.value = false
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

onMounted(() => {
  loadFrameworks()
  fetchData()
})
</script>

<style scoped>
/* ─── Page layout ─────────────────────────────────────────────────────────── */

.rp-page {
  padding: 2rem;
  max-width: 1100px;
  margin: 0 auto;
}

.rp-page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.75rem;
}

.rp-page-title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text);
  margin: 0 0 0.35rem;
}

.rp-page-desc {
  font-size: 13px;
  color: var(--color-text-dim);
  margin: 0;
}

/* ─── Filter row ──────────────────────────────────────────────────────────── */

.rp-filter-row {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.rp-search-wrap {
  position: relative;
  width: 260px;
}

.rp-search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: var(--color-text-muted);
  pointer-events: none;
}

.rp-input {
  width: 100%;
  padding: 7px 10px;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
}

.rp-input:focus {
  border-color: var(--color-accent);
}

.rp-input::placeholder {
  color: var(--color-text-muted);
}

.rp-search-input {
  padding-left: 30px;
  padding-right: 28px;
}

.rp-search-clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 2px;
  font-size: 11px;
  display: flex;
  align-items: center;
}

.rp-search-clear:hover {
  color: var(--color-text);
}

.rp-select {
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

.rp-select:focus {
  border-color: var(--color-accent);
}

/* ─── Table ───────────────────────────────────────────────────────────────── */

.rp-table-wrap {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.rp-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.rp-table th {
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

.rp-th-center {
  text-align: center;
}

.rp-table td {
  padding: 12px 16px;
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.rp-table tbody tr:last-child td {
  border-bottom: none;
}

.rp-table tbody tr:hover td {
  background: rgba(0, 229, 184, 0.02);
}

.rp-td-name {
  max-width: 280px;
}

.rp-name {
  display: block;
  font-weight: 500;
}

.rp-desc-snippet {
  display: block;
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 260px;
}

.rp-td-framework {
  min-width: 160px;
}

.rp-fw-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 7px;
  font-size: 10px;
  font-family: var(--font-mono);
  font-weight: 500;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-accent);
  letter-spacing: 0.05em;
  margin-right: 6px;
}

.rp-fw-name {
  font-size: 12px;
  color: var(--color-text-dim);
}

.rp-td-center {
  text-align: center;
}

.rp-td-actions {
  white-space: nowrap;
}

.rp-year-badge {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}

.rp-count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 20px;
  padding: 0 6px;
  font-size: 11px;
  font-family: var(--font-mono);
  font-weight: 500;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: 100px;
  color: var(--color-text-dim);
}

.rp-status-chip {
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

.chip-active {
  background: rgba(0, 229, 184, 0.12);
  color: var(--color-accent);
  border: 1px solid rgba(0, 229, 184, 0.25);
}

.chip-closed {
  background: rgba(251, 146, 60, 0.1);
  color: #fb923c;
  border: 1px solid rgba(251, 146, 60, 0.25);
}

.chip-archived {
  background: var(--color-bg-input);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
}

/* ─── Row action buttons ──────────────────────────────────────────────────── */

.btn-icon {
  width: 28px;
  height: 28px;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-dim);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.15s;
}

.btn-icon:hover {
  background: var(--color-accent-glow);
  border-color: rgba(0, 229, 184, 0.2);
  color: var(--color-accent);
}

.btn-icon-danger:hover {
  background: var(--color-danger-dim);
  border-color: rgba(255, 77, 109, 0.3);
  color: var(--color-danger);
}

/* ─── Pagination ──────────────────────────────────────────────────────────── */

.rp-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--color-border);
}

.rp-page-btn {
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

.rp-page-btn:hover:not(:disabled) {
  background: var(--color-accent-glow);
  border-color: rgba(0, 229, 184, 0.2);
  color: var(--color-accent);
}

.rp-page-btn.is-active {
  background: var(--color-accent-glow);
  border-color: rgba(0, 229, 184, 0.3);
  color: var(--color-accent);
  font-weight: 600;
}

.rp-page-btn.is-ellipsis,
.rp-page-btn:disabled {
  cursor: default;
  opacity: 0.4;
}

.rp-total-count {
  padding: 0.6rem 1rem;
  font-size: 11px;
  color: var(--color-text-muted);
  text-align: right;
  border-top: 1px solid var(--color-border);
}

/* ─── State indicators ────────────────────────────────────────────────────── */

.rp-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;
}

.rp-error-banner {
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

.rp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
  font-size: 13px;
}

.rp-empty .pi {
  font-size: 1.75rem;
  opacity: 0.4;
}

/* ─── Form (inside dialog) ────────────────────────────────────────────────── */

.rp-form {
  display: flex;
  flex-direction: column;
  padding: 0.25rem 0;
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
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

.rp-field-input {
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

.rp-field-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px var(--color-accent-glow);
}

.rp-field-input::placeholder {
  color: var(--color-text-muted);
}

.rp-field-input.is-error {
  border-color: var(--color-danger);
}

.rp-field-select {
  cursor: pointer;
}

.rp-field-textarea {
  resize: vertical;
  min-height: 72px;
  line-height: 1.6;
}

.form-err {
  font-size: 11px;
  color: #ff8fa3;
}

.rp-alert-error {
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

.rp-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

/* ─── Delete dialog ───────────────────────────────────────────────────────── */

.del-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 0.5rem 0 1rem;
  gap: 0.75rem;
}

.del-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--color-danger-dim);
  border: 1px solid rgba(255, 77, 109, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.del-icon-wrap .pi {
  font-size: 1.4rem;
  color: var(--color-danger);
}

.del-text {
  font-size: 14px;
  color: var(--color-text);
  margin: 0;
}

.del-warn {
  font-size: 12px;
  color: var(--color-text-dim);
  margin: 0;
  line-height: 1.6;
  max-width: 340px;
}
</style>
