<template>
  <div class="fcv-page">

    <!-- Full-page loading -->
    <div v-if="fwLoading" class="fcv-centered">
      <ProgressSpinner style="width: 36px; height: 36px" />
    </div>
    <div v-else-if="fwError" class="fcv-error-banner">
      <i class="pi pi-exclamation-circle" /> {{ fwError }}
    </div>

    <template v-else>

      <!-- ─── Breadcrumb ──────────────────────────────────────────────────────── -->
      <div class="fcv-breadcrumb-row">
        <button class="fcv-back-btn" type="button" @click="router.push({ name: 'frameworks' })">
          <i class="pi pi-arrow-left" />
        </button>
        <span class="fcv-crumb-link" @click="router.push({ name: 'frameworks' })">Framework</span>
        <i class="pi pi-chevron-right fcv-crumb-sep" />
        <span class="fcv-crumb-current">{{ fw?.name ?? '—' }}</span>
      </div>

      <!-- ─── Two-column layout ──────────────────────────────────────────────── -->
      <div class="fcv-layout">

        <!-- Sidebar -->
        <aside class="fcv-sidebar">
          <div class="fcv-sidebar-header">
            <span class="fcv-sidebar-code">{{ fw?.code }}</span>
            <span v-if="fw?.version" class="fcv-sidebar-version">v{{ fw.version }}</span>
          </div>

          <h2 class="fcv-sidebar-name">{{ fw?.name ?? '—' }}</h2>

          <p v-if="fw?.description" class="fcv-sidebar-desc">{{ fw.description }}</p>
          <p v-else class="fcv-sidebar-desc fcv-sidebar-desc--empty">Tidak ada deskripsi.</p>

          <div class="fcv-sidebar-divider" />

          <div class="fcv-sidebar-stat">
            <span class="fcv-stat-val">{{ contexts.length }}</span>
            <span class="fcv-stat-lbl">Total Konteks</span>
          </div>
          <div class="fcv-sidebar-stat">
            <span class="fcv-stat-val">{{ activeCount }}</span>
            <span class="fcv-stat-lbl">Konteks Aktif</span>
          </div>

          <div class="fcv-sidebar-divider" />

          <div class="fcv-sidebar-row">
            <span class="fcv-sidebar-lbl">Status</span>
            <span
              class="fcv-status-badge"
              :class="fw?.isActive ? 'badge-active' : 'badge-inactive'"
            >
              {{ fw?.isActive ? 'Aktif' : 'Nonaktif' }}
            </span>
          </div>
        </aside>

        <!-- Main content -->
        <main class="fcv-main">

          <!-- Section header -->
          <div class="fcv-section-header">
            <div>
              <h3 class="fcv-section-title">Konteks Risiko Template</h3>
              <p class="fcv-section-sub">
                Template konteks yang dapat digunakan pada semua program risiko yang menggunakan framework ini.
              </p>
            </div>
            <button
              class="fcv-add-btn"
              type="button"
              @click="router.push({ name: 'framework-context-create', params: { frameworkId } })"
            >
              <i class="pi pi-plus" />
              Tambah Konteks
            </button>
          </div>

          <!-- Loading contexts -->
          <div v-if="loading" class="fcv-centered">
            <ProgressSpinner style="width: 28px; height: 28px" />
          </div>

          <!-- Error contexts -->
          <div v-else-if="error" class="fcv-error-banner">
            <i class="pi pi-exclamation-circle" /> {{ error }}
          </div>

          <!-- Empty state -->
          <div v-else-if="contexts.length === 0" class="fcv-empty">
            <div class="fcv-empty-icon">
              <i class="pi pi-database" />
            </div>
            <div class="fcv-empty-body">
              <p class="fcv-empty-title">Belum ada konteks template</p>
              <p class="fcv-empty-desc">
                Tambahkan konteks risiko sebagai template global untuk framework ini.
                Konteks dapat digunakan ulang di berbagai program risiko.
              </p>
              <button
                class="fcv-add-btn"
                type="button"
                @click="router.push({ name: 'framework-context-create', params: { frameworkId } })"
              >
                <i class="pi pi-plus" /> Tambah Konteks Template
              </button>
            </div>
          </div>

          <!-- Context list -->
          <div v-else class="fcv-list">
            <div
              v-for="ctx in contexts"
              :key="ctx.id"
              class="fcv-row"
              :class="{ 'row-active': ctx.status === 'ACTIVE' }"
            >
              <!-- Left: info -->
              <div class="fcv-row-info">
                <div class="fcv-row-badges">
                  <span class="badge-code">{{ ctx.code }}</span>
                  <span class="badge-type">{{ CONTEXT_TYPE_LABELS[ctx.contextType] }}</span>
                  <span
                    class="badge-status"
                    :class="ctx.status === 'ACTIVE' ? 'bs-active' : 'bs-inactive'"
                  >
                    {{ RISK_CONTEXT_STATUS_LABELS[ctx.status] }}
                  </span>
                </div>
                <div class="fcv-row-name">{{ ctx.name }}</div>
                <div class="fcv-row-meta">
                  Periode {{ ctx.periodStart }}–{{ ctx.periodEnd }}
                  &nbsp;·&nbsp;
                  Matriks {{ ctx.matrixRows }}×{{ ctx.matrixCols }}
                  &nbsp;·&nbsp;
                  <span>{{ ctx._count?.riskCategories ?? 0 }} Kategori</span>
                  &nbsp;·&nbsp;
                  <span>{{ ctx._count?.likelihoodCriteria ?? 0 }} Kemungkinan</span>
                  &nbsp;·&nbsp;
                  <span>{{ ctx._count?.impactAreas ?? 0 }} Area Dampak</span>
                </div>
              </div>

              <!-- Right: actions -->
              <div class="fcv-row-actions">
                <button
                  class="fcv-manage-btn"
                  type="button"
                  @click="router.push({ name: 'risk-context-detail', params: { contextId: ctx.id } })"
                >
                  Kelola <i class="pi pi-arrow-right" />
                </button>
                <div class="fcv-icon-group">
                  <button class="btn-icon" title="Edit" @click="openEdit(ctx)">
                    <i class="pi pi-pencil" />
                  </button>
                  <button
                    v-if="ctx.status !== 'ACTIVE'"
                    class="btn-icon btn-icon-accent"
                    title="Aktifkan"
                    @click="openActivate(ctx)"
                  >
                    <i class="pi pi-check-circle" />
                  </button>
                  <button
                    v-if="ctx.status === 'ACTIVE'"
                    class="btn-icon btn-icon-warn"
                    title="Nonaktifkan"
                    @click="openDeactivate(ctx)"
                  >
                    <i class="pi pi-pause-circle" />
                  </button>
                  <button class="btn-icon btn-icon-danger" title="Hapus" @click="openDelete(ctx)">
                    <i class="pi pi-trash" />
                  </button>
                </div>
              </div>
            </div>
          </div>

        </main>
      </div>
    </template>

    <!-- ─── Edit Dialog ──────────────────────────────────────────────────────── -->
    <Dialog v-model:visible="showEdit" modal header="Edit Konteks Template" :style="{ width: '560px' }">
      <form class="fcv-form" @submit.prevent="submitEdit">
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Nama Konteks <span class="req">*</span></label>
            <input
              v-model="editForm.name"
              class="fcv-input"
              :class="{ 'is-error': editErrors.name }"
              type="text"
              autocomplete="off"
            />
            <span v-if="editErrors.name" class="form-err">{{ editErrors.name }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">Kode <span class="req">*</span></label>
            <input
              v-model="editForm.code"
              class="fcv-input"
              :class="{ 'is-error': editErrors.code }"
              type="text"
              autocomplete="off"
            />
            <span v-if="editErrors.code" class="form-err">{{ editErrors.code }}</span>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Tipe Konteks <span class="req">*</span></label>
          <select v-model="editForm.contextType" class="fcv-input fcv-select">
            <option value="ASSET">Aset</option>
            <option value="PROCESS">Proses Bisnis</option>
          </select>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Periode Awal <span class="req">*</span></label>
            <input
              v-model.number="editForm.periodStart"
              class="fcv-input"
              :class="{ 'is-error': editErrors.periodStart }"
              type="number"
              min="2000"
              max="2100"
            />
            <span v-if="editErrors.periodStart" class="form-err">{{ editErrors.periodStart }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">Periode Akhir <span class="req">*</span></label>
            <input
              v-model.number="editForm.periodEnd"
              class="fcv-input"
              :class="{ 'is-error': editErrors.periodEnd }"
              type="number"
              min="2000"
              max="2100"
            />
            <span v-if="editErrors.periodEnd" class="form-err">{{ editErrors.periodEnd }}</span>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Deskripsi <span class="form-opt">(opsional)</span></label>
          <textarea v-model="editForm.description" class="fcv-input fcv-textarea" rows="2" />
        </div>

        <div v-if="editApiError" class="fcv-alert-error">
          <i class="pi pi-exclamation-triangle" /> {{ editApiError }}
        </div>

        <div class="form-actions">
          <Button label="Batal" severity="secondary" type="button" :disabled="editLoading" @click="showEdit = false" />
          <Button label="Simpan" type="submit" :loading="editLoading" />
        </div>
      </form>
    </Dialog>

    <!-- ─── Activate Dialog ──────────────────────────────────────────────────── -->
    <Dialog v-model:visible="showActivate" modal header="Aktifkan Konteks" :style="{ width: '400px' }">
      <div class="del-body">
        <div class="act-icon-wrap">
          <i class="pi pi-check-circle" />
        </div>
        <p class="del-text">
          Aktifkan konteks template <strong>{{ activateTarget?.name }}</strong>?
        </p>
        <div v-if="activateError" class="fcv-alert-error">
          <i class="pi pi-exclamation-triangle" /> {{ activateError }}
        </div>
      </div>
      <template #footer>
        <Button label="Batal" severity="secondary" :disabled="activateLoading" @click="showActivate = false" />
        <Button label="Aktifkan" :loading="activateLoading" @click="submitActivate" />
      </template>
    </Dialog>

    <!-- ─── Deactivate Dialog ────────────────────────────────────────────────── -->
    <Dialog v-model:visible="showDeactivate" modal header="Nonaktifkan Konteks" :style="{ width: '400px' }">
      <div class="del-body">
        <div class="del-icon-wrap del-icon-warn">
          <i class="pi pi-pause-circle" />
        </div>
        <p class="del-text">
          Nonaktifkan konteks template <strong>{{ deactivateTarget?.name }}</strong>?
        </p>
        <div v-if="deactivateError" class="fcv-alert-error">
          <i class="pi pi-exclamation-triangle" /> {{ deactivateError }}
        </div>
      </div>
      <template #footer>
        <Button label="Batal" severity="secondary" :disabled="deactivateLoading" @click="showDeactivate = false" />
        <Button label="Nonaktifkan" severity="warn" :loading="deactivateLoading" @click="submitDeactivate" />
      </template>
    </Dialog>

    <!-- ─── Delete Dialog ────────────────────────────────────────────────────── -->
    <Dialog v-model:visible="showDelete" modal header="Hapus Konteks Template" :style="{ width: '420px' }">
      <div class="del-body">
        <!-- ACTIVE: blocked state -->
        <template v-if="deleteTarget?.status === 'ACTIVE'">
          <div class="del-icon-wrap del-icon-warn">
            <i class="pi pi-lock" />
          </div>
          <p class="del-text">Tidak dapat menghapus <strong>{{ deleteTarget?.name }}</strong></p>
          <div class="fcv-alert-blocked">
            <i class="pi pi-info-circle" />
            <span>Konteks sedang dalam status <strong>Aktif</strong>. Nonaktifkan konteks terlebih dahulu sebelum menghapus.</span>
          </div>
        </template>

        <!-- INACTIVE: normal delete confirmation -->
        <template v-else>
          <div class="del-icon-wrap">
            <i class="pi pi-exclamation-triangle" />
          </div>
          <p class="del-text">
            Hapus konteks template <strong>{{ deleteTarget?.name }}</strong>?
          </p>
          <div class="fcv-alert-info">
            <i class="pi pi-info-circle" />
            <span>Konteks tidak dapat dihapus jika masih digunakan dalam program risiko.</span>
          </div>
          <div v-if="deleteError" class="fcv-alert-error">
            <i class="pi pi-exclamation-triangle" /> {{ deleteError }}
          </div>
        </template>
      </div>
      <template #footer>
        <Button label="Batal" severity="secondary" :disabled="deleteLoading" @click="showDelete = false" />
        <Button
          v-if="deleteTarget?.status !== 'ACTIVE'"
          label="Hapus"
          severity="danger"
          :loading="deleteLoading"
          @click="submitDelete"
        />
      </template>
    </Dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'
import {
  riskContextApi,
  RISK_CONTEXT_STATUS_LABELS,
  CONTEXT_TYPE_LABELS,
  type RiskContext,
} from '@/api/riskContext'
import { frameworkApi, type Framework } from '@/api/framework'
import { extractApiError } from '@/utils/apiError'

const router = useRouter()
const route = useRoute()
const toast = useToast()

const frameworkId = route.params.frameworkId as string

// ─── Framework info ───────────────────────────────────────────────────────────

const fw = ref<Framework | null>(null)
const fwLoading = ref(false)
const fwError = ref('')

async function loadFramework() {
  fwLoading.value = true
  fwError.value = ''
  try {
    const res = await frameworkApi.getById(frameworkId)
    fw.value = res.data.data
  } catch (err: any) {
    fwError.value = extractApiError(err, 'Gagal memuat data framework.')
  } finally {
    fwLoading.value = false
  }
}

// ─── Contexts ─────────────────────────────────────────────────────────────────

const contexts = ref<RiskContext[]>([])
const loading = ref(false)
const error = ref('')

const activeCount = computed(() => contexts.value.filter(c => c.status === 'ACTIVE').length)

async function loadContexts() {
  loading.value = true
  error.value = ''
  try {
    const res = await riskContextApi.listByFramework(frameworkId)
    contexts.value = res.data.data ?? []
  } catch (err: any) {
    error.value = extractApiError(err, 'Gagal memuat daftar konteks template.')
  } finally {
    loading.value = false
  }
}

// ─── Edit ─────────────────────────────────────────────────────────────────────

const showEdit = ref(false)
const editLoading = ref(false)
const editApiError = ref('')
const editTarget = ref<RiskContext | null>(null)
const editForm = reactive({
  name: '',
  code: '',
  contextType: '',
  periodStart: 2025,
  periodEnd: 2025,
  description: '',
  riskAppetiteLevel: '',
  riskAppetiteDescription: '',
})
const editErrors = reactive({ name: '', code: '', contextType: '', periodStart: '', periodEnd: '' })

function openEdit(ctx: RiskContext) {
  editTarget.value = ctx
  editForm.name = ctx.name
  editForm.code = ctx.code
  editForm.contextType = ctx.contextType
  editForm.periodStart = ctx.periodStart
  editForm.periodEnd = ctx.periodEnd
  editForm.description = ctx.description ?? ''
  editForm.riskAppetiteLevel = ctx.riskAppetiteLevel ?? ''
  editForm.riskAppetiteDescription = ctx.riskAppetiteDescription ?? ''
  Object.assign(editErrors, { name: '', code: '', contextType: '', periodStart: '', periodEnd: '' })
  editApiError.value = ''
  showEdit.value = true
}

async function submitEdit() {
  if (!editTarget.value) return
  let valid = true
  editErrors.name = ''
  editErrors.code = ''
  editErrors.periodStart = ''
  editErrors.periodEnd = ''
  if (!editForm.name.trim()) { editErrors.name = 'Nama wajib diisi'; valid = false }
  if (!editForm.code.trim()) { editErrors.code = 'Kode wajib diisi'; valid = false }
  if (editForm.periodEnd < editForm.periodStart) {
    editErrors.periodEnd = 'Periode akhir tidak boleh sebelum periode awal'; valid = false
  }
  if (!valid) return

  editLoading.value = true
  editApiError.value = ''
  try {
    await riskContextApi.update(editTarget.value.id, {
      name: editForm.name.trim(),
      code: editForm.code.trim(),
      contextType: editForm.contextType,
      periodStart: editForm.periodStart,
      periodEnd: editForm.periodEnd,
      description: editForm.description.trim() || undefined,
      riskAppetiteLevel: editForm.riskAppetiteLevel.trim() || undefined,
      riskAppetiteDescription: editForm.riskAppetiteDescription.trim() || undefined,
    })
    showEdit.value = false
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Konteks template berhasil diperbarui', life: 3000 })
    loadContexts()
  } catch (err: any) {
    editApiError.value = extractApiError(err, 'Gagal memperbarui konteks template.')
  } finally {
    editLoading.value = false
  }
}

// ─── Activate ─────────────────────────────────────────────────────────────────

const showActivate = ref(false)
const activateLoading = ref(false)
const activateError = ref('')
const activateTarget = ref<RiskContext | null>(null)

function openActivate(ctx: RiskContext) {
  activateTarget.value = ctx
  activateError.value = ''
  showActivate.value = true
}

async function submitActivate() {
  if (!activateTarget.value) return
  activateLoading.value = true
  activateError.value = ''
  try {
    await riskContextApi.activate(activateTarget.value.id)
    showActivate.value = false
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Konteks template berhasil diaktifkan', life: 3000 })
    loadContexts()
  } catch (err: any) {
    activateError.value = extractApiError(err, 'Gagal mengaktifkan konteks template.')
  } finally {
    activateLoading.value = false
  }
}

// ─── Deactivate ───────────────────────────────────────────────────────────────

const showDeactivate = ref(false)
const deactivateLoading = ref(false)
const deactivateError = ref('')
const deactivateTarget = ref<RiskContext | null>(null)

function openDeactivate(ctx: RiskContext) {
  deactivateTarget.value = ctx
  deactivateError.value = ''
  showDeactivate.value = true
}

async function submitDeactivate() {
  if (!deactivateTarget.value) return
  deactivateLoading.value = true
  deactivateError.value = ''
  try {
    await riskContextApi.deactivate(deactivateTarget.value.id)
    showDeactivate.value = false
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Konteks template berhasil dinonaktifkan', life: 3000 })
    loadContexts()
  } catch (err: any) {
    deactivateError.value = extractApiError(err, 'Gagal menonaktifkan konteks template.')
  } finally {
    deactivateLoading.value = false
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

const showDelete = ref(false)
const deleteLoading = ref(false)
const deleteError = ref('')
const deleteTarget = ref<RiskContext | null>(null)

function openDelete(ctx: RiskContext) {
  deleteTarget.value = ctx
  deleteError.value = ''
  showDelete.value = true
}

async function submitDelete() {
  if (!deleteTarget.value) return
  deleteLoading.value = true
  deleteError.value = ''
  try {
    await riskContextApi.remove(deleteTarget.value.id)
    showDelete.value = false
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Konteks template berhasil dihapus', life: 3000 })
    loadContexts()
  } catch (err: any) {
    deleteError.value = extractApiError(err, 'Gagal menghapus konteks template.')
  } finally {
    deleteLoading.value = false
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

onMounted(() => {
  loadFramework()
  loadContexts()
})
</script>

<style scoped>
.fcv-page {
  padding: 2rem;
  max-width: 1100px;
  margin: 0 auto;
}

/* ─── Breadcrumb ──────────────────────────────────────────────────────────── */

.fcv-breadcrumb-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.fcv-back-btn {
  width: 30px;
  height: 30px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  transition: all 0.15s;
  flex-shrink: 0;
}

.fcv-back-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.fcv-crumb-link {
  font-size: 13px;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: color 0.15s;
}

.fcv-crumb-link:hover {
  color: var(--color-accent);
}

.fcv-crumb-sep {
  font-size: 9px;
  color: var(--color-text-muted);
  opacity: 0.5;
}

.fcv-crumb-current {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}

/* ─── Layout ──────────────────────────────────────────────────────────────── */

.fcv-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 2.5rem;
  align-items: start;
}

/* ─── Sidebar ─────────────────────────────────────────────────────────────── */

.fcv-sidebar {
  position: sticky;
  top: 1.5rem;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1.25rem;
}

.fcv-sidebar-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.6rem;
}

.fcv-sidebar-code {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  color: var(--color-accent);
  background: rgba(0, 229, 184, 0.1);
  border: 1px solid rgba(0, 229, 184, 0.2);
  padding: 1px 7px;
  border-radius: var(--radius-sm);
  letter-spacing: 0.05em;
}

.fcv-sidebar-version {
  font-size: 11px;
  color: var(--color-text-muted);
}

.fcv-sidebar-name {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text);
  margin: 0 0 0.6rem;
  line-height: 1.3;
}

.fcv-sidebar-desc {
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.6;
  margin: 0;
}

.fcv-sidebar-desc--empty {
  opacity: 0.5;
  font-style: italic;
}

.fcv-sidebar-divider {
  height: 1px;
  background: var(--color-border);
  margin: 1rem 0;
}

.fcv-sidebar-stat {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  margin-bottom: 0.5rem;
}

.fcv-stat-val {
  font-family: var(--font-mono);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1;
}

.fcv-stat-lbl {
  font-size: 11px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.fcv-sidebar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.fcv-sidebar-lbl {
  font-size: 11px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.07em;
}

.fcv-status-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 100px;
  letter-spacing: 0.04em;
}

.badge-active {
  color: var(--color-accent);
  background: rgba(0, 229, 184, 0.1);
  border: 1px solid rgba(0, 229, 184, 0.25);
}

.badge-inactive {
  color: var(--color-text-muted);
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
}

/* ─── Main content ────────────────────────────────────────────────────────── */

.fcv-main {
  min-width: 0;
}

.fcv-section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 0;
}

.fcv-section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 4px;
  letter-spacing: 0.03em;
}

.fcv-section-sub {
  font-size: 12px;
  color: var(--color-text-muted);
  margin: 0;
  max-width: 480px;
  line-height: 1.5;
}

.fcv-add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: rgba(0, 229, 184, 0.1);
  border: 1px solid rgba(0, 229, 184, 0.25);
  border-radius: var(--radius-sm);
  color: var(--color-accent);
  font-size: 12px;
  font-family: var(--font-body);
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
  flex-shrink: 0;
}

.fcv-add-btn:hover {
  background: rgba(0, 229, 184, 0.18);
}

/* ─── Context list rows ───────────────────────────────────────────────────── */

.fcv-list {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.fcv-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
  transition: background 0.15s;
}

.fcv-row:last-child {
  border-bottom: none;
}

.fcv-row:hover {
  background: var(--color-bg-input);
}

.fcv-row.row-active {
  border-left: 3px solid rgba(0, 229, 184, 0.5);
  padding-left: calc(1.25rem - 3px);
}

.fcv-row-info {
  flex: 1;
  min-width: 0;
}

.fcv-row-badges {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.badge-code {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  color: var(--color-accent);
  background: rgba(0, 229, 184, 0.1);
  border: 1px solid rgba(0, 229, 184, 0.2);
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  letter-spacing: 0.05em;
}

.badge-type {
  font-size: 10px;
  color: var(--color-text-muted);
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  padding: 1px 6px;
  border-radius: var(--radius-sm);
}

.badge-status {
  font-size: 10px;
  font-weight: 500;
  padding: 1px 6px;
  border-radius: 100px;
}

.bs-active {
  color: var(--color-accent);
  background: rgba(0, 229, 184, 0.1);
  border: 1px solid rgba(0, 229, 184, 0.2);
}

.bs-inactive {
  color: var(--color-text-muted);
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
}

.fcv-row-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fcv-row-meta {
  font-size: 11px;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fcv-row-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.fcv-manage-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-dim);
  font-size: 11px;
  font-family: var(--font-body);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.fcv-manage-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
  background: rgba(0, 229, 184, 0.05);
}

.fcv-icon-group {
  display: flex;
  gap: 2px;
}

/* ─── Icon buttons ────────────────────────────────────────────────────────── */

.btn-icon {
  width: 28px;
  height: 28px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.15s;
}

.btn-icon:hover {
  background: var(--color-bg-input);
  border-color: var(--color-border);
  color: var(--color-text);
}

.btn-icon-accent:hover {
  background: rgba(0, 229, 184, 0.1);
  border-color: rgba(0, 229, 184, 0.3);
  color: var(--color-accent);
}

.btn-icon-warn:hover {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.3);
  color: #fbbf24;
}

.btn-icon-danger:hover {
  background: var(--color-danger-dim);
  border-color: rgba(255, 77, 109, 0.3);
  color: #ff8fa3;
}

/* ─── Empty state ─────────────────────────────────────────────────────────── */

.fcv-empty {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 2rem 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.fcv-empty-icon {
  width: 40px;
  height: 40px;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.fcv-empty-icon .pi {
  font-size: 1.1rem;
  color: var(--color-text-muted);
  opacity: 0.6;
}

.fcv-empty-body {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.fcv-empty-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.fcv-empty-desc {
  font-size: 12px;
  color: var(--color-text-muted);
  margin: 0;
  line-height: 1.6;
  max-width: 440px;
}

/* ─── States ──────────────────────────────────────────────────────────────── */

.fcv-centered {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem;
}

.fcv-error-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.25rem;
  font-size: 13px;
  color: #ff8fa3;
  background: var(--color-danger-dim);
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
}

/* ─── Form ────────────────────────────────────────────────────────────────── */

.fcv-form {
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

.req { color: var(--color-danger); }

.form-opt {
  font-size: 10px;
  color: var(--color-text-muted);
  font-weight: 400;
  letter-spacing: 0;
  text-transform: none;
}

.fcv-input {
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

.fcv-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px var(--color-accent-glow);
}

.fcv-input.is-error { border-color: var(--color-danger); }
.fcv-select { cursor: pointer; }

.fcv-textarea {
  resize: vertical;
  min-height: 60px;
  line-height: 1.6;
}

.form-err {
  font-size: 11px;
  color: #ff8fa3;
}

.fcv-alert-blocked {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  font-size: 12px;
  color: #ffb900;
  background: rgba(255, 185, 0, 0.08);
  border: 1px solid rgba(255, 185, 0, 0.25);
  border-radius: var(--radius-sm);
  text-align: left;
  line-height: 1.5;
  max-width: 340px;
}
.fcv-alert-blocked .pi { flex-shrink: 0; margin-top: 1px; }

.fcv-alert-info {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  font-size: 12px;
  color: var(--color-text-dim);
  background: rgba(90, 122, 154, 0.08);
  border: 1px solid rgba(90, 122, 154, 0.2);
  border-radius: var(--radius-sm);
  text-align: left;
  line-height: 1.5;
  max-width: 340px;
}
.fcv-alert-info .pi { flex-shrink: 0; margin-top: 1px; }

.fcv-alert-error {
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

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

/* ─── Dialog icons ────────────────────────────────────────────────────────── */

.del-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 0.5rem;
  text-align: center;
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

.del-icon-wrap .pi { font-size: 1.4rem; color: #ff8fa3; }

.del-icon-warn {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.3);
}

.del-icon-warn .pi { color: #fbbf24; }

.del-text {
  font-size: 14px;
  color: var(--color-text);
  margin: 0;
}

.del-warn {
  font-size: 12px;
  color: var(--color-text-muted);
  margin: 0;
  max-width: 300px;
}

.act-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: rgba(0, 229, 184, 0.1);
  border: 1px solid rgba(0, 229, 184, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.act-icon-wrap .pi { font-size: 1.4rem; color: var(--color-accent); }
</style>
