<template>
  <div class="settings-section">

    <!-- ─── Header ─────────────────────────────────────────────────────────── -->
    <div class="ac-header">
      <div>
        <h2 class="settings-section-title">Kategori Aset</h2>
        <p class="settings-section-desc">
          Kelola kategori yang digunakan untuk mengklasifikasikan aset organisasi.
        </p>
      </div>
      <Button label="Tambah" icon="pi pi-plus" size="small" @click="openCreate" />
    </div>

    <div class="settings-section-divider" />

    <!-- ─── Filter ────────────────────────────────────────────────────────── -->
    <div class="ac-filter-row">
      <div class="ac-search-wrap">
        <i class="pi pi-search ac-search-icon" />
        <input
          v-model="searchQuery"
          class="ac-search-input"
          type="text"
          placeholder="Cari nama kategori..."
          @input="onSearchInput"
        />
        <button v-if="searchQuery" class="ac-search-clear" type="button" @click="clearSearch">
          <i class="pi pi-times" />
        </button>
      </div>
    </div>

    <!-- ─── Table ─────────────────────────────────────────────────────────── -->
    <div class="ac-table-wrap">
      <div v-if="loading" class="ac-loading">
        <ProgressSpinner style="width: 32px; height: 32px" />
      </div>
      <div v-else-if="fetchError" class="ac-error-banner">
        <i class="pi pi-exclamation-circle" />
        {{ fetchError }}
      </div>
      <template v-else>
        <table class="ac-table">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Deskripsi</th>
              <th class="ac-th-count">Aset</th>
              <th class="ac-th-actions">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="categories.length === 0">
              <td colspan="4">
                <div class="ac-empty">
                  <i class="pi pi-inbox" />
                  <span>Tidak ada data ditemukan</span>
                </div>
              </td>
            </tr>
            <tr v-for="cat in categories" :key="cat.id">
              <td class="ac-td-name">{{ cat.name }}</td>
              <td class="ac-td-desc">
                <span v-if="cat.description">{{ cat.description }}</span>
                <span v-else class="ac-td-empty">—</span>
              </td>
              <td class="ac-td-count">
                <span class="ac-count-badge">{{ cat._count?.assets ?? 0 }}</span>
              </td>
              <td class="ac-td-actions">
                <button class="btn-icon" type="button" title="Edit" @click="openEdit(cat)">
                  <i class="pi pi-pencil" />
                </button>
                <button
                  class="btn-icon btn-icon-danger"
                  type="button"
                  title="Hapus"
                  @click="openDelete(cat)"
                >
                  <i class="pi pi-trash" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div v-if="pagination && pagination.totalPages > 1" class="ac-pagination">
          <button
            class="ac-page-btn"
            type="button"
            :disabled="!pagination.hasPrevPage"
            @click="changePage(currentPage - 1)"
          >
            <i class="pi pi-chevron-left" />
          </button>
          <button
            v-for="p in pageNumbers"
            :key="String(p)"
            class="ac-page-btn"
            type="button"
            :class="{
              'is-active': p === currentPage,
              'is-ellipsis': p === '...',
            }"
            :disabled="p === '...'"
            @click="typeof p === 'number' && changePage(p)"
          >
            {{ p }}
          </button>
          <button
            class="ac-page-btn"
            type="button"
            :disabled="!pagination.hasNextPage"
            @click="changePage(currentPage + 1)"
          >
            <i class="pi pi-chevron-right" />
          </button>
        </div>

        <div v-if="pagination" class="ac-total-count">
          Menampilkan {{ categories.length }} dari {{ pagination.totalItems }} kategori
        </div>
      </template>
    </div>

    <!-- ─── Create / Edit Dialog ──────────────────────────────────────────── -->
    <Dialog
      v-model:visible="showFormDialog"
      modal
      :header="editTarget ? 'Edit Kategori Aset' : 'Tambah Kategori Aset'"
      :style="{ width: '460px' }"
    >
      <form class="ac-form" @submit.prevent="submitForm">
        <div class="form-group">
          <label class="form-label">Nama <span class="req">*</span></label>
          <input
            v-model="form.name"
            class="ac-input"
            :class="{ 'is-error': formErrors.name }"
            type="text"
            placeholder="Nama kategori"
            autocomplete="off"
          />
          <span v-if="formErrors.name" class="form-err">{{ formErrors.name }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">Deskripsi <span class="form-opt">(opsional)</span></label>
          <textarea
            v-model="form.description"
            class="ac-input ac-textarea"
            placeholder="Deskripsi singkat kategori ini..."
            rows="3"
            autocomplete="off"
          />
        </div>

        <div v-if="formApiError" class="ac-alert-error">
          <i class="pi pi-exclamation-triangle" />
          {{ formApiError }}
        </div>

        <div class="ac-form-actions">
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

    <!-- ─── Delete Confirmation Dialog ───────────────────────────────────── -->
    <Dialog
      v-model:visible="showDeleteDialog"
      modal
      header="Hapus Kategori Aset"
      :style="{ width: '420px' }"
    >
      <div class="del-body">
        <div class="del-icon-wrap">
          <i class="pi pi-exclamation-triangle" />
        </div>
        <p class="del-text">
          Hapus kategori <strong>{{ deleteTarget?.name }}</strong>?
        </p>
        <p class="del-warn">
          Tindakan ini tidak dapat dibatalkan. Kategori tidak dapat dihapus jika masih
          memiliki aset yang terkait.
        </p>
        <div v-if="deleteApiError" class="ac-alert-error">
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
import { assetCategoryApi, type AssetCategory, type PaginationMeta } from '@/api/assetCategory'
import { extractApiError } from '@/utils/apiError'

const toast = useToast()

// ─── List state ───────────────────────────────────────────────────────────────

const categories = ref<AssetCategory[]>([])
const pagination = ref<PaginationMeta | null>(null)
const loading = ref(false)
const fetchError = ref('')
const searchQuery = ref('')
const currentPage = ref(1)
const PAGE_LIMIT = 15

let searchTimer: ReturnType<typeof setTimeout> | null = null

// ─── Form / dialog state ──────────────────────────────────────────────────────

const showFormDialog = ref(false)
const editTarget = ref<AssetCategory | null>(null)
const formLoading = ref(false)
const formApiError = ref('')
const form = reactive({ name: '', description: '' })
const formErrors = reactive({ name: '' })

const showDeleteDialog = ref(false)
const deleteTarget = ref<AssetCategory | null>(null)
const deleteLoading = ref(false)
const deleteApiError = ref('')

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchData() {
  loading.value = true
  fetchError.value = ''
  try {
    const res = await assetCategoryApi.search({
      name: searchQuery.value || undefined,
      page: currentPage.value,
      limit: PAGE_LIMIT,
    })
    categories.value = res.data.data ?? []
    pagination.value = res.data.pagination ?? null
  } catch (err: any) {
    fetchError.value = extractApiError(err, 'Gagal memuat data kategori aset.')
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
  form.name = ''
  form.description = ''
  formErrors.name = ''
  formApiError.value = ''
  showFormDialog.value = true
}

function openEdit(cat: AssetCategory) {
  editTarget.value = cat
  form.name = cat.name
  form.description = cat.description ?? ''
  formErrors.name = ''
  formApiError.value = ''
  showFormDialog.value = true
}

function validateForm(): boolean {
  formErrors.name = ''
  if (!form.name.trim()) {
    formErrors.name = 'Nama kategori wajib diisi'
    return false
  }
  if (form.name.trim().length < 2) {
    formErrors.name = 'Nama minimal 2 karakter'
    return false
  }
  if (form.name.trim().length > 100) {
    formErrors.name = 'Nama maksimal 100 karakter'
    return false
  }
  return true
}

async function submitForm() {
  if (!validateForm()) return

  formLoading.value = true
  formApiError.value = ''
  try {
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
    }

    if (editTarget.value) {
      await assetCategoryApi.update(editTarget.value.id, payload)
      toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Kategori berhasil diperbarui', life: 3000 })
    } else {
      await assetCategoryApi.create(payload as { name: string; description?: string })
      toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Kategori berhasil ditambahkan', life: 3000 })
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

function openDelete(cat: AssetCategory) {
  deleteTarget.value = cat
  deleteApiError.value = ''
  showDeleteDialog.value = true
}

async function submitDelete() {
  if (!deleteTarget.value) return
  deleteLoading.value = true
  deleteApiError.value = ''
  try {
    await assetCategoryApi.remove(deleteTarget.value.id)
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Kategori berhasil dihapus', life: 3000 })
    showDeleteDialog.value = false
    if (categories.value.length === 1 && currentPage.value > 1) {
      currentPage.value--
    }
    fetchData()
  } catch (err: any) {
    deleteApiError.value = extractApiError(err, 'Gagal menghapus kategori.')
  } finally {
    deleteLoading.value = false
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

onMounted(fetchData)
</script>

<style scoped>
/* ─── Section layout ──────────────────────────────────────────────────────── */

.ac-header {
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

.ac-filter-row {
  margin-bottom: 1rem;
}

.ac-search-wrap {
  position: relative;
  width: 300px;
}

.ac-search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: var(--color-text-muted);
  pointer-events: none;
}

.ac-search-input {
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

.ac-search-input:focus {
  border-color: var(--color-accent);
}

.ac-search-input::placeholder {
  color: var(--color-text-muted);
}

.ac-search-clear {
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

.ac-search-clear:hover {
  color: var(--color-text);
}

/* ─── Table ───────────────────────────────────────────────────────────────── */

.ac-table-wrap {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.ac-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.ac-table th {
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

.ac-table td {
  padding: 11px 16px;
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.ac-table tbody tr:last-child td {
  border-bottom: none;
}

.ac-table tbody tr:hover td {
  background: rgba(0, 229, 184, 0.02);
}

.ac-th-count {
  width: 70px;
  text-align: center;
}

.ac-th-actions {
  width: 80px;
  text-align: center;
}

.ac-td-name {
  font-weight: 500;
  width: 220px;
}

.ac-td-desc {
  color: var(--color-text-dim);
  font-size: 12px;
  max-width: 320px;
}

.ac-td-empty {
  color: var(--color-text-muted);
}

.ac-td-count {
  text-align: center;
}

.ac-count-badge {
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

.ac-td-actions {
  text-align: center;
  white-space: nowrap;
}

.ac-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
  font-size: 13px;
}

.ac-empty .pi {
  font-size: 1.75rem;
  opacity: 0.4;
}

.ac-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;
}

.ac-error-banner {
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

.ac-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--color-border);
}

.ac-page-btn {
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

.ac-page-btn:hover:not(:disabled) {
  background: var(--color-accent-glow);
  border-color: rgba(0, 229, 184, 0.2);
  color: var(--color-accent);
}

.ac-page-btn.is-active {
  background: var(--color-accent-glow);
  border-color: rgba(0, 229, 184, 0.3);
  color: var(--color-accent);
  font-weight: 600;
}

.ac-page-btn.is-ellipsis,
.ac-page-btn:disabled {
  cursor: default;
  opacity: 0.4;
}

.ac-total-count {
  padding: 0.6rem 1rem;
  font-size: 11px;
  color: var(--color-text-muted);
  text-align: right;
  border-top: 1px solid var(--color-border);
}

/* ─── Form (inside dialog) ────────────────────────────────────────────────── */

.ac-form {
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

.ac-input {
  padding: 8px 10px;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 13px;
  outline: none;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  width: 100%;
}

.ac-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px var(--color-accent-glow);
}

.ac-input::placeholder {
  color: var(--color-text-muted);
}

.ac-input.is-error {
  border-color: var(--color-danger);
}

.ac-textarea {
  resize: vertical;
  min-height: 72px;
  line-height: 1.6;
}

.form-err {
  font-size: 11px;
  color: #ff8fa3;
}

.ac-alert-error {
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

.ac-form-actions {
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
