<template>
  <div class="settings-section">
    <!-- ─── Header ─────────────────────────────────────────────────────────── -->
    <div class="uk-header">
      <div>
        <h2 class="settings-section-title">Unit Kerja</h2>
        <p class="settings-section-desc">
          Kelola daftar unit kerja yang terdaftar dalam sistem.
        </p>
      </div>
      <Button
        label="Tambah"
        icon="pi pi-plus"
        size="small"
        @click="openCreate"
      />
    </div>

    <div class="settings-section-divider" />

    <!-- ─── Filter ────────────────────────────────────────────────────────── -->
    <div class="uk-filter-row">
      <div class="uk-search-wrap">
        <i class="pi pi-search uk-search-icon" />
        <input
          v-model="searchQuery"
          class="uk-search-input"
          type="text"
          placeholder="Cari nama unit kerja..."
          @input="onSearchInput"
        />
        <button
          v-if="searchQuery"
          class="uk-search-clear"
          type="button"
          @click="clearSearch"
        >
          <i class="pi pi-times" />
        </button>
      </div>
    </div>

    <!-- ─── Table ─────────────────────────────────────────────────────────── -->
    <div class="uk-table-wrap">
      <div v-if="loading" class="uk-loading">
        <ProgressSpinner style="width: 32px; height: 32px" />
      </div>
      <div v-else-if="fetchError" class="uk-error-banner">
        <i class="pi pi-exclamation-circle" />
        {{ fetchError }}
      </div>
      <template v-else>
        <table class="uk-table">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Kode</th>
              <th>Email</th>
              <th class="uk-th-actions">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="unitKerjas.length === 0">
              <td colspan="4">
                <div class="uk-empty">
                  <i class="pi pi-inbox" />
                  <span>Tidak ada data ditemukan</span>
                </div>
              </td>
            </tr>
            <tr v-for="uk in unitKerjas" :key="uk.id">
              <td class="uk-td-name">{{ uk.name }}</td>
              <td>
                <span class="uk-code-chip">{{ uk.code }}</span>
              </td>
              <td class="uk-td-dim">{{ uk.email }}</td>
              <td class="uk-td-actions">
                <button
                  class="btn-icon"
                  type="button"
                  title="Edit"
                  @click="openEdit(uk)"
                >
                  <i class="pi pi-pencil" />
                </button>
                <button
                  class="btn-icon btn-icon-danger"
                  type="button"
                  title="Hapus"
                  @click="openDelete(uk)"
                >
                  <i class="pi pi-trash" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div
          v-if="pagination && pagination.totalPages > 1"
          class="uk-pagination"
        >
          <button
            class="uk-page-btn"
            type="button"
            :disabled="!pagination.hasPrevPage"
            @click="changePage(currentPage - 1)"
          >
            <i class="pi pi-chevron-left" />
          </button>
          <button
            v-for="p in pageNumbers"
            :key="String(p)"
            class="uk-page-btn"
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
            class="uk-page-btn"
            type="button"
            :disabled="!pagination.hasNextPage"
            @click="changePage(currentPage + 1)"
          >
            <i class="pi pi-chevron-right" />
          </button>
        </div>

        <div v-if="pagination" class="uk-total-count">
          Menampilkan {{ unitKerjas.length }} dari
          {{ pagination.totalItems }} unit kerja
        </div>
      </template>
    </div>

    <!-- ─── Create / Edit Dialog ──────────────────────────────────────────── -->
    <Dialog
      v-model:visible="showFormDialog"
      modal
      :header="editTarget ? 'Edit Unit Kerja' : 'Tambah Unit Kerja'"
      :style="{ width: '460px' }"
    >
      <form class="uk-form" @submit.prevent="submitForm">
        <div class="form-group">
          <label class="form-label">Nama <span class="req">*</span></label>
          <input
            v-model="form.name"
            class="uk-input"
            :class="{ 'is-error': formErrors.name }"
            type="text"
            placeholder="Nama unit kerja"
            autocomplete="off"
          />
          <span v-if="formErrors.name" class="form-err">{{
            formErrors.name
          }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">Kode <span class="req">*</span></label>
          <input
            v-model="form.code"
            class="uk-input uk-input-mono"
            :class="{ 'is-error': formErrors.code }"
            type="text"
            placeholder="KODE-UK"
            autocomplete="off"
            @input="
              form.code = form.code.toUpperCase().replace(/[^A-Z0-9_-]/g, '')
            "
          />
          <span class="form-hint"
            >Huruf kapital, angka, underscore ( _ ), atau dash ( - )</span
          >
          <span v-if="formErrors.code" class="form-err">{{
            formErrors.code
          }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">Email <span class="req">*</span></label>
          <input
            v-model="form.email"
            class="uk-input"
            :class="{ 'is-error': formErrors.email }"
            type="email"
            placeholder="email@unitkerja.com"
            autocomplete="off"
          />
          <span v-if="formErrors.email" class="form-err">{{
            formErrors.email
          }}</span>
        </div>

        <div v-if="formApiError" class="uk-alert-error">
          <i class="pi pi-exclamation-triangle" />
          {{ formApiError }}
        </div>

        <div class="uk-form-actions">
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
      header="Hapus Unit Kerja"
      :style="{ width: '420px' }"
    >
      <div class="del-body">
        <div class="del-icon-wrap">
          <i class="pi pi-exclamation-triangle" />
        </div>
        <p class="del-text">
          Hapus unit kerja <strong>{{ deleteTarget?.name }}</strong
          >?
        </p>
        <p class="del-warn">
          Tindakan ini tidak dapat dibatalkan. Unit kerja tidak dapat dihapus
          jika masih memiliki profil pengguna yang terkait.
        </p>
        <div v-if="deleteApiError" class="uk-alert-error">
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
import { ref, reactive, computed, onMounted } from "vue";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import ProgressSpinner from "primevue/progressspinner";
import Toast from "primevue/toast";
import { useToast } from "primevue/usetoast";
import { extractApiError } from "@/utils/apiError";
import {
  unitKerjaApi,
  type UnitKerja,
  type PaginationMeta,
} from "@/api/unitKerja";

const toast = useToast();

// ─── List state ───────────────────────────────────────────────────────────────

const unitKerjas = ref<UnitKerja[]>([]);
const pagination = ref<PaginationMeta | null>(null);
const loading = ref(false);
const fetchError = ref("");
const searchQuery = ref("");
const currentPage = ref(1);
const PAGE_LIMIT = 10;

let searchTimer: ReturnType<typeof setTimeout> | null = null;

// ─── Form / dialog state ──────────────────────────────────────────────────────

const showFormDialog = ref(false);
const editTarget = ref<UnitKerja | null>(null);
const formLoading = ref(false);
const formApiError = ref("");
const form = reactive({ name: "", code: "", email: "" });
const formErrors = reactive({ name: "", code: "", email: "" });

const showDeleteDialog = ref(false);
const deleteTarget = ref<UnitKerja | null>(null);
const deleteLoading = ref(false);
const deleteApiError = ref("");

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchData() {
  loading.value = true;
  fetchError.value = "";
  try {
    const res = await unitKerjaApi.search({
      name: searchQuery.value || undefined,
      page: currentPage.value,
      limit: PAGE_LIMIT,
    });
    unitKerjas.value = res.data.data ?? [];
    pagination.value = res.data.pagination ?? null;
  } catch (err: any) {
    fetchError.value =
      extractApiError(err, "Gagal memuat data unit kerja.");
  } finally {
    loading.value = false;
  }
}

function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    currentPage.value = 1;
    fetchData();
  }, 400);
}

function clearSearch() {
  searchQuery.value = "";
  currentPage.value = 1;
  fetchData();
}

function changePage(page: number) {
  currentPage.value = page;
  fetchData();
}

// ─── Pagination numbers ───────────────────────────────────────────────────────

const pageNumbers = computed<(number | string)[]>(() => {
  if (!pagination.value) return [];
  const total = pagination.value.totalPages;
  const cur = currentPage.value;
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | string)[] = [1];
  if (cur > 3) pages.push("...");
  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++)
    pages.push(i);
  if (cur < total - 2) pages.push("...");
  pages.push(total);
  return pages;
});

// ─── Create / Edit ────────────────────────────────────────────────────────────

function openCreate() {
  editTarget.value = null;
  form.name = "";
  form.code = "";
  form.email = "";
  formErrors.name = "";
  formErrors.code = "";
  formErrors.email = "";
  formApiError.value = "";
  showFormDialog.value = true;
}

function openEdit(uk: UnitKerja) {
  editTarget.value = uk;
  form.name = uk.name;
  form.code = uk.code;
  form.email = uk.email;
  formErrors.name = "";
  formErrors.code = "";
  formErrors.email = "";
  formApiError.value = "";
  showFormDialog.value = true;
}

function validateForm(): boolean {
  let valid = true;
  formErrors.name = "";
  formErrors.code = "";
  formErrors.email = "";

  if (!form.name.trim()) {
    formErrors.name = "Nama unit kerja wajib diisi";
    valid = false;
  } else if (form.name.trim().length < 2) {
    formErrors.name = "Nama minimal 2 karakter";
    valid = false;
  }

  if (!form.code) {
    formErrors.code = "Kode unit kerja wajib diisi";
    valid = false;
  } else if (!/^[A-Z0-9_-]{2,}$/.test(form.code)) {
    formErrors.code =
      "Kode hanya boleh berisi huruf kapital, angka, underscore, atau dash";
    valid = false;
  }

  if (!form.email.trim()) {
    formErrors.email = "Email wajib diisi";
    valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    formErrors.email = "Format email tidak valid";
    valid = false;
  }

  return valid;
}

async function submitForm() {
  if (!validateForm()) return;

  formLoading.value = true;
  formApiError.value = "";
  try {
    if (editTarget.value) {
      await unitKerjaApi.update(editTarget.value.id, {
        name: form.name,
        code: form.code,
        email: form.email,
      });
      toast.add({
        severity: "success",
        summary: "Berhasil",
        detail: "Unit kerja berhasil diperbarui",
        life: 3000,
      });
    } else {
      await unitKerjaApi.create({
        name: form.name,
        code: form.code,
        email: form.email,
      });
      toast.add({
        severity: "success",
        summary: "Berhasil",
        detail: "Unit kerja berhasil ditambahkan",
        life: 3000,
      });
    }
    showFormDialog.value = false;
    fetchData();
  } catch (err: any) {
    formApiError.value =
      extractApiError(err, "Terjadi kesalahan. Coba lagi.");
  } finally {
    formLoading.value = false;
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

function openDelete(uk: UnitKerja) {
  deleteTarget.value = uk;
  deleteApiError.value = "";
  showDeleteDialog.value = true;
}

async function submitDelete() {
  if (!deleteTarget.value) return;
  deleteLoading.value = true;
  deleteApiError.value = "";
  try {
    await unitKerjaApi.remove(deleteTarget.value.id);
    toast.add({
      severity: "success",
      summary: "Berhasil",
      detail: "Unit kerja berhasil dihapus",
      life: 3000,
    });
    showDeleteDialog.value = false;
    if (unitKerjas.value.length === 1 && currentPage.value > 1) {
      currentPage.value--;
    }
    fetchData();
  } catch (err: any) {
    deleteApiError.value =
      extractApiError(err, "Gagal menghapus unit kerja.");
  } finally {
    deleteLoading.value = false;
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

onMounted(fetchData);
</script>

<style scoped>
/* ─── Section layout ──────────────────────────────────────────────────────── */

.uk-header {
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

.uk-filter-row {
  margin-bottom: 1rem;
}

.uk-search-wrap {
  position: relative;
  width: 300px;
}

.uk-search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: var(--color-text-muted);
  pointer-events: none;
}

.uk-search-input {
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

.uk-search-input:focus {
  border-color: var(--color-accent);
}

.uk-search-input::placeholder {
  color: var(--color-text-muted);
}

.uk-search-clear {
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

.uk-search-clear:hover {
  color: var(--color-text);
}

/* ─── Table ───────────────────────────────────────────────────────────────── */

.uk-table-wrap {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.uk-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.uk-table th {
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

.uk-table td {
  padding: 11px 16px;
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.uk-table tbody tr:last-child td {
  border-bottom: none;
}

.uk-table tbody tr:hover td {
  background: rgba(0, 229, 184, 0.02);
}

.uk-th-actions {
  width: 80px;
  text-align: center;
}

.uk-td-name {
  font-weight: 500;
}

.uk-td-dim {
  color: var(--color-text-dim);
  font-size: 12px;
}

.uk-td-actions {
  text-align: center;
  white-space: nowrap;
}

.uk-code-chip {
  font-family: var(--font-mono);
  font-size: 11px;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 2px 8px;
  color: var(--color-accent);
  letter-spacing: 0.04em;
}

.uk-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
  font-size: 13px;
}

.uk-empty .pi {
  font-size: 1.75rem;
  opacity: 0.4;
}

.uk-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;
}

.uk-error-banner {
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

.uk-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--color-border);
}

.uk-page-btn {
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

.uk-page-btn:hover:not(:disabled) {
  background: var(--color-accent-glow);
  border-color: rgba(0, 229, 184, 0.2);
  color: var(--color-accent);
}

.uk-page-btn.is-active {
  background: var(--color-accent-glow);
  border-color: rgba(0, 229, 184, 0.3);
  color: var(--color-accent);
  font-weight: 600;
}

.uk-page-btn.is-ellipsis,
.uk-page-btn:disabled {
  cursor: default;
  opacity: 0.4;
}

.uk-total-count {
  padding: 0.6rem 1rem;
  font-size: 11px;
  color: var(--color-text-muted);
  text-align: right;
  border-top: 1px solid var(--color-border);
}

/* ─── Form (inside dialog) ────────────────────────────────────────────────── */

.uk-form {
  display: flex;
  flex-direction: column;
  gap: 0;
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

.uk-input {
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

.uk-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px var(--color-accent-glow);
}

.uk-input::placeholder {
  color: var(--color-text-muted);
}

.uk-input.is-error {
  border-color: var(--color-danger);
}

.uk-input-mono {
  font-family: var(--font-mono);
  letter-spacing: 0.06em;
}

.form-hint {
  font-size: 11px;
  color: var(--color-text-muted);
}

.form-err {
  font-size: 11px;
  color: #ff8fa3;
}

.uk-alert-error {
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

.uk-form-actions {
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
