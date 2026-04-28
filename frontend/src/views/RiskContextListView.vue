<template>
  <div class="rcl-page">

    <div v-if="fwLoading" class="rcl-centered">
      <ProgressSpinner style="width: 36px; height: 36px" />
    </div>
    <div v-else-if="fwError" class="rcl-error-banner">
      <i class="pi pi-exclamation-circle" /> {{ fwError }}
    </div>

    <template v-else>
      <!-- ─── Header ────────────────────────────────────────────────────────── -->
      <div class="rcl-header">
        <div class="rcl-header-left">
          <button
            class="rcl-back-btn"
            type="button"
            @click="router.push({ name: 'risk-program-detail', params: { id: programId } })"
          >
            <i class="pi pi-arrow-left" />
          </button>
          <div>
            <div class="rcl-breadcrumb">Program Risiko / Framework</div>
            <h1 class="rcl-title">{{ fw?.framework.name ?? '—' }}</h1>
            <div class="rcl-meta">
              <span class="rcl-fw-code">{{ fw?.framework.code }}</span>
              <span v-if="fw?.framework.version" class="rcl-fw-version">v{{ fw.framework.version }}</span>
              <span class="rcl-section-label">Konteks Risiko</span>
            </div>
          </div>
        </div>
        <button
          class="rcl-add-btn"
          type="button"
          @click="openPicker"
        >
          <i class="pi pi-plus" />
          Tambah Konteks
        </button>
      </div>

      <!-- ─── Context grid ──────────────────────────────────────────────────── -->
      <div v-if="loading" class="rcl-centered">
        <ProgressSpinner style="width: 28px; height: 28px" />
      </div>
      <div v-else-if="error" class="rcl-error-banner">
        <i class="pi pi-exclamation-circle" /> {{ error }}
      </div>
      <div v-else-if="contexts.length === 0" class="rcl-empty">
        <i class="pi pi-inbox" />
        <span>Belum ada konteks risiko dalam framework ini</span>
        <button
          class="rcl-add-inline-btn"
          type="button"
          @click="openPicker"
        >
          <i class="pi pi-plus" /> Tambah Konteks
        </button>
      </div>
      <div v-else class="rcl-grid">
        <div
          v-for="ctx in contexts"
          :key="ctx.id"
          class="rcl-card"
          :class="{ 'card-active': ctx.status === 'ACTIVE' }"
        >
          <div class="rcl-card-top">
            <div class="rcl-card-badges">
              <span class="rcl-ctx-code">{{ ctx.code }}</span>
              <span class="rcl-ctx-type">{{ CONTEXT_TYPE_LABELS[ctx.contextType] }}</span>
              <span class="rcl-ctx-status" :class="`cs-${ctx.status.toLowerCase()}`">
                {{ RISK_CONTEXT_STATUS_LABELS[ctx.status] }}
              </span>
            </div>
            <div class="rcl-card-actions">
              <button
                class="btn-icon"
                title="Kelola Konteks"
                @click="router.push({ name: 'risk-context-detail', params: { contextId: ctx.id } })"
              >
                <i class="pi pi-cog" />
              </button>
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
              <button class="btn-icon btn-icon-danger" title="Hapus" @click="openDelete(ctx)">
                <i class="pi pi-trash" />
              </button>
            </div>
          </div>

          <div class="rcl-ctx-name">{{ ctx.name }}</div>
          <div class="rcl-ctx-period">
            Periode {{ ctx.periodStart }}–{{ ctx.periodEnd }}
            &nbsp;·&nbsp;
            Matriks {{ ctx.matrixRows }}×{{ ctx.matrixCols }}
          </div>

          <div class="rcl-ctx-counts">
            <div class="rcl-count-item">
              <span class="rcl-count-val">{{ ctx._count?.riskCategories ?? 0 }}</span>
              <span class="rcl-count-lbl">Kategori</span>
            </div>
            <div class="rcl-count-item">
              <span class="rcl-count-val">{{ ctx._count?.likelihoodCriteria ?? 0 }}</span>
              <span class="rcl-count-lbl">Kemungkinan</span>
            </div>
            <div class="rcl-count-item">
              <span class="rcl-count-val">{{ ctx._count?.impactAreas ?? 0 }}</span>
              <span class="rcl-count-lbl">Area Dampak</span>
            </div>
            <div class="rcl-count-item">
              <span class="rcl-count-val">{{ ctx._count?.treatmentOptions ?? 0 }}</span>
              <span class="rcl-count-lbl">Penanganan</span>
            </div>
          </div>

          <button
            class="rcl-detail-btn"
            type="button"
            @click="router.push({ name: 'risk-context-detail', params: { contextId: ctx.id } })"
          >
            Kelola Konteks <i class="pi pi-arrow-right" />
          </button>
        </div>
      </div>
    </template>

    <!-- ─── Picker Dialog ───────────────────────────────────────────────────── -->
    <Dialog v-model:visible="showPicker" modal header="Pilih Konteks Template" :style="{ width: '520px' }">
      <div v-if="pickerLoading" class="rcl-centered" style="padding: 2rem">
        <ProgressSpinner style="width: 28px; height: 28px" />
      </div>
      <div v-else-if="pickerError" class="rcl-alert-error" style="margin: 0.5rem 0 1rem">
        <i class="pi pi-exclamation-triangle" /> {{ pickerError }}
      </div>
      <div v-else-if="availableTemplates.length === 0" class="rcl-empty" style="padding: 2rem 1rem">
        <i class="pi pi-inbox" />
        <span style="font-size: 13px">Tidak ada template konteks yang tersedia untuk ditambahkan.</span>
      </div>
      <div v-else class="picker-list">
        <button
          v-for="tpl in availableTemplates"
          :key="tpl.id"
          class="picker-item"
          type="button"
          :disabled="pickerAdding === tpl.id"
          @click="addContext(tpl.id)"
        >
          <div class="picker-item-left">
            <span class="rcl-ctx-code">{{ tpl.code }}</span>
            <div>
              <div class="picker-item-name">{{ tpl.name }}</div>
              <div class="picker-item-meta">
                {{ tpl.contextType === 'ASSET' ? 'Aset' : 'Proses Bisnis' }}
                &nbsp;·&nbsp; {{ tpl.periodStart }}–{{ tpl.periodEnd }}
                &nbsp;·&nbsp; Matriks {{ tpl.matrixRows }}×{{ tpl.matrixCols }}
              </div>
            </div>
          </div>
          <i v-if="pickerAdding === tpl.id" class="pi pi-spin pi-spinner" style="color: var(--color-accent)" />
          <i v-else class="pi pi-plus-circle" style="color: var(--color-accent); flex-shrink: 0" />
        </button>
      </div>
    </Dialog>

    <!-- ─── Edit Dialog ──────────────────────────────────────────────────────── -->
    <Dialog v-model:visible="showEdit" modal header="Edit Konteks Risiko" :style="{ width: '560px' }">
      <form class="rcl-form" @submit.prevent="submitEdit">
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Nama Konteks <span class="req">*</span></label>
            <input
              v-model="editForm.name"
              class="rcl-input"
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
              class="rcl-input"
              :class="{ 'is-error': editErrors.code }"
              type="text"
              autocomplete="off"
            />
            <span v-if="editErrors.code" class="form-err">{{ editErrors.code }}</span>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Tipe Konteks <span class="req">*</span></label>
          <select v-model="editForm.contextType" class="rcl-input rcl-select">
            <option value="ASSET">Aset</option>
            <option value="PROCESS">Proses Bisnis</option>
          </select>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Periode Awal <span class="req">*</span></label>
            <input
              v-model.number="editForm.periodStart"
              class="rcl-input"
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
              class="rcl-input"
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
          <textarea v-model="editForm.description" class="rcl-input rcl-textarea" rows="2" />
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Level Selera Risiko <span class="form-opt">(opsional)</span></label>
            <input v-model="editForm.riskAppetiteLevel" class="rcl-input" type="text" autocomplete="off" />
          </div>
          <div class="form-group">
            <label class="form-label">Deskripsi Selera Risiko <span class="form-opt">(opsional)</span></label>
            <input v-model="editForm.riskAppetiteDescription" class="rcl-input" type="text" autocomplete="off" />
          </div>
        </div>

        <div v-if="editApiError" class="rcl-alert-error">
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
          Aktifkan konteks <strong>{{ activateTarget?.name }}</strong>?
        </p>
        <p class="del-warn">
          Konteks yang sedang aktif di framework ini akan dinonaktifkan secara otomatis.
        </p>
        <div v-if="activateError" class="rcl-alert-error">
          <i class="pi pi-exclamation-triangle" /> {{ activateError }}
        </div>
      </div>
      <template #footer>
        <Button label="Batal" severity="secondary" :disabled="activateLoading" @click="showActivate = false" />
        <Button label="Aktifkan" :loading="activateLoading" @click="submitActivate" />
      </template>
    </Dialog>

    <!-- ─── Delete Dialog ────────────────────────────────────────────────────── -->
    <Dialog v-model:visible="showDelete" modal header="Hapus Konteks Risiko" :style="{ width: '400px' }">
      <div class="del-body">
        <div class="del-icon-wrap">
          <i class="pi pi-exclamation-triangle" />
        </div>
        <p class="del-text">
          Hapus konteks <strong>{{ deleteTarget?.name }}</strong>?
        </p>
        <p class="del-warn">
          Konteks akan dihapus dari program ini. Template aslinya di framework tidak terpengaruh.
        </p>
        <div v-if="deleteError" class="rcl-alert-error">
          <i class="pi pi-exclamation-triangle" /> {{ deleteError }}
        </div>
      </div>
      <template #footer>
        <Button label="Batal" severity="secondary" :disabled="deleteLoading" @click="showDelete = false" />
        <Button label="Hapus" severity="danger" :loading="deleteLoading" @click="submitDelete" />
      </template>
    </Dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
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
import { programFrameworkApi, type ProgramFramework } from '@/api/programFramework'
import { programFrameworkContextApi, type ProgramFrameworkContext } from '@/api/programFrameworkContext'
import { extractApiError } from '@/utils/apiError'

const router = useRouter()
const route = useRoute()
const toast = useToast()

const programId = route.params.id as string
const frameworkId = route.params.frameworkId as string

// ─── Framework info ───────────────────────────────────────────────────────────

const fw = ref<ProgramFramework | null>(null)
const fwLoading = ref(false)
const fwError = ref('')

async function loadFramework() {
  fwLoading.value = true
  fwError.value = ''
  try {
    const res = await programFrameworkApi.getById(programId, frameworkId)
    fw.value = res.data.data
  } catch (err: any) {
    fwError.value = extractApiError(err, 'Gagal memuat data framework.')
  } finally {
    fwLoading.value = false
  }
}

// ─── Contexts (linked to program-framework) ───────────────────────────────────

const contexts = ref<ProgramFrameworkContext[]>([])
const loading = ref(false)
const error = ref('')

async function loadContexts() {
  loading.value = true
  error.value = ''
  try {
    const res = await programFrameworkContextApi.list(frameworkId)
    contexts.value = res.data.data ?? []
  } catch (err: any) {
    error.value = extractApiError(err, 'Gagal memuat daftar konteks risiko.')
  } finally {
    loading.value = false
  }
}

// ─── Picker ───────────────────────────────────────────────────────────────────

const showPicker = ref(false)
const pickerLoading = ref(false)
const pickerError = ref('')
const pickerAdding = ref<string | null>(null)
const availableTemplates = ref<RiskContext[]>([])

async function openPicker() {
  pickerError.value = ''
  availableTemplates.value = []
  showPicker.value = true
  pickerLoading.value = true
  try {
    const masterFrameworkId = fw.value?.frameworkId
    if (!masterFrameworkId) throw new Error('Framework ID tidak ditemukan.')
    const res = await riskContextApi.listByFramework(masterFrameworkId)
    const allTemplates = res.data.data ?? []
    const linkedIds = new Set(contexts.value.map((c) => c.id))
    availableTemplates.value = allTemplates.filter((t) => !linkedIds.has(t.id))
  } catch (err: any) {
    pickerError.value = extractApiError(err, 'Gagal memuat template konteks.')
  } finally {
    pickerLoading.value = false
  }
}

async function addContext(riskContextId: string) {
  pickerAdding.value = riskContextId
  try {
    await programFrameworkContextApi.add(frameworkId, { riskContextId })
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Konteks berhasil ditambahkan ke program', life: 3000 })
    showPicker.value = false
    loadContexts()
  } catch (err: any) {
    pickerError.value = extractApiError(err, 'Gagal menambahkan konteks.')
  } finally {
    pickerAdding.value = null
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
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Konteks risiko berhasil diperbarui', life: 3000 })
    loadContexts()
  } catch (err: any) {
    editApiError.value = extractApiError(err, 'Gagal memperbarui konteks risiko.')
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
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Konteks risiko berhasil diaktifkan', life: 3000 })
    loadContexts()
  } catch (err: any) {
    activateError.value = extractApiError(err, 'Gagal mengaktifkan konteks risiko.')
  } finally {
    activateLoading.value = false
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
    await programFrameworkContextApi.remove(frameworkId, deleteTarget.value.id)
    showDelete.value = false
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Konteks risiko berhasil dihapus dari program', life: 3000 })
    loadContexts()
  } catch (err: any) {
    deleteError.value = extractApiError(err, 'Gagal menghapus konteks risiko dari program.')
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
.rcl-page {
  padding: 2rem;
  max-width: 1100px;
  margin: 0 auto;
}

/* ─── Header ──────────────────────────────────────────────────────────────── */

.rcl-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 1rem;
}

.rcl-header-left {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.rcl-back-btn {
  width: 34px;
  height: 34px;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-dim);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  transition: all 0.15s;
  margin-top: 4px;
  flex-shrink: 0;
}

.rcl-back-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.rcl-breadcrumb {
  font-size: 11px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 4px;
}

.rcl-title {
  font-family: var(--font-display);
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-text);
  margin: 0 0 0.4rem;
}

.rcl-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.rcl-fw-code {
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

.rcl-fw-version {
  font-size: 11px;
  color: var(--color-text-muted);
}

.rcl-section-label {
  font-size: 11px;
  color: var(--color-text-dim);
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.rcl-add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: rgba(0, 229, 184, 0.1);
  border: 1px solid rgba(0, 229, 184, 0.25);
  border-radius: var(--radius-sm);
  color: var(--color-accent);
  font-size: 12px;
  font-family: var(--font-body);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.rcl-add-btn:hover {
  background: rgba(0, 229, 184, 0.18);
}

/* ─── Context grid ────────────────────────────────────────────────────────── */

.rcl-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.rcl-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1.25rem;
  transition: border-color 0.15s;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.rcl-card.card-active {
  border-color: rgba(0, 229, 184, 0.3);
}

.rcl-card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
}

.rcl-card-badges {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.rcl-ctx-code {
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

.rcl-ctx-type {
  font-size: 10px;
  color: var(--color-text-muted);
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  padding: 1px 6px;
  border-radius: var(--radius-sm);
}

.rcl-ctx-status {
  font-size: 10px;
  font-weight: 500;
  padding: 1px 6px;
  border-radius: 100px;
}


.rcl-card-actions {
  display: flex;
  gap: 3px;
  flex-shrink: 0;
}

.rcl-ctx-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.4;
}

.rcl-ctx-period {
  font-size: 11px;
  color: var(--color-text-muted);
}

.rcl-ctx-counts {
  display: flex;
  gap: 1rem;
  margin-top: 0.25rem;
}

.rcl-count-item {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.rcl-count-val {
  font-family: var(--font-mono);
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1;
}

.rcl-count-lbl {
  font-size: 9px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.rcl-detail-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  margin-top: 0.5rem;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-dim);
  font-size: 11px;
  font-family: var(--font-body);
  cursor: pointer;
  transition: all 0.15s;
  justify-content: center;
}

.rcl-detail-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
  background: rgba(0, 229, 184, 0.05);
}

/* ─── States ──────────────────────────────────────────────────────────────── */

.rcl-centered {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem;
}

.rcl-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 5rem 1rem;
  color: var(--color-text-muted);
  font-size: 13px;
}

.rcl-empty .pi {
  font-size: 2.5rem;
  opacity: 0.3;
}

.rcl-add-inline-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  background: rgba(0, 229, 184, 0.1);
  border: 1px solid rgba(0, 229, 184, 0.25);
  border-radius: var(--radius-sm);
  color: var(--color-accent);
  font-size: 12px;
  font-family: var(--font-body);
  cursor: pointer;
  margin-top: 0.25rem;
  transition: background 0.15s;
}

.rcl-add-inline-btn:hover {
  background: rgba(0, 229, 184, 0.18);
}

.rcl-error-banner {
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

.rcl-form {
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

.rcl-input {
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

.rcl-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px var(--color-accent-glow);
}

.rcl-input.is-error {
  border-color: var(--color-danger);
}

.rcl-select { cursor: pointer; }

.rcl-textarea {
  resize: vertical;
  min-height: 60px;
  line-height: 1.6;
}

.form-err {
  font-size: 11px;
  color: #ff8fa3;
}

.rcl-alert-error {
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

/* ─── Picker dialog ───────────────────────────────────────────────────────── */

.picker-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin: 0.25rem 0 0.5rem;
}

.picker-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.875rem 1rem;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text);
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
  font-family: var(--font-body);
}

.picker-item:last-child { border-bottom: none; }
.picker-item:hover:not(:disabled) { background: rgba(0, 229, 184, 0.04); }
.picker-item:disabled { opacity: 0.6; cursor: default; }

.picker-item-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.picker-item-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
}

.picker-item-meta {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 2px;
}
</style>
