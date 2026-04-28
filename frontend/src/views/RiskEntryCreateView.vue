<template>
  <div class="rec-page">

    <!-- ─── Loading awal ──────────────────────────────────────────────────────── -->
    <div v-if="initLoading" class="rec-centered">
      <ProgressSpinner style="width: 36px; height: 36px" />
    </div>
    <div v-else-if="initError" class="rec-alert-error">
      <i class="pi pi-exclamation-circle" /> {{ initError }}
    </div>

    <template v-else>

      <!-- ─── Breadcrumb ──────────────────────────────────────────────────────── -->
      <div class="rec-breadcrumb">
        <button class="rec-back-btn" type="button" @click="goBack">
          <i class="pi pi-arrow-left" />
        </button>
        <span class="rec-breadcrumb-text" @click="goBack">Kertas Kerja</span>
        <span class="rec-breadcrumb-sep">/</span>
        <span class="rec-breadcrumb-current">Input Entri Risiko</span>
      </div>

      <!-- ─── Step indicator ─────────────────────────────────────────────────── -->
      <div class="rec-steps">
        <div
          v-for="(s, i) in steps"
          :key="i"
          class="rec-step"
          :class="{ active: currentStep === i, done: currentStep > i }"
        >
          <div class="rec-step-circle">
            <i v-if="currentStep > i" class="pi pi-check" />
            <span v-else>{{ i + 1 }}</span>
          </div>
          <span class="rec-step-label">{{ s }}</span>
        </div>
      </div>

      <!-- ─── Main card ───────────────────────────────────────────────────────── -->
      <div class="rec-card">

        <!-- ══════════════════ STEP 0: Konteks & Subjek ══════════════════════ -->
        <div v-if="currentStep === 0" class="rec-step-body">
          <h2 class="rec-step-title">Konteks & Subjek Risiko</h2>

          <!-- Konteks Risiko dropdown -->
          <div class="rec-form-group">
            <label class="rec-label">Konteks Risiko <span class="rec-req">*</span></label>
            <div class="rec-select-wrap" :class="{ 'is-error': errors.programFrameworkContextId }">
              <button
                type="button"
                class="rec-select-trigger"
                :class="{ open: openDropdown === 'context' }"
                @click="toggleDropdown('context')"
              >
                <template v-if="selectedContextOption">
                  <span class="rec-ctx-code">[{{ selectedContextOption.code }}]</span>
                  <span class="rec-select-value-text">{{ selectedContextOption.name }}</span>
                </template>
                <span v-else class="rec-select-placeholder">— Pilih konteks —</span>
                <i class="pi rec-select-chevron" :class="openDropdown === 'context' ? 'pi-chevron-up' : 'pi-chevron-down'" />
              </button>
              <div v-show="openDropdown === 'context'" class="rec-select-panel">
                <div class="rec-select-search-wrap">
                  <i class="pi pi-search" style="font-size:11px;color:var(--color-text-muted)" />
                  <input
                    v-model="searchContext"
                    type="text"
                    placeholder="Cari konteks..."
                    class="rec-select-search-input"
                    @click.stop
                  />
                </div>
                <div class="rec-select-list">
                  <div v-if="filteredPfGroups.length === 0" class="rec-select-empty">
                    Tidak ada hasil
                  </div>
                  <template v-for="pf in filteredPfGroups" :key="pf.pfId">
                    <div class="rec-select-group-header">
                      <span class="rec-select-fw-badge">[{{ pf.frameworkCode }}]</span>
                      <span class="rec-select-fw-name">{{ pf.frameworkName }}</span>
                    </div>
                    <div
                      v-for="opt in pf.contexts"
                      :key="opt.riskContextId"
                      class="rec-select-option"
                      :class="{ selected: form.riskContextId === opt.riskContextId }"
                      @click="selectContext(opt)"
                    >
                      <span class="rec-ctx-code">[{{ opt.code }}]</span>
                      <span class="rec-select-option-name">{{ opt.name }}</span>
                      <i v-if="form.riskContextId === opt.riskContextId" class="pi pi-check rec-select-check" />
                    </div>
                  </template>
                </div>
              </div>
            </div>
            <span v-if="errors.programFrameworkContextId" class="rec-err">{{ errors.programFrameworkContextId }}</span>
          </div>

          <!-- Context loading -->
          <div v-if="contextLoading" class="rec-loading-inline">
            <ProgressSpinner style="width: 20px; height: 20px" />
            <span>Memuat data konteks…</span>
          </div>

          <template v-if="contextDetail && !contextLoading">
            <!-- Context info badge -->
            <div class="rec-ctx-info">
              <span class="rec-ctx-type-badge" :class="contextDetail.contextType === 'ASSET' ? 'badge-asset' : 'badge-process'">
                {{ contextDetail.contextType === 'ASSET' ? 'Aset' : 'Proses Bisnis' }}
              </span>
              <span class="rec-ctx-matrix">
                Matriks {{ contextDetail.matrixRows }}×{{ contextDetail.matrixCols }}
              </span>
              <span class="rec-ctx-areas">
                {{ contextDetail.impactAreas.length }} area dampak
              </span>
            </div>

            <!-- Asset dropdown -->
            <div v-if="contextDetail.contextType === 'ASSET'" class="rec-form-group">
              <label class="rec-label">Aset <span class="rec-opt">(opsional)</span></label>
              <div class="rec-select-wrap">
                <button
                  type="button"
                  class="rec-select-trigger"
                  :class="{ open: openDropdown === 'subject' }"
                  @click="toggleDropdown('subject')"
                >
                  <template v-if="selectedAsset">
                    <span class="rec-ctx-code">[{{ selectedAsset.code }}]</span>
                    <span class="rec-select-value-text">{{ selectedAsset.name }}</span>
                  </template>
                  <span v-else class="rec-select-placeholder">— Tanpa aset spesifik —</span>
                  <i class="pi rec-select-chevron" :class="openDropdown === 'subject' ? 'pi-chevron-up' : 'pi-chevron-down'" />
                </button>
                <div v-show="openDropdown === 'subject'" class="rec-select-panel">
                  <div class="rec-select-search-wrap">
                    <i class="pi pi-search" style="font-size:11px;color:var(--color-text-muted)" />
                    <input
                      v-model="searchSubject"
                      type="text"
                      placeholder="Cari aset..."
                      class="rec-select-search-input"
                      @click.stop
                    />
                  </div>
                  <div class="rec-select-list">
                    <div
                      class="rec-select-option"
                      :class="{ selected: !form.assetId }"
                      @click="form.assetId = ''; closeAllDropdowns()"
                    >
                      <span class="rec-select-none-label">— Tanpa aset spesifik —</span>
                      <i v-if="!form.assetId" class="pi pi-check rec-select-check" />
                    </div>
                    <div v-if="availableAssets.length === 0" class="rec-select-empty">
                      Belum ada aset aktif tersedia
                    </div>
                    <div v-else-if="filteredAssets.length === 0" class="rec-select-empty">
                      Tidak ada hasil
                    </div>
                    <div
                      v-for="a in filteredAssets"
                      :key="a.id"
                      class="rec-select-option"
                      :class="{ selected: form.assetId === a.id }"
                      @click="form.assetId = a.id; closeAllDropdowns()"
                    >
                      <span class="rec-ctx-code">[{{ a.code }}]</span>
                      <span class="rec-select-option-name">{{ a.name }}</span>
                      <i v-if="form.assetId === a.id" class="pi pi-check rec-select-check" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Business process dropdown -->
            <div v-if="contextDetail.contextType === 'PROCESS'" class="rec-form-group">
              <label class="rec-label">Proses Bisnis <span class="rec-opt">(opsional)</span></label>
              <div class="rec-select-wrap">
                <button
                  type="button"
                  class="rec-select-trigger"
                  :class="{ open: openDropdown === 'subject' }"
                  @click="toggleDropdown('subject')"
                >
                  <template v-if="selectedProcess">
                    <span class="rec-ctx-code">[{{ selectedProcess.code }}]</span>
                    <span class="rec-select-value-text">{{ selectedProcess.name }}</span>
                  </template>
                  <span v-else class="rec-select-placeholder">— Tanpa proses spesifik —</span>
                  <i class="pi rec-select-chevron" :class="openDropdown === 'subject' ? 'pi-chevron-up' : 'pi-chevron-down'" />
                </button>
                <div v-show="openDropdown === 'subject'" class="rec-select-panel">
                  <div class="rec-select-search-wrap">
                    <i class="pi pi-search" style="font-size:11px;color:var(--color-text-muted)" />
                    <input
                      v-model="searchSubject"
                      type="text"
                      placeholder="Cari proses bisnis..."
                      class="rec-select-search-input"
                      @click.stop
                    />
                  </div>
                  <div class="rec-select-list">
                    <div
                      class="rec-select-option"
                      :class="{ selected: !form.businessProcessId }"
                      @click="form.businessProcessId = ''; closeAllDropdowns()"
                    >
                      <span class="rec-select-none-label">— Tanpa proses spesifik —</span>
                      <i v-if="!form.businessProcessId" class="pi pi-check rec-select-check" />
                    </div>
                    <div v-if="availableProcesses.length === 0" class="rec-select-empty">
                      Belum ada proses bisnis aktif tersedia
                    </div>
                    <div v-else-if="filteredProcesses.length === 0" class="rec-select-empty">
                      Tidak ada hasil
                    </div>
                    <div
                      v-for="p in filteredProcesses"
                      :key="p.id"
                      class="rec-select-option"
                      :class="{ selected: form.businessProcessId === p.id }"
                      @click="form.businessProcessId = p.id; closeAllDropdowns()"
                    >
                      <span class="rec-ctx-code">[{{ p.code }}]</span>
                      <span class="rec-select-option-name">{{ p.name }}</span>
                      <i v-if="form.businessProcessId === p.id" class="pi pi-check rec-select-check" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- ══════════════════ STEP 1: Deskripsi Risiko ══════════════════════ -->
        <div v-if="currentStep === 1" class="rec-step-body">
          <h2 class="rec-step-title">Deskripsi Risiko</h2>

          <!-- Category dropdown -->
          <div class="rec-form-group">
            <label class="rec-label">Kategori Risiko <span class="rec-opt">(opsional)</span></label>
            <div class="rec-select-wrap">
              <button
                type="button"
                class="rec-select-trigger"
                :class="{ open: openDropdown === 'category' }"
                @click="toggleDropdown('category')"
              >
                <template v-if="selectedCategory">
                  <span class="rec-cat-dot" :style="{ background: selectedCategory.color ?? 'var(--color-text-muted)' }" />
                  <span class="rec-select-value-text">{{ selectedCategory.name }}</span>
                </template>
                <span v-else class="rec-select-placeholder">— Tanpa kategori —</span>
                <i class="pi rec-select-chevron" :class="openDropdown === 'category' ? 'pi-chevron-up' : 'pi-chevron-down'" />
              </button>
              <div v-show="openDropdown === 'category'" class="rec-select-panel">
                <div class="rec-select-search-wrap">
                  <i class="pi pi-search" style="font-size:11px;color:var(--color-text-muted)" />
                  <input
                    v-model="searchCategory"
                    type="text"
                    placeholder="Cari kategori..."
                    class="rec-select-search-input"
                    @click.stop
                  />
                </div>
                <div class="rec-select-list">
                  <div
                    class="rec-select-option"
                    :class="{ selected: !form.riskCategoryId }"
                    @click="form.riskCategoryId = ''; closeAllDropdowns()"
                  >
                    <span class="rec-select-none-label">— Tanpa kategori —</span>
                    <i v-if="!form.riskCategoryId" class="pi pi-check rec-select-check" />
                  </div>
                  <div v-if="(contextDetail?.riskCategories ?? []).length === 0" class="rec-select-empty">
                    Belum ada kategori tersedia
                  </div>
                  <div v-else-if="filteredCategories.length === 0" class="rec-select-empty">
                    Tidak ada hasil
                  </div>
                  <div
                    v-for="cat in filteredCategories"
                    :key="cat.id"
                    class="rec-select-option"
                    :class="{ selected: form.riskCategoryId === cat.id }"
                    @click="form.riskCategoryId = cat.id; closeAllDropdowns()"
                  >
                    <span class="rec-cat-dot" :style="{ background: cat.color ?? 'var(--color-text-muted)' }" />
                    <span class="rec-select-option-name">{{ cat.name }}</span>
                    <i v-if="form.riskCategoryId === cat.id" class="pi pi-check rec-select-check" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Name -->
          <div class="rec-form-group">
            <label class="rec-label">Nama / Peristiwa Risiko <span class="rec-req">*</span></label>
            <input
              v-model="form.name"
              type="text"
              class="rec-input"
              :class="{ 'is-error': errors.name }"
              maxlength="500"
              autocomplete="off"
            />
            <span v-if="errors.name" class="rec-err">{{ errors.name }}</span>
          </div>

          <!-- Description / Kerawanan -->
          <div class="rec-form-group">
            <label class="rec-label">Kerawanan <span class="rec-opt">(opsional)</span></label>
            <textarea v-model="form.description" class="rec-input rec-textarea" rows="2" />
          </div>

        </div>

        <!-- ══════════════════ STEP 2: Kontrol yang Ada ══════════════════════ -->
        <div v-if="currentStep === 2" class="rec-step-body">
          <div class="rec-step-header-row">
            <div>
              <h2 class="rec-step-title" style="margin-bottom: 0.25rem">Kontrol yang Ada</h2>
              <p class="rec-hint">Daftar kontrol yang sudah ada sebelum penilaian risiko dilakukan.</p>
            </div>
            <button type="button" class="rec-add-btn" @click="addControl">
              <i class="pi pi-plus" /> Tambah Kontrol
            </button>
          </div>

          <div v-if="form.controls.length === 0" class="rec-empty-inline" style="margin-top: 1rem">
            <i class="pi pi-shield" />
            <span>Belum ada kontrol. Klik "Tambah Kontrol" atau lanjutkan jika tidak ada.</span>
          </div>

          <div v-for="(ctrl, i) in form.controls" :key="i" class="ctrl-card" :class="`ctrl-eff-${ctrl.effectiveness ? ctrl.effectiveness.toLowerCase() : 'unset'}`">
            <div class="ctrl-accent-bar" />
            <div class="ctrl-card-body">

              <!-- Row 1: number + name + remove -->
              <div class="ctrl-row-top">
                <span class="ctrl-num-badge">{{ i + 1 }}</span>
                <div class="ctrl-name-col">
                  <input
                    v-model="ctrl.name"
                    type="text"
                    class="ctrl-name-input rec-input"
                    :class="{ 'is-error': controlErrors[i]?.name }"
                    placeholder="Nama kontrol..."
                    maxlength="500"
                    autocomplete="off"
                  />
                  <span v-if="controlErrors[i]?.name" class="rec-err">{{ controlErrors[i].name }}</span>
                </div>
                <button type="button" class="ctrl-remove-btn" @click="removeControl(i)" title="Hapus kontrol">
                  <i class="pi pi-times" />
                </button>
              </div>

              <!-- Row 2: effectiveness pills -->
              <div class="ctrl-eff-row">
                <span class="ctrl-eff-row-label">Efektivitas</span>
                <div class="ctrl-eff-pills">
                  <label
                    v-for="opt in effectivenessOptions"
                    :key="opt.value"
                    class="ctrl-eff-pill"
                    :class="{ selected: ctrl.effectiveness === opt.value, [`pill-${opt.value.toLowerCase()}`]: true }"
                    :title="opt.desc"
                  >
                    <input type="radio" :name="`eff-${i}`" :value="opt.value" v-model="ctrl.effectiveness" style="display:none" />
                    <i class="pi" :class="opt.value === 'ADEQUATE' ? 'pi-check-circle' : opt.value === 'PARTIAL' ? 'pi-minus-circle' : 'pi-times-circle'" />
                    {{ opt.label }}
                  </label>
                </div>
                <span v-if="controlErrors[i]?.effectiveness" class="rec-err" style="margin-left: 0.25rem">{{ controlErrors[i].effectiveness }}</span>
              </div>

              <!-- Row 3: description -->
              <textarea
                v-model="ctrl.description"
                class="ctrl-desc-input rec-input rec-textarea"
                rows="2"
                placeholder="Deskripsi kontrol (opsional)..."
              />

            </div>
          </div>
        </div>

        <!-- ─── Navigation buttons ─────────────────────────────────────────────── -->
        <div class="rec-nav">
          <button
            v-if="currentStep > 0"
            type="button"
            class="rec-btn-secondary"
            :disabled="submitLoading"
            @click="prevStep"
          >
            <i class="pi pi-arrow-left" /> Sebelumnya
          </button>
          <div class="rec-nav-spacer" />
          <button
            v-if="currentStep < steps.length - 1"
            type="button"
            class="rec-btn-primary"
            @click="nextStep"
          >
            Selanjutnya <i class="pi pi-arrow-right" />
          </button>
          <button
            v-else
            type="button"
            class="rec-btn-submit"
            :disabled="submitLoading"
            @click="submitForm"
          >
            <i v-if="submitLoading" class="pi pi-spin pi-spinner" />
            <i v-else class="pi pi-check" />
            Simpan Entri Risiko
          </button>
        </div>

        <!-- API error -->
        <div v-if="submitError" class="rec-api-error">
          <i class="pi pi-exclamation-triangle" /> {{ submitError }}
        </div>

      </div><!-- /.rec-card -->
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'
import { workingPaperApi } from '@/api/workingPaper'
import { programFrameworkApi } from '@/api/programFramework'
import { riskContextApi, type RiskContextDetail } from '@/api/riskContext'
import { riskEntryApi, type ControlEffectiveness } from '@/api/riskEntry'
import { assetApi, type Asset } from '@/api/asset'
import { prosesBisnisApi, type ProsesBisnis } from '@/api/prosesBisnis'
import { extractApiError } from '@/utils/apiError'

const router = useRouter()
const route = useRoute()
const toast = useToast()

const wpId = route.params.id as string
const unitKerjaId = ref('')

const steps = ['Konteks & Subjek', 'Deskripsi Risiko', 'Kontrol']
const currentStep = ref(0)

// ─── Init loading ─────────────────────────────────────────────────────────────

const initLoading = ref(true)
const initError = ref('')

interface PfGroup {
  pfId: string
  frameworkCode: string
  frameworkName: string
  contexts: Array<{ riskContextId: string; programFrameworkId: string; code: string; name: string }>
}

const pfGroups = ref<PfGroup[]>([])

async function init() {
  initLoading.value = true
  initError.value = ''
  try {
    const wpRes = await workingPaperApi.getById(wpId)
    const wp = wpRes.data.data
    if (wp.status !== 'DRAFT' && wp.status !== 'REVISION') {
      initError.value = `Kertas kerja berstatus "${wp.status}" tidak dapat diedit.`
      return
    }
    unitKerjaId.value = wp.unitKerjaId

    const pfRes = await programFrameworkApi.listByProgram(wp.programId)
    const pfs = pfRes.data.data ?? []

    const groups = await Promise.all(
      pfs.map(pf =>
        riskContextApi.listByFramework(pf.frameworkId).then(r => ({
          pf,
          contexts: (r.data.data ?? []).filter(c => c.status === 'ACTIVE'),
        }))
      )
    )

    pfGroups.value = groups
      .filter(r => r.contexts.length > 0)
      .map(r => ({
        pfId: r.pf.id,
        frameworkCode: r.pf.framework.code,
        frameworkName: r.pf.framework.name,
        contexts: r.contexts.map(ctx => ({
          riskContextId: ctx.id,
          programFrameworkId: r.pf.id,
          code: ctx.code,
          name: ctx.name,
        })),
      }))
  } catch (err: any) {
    initError.value = extractApiError(err, 'Gagal memuat data kertas kerja.')
  } finally {
    initLoading.value = false
  }
}

// ─── Context loading ──────────────────────────────────────────────────────────

const contextLoading = ref(false)
const contextDetail = ref<RiskContextDetail | null>(null)
const availableAssets = ref<Asset[]>([])
const availableProcesses = ref<ProsesBisnis[]>([])

async function loadContext(riskContextId: string) {
  contextLoading.value = true
  contextDetail.value = null
  availableAssets.value = []
  availableProcesses.value = []
  try {
    const res = await riskContextApi.getById(riskContextId)
    contextDetail.value = res.data.data
    if (res.data.data.contextType === 'ASSET') {
      const assetRes = await assetApi.search(unitKerjaId.value, { status: 'ACTIVE', limit: 100 })
      availableAssets.value = assetRes.data.data ?? []
    } else {
      const procRes = await prosesBisnisApi.search(unitKerjaId.value, { status: 'ACTIVE', limit: 100 })
      availableProcesses.value = procRes.data.data ?? []
    }
  } catch (err: any) {
    initError.value = extractApiError(err, 'Gagal memuat detail konteks.')
  } finally {
    contextLoading.value = false
  }
}

// ─── Dropdown state ───────────────────────────────────────────────────────────

const openDropdown = ref<string | null>(null)
const searchContext = ref('')
const searchSubject = ref('')
const searchCategory = ref('')

function toggleDropdown(name: string) {
  if (openDropdown.value === name) {
    openDropdown.value = null
  } else {
    openDropdown.value = name
    if (name === 'context') searchContext.value = ''
    if (name === 'subject') searchSubject.value = ''
    if (name === 'category') searchCategory.value = ''
  }
}

function closeAllDropdowns() {
  openDropdown.value = null
}

function handleOutsideClick(e: MouseEvent) {
  if (!(e.target as HTMLElement).closest('.rec-select-wrap')) {
    closeAllDropdowns()
  }
}

function selectContext(opt: { riskContextId: string; programFrameworkId: string; code: string; name: string }) {
  form.riskContextId = opt.riskContextId
  form.programFrameworkId = opt.programFrameworkId
  form.assetId = ''
  form.businessProcessId = ''
  closeAllDropdowns()
  loadContext(opt.riskContextId)
}

const selectedContextOption = computed(() => {
  if (!form.riskContextId) return null
  for (const g of pfGroups.value) {
    const ctx = g.contexts.find(c => c.riskContextId === form.riskContextId)
    if (ctx) return ctx
  }
  return null
})

const selectedAsset = computed(() =>
  form.assetId ? (availableAssets.value.find(a => a.id === form.assetId) ?? null) : null
)

const selectedProcess = computed(() =>
  form.businessProcessId
    ? (availableProcesses.value.find(p => p.id === form.businessProcessId) ?? null)
    : null
)

const selectedCategory = computed(() =>
  form.riskCategoryId
    ? (contextDetail.value?.riskCategories.find(c => c.id === form.riskCategoryId) ?? null)
    : null
)

const filteredPfGroups = computed(() => {
  const q = searchContext.value.toLowerCase()
  if (!q) return pfGroups.value
  return pfGroups.value
    .map(pf => ({
      ...pf,
      contexts: pf.contexts.filter(
        c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
      ),
    }))
    .filter(pf => pf.contexts.length > 0)
})

const filteredAssets = computed(() => {
  const q = searchSubject.value.toLowerCase()
  if (!q) return availableAssets.value
  return availableAssets.value.filter(
    a => a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q)
  )
})

const filteredProcesses = computed(() => {
  const q = searchSubject.value.toLowerCase()
  if (!q) return availableProcesses.value
  return availableProcesses.value.filter(
    p => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)
  )
})

const filteredCategories = computed(() => {
  const q = searchCategory.value.toLowerCase()
  const cats = contextDetail.value?.riskCategories ?? []
  if (!q) return cats
  return cats.filter(c => c.name.toLowerCase().includes(q))
})

// ─── Form state ───────────────────────────────────────────────────────────────

const form = reactive({
  programFrameworkId: '',
  riskContextId: '',
  assetId: '',
  businessProcessId: '',
  name: '',
  description: '',
  riskCategoryId: '',
  controls: [] as Array<{ name: string; description: string; effectiveness: ControlEffectiveness | '' }>,
})

const errors = reactive({
  programFrameworkContextId: '',
  name: '',
})

const controlErrors = ref<Array<{ name?: string; effectiveness?: string }>>([])
const submitError = ref('')
const submitLoading = ref(false)

// ─── Controls ─────────────────────────────────────────────────────────────────

const effectivenessOptions: Array<{ value: ControlEffectiveness; label: string; desc: string }> = [
  { value: 'ADEQUATE', label: 'Memadai', desc: 'Kontrol sudah efektif mengurangi risiko' },
  { value: 'PARTIAL', label: 'Sebagian', desc: 'Kontrol sudah ada namun belum sepenuhnya efektif' },
  { value: 'INADEQUATE', label: 'Tidak Memadai', desc: 'Kontrol belum efektif atau tidak ada' },
]

function addControl() {
  form.controls.push({ name: '', description: '', effectiveness: '' })
  controlErrors.value.push({})
}

function removeControl(i: number) {
  form.controls.splice(i, 1)
  controlErrors.value.splice(i, 1)
}

// ─── Navigation ───────────────────────────────────────────────────────────────

function validateStep0(): boolean {
  errors.programFrameworkContextId = ''
  if (!form.riskContextId) {
    errors.programFrameworkContextId = 'Konteks wajib dipilih'
    return false
  }
  if (!contextDetail.value) {
    errors.programFrameworkContextId = 'Data konteks belum termuat, coba pilih ulang'
    return false
  }
  return true
}

function validateStep1(): boolean {
  errors.name = ''
  let ok = true
  if (!form.name.trim()) { errors.name = 'Nama risiko tidak boleh kosong'; ok = false }
  return ok
}

function validateStep2(): boolean {
  controlErrors.value = form.controls.map(ctrl => {
    const e: { name?: string; effectiveness?: string } = {}
    if (!ctrl.name.trim()) e.name = 'Nama kontrol tidak boleh kosong'
    if (!ctrl.effectiveness) e.effectiveness = 'Kemampuan kontrol wajib dipilih'
    return e
  })
  return controlErrors.value.every(e => !e.name && !e.effectiveness)
}

function nextStep() {
  let valid = true
  if (currentStep.value === 0) valid = validateStep0()
  else if (currentStep.value === 1) valid = validateStep1()
  else if (currentStep.value === 2) valid = validateStep2()
  if (valid) currentStep.value++
}

function prevStep() {
  if (currentStep.value > 0) currentStep.value--
}

function goBack() {
  router.push({ name: 'working-paper-detail', params: { id: wpId } })
}

// ─── Submit ───────────────────────────────────────────────────────────────────

async function submitForm() {
  if (!validateStep2()) return

  submitLoading.value = true
  submitError.value = ''
  try {
    await riskEntryApi.create(wpId, {
      programFrameworkId: form.programFrameworkId,
      riskContextId: form.riskContextId,
      assetId: form.assetId || null,
      businessProcessId: form.businessProcessId || null,
      name: form.name.trim(),
      description: form.description.trim() || null,
      riskCategoryId: form.riskCategoryId || null,
      controls: form.controls.map((c, i) => ({
        name: c.name.trim(),
        description: c.description.trim() || null,
        effectiveness: c.effectiveness as ControlEffectiveness,
        order: i,
      })),
    })

    toast.add({
      severity: 'success',
      summary: 'Berhasil',
      detail: 'Entri risiko berhasil disimpan',
      life: 3000,
    })
    router.push({ name: 'working-paper-detail', params: { id: wpId } })
  } catch (err: any) {
    submitError.value = extractApiError(err, 'Gagal menyimpan entri risiko.')
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  init()
  document.addEventListener('mousedown', handleOutsideClick)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleOutsideClick)
})
</script>

<style scoped>

.rec-page {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

/* ─── Breadcrumb ──────────────────────────────────────────────────────────── */

.rec-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.75rem;
}

.rec-back-btn {
  width: 28px; height: 28px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px;
  transition: all 0.15s;
}

.rec-back-btn:hover { border-color: var(--color-accent); color: var(--color-accent); }

.rec-breadcrumb-text {
  font-size: 13px; color: var(--color-text-muted); cursor: pointer;
}

.rec-breadcrumb-text:hover { color: var(--color-accent); }

.rec-breadcrumb-sep { font-size: 13px; color: var(--color-text-muted); opacity: 0.4; }

.rec-breadcrumb-current {
  font-size: 13px; color: var(--color-text-dim); font-weight: 500;
}

/* ─── Steps ───────────────────────────────────────────────────────────────── */

.rec-steps {
  display: flex;
  align-items: flex-start;
  gap: 0;
  margin-bottom: 2rem;
  overflow-x: auto;
}

.rec-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
  flex: 1;
  position: relative;
}

.rec-step:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 13px;
  left: calc(50% + 14px);
  right: calc(-50% + 14px);
  height: 2px;
  background: var(--color-border);
}

.rec-step.done:not(:last-child)::after { background: var(--color-accent); }

.rec-step-circle {
  width: 28px; height: 28px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  background: var(--color-bg-card);
  color: var(--color-text-muted);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px;
  font-weight: 600;
  z-index: 1;
  transition: all 0.2s;
}

.rec-step.active .rec-step-circle {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.rec-step.done .rec-step-circle {
  border-color: var(--color-accent);
  background: var(--color-accent);
  color: #000;
}

.rec-step-label {
  font-size: 11px;
  color: var(--color-text-muted);
  text-align: center;
  white-space: nowrap;
}

.rec-step.active .rec-step-label { color: var(--color-accent); font-weight: 600; }
.rec-step.done .rec-step-label { color: var(--color-text-dim); }

/* ─── Card ────────────────────────────────────────────────────────────────── */

.rec-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.rec-step-body {
  padding: 1.75rem 1.75rem 0.5rem;
}

.rec-step-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 1.25rem;
}

.rec-step-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0;
}

/* ─── Form elements ───────────────────────────────────────────────────────── */

.rec-form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-bottom: 1rem;
}

.rec-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-dim);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.rec-req { color: #f87171; margin-left: 2px; }
.rec-opt { font-size: 11px; color: var(--color-text-muted); font-weight: 400; margin-left: 4px; text-transform: none; letter-spacing: 0; }

.rec-input {
  width: 100%;
  padding: 8px 10px;
  background: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-size: 13px;
  transition: border-color 0.15s;
  outline: none;
  box-sizing: border-box;
}

.rec-input:focus { border-color: var(--color-accent); }
.rec-input.is-error { border-color: #f87171; }

.rec-textarea { resize: vertical; min-height: 60px; }

select.rec-input { cursor: pointer; }

.rec-hint { font-size: 11px; color: var(--color-text-muted); font-style: italic; }
.rec-err { font-size: 11px; color: #f87171; }

/* ─── Custom Select Dropdown ──────────────────────────────────────────────── */

.rec-select-wrap {
  position: relative;
}

.rec-select-wrap.is-error .rec-select-trigger {
  border-color: #f87171;
}

.rec-select-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 8px 10px;
  background: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-size: 13px;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s;
  outline: none;
}

.rec-select-trigger:focus,
.rec-select-trigger.open {
  border-color: var(--color-accent);
}

.rec-select-placeholder {
  flex: 1;
  color: var(--color-text-muted);
  font-style: italic;
  font-size: 13px;
}

.rec-select-value-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

.rec-select-chevron {
  margin-left: auto;
  font-size: 11px;
  opacity: 0.55;
  flex-shrink: 0;
  transition: transform 0.15s;
}

.rec-select-trigger.open .rec-select-chevron {
  opacity: 0.9;
}

.rec-select-panel {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 200;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  overflow: hidden;
}

.rec-select-search-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 7px 10px;
  border-bottom: 1px solid var(--color-border);
}

.rec-select-search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--color-text);
  font-size: 12px;
}

.rec-select-search-input::placeholder {
  color: var(--color-text-muted);
}

.rec-select-list {
  max-height: 260px;
  overflow-y: auto;
}

.rec-select-group-header {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 6px 10px 4px;
  background: color-mix(in srgb, var(--color-bg-alt) 80%, transparent);
  border-bottom: 1px solid var(--color-border);
  font-size: 11px;
  position: sticky;
  top: 0;
  z-index: 1;
}

.rec-select-fw-badge {
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  color: var(--color-accent);
  background: rgba(0, 229, 184, 0.1);
  padding: 1px 5px;
  border-radius: 3px;
  flex-shrink: 0;
}

.rec-select-fw-name {
  color: var(--color-text-dim);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rec-select-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 13px;
  color: var(--color-text);
  transition: background 0.1s;
}

.rec-select-option:hover {
  background: var(--color-bg-alt);
}

.rec-select-option.selected {
  background: rgba(0, 229, 184, 0.06);
}

.rec-select-option-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rec-select-none-label {
  flex: 1;
  color: var(--color-text-muted);
  font-style: italic;
  font-size: 13px;
}

.rec-select-check {
  margin-left: auto;
  font-size: 10px;
  color: var(--color-accent);
  flex-shrink: 0;
}

.rec-select-empty {
  padding: 12px;
  text-align: center;
  font-size: 12px;
  color: var(--color-text-muted);
  font-style: italic;
}

/* Code badge inside options */
.rec-ctx-code {
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  color: var(--color-accent);
  background: rgba(0, 229, 184, 0.08);
  padding: 1px 5px;
  border-radius: 3px;
  flex-shrink: 0;
}

/* Category color dot */
.rec-cat-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ─── Level dropdown (Likelihood & Impact) ────────────────────────────────── */

.rec-level-panel {
  min-width: 100%;
}

.rec-level-option {
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 1px solid var(--color-border);
  transition: background 0.1s;
}

.rec-level-option:last-child {
  border-bottom: none;
}

.rec-level-option:hover {
  background: var(--color-bg-alt);
}

.rec-level-option.selected {
  background: rgba(0, 229, 184, 0.05);
}

.rec-level-option-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rec-level-badge {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-dim);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s;
}

.rec-level-option.selected .rec-level-badge {
  background: rgba(0, 229, 184, 0.12);
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.rec-level-option-name {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rec-level-score {
  font-size: 11px;
  color: var(--color-text-muted);
  font-family: var(--font-mono, monospace);
  background: var(--color-bg-alt);
  padding: 1px 6px;
  border-radius: 3px;
  flex-shrink: 0;
  border: 1px solid var(--color-border);
}

.rec-level-option.selected .rec-level-score {
  background: rgba(0, 229, 184, 0.1);
  color: var(--color-accent);
  border-color: rgba(0, 229, 184, 0.25);
}

.rec-level-option-desc {
  margin: 0.375rem 0 0 30px;
  font-size: 11px;
  color: var(--color-text-muted);
  line-height: 1.5;
}

/* Level number shown in trigger button after selection */
.rec-level-num {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(0, 229, 184, 0.12);
  border: 1px solid rgba(0, 229, 184, 0.3);
  font-size: 11px;
  font-weight: 700;
  color: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* ─── Context info ────────────────────────────────────────────────────────── */

.rec-ctx-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
  padding: 0.625rem 0.875rem;
  background: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.rec-ctx-type-badge {
  padding: 2px 8px;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 600;
}

.badge-asset { background: rgba(96, 165, 250, 0.12); color: #60a5fa; border: 1px solid rgba(96, 165, 250, 0.25); }
.badge-process { background: rgba(167, 139, 250, 0.12); color: #a78bfa; border: 1px solid rgba(167, 139, 250, 0.25); }

.rec-ctx-matrix, .rec-ctx-areas {
  font-size: 12px;
  color: var(--color-text-muted);
}

/* ─── Legacy control card (used by Step 4 treatment plans) ───────────────── */

.rec-control-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1rem;
  margin-bottom: 0.875rem;
  background: var(--color-bg-alt);
}

.rec-control-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.875rem;
}

.rec-control-num {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-dim);
}

.rec-remove-btn {
  width: 24px; height: 24px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px;
  transition: all 0.15s;
}

.rec-remove-btn:hover { border-color: #f87171; color: #f87171; }

/* ─── Treatment Plan card (per impact area) ───────────────────────────────── */

.rec-plan-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
  overflow: hidden;
  background: var(--color-bg-card);
}

.rec-plan-area-header {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.75rem 1rem;
  background: var(--color-bg-alt);
  border-bottom: 1px solid var(--color-border);
}

.rec-plan-area-icon {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  background: rgba(0, 229, 184, 0.1);
  border: 1px solid rgba(0, 229, 184, 0.2);
  color: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex-shrink: 0;
}

.rec-plan-area-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  flex: 1;
}

.rec-plan-area-score {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 100px;
  border: 1px solid transparent;
  flex-shrink: 0;
}

.rec-plan-fields {
  padding: 1rem;
}

/* ─── Control card (redesigned) ──────────────────────────────────────────── */

.ctrl-card {
  display: flex;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  margin-bottom: 0.75rem;
  overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s;
  background: var(--color-bg-card);
}

.ctrl-card:hover {
  box-shadow: 0 2px 12px rgba(0,0,0,0.15);
}

.ctrl-accent-bar {
  width: 4px;
  flex-shrink: 0;
  background: var(--color-border);
  transition: background 0.2s;
}

.ctrl-card.ctrl-eff-adequate .ctrl-accent-bar { background: #34d399; }
.ctrl-card.ctrl-eff-partial .ctrl-accent-bar { background: #fbbf24; }
.ctrl-card.ctrl-eff-inadequate .ctrl-accent-bar { background: #f87171; }

.ctrl-card-body {
  flex: 1;
  padding: 0.875rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.ctrl-row-top {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
}

.ctrl-num-badge {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.ctrl-name-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.ctrl-name-input {
  font-size: 13px;
  font-weight: 500;
}

.ctrl-remove-btn {
  width: 24px;
  height: 24px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  transition: all 0.15s;
  flex-shrink: 0;
  margin-top: 2px;
}

.ctrl-remove-btn:hover { border-color: #f87171; color: #f87171; }

.ctrl-eff-row {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  flex-wrap: wrap;
}

.ctrl-eff-row-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.ctrl-eff-pills {
  display: flex;
  gap: 0.375rem;
}

.ctrl-eff-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid var(--color-border);
  border-radius: 100px;
  cursor: pointer;
  color: var(--color-text-muted);
  transition: all 0.15s;
  user-select: none;
}

.ctrl-eff-pill:hover { border-color: var(--color-text-muted); color: var(--color-text); }

.ctrl-eff-pill.selected.pill-adequate { border-color: #34d399; color: #34d399; background: rgba(52,211,153,0.1); }
.ctrl-eff-pill.selected.pill-partial { border-color: #fbbf24; color: #fbbf24; background: rgba(251,191,36,0.1); }
.ctrl-eff-pill.selected.pill-inadequate { border-color: #f87171; color: #f87171; background: rgba(248,113,113,0.1); }

.ctrl-desc-input {
  font-size: 12px;
  color: var(--color-text-muted);
  resize: vertical;
  min-height: 52px;
}

/* ─── Assessment area list ────────────────────────────────────────────────── */

.assess-global-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.875rem;
  background: rgba(248,113,113,0.08);
  border: 1px solid rgba(248,113,113,0.25);
  border-radius: var(--radius-md);
  color: #f87171;
  font-size: 13px;
  margin-bottom: 0.875rem;
}

.assess-area-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.assess-area-item {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.assess-area-item.is-active {
  border-color: rgba(0, 229, 184, 0.35);
  box-shadow: 0 0 0 1px rgba(0, 229, 184, 0.12);
}

.assess-collapsed-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--color-bg-card);
  cursor: default;
}

.assess-area-icon-wrap {
  width: 30px;
  height: 30px;
  border-radius: var(--radius-sm);
  background: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--color-text-muted);
  flex-shrink: 0;
  transition: all 0.15s;
}

.assess-area-icon-wrap.active {
  background: rgba(0, 229, 184, 0.1);
  border-color: rgba(0, 229, 184, 0.3);
  color: var(--color-accent);
}

.assess-area-row-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-dim);
  flex: 1;
}

.assess-area-count {
  font-size: 11px;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.assess-nilai-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  background: rgba(0, 229, 184, 0.08);
  color: var(--color-accent);
  border: 1px solid rgba(0, 229, 184, 0.3);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}

.assess-nilai-btn:hover {
  background: rgba(0, 229, 184, 0.18);
  border-color: rgba(0, 229, 184, 0.5);
}

.assess-expanded-card {
  padding: 1rem 1.125rem 1.125rem;
  background: var(--color-bg-card);
}

.assess-expanded-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.assess-expanded-title-row {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  flex: 1;
  min-width: 0;
}

.assess-area-card-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text);
}

.assess-remove-btn {
  width: 26px;
  height: 26px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  transition: all 0.15s;
  flex-shrink: 0;
}

.assess-remove-btn:hover { border-color: #f87171; color: #f87171; }

.assess-desc-row {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.assess-summary-icon {
  font-size: 18px;
  color: var(--color-text-muted);
  opacity: 0.6;
}

.rec-score-badge {
  padding: 2px 8px;
  border-radius: 100px;
  font-size: 12px;
  font-weight: 700;
  border: 1px solid;
}

.rec-area-selects {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.875rem;
}

@media (max-width: 560px) {
  .rec-area-selects { grid-template-columns: 1fr; }
  .assess-desc-row { flex-direction: column; }
  .assess-area-count { display: none; }
}

/* ─── Score summary ───────────────────────────────────────────────────────── */

.rec-score-summary {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  margin-top: 0.5rem;
}

.rec-score-summary-label {
  font-size: 12px;
  color: var(--color-text-muted);
  flex: 1;
}

.rec-score-value {
  font-size: 24px;
  font-weight: 800;
  font-family: var(--font-mono);
}

.rec-risk-level-badge {
  padding: 3px 10px;
  border-radius: 100px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid;
}

/* ─── Add button ──────────────────────────────────────────────────────────── */

.rec-add-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  background: rgba(0, 229, 184, 0.1);
  color: var(--color-accent);
  border: 1px solid rgba(0, 229, 184, 0.3);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s;
}

.rec-add-btn:hover { background: rgba(0, 229, 184, 0.18); }

/* ─── Empty inline ────────────────────────────────────────────────────────── */

.rec-empty-inline {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  font-size: 13px;
  margin-bottom: 1rem;
}

/* ─── Navigation ──────────────────────────────────────────────────────────── */

.rec-nav {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 1.75rem;
  border-top: 1px solid var(--color-border);
  margin-top: 1rem;
}

.rec-nav-spacer { flex: 1; }

.rec-btn-secondary {
  display: inline-flex; align-items: center; gap: 0.375rem;
  padding: 8px 16px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-dim);
  font-size: 13px; font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.rec-btn-secondary:hover { border-color: var(--color-accent); color: var(--color-accent); }
.rec-btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }

.rec-btn-primary {
  display: inline-flex; align-items: center; gap: 0.375rem;
  padding: 8px 20px;
  background: var(--color-accent);
  border: none;
  border-radius: var(--radius-md);
  color: #000;
  font-size: 13px; font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}

.rec-btn-primary:hover { opacity: 0.85; }

.rec-btn-submit {
  display: inline-flex; align-items: center; gap: 0.375rem;
  padding: 8px 20px;
  background: var(--color-accent);
  border: none;
  border-radius: var(--radius-md);
  color: #000;
  font-size: 13px; font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}

.rec-btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
.rec-btn-submit:not(:disabled):hover { opacity: 0.85; }

/* ─── API error ───────────────────────────────────────────────────────────── */

.rec-api-error {
  margin: 0 1.75rem 1.25rem;
  padding: 0.625rem 0.875rem;
  background: rgba(248, 113, 113, 0.08);
  border: 1px solid rgba(248, 113, 113, 0.25);
  border-radius: var(--radius-md);
  color: #f87171;
  font-size: 13px;
}

/* ─── Loading / error states ──────────────────────────────────────────────── */

.rec-centered {
  display: flex; align-items: center; justify-content: center;
  min-height: 200px;
}

.rec-alert-error {
  padding: 1rem;
  background: rgba(248, 113, 113, 0.08);
  border: 1px solid rgba(248, 113, 113, 0.25);
  border-radius: var(--radius-md);
  color: #f87171;
  font-size: 13px;
}

.rec-loading-inline {
  display: flex; align-items: center; gap: 0.5rem;
  color: var(--color-text-muted);
  font-size: 13px;
  margin-bottom: 1rem;
}

/* ─── Checkbox ────────────────────────────────────────────────────────────── */

.rec-checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 13px;
  color: var(--color-text);
  cursor: pointer;
}

.rec-checkbox {
  width: 15px;
  height: 15px;
  cursor: pointer;
  accent-color: var(--color-accent);
}

</style>
