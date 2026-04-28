<template>
  <div class="settings-section">

    <!-- ─── Header ─────────────────────────────────────────────────────────── -->
    <div class="fw-header">
      <div>
        <h2 class="settings-section-title">Framework</h2>
        <p class="settings-section-desc">
          Kelola daftar framework manajemen risiko yang digunakan dalam sistem.
        </p>
      </div>
      <Button label="Tambah" icon="pi pi-plus" size="small" @click="openCreate" />
    </div>

    <div class="settings-section-divider" />

    <!-- ─── Filter ────────────────────────────────────────────────────────── -->
    <div class="fw-filter-row">
      <div class="fw-search-wrap">
        <i class="pi pi-search fw-search-icon" />
        <input
          v-model="searchQuery"
          class="fw-search-input"
          type="text"
          placeholder="Cari nama atau kode framework..."
          @input="onSearchInput"
        />
        <button v-if="searchQuery" class="fw-search-clear" type="button" @click="clearSearch">
          <i class="pi pi-times" />
        </button>
      </div>

      <div class="fw-filter-status">
        <select v-model="filterActive" class="fw-select" @change="onFilterChange">
          <option value="">Semua Status</option>
          <option value="true">Aktif</option>
          <option value="false">Tidak Aktif</option>
        </select>
      </div>
    </div>

    <!-- ─── Table ─────────────────────────────────────────────────────────── -->
    <div class="fw-table-wrap">
      <div v-if="loading" class="fw-loading">
        <ProgressSpinner style="width: 32px; height: 32px" />
      </div>
      <div v-else-if="fetchError" class="fw-error-banner">
        <i class="pi pi-exclamation-circle" />
        {{ fetchError }}
      </div>
      <template v-else>
        <table class="fw-table">
          <thead>
            <tr>
              <th>Kode</th>
              <th>Nama</th>
              <th>Versi</th>
              <th class="fw-th-count">Program</th>
              <th class="fw-th-status">Status</th>
              <th class="fw-th-actions">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="frameworks.length === 0">
              <td colspan="6">
                <div class="fw-empty">
                  <i class="pi pi-inbox" />
                  <span>Tidak ada data ditemukan</span>
                </div>
              </td>
            </tr>
            <tr v-for="fw in frameworks" :key="fw.id">
              <td class="fw-td-code">
                <span class="fw-code-badge">{{ fw.code }}</span>
              </td>
              <td class="fw-td-name">{{ fw.name }}</td>
              <td class="fw-td-version">
                <span v-if="fw.version">{{ fw.version }}</span>
                <span v-else class="fw-td-empty">—</span>
              </td>
              <td class="fw-td-count">
                <span class="fw-count-badge">{{ fw._count?.riskPrograms ?? 0 }}</span>
              </td>
              <td class="fw-td-status">
                <span class="fw-status-chip" :class="fw.isActive ? 'chip-active' : 'chip-inactive'">
                  {{ fw.isActive ? 'Aktif' : 'Tidak Aktif' }}
                </span>
              </td>
              <td class="fw-td-actions">
                <button class="btn-icon" type="button" title="Edit" @click="openEdit(fw)">
                  <i class="pi pi-pencil" />
                </button>
                <button
                  v-if="fw.isActive"
                  class="btn-icon btn-icon-warn"
                  type="button"
                  title="Nonaktifkan"
                  @click="openToggle(fw, false)"
                >
                  <i class="pi pi-ban" />
                </button>
                <button
                  v-else
                  class="btn-icon btn-icon-success"
                  type="button"
                  title="Aktifkan"
                  @click="openToggle(fw, true)"
                >
                  <i class="pi pi-check-circle" />
                </button>
                <button
                  class="btn-icon btn-icon-danger"
                  type="button"
                  title="Hapus"
                  @click="openDelete(fw)"
                >
                  <i class="pi pi-trash" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div v-if="pagination && pagination.totalPages > 1" class="fw-pagination">
          <button
            class="fw-page-btn"
            type="button"
            :disabled="!pagination.hasPrevPage"
            @click="changePage(currentPage - 1)"
          >
            <i class="pi pi-chevron-left" />
          </button>
          <button
            v-for="p in pageNumbers"
            :key="String(p)"
            class="fw-page-btn"
            type="button"
            :class="{ 'is-active': p === currentPage, 'is-ellipsis': p === '...' }"
            :disabled="p === '...'"
            @click="typeof p === 'number' && changePage(p)"
          >
            {{ p }}
          </button>
          <button
            class="fw-page-btn"
            type="button"
            :disabled="!pagination.hasNextPage"
            @click="changePage(currentPage + 1)"
          >
            <i class="pi pi-chevron-right" />
          </button>
        </div>

        <div v-if="pagination" class="fw-total-count">
          Menampilkan {{ frameworks.length }} dari {{ pagination.totalItems }} framework
        </div>
      </template>
    </div>

    <!-- ─── Create / Edit Dialog ──────────────────────────────────────────── -->
    <Dialog
      v-model:visible="showFormDialog"
      modal
      :header="editTarget ? 'Edit Framework' : 'Tambah Framework'"
      :style="{ width: '500px' }"
    >
      <form class="fw-form" @submit.prevent="submitForm">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Kode <span class="req">*</span></label>
            <input
              v-model="form.code"
              class="fw-input"
              :class="{ 'is-error': formErrors.code }"
              type="text"
              placeholder="Cth: ISO-31000"
              autocomplete="off"
              style="text-transform: uppercase"
              @input="form.code = (form.code as string).toUpperCase()"
            />
            <span v-if="formErrors.code" class="form-err">{{ formErrors.code }}</span>
          </div>

          <div class="form-group">
            <label class="form-label">Versi <span class="form-opt">(opsional)</span></label>
            <input
              v-model="form.version"
              class="fw-input"
              type="text"
              placeholder="Cth: 2018"
              autocomplete="off"
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Nama <span class="req">*</span></label>
          <input
            v-model="form.name"
            class="fw-input"
            :class="{ 'is-error': formErrors.name }"
            type="text"
            placeholder="Nama lengkap framework"
            autocomplete="off"
          />
          <span v-if="formErrors.name" class="form-err">{{ formErrors.name }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">Deskripsi <span class="form-opt">(opsional)</span></label>
          <textarea
            v-model="form.description"
            class="fw-input fw-textarea"
            placeholder="Deskripsi singkat framework ini..."
            rows="3"
            autocomplete="off"
          />
        </div>

        <div v-if="formApiError" class="fw-alert-error">
          <i class="pi pi-exclamation-triangle" />
          {{ formApiError }}
        </div>

        <div class="fw-form-actions">
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

    <!-- ─── Toggle Active/Inactive Dialog ────────────────────────────────── -->
    <Dialog
      v-model:visible="showToggleDialog"
      modal
      :header="toggleActivate ? 'Aktifkan Framework' : 'Nonaktifkan Framework'"
      :style="{ width: '420px' }"
    >
      <div class="del-body">
        <div class="del-icon-wrap" :class="toggleActivate ? 'del-icon-success' : 'del-icon-warn'">
          <i :class="toggleActivate ? 'pi pi-check-circle' : 'pi pi-ban'" />
        </div>
        <p class="del-text">
          {{ toggleActivate ? 'Aktifkan' : 'Nonaktifkan' }} framework
          <strong>{{ toggleTarget?.name }}</strong>?
        </p>
        <p class="del-warn">
          {{
            toggleActivate
              ? 'Framework akan dapat digunakan untuk program risiko baru.'
              : 'Framework tidak akan tersedia untuk program risiko baru.'
          }}
        </p>
        <div v-if="toggleApiError" class="fw-alert-error">
          <i class="pi pi-exclamation-triangle" />
          {{ toggleApiError }}
        </div>
      </div>
      <template #footer>
        <Button
          label="Batal"
          severity="secondary"
          :disabled="toggleLoading"
          @click="showToggleDialog = false"
        />
        <Button
          :label="toggleActivate ? 'Aktifkan' : 'Nonaktifkan'"
          :severity="toggleActivate ? 'success' : 'warn'"
          :loading="toggleLoading"
          @click="submitToggle"
        />
      </template>
    </Dialog>

    <!-- ─── Delete Confirmation Dialog ───────────────────────────────────── -->
    <Dialog
      v-model:visible="showDeleteDialog"
      modal
      header="Hapus Framework"
      :style="{ width: '420px' }"
    >
      <div class="del-body">
        <div class="del-icon-wrap">
          <i class="pi pi-exclamation-triangle" />
        </div>
        <p class="del-text">
          Hapus framework <strong>{{ deleteTarget?.name }}</strong>?
        </p>
        <p class="del-warn">
          Tindakan ini tidak dapat dibatalkan. Framework tidak dapat dihapus jika masih
          memiliki program risiko yang terkait.
        </p>
        <div v-if="deleteApiError" class="fw-alert-error">
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
        <Button label="Hapus" severity="danger" :loading="deleteLoading" @click="submitDelete" />
      </template>
    </Dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'
import { frameworkApi, type Framework, type PaginationMeta } from '@/api/framework'
import { extractApiError } from '@/utils/apiError'

const toast = useToast()

// ─── List state ───────────────────────────────────────────────────────────────

const frameworks = ref<Framework[]>([])
const pagination = ref<PaginationMeta | null>(null)
const loading = ref(false)
const fetchError = ref('')
const searchQuery = ref('')
const filterActive = ref('')
const currentPage = ref(1)
const PAGE_LIMIT = 15

let searchTimer: ReturnType<typeof setTimeout> | null = null

// ─── Form / dialog state ──────────────────────────────────────────────────────

const showFormDialog = ref(false)
const editTarget = ref<Framework | null>(null)
const formLoading = ref(false)
const formApiError = ref('')
const form = reactive({ code: '', name: '', version: '', description: '' })
const formErrors = reactive({ code: '', name: '' })

const showToggleDialog = ref(false)
const toggleTarget = ref<Framework | null>(null)
const toggleActivate = ref(false)
const toggleLoading = ref(false)
const toggleApiError = ref('')

const showDeleteDialog = ref(false)
const deleteTarget = ref<Framework | null>(null)
const deleteLoading = ref(false)
const deleteApiError = ref('')

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchData() {
  loading.value = true
  fetchError.value = ''
  try {
    const params: Record<string, any> = {
      page: currentPage.value,
      limit: PAGE_LIMIT,
    }
    if (searchQuery.value) params.name = searchQuery.value
    if (filterActive.value !== '') params.isActive = filterActive.value === 'true'

    const res = await frameworkApi.search(params)
    frameworks.value = res.data.data ?? []
    pagination.value = res.data.pagination ?? null
  } catch (err: any) {
    fetchError.value = extractApiError(err, 'Gagal memuat data framework.')
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

function openCreate() {
  editTarget.value = null
  form.code = ''
  form.name = ''
  form.version = ''
  form.description = ''
  formErrors.code = ''
  formErrors.name = ''
  formApiError.value = ''
  showFormDialog.value = true
}

function openEdit(fw: Framework) {
  editTarget.value = fw
  form.code = fw.code
  form.name = fw.name
  form.version = fw.version ?? ''
  form.description = fw.description ?? ''
  formErrors.code = ''
  formErrors.name = ''
  formApiError.value = ''
  showFormDialog.value = true
}

function validateForm(): boolean {
  formErrors.code = ''
  formErrors.name = ''
  let valid = true

  if (!form.code.trim()) {
    formErrors.code = 'Kode framework wajib diisi'
    valid = false
  } else if (!/^[A-Z0-9_-]+$/.test(form.code.trim())) {
    formErrors.code = 'Kode hanya boleh mengandung huruf kapital, angka, underscore, dan dash'
    valid = false
  } else if (form.code.trim().length < 2) {
    formErrors.code = 'Kode minimal 2 karakter'
    valid = false
  }

  if (!form.name.trim()) {
    formErrors.name = 'Nama framework wajib diisi'
    valid = false
  } else if (form.name.trim().length < 2) {
    formErrors.name = 'Nama minimal 2 karakter'
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
      code: form.code.trim(),
      name: form.name.trim(),
      version: form.version.trim() || undefined,
      description: form.description.trim() || undefined,
    }

    if (editTarget.value) {
      await frameworkApi.update(editTarget.value.id, payload)
      toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Framework berhasil diperbarui', life: 3000 })
    } else {
      await frameworkApi.create(payload as { code: string; name: string; version?: string; description?: string })
      toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Framework berhasil ditambahkan', life: 3000 })
    }
    showFormDialog.value = false
    fetchData()
  } catch (err: any) {
    formApiError.value = extractApiError(err, 'Terjadi kesalahan. Coba lagi.')
  } finally {
    formLoading.value = false
  }
}

// ─── Toggle activate / deactivate ────────────────────────────────────────────

function openToggle(fw: Framework, activate: boolean) {
  toggleTarget.value = fw
  toggleActivate.value = activate
  toggleApiError.value = ''
  showToggleDialog.value = true
}

async function submitToggle() {
  if (!toggleTarget.value) return
  toggleLoading.value = true
  toggleApiError.value = ''
  try {
    if (toggleActivate.value) {
      await frameworkApi.activate(toggleTarget.value.id)
      toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Framework berhasil diaktifkan', life: 3000 })
    } else {
      await frameworkApi.deactivate(toggleTarget.value.id)
      toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Framework berhasil dinonaktifkan', life: 3000 })
    }
    showToggleDialog.value = false
    fetchData()
  } catch (err: any) {
    toggleApiError.value = extractApiError(err, 'Terjadi kesalahan. Coba lagi.')
  } finally {
    toggleLoading.value = false
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

function openDelete(fw: Framework) {
  deleteTarget.value = fw
  deleteApiError.value = ''
  showDeleteDialog.value = true
}

async function submitDelete() {
  if (!deleteTarget.value) return
  deleteLoading.value = true
  deleteApiError.value = ''
  try {
    await frameworkApi.remove(deleteTarget.value.id)
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Framework berhasil dihapus', life: 3000 })
    showDeleteDialog.value = false
    if (frameworks.value.length === 1 && currentPage.value > 1) {
      currentPage.value--
    }
    fetchData()
  } catch (err: any) {
    deleteApiError.value = extractApiError(err, 'Gagal menghapus framework.')
  } finally {
    deleteLoading.value = false
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

onMounted(fetchData)
</script>

<style scoped>
/* ─── Section layout ──────────────────────────────────────────────────────── */

.fw-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
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

/* ─── Filter ──────────────────────────────────────────────────────────────── */

.fw-filter-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.fw-search-wrap {
  position: relative;
  width: 300px;
}

.fw-search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: var(--color-text-muted);
  pointer-events: none;
}

.fw-search-input {
  width: 100%;
  padding: 7px 30px 7px 30px;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
}

.fw-search-input:focus {
  border-color: var(--color-accent);
}

.fw-search-input::placeholder {
  color: var(--color-text-muted);
}

.fw-search-clear {
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

.fw-search-clear:hover {
  color: var(--color-text);
}

.fw-select {
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

.fw-select:focus {
  border-color: var(--color-accent);
}

/* ─── Table ───────────────────────────────────────────────────────────────── */

.fw-table-wrap {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.fw-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.fw-table th {
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

.fw-table td {
  padding: 11px 16px;
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.fw-table tbody tr:last-child td {
  border-bottom: none;
}

.fw-table tbody tr:hover td {
  background: rgba(0, 229, 184, 0.02);
}

.fw-th-count,
.fw-th-status,
.fw-th-actions {
  text-align: center;
}

.fw-th-count { width: 80px; }
.fw-th-status { width: 110px; }
.fw-th-actions { width: 100px; }

.fw-td-code {
  width: 140px;
}

.fw-code-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  font-size: 11px;
  font-family: var(--font-mono);
  font-weight: 500;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-accent);
  letter-spacing: 0.05em;
}

.fw-td-name {
  font-weight: 500;
}

.fw-td-version {
  color: var(--color-text-dim);
  font-size: 12px;
  font-family: var(--font-mono);
  width: 90px;
}

.fw-td-empty {
  color: var(--color-text-muted);
}

.fw-td-count {
  text-align: center;
}

.fw-count-badge {
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

.fw-td-status {
  text-align: center;
}

.fw-status-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  font-size: 11px;
  font-weight: 500;
  border-radius: 100px;
  letter-spacing: 0.04em;
}

.chip-active {
  background: rgba(0, 229, 184, 0.12);
  color: var(--color-accent);
  border: 1px solid rgba(0, 229, 184, 0.25);
}

.chip-inactive {
  background: var(--color-bg-input);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
}

.fw-td-actions {
  text-align: center;
  white-space: nowrap;
}

.fw-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
  font-size: 13px;
}

.fw-empty .pi {
  font-size: 1.75rem;
  opacity: 0.4;
}

.fw-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;
}

.fw-error-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.25rem;
  font-size: 13px;
  color: #ff8fa3;
  background: var(--color-danger-dim);
  border: 1px solid rgba(255, 77, 109, 0.3);
  border-radius: var(--radius-md);
  margin: 1rem;
}


/* ─── Pagination ──────────────────────────────────────────────────────────── */

.fw-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--color-border);
}

.fw-page-btn {
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

.fw-page-btn:hover:not(:disabled) {
  background: var(--color-accent-glow);
  border-color: rgba(0, 229, 184, 0.2);
  color: var(--color-accent);
}

.fw-page-btn.is-active {
  background: var(--color-accent-glow);
  border-color: rgba(0, 229, 184, 0.3);
  color: var(--color-accent);
  font-weight: 600;
}

.fw-page-btn.is-ellipsis,
.fw-page-btn:disabled {
  cursor: default;
  opacity: 0.4;
}

.fw-total-count {
  padding: 0.6rem 1rem;
  font-size: 11px;
  color: var(--color-text-muted);
  text-align: right;
  border-top: 1px solid var(--color-border);
}

/* ─── Form (inside dialog) ────────────────────────────────────────────────── */

.fw-form {
  display: flex;
  flex-direction: column;
  padding: 0.25rem 0;
}

.form-row {
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

.fw-input {
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

.fw-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px var(--color-accent-glow);
}

.fw-input::placeholder {
  color: var(--color-text-muted);
}

.fw-input.is-error {
  border-color: var(--color-danger);
}

.fw-textarea {
  resize: vertical;
  min-height: 72px;
  line-height: 1.6;
}

.form-err {
  font-size: 11px;
  color: #ff8fa3;
}

.fw-alert-error {
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
}

.fw-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

</style>
