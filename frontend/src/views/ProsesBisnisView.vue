<template>
  <div class="asset-page">

    <!-- ─── Page header ───────────────────────────────────────────────────── -->
    <div class="asset-page-header">
      <div>
        <h1 class="asset-page-title">Manajemen Proses Bisnis</h1>
        <p class="asset-page-desc">Pantau dan kelola proses bisnis organisasi berdasarkan unit kerja.</p>
      </div>
    </div>

    <!-- ─── Unit Kerja selector ───────────────────────────────────────────── -->
    <div v-if="isAutoFillUK" class="asset-uk-bar">
      <label class="asset-uk-label">Unit Kerja</label>
      <div v-if="ukLoading" class="asset-uk-static">
        <ProgressSpinner style="width:16px;height:16px" />
        <span>Memuat...</span>
      </div>
      <div v-else-if="myUnitKerja" class="asset-uk-static">
        <i class="pi pi-building asset-uk-static-icon" />
        <span class="asset-uk-static-name">{{ myUnitKerja.name }}</span>
        <span class="asset-uk-static-code">{{ myUnitKerja.code }}</span>
      </div>
      <div v-else class="asset-uk-static asset-uk-static-warn">
        <i class="pi pi-exclamation-triangle" />
        <span>Unit kerja belum ditetapkan. Hubungi administrator.</span>
      </div>
    </div>

    <div v-else class="asset-uk-bar">
      <label class="asset-uk-label">Unit Kerja</label>
      <div class="asset-uk-select-wrap">
        <i class="pi pi-building asset-uk-select-icon" />
        <select
          v-model="selectedUnitKerjaId"
          class="asset-uk-select"
          :disabled="ukLoading"
          @change="onUnitKerjaChange"
        >
          <option value="">— Pilih Unit Kerja —</option>
          <option v-for="uk in unitKerjas" :key="uk.id" :value="uk.id">
            {{ uk.name }} ({{ uk.code }})
          </option>
        </select>
        <i class="pi pi-chevron-down asset-uk-select-caret" />
      </div>
      <ProgressSpinner v-if="ukLoading" style="width:20px;height:20px" />
    </div>

    <!-- ─── Empty prompt ─────────────────────────────────────────────────── -->
    <div v-if="!selectedUnitKerjaId && !ukLoading" class="asset-empty-prompt">
      <i class="pi pi-sitemap asset-empty-icon" />
      <p v-if="isAutoFillUK" class="asset-empty-text">Unit kerja belum ditetapkan. Hubungi administrator.</p>
      <p v-else class="asset-empty-text">Pilih unit kerja untuk melihat daftar proses bisnis</p>
    </div>

    <!-- ─── Table section ─────────────────────────────────────────────────── -->
    <template v-else>

      <!-- Controls: filters + add button -->
      <div class="asset-controls">
        <div class="asset-filters">
          <div class="filter-search-wrap">
            <i class="pi pi-search filter-search-icon" />
            <input
              v-model="filterName"
              class="filter-input"
              type="text"
              placeholder="Cari nama atau kode..."
              @input="onFilterInput"
            />
            <button v-if="filterName" class="filter-clear" type="button" @click="clearNameFilter">
              <i class="pi pi-times" />
            </button>
          </div>

          <div class="filter-select-wrap">
            <select v-model="filterStatus" class="filter-select" @change="onFilterChange">
              <option value="">Semua Status</option>
              <option value="ACTIVE">Aktif</option>
              <option value="INACTIVE">Non-Aktif</option>
              <option value="ARCHIVED">Diarsipkan</option>
            </select>
            <i class="pi pi-chevron-down filter-select-caret" />
          </div>
        </div>

        <Button
          v-if="canWrite"
          label="Tambah Proses Bisnis"
          icon="pi pi-plus"
          size="small"
          @click="openCreate"
        />
      </div>

      <!-- Table -->
      <div class="asset-table-wrap">
        <div v-if="loading" class="asset-loading">
          <ProgressSpinner style="width:32px;height:32px" />
        </div>
        <div v-else-if="fetchError" class="asset-error-banner">
          <i class="pi pi-exclamation-circle" />
          {{ fetchError }}
        </div>
        <template v-else>
          <table class="asset-table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Kode</th>
                <th>Pemilik / PIC</th>
                <th class="asset-th-status">Status</th>
                <th v-if="canWrite" class="asset-th-actions">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="items.length === 0">
                <td :colspan="canWrite ? 5 : 4">
                  <div class="asset-empty-row">
                    <i class="pi pi-inbox" />
                    <span>Tidak ada proses bisnis ditemukan</span>
                  </div>
                </td>
              </tr>
              <tr v-for="item in items" :key="item.id">
                <td class="asset-td-name">
                  {{ item.name }}
                  <div v-if="item.description" class="asset-td-desc">{{ item.description }}</div>
                </td>
                <td><span class="asset-code-chip">{{ item.code }}</span></td>
                <td class="asset-td-dim">{{ item.owner || '—' }}</td>
                <td class="asset-th-status">
                  <span class="asset-status-chip" :class="`status-${item.status.toLowerCase()}`">
                    <span class="status-dot" />
                    {{ statusLabel(item.status) }}
                  </span>
                </td>
                <td v-if="canWrite" class="asset-td-actions">
                  <button
                    v-if="item.status !== 'ARCHIVED'"
                    class="btn-icon"
                    type="button"
                    title="Edit"
                    @click="openEdit(item)"
                  >
                    <i class="pi pi-pencil" />
                  </button>
                  <button
                    v-if="item.status === 'INACTIVE'"
                    class="btn-icon btn-icon-success"
                    type="button"
                    title="Aktifkan"
                    @click="openStatusChange(item, 'activate')"
                  >
                    <i class="pi pi-play" />
                  </button>
                  <button
                    v-if="item.status === 'ACTIVE'"
                    class="btn-icon btn-icon-warn"
                    type="button"
                    title="Nonaktifkan"
                    @click="openStatusChange(item, 'deactivate')"
                  >
                    <i class="pi pi-pause" />
                  </button>
                  <button
                    v-if="item.status === 'INACTIVE'"
                    class="btn-icon btn-icon-danger"
                    type="button"
                    title="Arsipkan"
                    @click="openArchive(item)"
                  >
                    <i class="pi pi-box" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Pagination -->
          <div v-if="pagination && pagination.totalPages > 1" class="asset-pagination">
            <button
              class="asset-page-btn"
              type="button"
              :disabled="!pagination.hasPrevPage"
              @click="changePage(currentPage - 1)"
            >
              <i class="pi pi-chevron-left" />
            </button>
            <button
              v-for="p in pageNumbers"
              :key="String(p)"
              class="asset-page-btn"
              type="button"
              :class="{ 'is-active': p === currentPage, 'is-ellipsis': p === '...' }"
              :disabled="p === '...'"
              @click="typeof p === 'number' && changePage(p)"
            >
              {{ p }}
            </button>
            <button
              class="asset-page-btn"
              type="button"
              :disabled="!pagination.hasNextPage"
              @click="changePage(currentPage + 1)"
            >
              <i class="pi pi-chevron-right" />
            </button>
          </div>

          <div v-if="pagination" class="asset-total-count">
            Menampilkan {{ items.length }} dari {{ pagination.totalItems }} proses bisnis
          </div>
        </template>
      </div>
    </template>

    <!-- ─── Create / Edit Dialog ──────────────────────────────────────────── -->
    <Dialog
      v-model:visible="showFormDialog"
      modal
      :header="editTarget ? 'Edit Proses Bisnis' : 'Tambah Proses Bisnis'"
      :style="{ width: '520px' }"
    >
      <form class="asset-form" @submit.prevent="submitForm">
        <!-- Name + Code -->
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Nama <span class="req">*</span></label>
            <input
              v-model="form.name"
              class="asset-input"
              :class="{ 'is-error': formErrors.name }"
              type="text"
              placeholder="Nama proses bisnis"
              autocomplete="off"
            />
            <span v-if="formErrors.name" class="form-err">{{ formErrors.name }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">Kode <span class="req">*</span></label>
            <input
              v-model="form.code"
              class="asset-input asset-input-mono"
              :class="{ 'is-error': formErrors.code }"
              type="text"
              placeholder="KODE-PROSES"
              autocomplete="off"
              @input="form.code = form.code.toUpperCase().replace(/[^A-Z0-9_-]/g, '')"
            />
            <span v-if="formErrors.code" class="form-err">{{ formErrors.code }}</span>
          </div>
        </div>

        <!-- Owner -->
        <div class="form-group">
          <label class="form-label">Pemilik / PIC <span class="form-opt">(opsional)</span></label>
          <input
            v-model="form.owner"
            class="asset-input"
            type="text"
            placeholder="Nama pemilik atau penanggung jawab proses"
            autocomplete="off"
          />
        </div>

        <!-- Description -->
        <div class="form-group">
          <label class="form-label">Deskripsi <span class="form-opt">(opsional)</span></label>
          <textarea
            v-model="form.description"
            class="asset-input asset-textarea"
            placeholder="Deskripsi singkat proses bisnis..."
            rows="3"
          />
        </div>

        <!-- Status (create only) -->
        <div v-if="!editTarget" class="form-group">
          <label class="form-label">Status Awal</label>
          <div class="asset-select-wrap">
            <select v-model="form.status" class="asset-select">
              <option value="ACTIVE">Aktif</option>
              <option value="INACTIVE">Non-Aktif</option>
            </select>
            <i class="pi pi-chevron-down asset-select-caret" />
          </div>
        </div>

        <div v-if="formApiError" class="asset-alert-error">
          <i class="pi pi-exclamation-triangle" />
          {{ formApiError }}
        </div>

        <div class="asset-form-actions">
          <Button
            label="Batal"
            severity="secondary"
            type="button"
            :disabled="formLoading"
            @click="showFormDialog = false"
          />
          <Button
            :label="editTarget ? 'Simpan Perubahan' : 'Tambah Proses Bisnis'"
            type="submit"
            :loading="formLoading"
          />
        </div>
      </form>
    </Dialog>

    <!-- ─── Activate / Deactivate Dialog ─────────────────────────────────── -->
    <Dialog
      v-model:visible="showStatusDialog"
      modal
      :header="statusAction === 'activate' ? 'Aktifkan Proses Bisnis' : 'Nonaktifkan Proses Bisnis'"
      :style="{ width: '400px' }"
    >
      <div class="confirm-body">
        <div class="confirm-icon-wrap" :class="statusAction === 'activate' ? 'is-success' : 'is-warn'">
          <i :class="statusAction === 'activate' ? 'pi pi-play' : 'pi pi-pause'" />
        </div>
        <p class="confirm-text">
          {{ statusAction === 'activate' ? 'Aktifkan' : 'Nonaktifkan' }} proses bisnis
          <strong>{{ statusTarget?.name }}</strong>?
        </p>
        <div v-if="statusApiError" class="asset-alert-error">
          <i class="pi pi-exclamation-triangle" />
          {{ statusApiError }}
        </div>
      </div>
      <template #footer>
        <Button
          label="Batal"
          severity="secondary"
          :disabled="statusLoading"
          @click="showStatusDialog = false"
        />
        <Button
          :label="statusAction === 'activate' ? 'Aktifkan' : 'Nonaktifkan'"
          :severity="statusAction === 'activate' ? 'success' : 'warning'"
          :loading="statusLoading"
          @click="submitStatusChange"
        />
      </template>
    </Dialog>

    <!-- ─── Archive Dialog ────────────────────────────────────────────────── -->
    <Dialog
      v-model:visible="showArchiveDialog"
      modal
      header="Arsipkan Proses Bisnis"
      :style="{ width: '420px' }"
    >
      <div class="confirm-body">
        <div class="confirm-icon-wrap is-danger">
          <i class="pi pi-box" />
        </div>
        <p class="confirm-text">
          Arsipkan proses bisnis <strong>{{ archiveTarget?.name }}</strong>?
        </p>
        <p class="confirm-warn">
          Proses bisnis yang diarsipkan tidak dapat diaktifkan kembali. Pastikan proses bisnis sudah
          benar-benar tidak digunakan sebelum diarsipkan.
        </p>
        <div v-if="archiveApiError" class="asset-alert-error">
          <i class="pi pi-exclamation-triangle" />
          {{ archiveApiError }}
        </div>
      </div>
      <template #footer>
        <Button
          label="Batal"
          severity="secondary"
          :disabled="archiveLoading"
          @click="showArchiveDialog = false"
        />
        <Button label="Arsipkan" severity="danger" :loading="archiveLoading" @click="submitArchive" />
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
import { prosesBisnisApi, type ProsesBisnis, type ProsesBisnisStatus } from '@/api/prosesBisnis'
import { unitKerjaApi, type UnitKerja } from '@/api/unitKerja'
import { useAuthStore } from '@/stores/auth'
import { usersApi } from '@/api/users'
import { extractApiError } from '@/utils/apiError'
import { usePagination } from '@/composables/usePagination'

const toast = useToast()
const auth = useAuthStore()

// ─── Roles & access ───────────────────────────────────────────────────────────

const isAutoFillUK = computed(() => auth.user?.roles.includes('USER') ?? false)
const canWrite = computed(() =>
  auth.user?.roles.some(r => ['ADMINISTRATOR', 'PENGELOLA_RISIKO_UKER'].includes(r)) ?? false
)

// ─── Unit Kerja data ──────────────────────────────────────────────────────────

const myUnitKerja = ref<{ id: string; name: string; code: string } | null>(null)
const unitKerjas = ref<UnitKerja[]>([])
const ukLoading = ref(false)
const selectedUnitKerjaId = ref('')

async function loadUnitKerjas() {
  ukLoading.value = true
  try {
    if (isAutoFillUK.value) {
      const res = await usersApi.getMyProfile()
      const uk = res.data.data.profile?.unitKerja
      if (uk) {
        myUnitKerja.value = uk
        selectedUnitKerjaId.value = uk.id
        fetchItems()
      }
    } else {
      const res = await unitKerjaApi.search({ limit: 100 })
      unitKerjas.value = res.data.data ?? []
    }
  } catch {
    // silent fail
  } finally {
    ukLoading.value = false
  }
}

// ─── List state ───────────────────────────────────────────────────────────────

const items = ref<ProsesBisnis[]>([])
const loading = ref(false)
const fetchError = ref('')
const filterName = ref('')
const filterStatus = ref('')
const { currentPage, pagination, pageNumbers, PAGE_LIMIT } = usePagination(10)

let filterTimer: ReturnType<typeof setTimeout> | null = null

function onUnitKerjaChange() {
  currentPage.value = 1
  filterName.value = ''
  filterStatus.value = ''
  items.value = []
  pagination.value = null
  fetchError.value = ''
  if (selectedUnitKerjaId.value) fetchItems()
}

async function fetchItems() {
  if (!selectedUnitKerjaId.value) return
  loading.value = true
  fetchError.value = ''
  try {
    const res = await prosesBisnisApi.search(selectedUnitKerjaId.value, {
      name: filterName.value || undefined,
      status: (filterStatus.value as ProsesBisnisStatus) || undefined,
      page: currentPage.value,
      limit: PAGE_LIMIT,
    })
    items.value = res.data.data ?? []
    pagination.value = res.data.pagination ?? null
  } catch (err: any) {
    fetchError.value = extractApiError(err, 'Gagal memuat data proses bisnis.')
  } finally {
    loading.value = false
  }
}

function onFilterInput() {
  if (filterTimer) clearTimeout(filterTimer)
  filterTimer = setTimeout(() => {
    currentPage.value = 1
    fetchItems()
  }, 400)
}

function onFilterChange() {
  currentPage.value = 1
  fetchItems()
}

function clearNameFilter() {
  filterName.value = ''
  currentPage.value = 1
  fetchItems()
}

function changePage(page: number) {
  currentPage.value = page
  fetchItems()
}

// ─── Status helpers ───────────────────────────────────────────────────────────

function statusLabel(status: ProsesBisnisStatus) {
  return { ACTIVE: 'Aktif', INACTIVE: 'Non-Aktif', ARCHIVED: 'Diarsipkan' }[status]
}

// ─── Create / Edit ────────────────────────────────────────────────────────────

const showFormDialog = ref(false)
const editTarget = ref<ProsesBisnis | null>(null)
const formLoading = ref(false)
const formApiError = ref('')
const form = reactive({ name: '', code: '', owner: '', description: '', status: 'ACTIVE' as ProsesBisnisStatus })
const formErrors = reactive({ name: '', code: '' })

function resetForm() {
  form.name = ''
  form.code = ''
  form.owner = ''
  form.description = ''
  form.status = 'ACTIVE'
  formErrors.name = ''
  formErrors.code = ''
  formApiError.value = ''
}

function openCreate() {
  editTarget.value = null
  resetForm()
  showFormDialog.value = true
}

function openEdit(item: ProsesBisnis) {
  editTarget.value = item
  form.name = item.name
  form.code = item.code
  form.owner = item.owner ?? ''
  form.description = item.description ?? ''
  form.status = item.status
  formErrors.name = ''
  formErrors.code = ''
  formApiError.value = ''
  showFormDialog.value = true
}

function validateForm(): boolean {
  let valid = true
  formErrors.name = ''
  formErrors.code = ''

  if (!form.name.trim()) {
    formErrors.name = 'Nama proses bisnis wajib diisi'
    valid = false
  } else if (form.name.trim().length < 2) {
    formErrors.name = 'Nama minimal 2 karakter'
    valid = false
  }

  if (!form.code) {
    formErrors.code = 'Kode proses bisnis wajib diisi'
    valid = false
  } else if (!/^[A-Z0-9_-]{2,}$/.test(form.code)) {
    formErrors.code = 'Kode hanya boleh berisi huruf kapital, angka, underscore, atau dash'
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
      code: form.code,
      owner: form.owner.trim() || undefined,
      description: form.description.trim() || undefined,
    }

    if (editTarget.value) {
      await prosesBisnisApi.update(selectedUnitKerjaId.value, editTarget.value.id, payload)
      toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Proses bisnis berhasil diperbarui', life: 3000 })
    } else {
      await prosesBisnisApi.create(selectedUnitKerjaId.value, { ...payload, status: form.status })
      toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Proses bisnis berhasil ditambahkan', life: 3000 })
    }
    showFormDialog.value = false
    fetchItems()
  } catch (err: any) {
    formApiError.value = extractApiError(err, 'Terjadi kesalahan. Coba lagi.')
  } finally {
    formLoading.value = false
  }
}

// ─── Activate / Deactivate ────────────────────────────────────────────────────

const showStatusDialog = ref(false)
const statusAction = ref<'activate' | 'deactivate'>('activate')
const statusTarget = ref<ProsesBisnis | null>(null)
const statusLoading = ref(false)
const statusApiError = ref('')

function openStatusChange(item: ProsesBisnis, action: 'activate' | 'deactivate') {
  statusTarget.value = item
  statusAction.value = action
  statusApiError.value = ''
  showStatusDialog.value = true
}

async function submitStatusChange() {
  if (!statusTarget.value) return
  statusLoading.value = true
  statusApiError.value = ''
  try {
    if (statusAction.value === 'activate') {
      await prosesBisnisApi.activate(selectedUnitKerjaId.value, statusTarget.value.id)
      toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Proses bisnis berhasil diaktifkan', life: 3000 })
    } else {
      await prosesBisnisApi.deactivate(selectedUnitKerjaId.value, statusTarget.value.id)
      toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Proses bisnis berhasil dinonaktifkan', life: 3000 })
    }
    showStatusDialog.value = false
    fetchItems()
  } catch (err: any) {
    statusApiError.value = extractApiError(err, 'Terjadi kesalahan. Coba lagi.')
  } finally {
    statusLoading.value = false
  }
}

// ─── Archive ──────────────────────────────────────────────────────────────────

const showArchiveDialog = ref(false)
const archiveTarget = ref<ProsesBisnis | null>(null)
const archiveLoading = ref(false)
const archiveApiError = ref('')

function openArchive(item: ProsesBisnis) {
  archiveTarget.value = item
  archiveApiError.value = ''
  showArchiveDialog.value = true
}

async function submitArchive() {
  if (!archiveTarget.value) return
  archiveLoading.value = true
  archiveApiError.value = ''
  try {
    await prosesBisnisApi.archive(selectedUnitKerjaId.value, archiveTarget.value.id)
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Proses bisnis berhasil diarsipkan', life: 3000 })
    showArchiveDialog.value = false
    fetchItems()
  } catch (err: any) {
    archiveApiError.value = extractApiError(err, 'Gagal mengarsipkan proses bisnis.')
  } finally {
    archiveLoading.value = false
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

onMounted(() => {
  loadUnitKerjas()
})
</script>

<style scoped>
/* ─── Page layout ─────────────────────────────────────────────────────────── */

.asset-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.asset-page-header {
  margin-bottom: 0.25rem;
}

.asset-page-title {
  font-family: var(--font-display);
  font-size: 1.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text);
  margin: 0 0 0.4rem;
}

.asset-page-desc {
  font-size: 13px;
  color: var(--color-text-dim);
  margin: 0;
}

/* ─── Unit Kerja selector bar ─────────────────────────────────────────────── */

.asset-uk-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.25rem;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.asset-uk-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.asset-uk-select-wrap {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  max-width: 420px;
}

.asset-uk-select-icon {
  position: absolute;
  left: 10px;
  font-size: 13px;
  color: var(--color-text-dim);
  pointer-events: none;
}

.asset-uk-select {
  width: 100%;
  appearance: none;
  padding: 7px 32px 7px 32px;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 13px;
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s;
}

.asset-uk-select:focus {
  border-color: var(--color-accent);
}

.asset-uk-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.asset-uk-select-caret {
  position: absolute;
  right: 10px;
  font-size: 11px;
  color: var(--color-text-muted);
  pointer-events: none;
}

/* ─── Unit Kerja static display (USER role) ──────────────────────────────── */

.asset-uk-static {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 13px;
  color: var(--color-text);
}

.asset-uk-static-icon {
  font-size: 13px;
  color: var(--color-text-dim);
}

.asset-uk-static-name {
  font-weight: 500;
}

.asset-uk-static-code {
  font-family: var(--font-mono);
  font-size: 11px;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 2px 8px;
  color: var(--color-accent);
  letter-spacing: 0.04em;
}

.asset-uk-static-warn {
  color: #fbbf24;
  font-size: 12px;
}

/* ─── Empty prompt ────────────────────────────────────────────────────────── */

.asset-empty-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 4rem 2rem;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  text-align: center;
}

.asset-empty-icon {
  font-size: 2.5rem;
  color: var(--color-text-muted);
  opacity: 0.4;
}

.asset-empty-text {
  font-size: 13px;
  color: var(--color-text-dim);
  margin: 0;
}

/* ─── Controls (filter + add) ────────────────────────────────────────────── */

.asset-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.asset-filters {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  flex-wrap: wrap;
}

/* Filter search input */

.filter-search-wrap {
  position: relative;
  width: 240px;
}

.filter-search-icon {
  position: absolute;
  left: 9px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: var(--color-text-muted);
  pointer-events: none;
}

.filter-input {
  width: 100%;
  padding: 6px 28px 6px 28px;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
}

.filter-input:focus {
  border-color: var(--color-accent);
}

.filter-input::placeholder {
  color: var(--color-text-muted);
}

.filter-clear {
  position: absolute;
  right: 7px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 2px;
  font-size: 10px;
  display: flex;
  align-items: center;
}

.filter-clear:hover {
  color: var(--color-text);
}

/* Filter selects */

.filter-select-wrap {
  position: relative;
}

.filter-select {
  appearance: none;
  padding: 6px 28px 6px 10px;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 13px;
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s;
}

.filter-select:focus {
  border-color: var(--color-accent);
}

.filter-select-caret {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 10px;
  color: var(--color-text-muted);
  pointer-events: none;
}

/* ─── Table ───────────────────────────────────────────────────────────────── */

.asset-table-wrap {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.asset-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.asset-table th {
  text-align: left;
  padding: 10px 14px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  background: rgba(22, 40, 68, 0.6);
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
}

.asset-table td {
  padding: 11px 14px;
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.asset-table tbody tr:last-child td {
  border-bottom: none;
}

.asset-table tbody tr:hover td {
  background: rgba(0, 229, 184, 0.02);
}

.asset-th-status {
  width: 120px;
  text-align: center;
}

.asset-th-actions {
  width: 100px;
  text-align: center;
}

.asset-td-name {
  font-weight: 500;
  max-width: 240px;
}

.asset-td-desc {
  font-size: 11px;
  color: var(--color-text-dim);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;
}

.asset-td-dim {
  color: var(--color-text-dim);
  font-size: 12px;
}

.asset-td-actions {
  text-align: center;
  white-space: nowrap;
}

.asset-code-chip {
  font-family: var(--font-mono);
  font-size: 11px;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 2px 8px;
  color: var(--color-accent);
  letter-spacing: 0.04em;
}

/* Status chips */

.asset-status-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border-radius: 100px;
  padding: 3px 10px;
}

.status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
}

.asset-status-chip.status-active {
  background: rgba(0, 229, 184, 0.12);
  border: 1px solid rgba(0, 229, 184, 0.25);
  color: var(--color-accent);
}

.asset-status-chip.status-active .status-dot {
  background: var(--color-accent);
  box-shadow: 0 0 4px var(--color-accent);
}

.asset-status-chip.status-inactive {
  background: rgba(90, 122, 154, 0.12);
  border: 1px solid rgba(90, 122, 154, 0.25);
  color: var(--color-text-dim);
}

.asset-status-chip.status-inactive .status-dot {
  background: var(--color-text-dim);
}

.asset-status-chip.status-archived {
  background: rgba(42, 74, 106, 0.15);
  border: 1px solid rgba(42, 74, 106, 0.3);
  color: var(--color-text-muted);
}

.asset-status-chip.status-archived .status-dot {
  background: var(--color-text-muted);
}


/* Empty + loading states */

.asset-empty-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
  font-size: 13px;
}

.asset-empty-row .pi {
  font-size: 1.75rem;
  opacity: 0.4;
}

.asset-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;
}

.asset-error-banner {
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

.asset-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--color-border);
}

.asset-page-btn {
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

.asset-page-btn:hover:not(:disabled) {
  background: var(--color-accent-glow);
  border-color: rgba(0, 229, 184, 0.2);
  color: var(--color-accent);
}

.asset-page-btn.is-active {
  background: var(--color-accent-glow);
  border-color: rgba(0, 229, 184, 0.3);
  color: var(--color-accent);
  font-weight: 600;
}

.asset-page-btn.is-ellipsis,
.asset-page-btn:disabled {
  cursor: default;
  opacity: 0.4;
}

.asset-total-count {
  padding: 0.6rem 1rem;
  font-size: 11px;
  color: var(--color-text-muted);
  text-align: right;
  border-top: 1px solid var(--color-border);
}

/* ─── Form (inside dialog) ────────────────────────────────────────────────── */

.asset-form {
  display: flex;
  flex-direction: column;
  padding: 0.25rem 0;
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 0.875rem;
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

.asset-input {
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

.asset-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px var(--color-accent-glow);
}

.asset-input::placeholder {
  color: var(--color-text-muted);
}

.asset-input.is-error {
  border-color: var(--color-danger);
}

.asset-input-mono {
  font-family: var(--font-mono);
  letter-spacing: 0.06em;
}

.asset-textarea {
  resize: vertical;
  min-height: 72px;
  line-height: 1.6;
}

.asset-select-wrap {
  position: relative;
}

.asset-select-wrap.is-error .asset-select {
  border-color: var(--color-danger);
}

.asset-select {
  width: 100%;
  appearance: none;
  padding: 8px 32px 8px 10px;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 13px;
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.asset-select:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px var(--color-accent-glow);
}

.asset-select-caret {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 10px;
  color: var(--color-text-muted);
  pointer-events: none;
}

.form-err {
  font-size: 11px;
  color: #ff8fa3;
}

.asset-alert-error {
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

.asset-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

/* ─── Confirm dialogs ─────────────────────────────────────────────────────── */

.confirm-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 0.5rem 0 1rem;
  gap: 0.75rem;
}

.confirm-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.confirm-icon-wrap.is-success {
  background: rgba(0, 229, 184, 0.12);
  border: 1px solid rgba(0, 229, 184, 0.3);
}

.confirm-icon-wrap.is-success .pi {
  color: var(--color-accent);
  font-size: 1.4rem;
}

.confirm-icon-wrap.is-warn {
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.3);
}

.confirm-icon-wrap.is-warn .pi {
  color: #fbbf24;
  font-size: 1.4rem;
}

.confirm-icon-wrap.is-danger {
  background: var(--color-danger-dim);
  border: 1px solid rgba(255, 77, 109, 0.3);
}

.confirm-icon-wrap.is-danger .pi {
  color: var(--color-danger);
  font-size: 1.4rem;
}

.confirm-text {
  font-size: 14px;
  color: var(--color-text);
  margin: 0;
}

.confirm-warn {
  font-size: 12px;
  color: var(--color-text-dim);
  margin: 0;
  line-height: 1.6;
  max-width: 340px;
}
</style>
