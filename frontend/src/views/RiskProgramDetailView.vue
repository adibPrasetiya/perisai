<template>
  <div class="rpd-page">

    <!-- ─── Loading ───────────────────────────────────────────────────────────── -->
    <div v-if="programLoading" class="rpd-centered">
      <ProgressSpinner style="width: 36px; height: 36px" />
    </div>
    <div v-else-if="programError" class="rpd-alert-error">
      <i class="pi pi-exclamation-circle" /> {{ programError }}
    </div>

    <template v-else-if="program">

      <!-- ─── Breadcrumb ────────────────────────────────────────────────────────── -->
      <div class="rpd-breadcrumb-row">
        <button class="rpd-back-btn" type="button" @click="router.push({ name: 'risk-programs' })">
          <i class="pi pi-arrow-left" />
        </button>
        <span class="rpd-breadcrumb-text">Program Risiko</span>
        <span class="rpd-breadcrumb-sep">/</span>
        <span class="rpd-breadcrumb-current">{{ program.name }}</span>
      </div>

      <!-- ─── Two-column layout ─────────────────────────────────────────────────── -->
      <div class="rpd-layout">

        <!-- ── Left sidebar: program info ──────────────────────────────────────── -->
        <aside class="rpd-sidebar">
          <div class="rpd-sidebar-card">
            <div class="rpd-sidebar-header">
              <h1 class="rpd-sidebar-title">{{ program.name }}</h1>
              <div class="rpd-sidebar-badges">
                <span class="rpd-year-badge">{{ program.year }}</span>
                <span class="rpd-status-chip" :class="`chip-${program.status.toLowerCase()}`">
                  {{ RISK_PROGRAM_STATUS_LABELS[program.status] }}
                </span>
              </div>
              <p v-if="program.description" class="rpd-sidebar-desc">{{ program.description }}</p>
              <p v-else class="rpd-sidebar-desc rpd-no-desc">Belum ada deskripsi.</p>
            </div>

            <div class="rpd-sidebar-meta">
              <div class="rpd-meta-row">
                <i class="pi pi-calendar rpd-meta-icon" />
                <span class="rpd-meta-label">Tahun</span>
                <span class="rpd-meta-val">{{ program.year }}</span>
              </div>
              <div class="rpd-meta-row">
                <i class="pi pi-shield rpd-meta-icon" />
                <span class="rpd-meta-label">Framework</span>
                <span class="rpd-meta-val">{{ programFrameworks.length }}</span>
              </div>
              <div class="rpd-meta-row">
                <i class="pi pi-clock rpd-meta-icon" />
                <span class="rpd-meta-label">Dibuat</span>
                <span class="rpd-meta-val">{{ formatDate(program.createdAt) }}</span>
              </div>
            </div>

            <div class="rpd-sidebar-actions">
              <button class="rpd-sidebar-edit-btn" type="button" @click="openEditProgram">
                <i class="pi pi-pencil" /> Edit Program
              </button>
            </div>
          </div>
        </aside>

        <!-- ── Main content ─────────────────────────────────────────────────────── -->
        <main class="rpd-main">

          <!-- Framework section -->
          <section class="rpd-section">
            <div class="rpd-section-header">
              <div class="rpd-section-header-left">
                <h2 class="rpd-section-title">Framework dalam Program</h2>
                <p class="rpd-section-desc">
                  Pilih framework standar yang digunakan sebagai acuan analisis risiko pada program ini.
                </p>
              </div>
              <button class="rpd-add-btn" type="button" @click="openAddFramework">
                <i class="pi pi-plus" /> Tambah Framework
              </button>
            </div>

            <!-- Loading -->
            <div v-if="fwLoading" class="rpd-centered">
              <ProgressSpinner style="width: 26px; height: 26px" />
            </div>

            <!-- Error -->
            <div v-else-if="fwError" class="rpd-section-error">
              <i class="pi pi-exclamation-circle" /> {{ fwError }}
            </div>

            <!-- Empty -->
            <div v-else-if="programFrameworks.length === 0" class="rpd-empty">
              <div class="rpd-empty-icon"><i class="pi pi-layer" /></div>
              <p class="rpd-empty-title">Belum ada framework</p>
              <p class="rpd-empty-desc">Tambahkan framework untuk mulai menyusun konteks risiko dalam program ini.</p>
              <button class="rpd-add-btn" type="button" style="margin-top: 0.5rem" @click="openAddFramework">
                <i class="pi pi-plus" /> Tambah Framework
              </button>
            </div>

            <!-- Framework rows -->
            <ul v-else class="rpd-fw-list">
              <li
                v-for="pf in programFrameworks"
                :key="pf.id"
                class="rpd-fw-row"
                :class="{ 'row-inactive': pf.status !== 'ACTIVE' }"
              >
                <!-- Left: info -->
                <div class="rpd-fw-row-left">
                  <div class="rpd-fw-row-top">
                    <span class="rpd-fw-code">{{ pf.framework.code }}</span>
                    <span v-if="pf.framework.version" class="rpd-fw-version">v{{ pf.framework.version }}</span>
                    <span class="rpd-fw-status" :class="`fw-status-${pf.status.toLowerCase()}`">
                      {{ PROGRAM_FRAMEWORK_STATUS_LABELS[pf.status] }}
                    </span>
                  </div>
                  <div class="rpd-fw-name">{{ pf.framework.name }}</div>
                  <div class="rpd-fw-row-meta">
                    <span class="rpd-fw-ctx-count">
                      <i class="pi pi-file" />
                      {{ pf._count?.programFrameworkContexts ?? 0 }} konteks dipilih
                    </span>
                  </div>
                </div>

                <!-- Right: actions -->
                <div class="rpd-fw-row-right">
                  <button
                    class="rpd-fw-manage-btn"
                    type="button"
                    @click="router.push({ name: 'risk-context-list', params: { id: programId, frameworkId: pf.id } })"
                  >
                    Kelola Konteks <i class="pi pi-arrow-right" />
                  </button>
                  <div class="rpd-fw-row-icons">
                    <button class="btn-icon" title="Edit Status" type="button" @click="openEditFramework(pf)">
                      <i class="pi pi-cog" />
                    </button>
                    <button class="btn-icon btn-icon-danger" title="Hapus dari Program" type="button" @click="openDeleteFramework(pf)">
                      <i class="pi pi-trash" />
                    </button>
                  </div>
                </div>
              </li>
            </ul>
          </section>

        </main>
      </div>

    </template>

    <!-- ─── Edit Program Dialog ───────────────────────────────────────────────── -->
    <Dialog v-model:visible="showEditProgram" modal header="Edit Program Risiko" :style="{ width: '480px' }">
      <form class="rpd-form" @submit.prevent="submitEditProgram">
        <div class="form-group">
          <label class="form-label">Nama Program <span class="req">*</span></label>
          <input
            v-model="programForm.name"
            class="rpd-field-input"
            :class="{ 'is-error': programFormErrors.name }"
            type="text"
            autocomplete="off"
          />
          <span v-if="programFormErrors.name" class="form-err">{{ programFormErrors.name }}</span>
        </div>
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Tahun <span class="req">*</span></label>
            <input
              v-model.number="programForm.year"
              class="rpd-field-input"
              :class="{ 'is-error': programFormErrors.year }"
              type="number"
              min="2000"
              max="2100"
              autocomplete="off"
            />
            <span v-if="programFormErrors.year" class="form-err">{{ programFormErrors.year }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select v-model="programForm.status" class="rpd-field-input rpd-field-select">
              <option v-for="(label, val) in RISK_PROGRAM_STATUS_LABELS" :key="val" :value="val">
                {{ label }}
              </option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Deskripsi <span class="form-opt">(opsional)</span></label>
          <textarea
            v-model="programForm.description"
            class="rpd-field-input rpd-field-textarea"
            rows="2"
            autocomplete="off"
          />
        </div>
        <div v-if="editProgramError" class="rpd-form-error">
          <i class="pi pi-exclamation-triangle" /> {{ editProgramError }}
        </div>
        <div class="rpd-form-actions">
          <Button label="Batal" severity="secondary" type="button" :disabled="editProgramLoading" @click="showEditProgram = false" />
          <Button label="Simpan Perubahan" type="submit" :loading="editProgramLoading" />
        </div>
      </form>
    </Dialog>

    <!-- ─── Add Framework Dialog ──────────────────────────────────────────────── -->
    <Dialog v-model:visible="showAddFw" modal header="Tambah Framework ke Program" :style="{ width: '480px' }">
      <form class="rpd-form" @submit.prevent="submitAddFramework">
        <div class="form-group">
          <label class="form-label">Framework <span class="req">*</span></label>
          <select
            v-model="addFwForm.frameworkId"
            class="rpd-field-input rpd-field-select"
            :class="{ 'is-error': addFwErrors.frameworkId }"
          >
            <option value="">— Pilih Framework —</option>
            <option v-for="fw in availableFrameworks" :key="fw.id" :value="fw.id">
              {{ fw.code }} — {{ fw.name }}
            </option>
          </select>
          <span v-if="addFwErrors.frameworkId" class="form-err">{{ addFwErrors.frameworkId }}</span>
          <span v-if="availableFrameworks.length === 0 && !fwListLoading" class="form-hint">
            Semua framework aktif sudah terdaftar dalam program ini.
          </span>
        </div>
        <div v-if="addFwError" class="rpd-form-error">
          <i class="pi pi-exclamation-triangle" /> {{ addFwError }}
        </div>
        <div class="rpd-form-actions">
          <Button label="Batal" severity="secondary" type="button" :disabled="addFwLoading" @click="showAddFw = false" />
          <Button label="Tambahkan" type="submit" :loading="addFwLoading" />
        </div>
      </form>
    </Dialog>

    <!-- ─── Edit Framework Status Dialog ─────────────────────────────────────── -->
    <Dialog v-model:visible="showEditFw" modal header="Edit Status Framework" :style="{ width: '420px' }">
      <form class="rpd-form" @submit.prevent="submitEditFramework">
        <div class="rpd-edit-fw-info">
          <span class="rpd-fw-code">{{ editFwTarget?.framework.code }}</span>
          <span class="rpd-fw-name-sm">{{ editFwTarget?.framework.name }}</span>
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select v-model="editFwForm.status" class="rpd-field-input rpd-field-select">
            <option v-for="(label, val) in PROGRAM_FRAMEWORK_STATUS_LABELS" :key="val" :value="val">
              {{ label }}
            </option>
          </select>
        </div>
        <div v-if="editFwError" class="rpd-form-error">
          <i class="pi pi-exclamation-triangle" /> {{ editFwError }}
        </div>
        <div class="rpd-form-actions">
          <Button label="Batal" severity="secondary" type="button" :disabled="editFwLoading" @click="showEditFw = false" />
          <Button label="Simpan" type="submit" :loading="editFwLoading" />
        </div>
      </form>
    </Dialog>

    <!-- ─── Delete Framework Dialog ───────────────────────────────────────────── -->
    <Dialog v-model:visible="showDeleteFw" modal header="Hapus Framework dari Program" :style="{ width: '400px' }">
      <div class="del-body">
        <div class="del-icon-wrap">
          <i class="pi pi-exclamation-triangle" />
        </div>
        <p class="del-text">
          Hapus <strong>{{ deleteFwTarget?.framework.name }}</strong> dari program ini?
        </p>
        <p class="del-warn">
          Tidak dapat dihapus jika masih memiliki konteks risiko yang terkait.
        </p>
        <div v-if="deleteFwError" class="rpd-form-error" style="margin-top: 0.5rem">
          <i class="pi pi-exclamation-triangle" /> {{ deleteFwError }}
        </div>
      </div>
      <template #footer>
        <Button label="Batal" severity="secondary" :disabled="deleteFwLoading" @click="showDeleteFw = false" />
        <Button label="Hapus" severity="danger" :loading="deleteFwLoading" @click="submitDeleteFramework" />
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
import { riskProgramApi, RISK_PROGRAM_STATUS_LABELS, type RiskProgram } from '@/api/riskProgram'
import {
  programFrameworkApi,
  PROGRAM_FRAMEWORK_STATUS_LABELS,
  type ProgramFramework,
} from '@/api/programFramework'
import { frameworkApi, type Framework } from '@/api/framework'
import { extractApiError } from '@/utils/apiError'

const router = useRouter()
const route = useRoute()
const toast = useToast()

const programId = route.params.id as string

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Program ──────────────────────────────────────────────────────────────────

const program = ref<RiskProgram | null>(null)
const programLoading = ref(false)
const programError = ref('')

async function loadProgram() {
  programLoading.value = true
  programError.value = ''
  try {
    const res = await riskProgramApi.getById(programId)
    program.value = res.data.data
  } catch (err: any) {
    programError.value = extractApiError(err, 'Gagal memuat data program risiko.')
  } finally {
    programLoading.value = false
  }
}

// ─── Program Frameworks ───────────────────────────────────────────────────────

const programFrameworks = ref<ProgramFramework[]>([])
const fwLoading = ref(false)
const fwError = ref('')

async function loadFrameworks() {
  fwLoading.value = true
  fwError.value = ''
  try {
    const res = await programFrameworkApi.listByProgram(programId)
    programFrameworks.value = res.data.data ?? []
  } catch (err: any) {
    fwError.value = extractApiError(err, 'Gagal memuat framework program.')
  } finally {
    fwLoading.value = false
  }
}

// ─── All frameworks (for add dropdown) ───────────────────────────────────────

const allFrameworks = ref<Framework[]>([])
const fwListLoading = ref(false)

async function loadAllFrameworks() {
  fwListLoading.value = true
  try {
    const res = await frameworkApi.search({ limit: 100, isActive: true })
    allFrameworks.value = res.data.data ?? []
  } catch {
    // non-critical
  } finally {
    fwListLoading.value = false
  }
}

const availableFrameworks = computed(() => {
  const addedIds = new Set(programFrameworks.value.map((pf) => pf.frameworkId))
  return allFrameworks.value.filter((fw) => !addedIds.has(fw.id))
})

// ─── Edit Program ─────────────────────────────────────────────────────────────

const showEditProgram = ref(false)
const editProgramLoading = ref(false)
const editProgramError = ref('')
const programForm = reactive({ name: '', description: '', year: 2025, status: 'DRAFT' as RiskProgram['status'] })
const programFormErrors = reactive({ name: '', year: '' })

function openEditProgram() {
  if (!program.value) return
  programForm.name = program.value.name
  programForm.description = program.value.description ?? ''
  programForm.year = program.value.year
  programForm.status = program.value.status
  programFormErrors.name = ''
  programFormErrors.year = ''
  editProgramError.value = ''
  showEditProgram.value = true
}

async function submitEditProgram() {
  programFormErrors.name = ''
  programFormErrors.year = ''
  let valid = true
  if (!programForm.name.trim()) { programFormErrors.name = 'Nama wajib diisi'; valid = false }
  if (!programForm.year || programForm.year < 2000 || programForm.year > 2100) { programFormErrors.year = 'Tahun tidak valid'; valid = false }
  if (!valid) return

  editProgramLoading.value = true
  editProgramError.value = ''
  try {
    const res = await riskProgramApi.update(programId, {
      name: programForm.name.trim(),
      description: programForm.description.trim() || undefined,
      year: programForm.year,
    })
    program.value = res.data.data
    showEditProgram.value = false
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Program berhasil diperbarui', life: 3000 })
  } catch (err: any) {
    editProgramError.value = extractApiError(err, 'Gagal memperbarui program.')
  } finally {
    editProgramLoading.value = false
  }
}

// ─── Add Framework ────────────────────────────────────────────────────────────

const showAddFw = ref(false)
const addFwLoading = ref(false)
const addFwError = ref('')
const addFwForm = reactive({ frameworkId: '' })
const addFwErrors = reactive({ frameworkId: '' })

function openAddFramework() {
  addFwForm.frameworkId = ''
  addFwErrors.frameworkId = ''
  addFwError.value = ''
  showAddFw.value = true
}

async function submitAddFramework() {
  addFwErrors.frameworkId = ''
  if (!addFwForm.frameworkId) { addFwErrors.frameworkId = 'Framework wajib dipilih'; return }

  addFwLoading.value = true
  addFwError.value = ''
  try {
    await programFrameworkApi.add(programId, { frameworkId: addFwForm.frameworkId })
    showAddFw.value = false
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Framework berhasil ditambahkan', life: 3000 })
    loadFrameworks()
    loadProgram()
  } catch (err: any) {
    addFwError.value = extractApiError(err, 'Gagal menambahkan framework.')
  } finally {
    addFwLoading.value = false
  }
}

// ─── Edit Framework ───────────────────────────────────────────────────────────

const showEditFw = ref(false)
const editFwLoading = ref(false)
const editFwError = ref('')
const editFwTarget = ref<ProgramFramework | null>(null)
const editFwForm = reactive({ status: 'ACTIVE' as ProgramFramework['status'] })

function openEditFramework(pf: ProgramFramework) {
  editFwTarget.value = pf
  editFwForm.status = pf.status
  editFwError.value = ''
  showEditFw.value = true
}

async function submitEditFramework() {
  if (!editFwTarget.value) return
  editFwLoading.value = true
  editFwError.value = ''
  try {
    await programFrameworkApi.update(programId, editFwTarget.value.id, { status: editFwForm.status })
    showEditFw.value = false
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Konfigurasi framework diperbarui', life: 3000 })
    loadFrameworks()
  } catch (err: any) {
    editFwError.value = extractApiError(err, 'Gagal memperbarui konfigurasi.')
  } finally {
    editFwLoading.value = false
  }
}

// ─── Delete Framework ─────────────────────────────────────────────────────────

const showDeleteFw = ref(false)
const deleteFwLoading = ref(false)
const deleteFwError = ref('')
const deleteFwTarget = ref<ProgramFramework | null>(null)

function openDeleteFramework(pf: ProgramFramework) {
  deleteFwTarget.value = pf
  deleteFwError.value = ''
  showDeleteFw.value = true
}

async function submitDeleteFramework() {
  if (!deleteFwTarget.value) return
  deleteFwLoading.value = true
  deleteFwError.value = ''
  try {
    await programFrameworkApi.remove(programId, deleteFwTarget.value.id)
    showDeleteFw.value = false
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Framework dihapus dari program', life: 3000 })
    loadFrameworks()
    loadProgram()
  } catch (err: any) {
    deleteFwError.value = extractApiError(err, 'Gagal menghapus framework.')
  } finally {
    deleteFwLoading.value = false
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

onMounted(() => {
  loadProgram()
  loadFrameworks()
  loadAllFrameworks()
})
</script>

<style scoped>

/* ─── Page ────────────────────────────────────────────────────────────────── */

.rpd-page {
  padding: 2rem;
  max-width: 1080px;
  margin: 0 auto;
}

/* ─── Breadcrumb ──────────────────────────────────────────────────────────── */

.rpd-breadcrumb-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.75rem;
}

.rpd-back-btn {
  width: 28px;
  height: 28px;
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

.rpd-back-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.rpd-breadcrumb-text {
  font-size: 13px;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: color 0.15s;
}

.rpd-breadcrumb-text:hover { color: var(--color-accent); }

.rpd-breadcrumb-sep {
  font-size: 13px;
  color: var(--color-text-muted);
  opacity: 0.4;
}

.rpd-breadcrumb-current {
  font-size: 13px;
  color: var(--color-text-dim);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ─── Two-column layout ───────────────────────────────────────────────────── */

.rpd-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 1.5rem;
  align-items: flex-start;
}

@media (max-width: 768px) {
  .rpd-layout { grid-template-columns: 1fr; }
}

/* ─── Sidebar ─────────────────────────────────────────────────────────────── */

.rpd-sidebar-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  position: sticky;
  top: 1.5rem;
}

.rpd-sidebar-header {
  padding: 1.25rem 1.25rem 1rem;
  border-bottom: 1px solid var(--color-border);
}

.rpd-sidebar-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 0.6rem;
  line-height: 1.3;
  word-break: break-word;
}

.rpd-sidebar-badges {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 0.625rem;
}

.rpd-year-badge {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-dim);
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  padding: 1px 8px;
  border-radius: var(--radius-sm);
}

.rpd-status-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 500;
  border-radius: 100px;
}

.chip-draft    { background: rgba(100, 116, 139, 0.1); color: #94a3b8;           border: 1px solid rgba(100, 116, 139, 0.25); }
.chip-active   { background: rgba(0, 229, 184, 0.1);   color: var(--color-accent); border: 1px solid rgba(0, 229, 184, 0.25); }
.chip-closed   { background: rgba(251, 146, 60, 0.1);  color: #fb923c;           border: 1px solid rgba(251, 146, 60, 0.25); }
.chip-archived { background: var(--color-bg-input);    color: var(--color-text-muted); border: 1px solid var(--color-border); }

.rpd-sidebar-desc {
  font-size: 12px;
  color: var(--color-text-dim);
  line-height: 1.5;
  margin: 0;
}

.rpd-no-desc { color: var(--color-text-muted); font-style: italic; }

.rpd-sidebar-meta {
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.rpd-meta-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 12px;
}

.rpd-meta-icon {
  font-size: 11px;
  color: var(--color-text-muted);
  width: 14px;
  text-align: center;
  flex-shrink: 0;
}

.rpd-meta-label {
  color: var(--color-text-muted);
  flex: 1;
}

.rpd-meta-val {
  color: var(--color-text-dim);
  font-weight: 500;
  font-family: var(--font-mono);
  font-size: 11px;
}

.rpd-sidebar-actions {
  padding: 0.875rem 1.25rem;
}

.rpd-sidebar-edit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 7px 14px;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-dim);
  font-size: 12px;
  font-family: var(--font-body);
  cursor: pointer;
  transition: all 0.15s;
}

.rpd-sidebar-edit-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
  background: rgba(0, 229, 184, 0.04);
}

/* ─── Main ────────────────────────────────────────────────────────────────── */

.rpd-main {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-width: 0;
}

/* ─── Section ─────────────────────────────────────────────────────────────── */

.rpd-section {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.rpd-section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.125rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
  gap: 1rem;
}

.rpd-section-header-left { flex: 1; min-width: 0; }

.rpd-section-title {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-dim);
  margin: 0 0 3px;
}

.rpd-section-desc {
  font-size: 12px;
  color: var(--color-text-muted);
  margin: 0;
  line-height: 1.4;
}

.rpd-add-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  background: rgba(0, 229, 184, 0.08);
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

.rpd-add-btn:hover { background: rgba(0, 229, 184, 0.15); }

/* ─── Framework list rows ─────────────────────────────────────────────────── */

.rpd-fw-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.rpd-fw-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
  transition: background 0.12s;
}

.rpd-fw-row:last-child { border-bottom: none; }

.rpd-fw-row:hover { background: rgba(0, 229, 184, 0.02); }

.rpd-fw-row.row-inactive { opacity: 0.55; }

/* Row left */
.rpd-fw-row-left {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
  min-width: 0;
}

.rpd-fw-row-top {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.rpd-fw-code {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  color: var(--color-accent);
  background: rgba(0, 229, 184, 0.08);
  border: 1px solid rgba(0, 229, 184, 0.2);
  padding: 1px 7px;
  border-radius: var(--radius-sm);
  letter-spacing: 0.06em;
}

.rpd-fw-version {
  font-size: 11px;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
}

.rpd-fw-status {
  font-size: 10px;
  font-weight: 500;
  padding: 1px 7px;
  border-radius: 100px;
}

.fw-status-active   { background: rgba(0, 229, 184, 0.1); color: var(--color-accent); border: 1px solid rgba(0, 229, 184, 0.2); }
.fw-status-inactive { background: rgba(100,116,139,0.1);  color: #94a3b8;             border: 1px solid rgba(100,116,139,0.2); }
.fw-status-archived { background: var(--color-bg-input);  color: var(--color-text-muted); border: 1px solid var(--color-border); }

.rpd-fw-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  line-height: 1.3;
}

.rpd-fw-row-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.rpd-fw-ctx-count {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--color-text-muted);
}

.rpd-fw-ctx-count .pi {
  font-size: 10px;
  opacity: 0.6;
}

/* Row right */
.rpd-fw-row-right {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  flex-shrink: 0;
}

.rpd-fw-manage-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-dim);
  font-size: 12px;
  font-family: var(--font-body);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.rpd-fw-manage-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
  background: rgba(0, 229, 184, 0.05);
}

.rpd-fw-row-icons {
  display: flex;
  align-items: center;
  gap: 2px;
}

/* ─── States ──────────────────────────────────────────────────────────────── */

.rpd-centered {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2.5rem;
}

.rpd-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 3.5rem 1rem;
  text-align: center;
}

.rpd-empty-icon {
  font-size: 2rem;
  color: var(--color-text-muted);
  opacity: 0.3;
  margin-bottom: 0.25rem;
}

.rpd-empty-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-dim);
  margin: 0;
}

.rpd-empty-desc {
  font-size: 12px;
  color: var(--color-text-muted);
  margin: 0;
  max-width: 340px;
  line-height: 1.5;
}

.rpd-alert-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.125rem;
  font-size: 13px;
  color: #ff8fa3;
  background: var(--color-danger-dim);
  border: 1px solid rgba(255, 77, 109, 0.3);
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
}

.rpd-section-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.25rem;
  font-size: 12px;
  color: #ff8fa3;
}

/* ─── Form (dialogs) ──────────────────────────────────────────────────────── */

.rpd-form {
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

.form-hint {
  font-size: 11px;
  color: var(--color-text-muted);
  font-style: italic;
}

.rpd-field-input {
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

.rpd-field-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px var(--color-accent-glow);
}

.rpd-field-input.is-error { border-color: var(--color-danger); }
.rpd-field-select { cursor: pointer; }
.rpd-field-textarea { resize: vertical; min-height: 64px; line-height: 1.6; }

.form-err {
  font-size: 11px;
  color: #ff8fa3;
}

.rpd-form-error {
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

.rpd-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.rpd-edit-fw-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0.625rem 0.875rem;
  background: rgba(0, 229, 184, 0.04);
  border: 1px solid rgba(0, 229, 184, 0.15);
  border-radius: var(--radius-sm);
  margin-bottom: 1.25rem;
}

.rpd-fw-name-sm {
  font-size: 13px;
  color: var(--color-text-dim);
}

</style>
