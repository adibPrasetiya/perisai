<template>
  <div class="settings-section">

    <!-- ─── Header ─────────────────────────────────────────────────────────── -->
    <div class="sc-header">
      <div>
        <h2 class="settings-section-title">{{ meta.label }}</h2>
        <p class="settings-section-desc">{{ meta.desc }}</p>
      </div>
      <button
        class="sc-save-btn"
        type="button"
        :class="{ 'is-dirty': hasDirty }"
        :disabled="!hasDirty || saving"
        @click="saveAll"
      >
        <i v-if="saving" class="pi pi-spin pi-spinner" />
        <i v-else class="pi pi-check" />
        {{ saving ? 'Menyimpan...' : 'Simpan' }}
      </button>
    </div>

    <div class="settings-section-divider" />

    <!-- ─── Loading ───────────────────────────────────────────────────────── -->
    <div v-if="loading" class="sc-loading">
      <ProgressSpinner style="width: 32px; height: 32px" />
    </div>

    <div v-else-if="fetchError" class="sc-error-banner">
      <i class="pi pi-exclamation-circle" />
      {{ fetchError }}
    </div>

    <!-- ─── Items ──────────────────────────────────────────────────────────── -->
    <template v-else>
      <div v-if="saveError" class="sc-save-error">
        <i class="pi pi-exclamation-triangle" />
        {{ saveError }}
      </div>

      <div class="sc-card">
        <div class="sc-items">
          <div
            v-for="item in items"
            :key="item.key"
            class="sc-item"
            :class="{ 'is-readonly': !item.isEditable }"
          >
            <div class="sc-item-info">
              <div class="sc-item-label">
                {{ item.label }}
                <span v-if="!item.isEditable" class="sc-readonly-badge">
                  <i class="pi pi-lock" /> Tetap
                </span>
              </div>
              <div v-if="item.description" class="sc-item-desc">{{ item.description }}</div>
            </div>

            <div class="sc-item-control">
              <!-- BOOLEAN toggle -->
              <template v-if="item.dataType === 'BOOLEAN'">
                <button
                  class="sc-toggle"
                  type="button"
                  :class="{ 'is-on': localValues[item.key] === 'true' }"
                  :disabled="!item.isEditable"
                  @click="item.isEditable && toggleBoolean(item.key)"
                >
                  <span class="sc-toggle-thumb" />
                </button>
                <span class="sc-toggle-label">
                  {{ localValues[item.key] === 'true' ? 'Aktif' : 'Tidak Aktif' }}
                </span>
              </template>

              <!-- INTEGER input -->
              <template v-else-if="item.dataType === 'INTEGER'">
                <input
                  v-model="localValues[item.key]"
                  class="sc-number-input"
                  type="number"
                  min="0"
                  step="1"
                  :disabled="!item.isEditable"
                  @input="markDirty(item.key)"
                />
              </template>

              <!-- STRING input -->
              <template v-else>
                <input
                  v-model="localValues[item.key]"
                  class="sc-text-input"
                  type="text"
                  :disabled="!item.isEditable"
                  @input="markDirty(item.key)"
                />
              </template>
            </div>
          </div>

          <div v-if="items.length === 0" class="sc-empty">
            <i class="pi pi-inbox" />
            <span>Tidak ada konfigurasi ditemukan</span>
          </div>
        </div>
      </div>
    </template>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'
import { systemConfigApi, type SystemConfig } from '@/api/systemConfig'
import { extractApiError } from '@/utils/apiError'

// ─── Props ────────────────────────────────────────────────────────────────────

const props = defineProps<{ group: string }>()

// ─── Group metadata ────────────────────────────────────────────────────────────

const GROUP_META: Record<string, { label: string; desc: string }> = {
  PASSWORD_POLICY: {
    label: 'Kebijakan Password',
    desc: 'Aturan kompleksitas dan masa berlaku password pengguna.',
  },
  SESSION: {
    label: 'Sesi & Token',
    desc: 'Durasi sesi aktif dan masa berlaku token autentikasi.',
  },
  SECURITY: {
    label: 'Login Throttling',
    desc: 'Perlindungan terhadap serangan brute force pada proses login.',
  },
}

const meta = computed(
  () => GROUP_META[props.group] ?? { label: props.group, desc: '' },
)

// ─── State ────────────────────────────────────────────────────────────────────

const items = ref<SystemConfig[]>([])
const loading = ref(false)
const fetchError = ref('')
const saving = ref(false)
const saveError = ref('')

const localValues = reactive<Record<string, string>>({})
const originalValues: Record<string, string> = {}
const dirtyKeys = reactive<Set<string>>(new Set())

const hasDirty = computed(() => dirtyKeys.size > 0)

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchData() {
  loading.value = true
  fetchError.value = ''
  dirtyKeys.clear()
  saveError.value = ''

  try {
    const res = await systemConfigApi.getAll()
    const allGroups = res.data.data
    const found = allGroups.find((g) => g.group === props.group)
    items.value = found?.items ?? []

    for (const item of items.value) {
      localValues[item.key] = item.value
      originalValues[item.key] = item.value
    }
  } catch (err: any) {
    fetchError.value = extractApiError(err, 'Gagal memuat konfigurasi.')
  } finally {
    loading.value = false
  }
}

// ─── Dirty tracking ───────────────────────────────────────────────────────────

function markDirty(key: string) {
  if (localValues[key] !== originalValues[key]) {
    dirtyKeys.add(key)
  } else {
    dirtyKeys.delete(key)
  }
}

function toggleBoolean(key: string) {
  localValues[key] = localValues[key] === 'true' ? 'false' : 'true'
  markDirty(key)
}

// ─── Save ─────────────────────────────────────────────────────────────────────

const toast = useToast()

async function saveAll() {
  if (!hasDirty.value) return

  saving.value = true
  saveError.value = ''

  const keys = Array.from(dirtyKeys)
  const errors: string[] = []

  for (const key of keys) {
    try {
      await systemConfigApi.update(key, localValues[key])
      originalValues[key] = localValues[key]
      dirtyKeys.delete(key)
    } catch (err: any) {
      errors.push(extractApiError(err, `Gagal menyimpan "${key}"`))
    }
  }

  saving.value = false

  if (errors.length > 0) {
    saveError.value = errors.join(' • ')
  } else {
    toast.add({
      severity: 'success',
      summary: 'Berhasil',
      detail: 'Konfigurasi berhasil disimpan',
      life: 3000,
    })
  }
}

// ─── Re-fetch when group prop changes ─────────────────────────────────────────

watch(() => props.group, fetchData)
onMounted(fetchData)
</script>

<style scoped>
/* ─── Header ──────────────────────────────────────────────────────────────── */

.sc-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 1rem;
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
  margin-bottom: 1.75rem;
}

/* ─── Save button ─────────────────────────────────────────────────────────── */

.sc-save-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  font-size: 12px;
  font-family: var(--font-body);
  font-weight: 500;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-bg-input);
  color: var(--color-text-muted);
  cursor: not-allowed;
  transition: all 0.15s;
  white-space: nowrap;
  flex-shrink: 0;
}

.sc-save-btn.is-dirty {
  border-color: rgba(0, 229, 184, 0.4);
  background: rgba(0, 229, 184, 0.08);
  color: var(--color-accent);
  cursor: pointer;
}

.sc-save-btn.is-dirty:hover:not(:disabled) {
  background: rgba(0, 229, 184, 0.15);
}

/* ─── Loading / Error ─────────────────────────────────────────────────────── */

.sc-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem;
}

.sc-error-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.25rem;
  font-size: 13px;
  color: #ff8fa3;
  background: var(--color-danger-dim);
  border: 1px solid rgba(255, 77, 109, 0.3);
  border-radius: var(--radius-md);
}

.sc-save-error {
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

/* ─── Card ────────────────────────────────────────────────────────────────── */

.sc-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

/* ─── Config items ────────────────────────────────────────────────────────── */

.sc-items {
  display: flex;
  flex-direction: column;
}

.sc-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
  transition: background 0.15s;
}

.sc-item:last-child {
  border-bottom: none;
}

.sc-item:hover:not(.is-readonly) {
  background: rgba(0, 229, 184, 0.015);
}

.sc-item-info {
  flex: 1;
  min-width: 0;
}

.sc-item-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 3px;
}

.sc-readonly-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  font-weight: 400;
  color: var(--color-text-muted);
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: 100px;
  padding: 1px 7px;
  letter-spacing: 0.03em;
}

.sc-item-desc {
  font-size: 11.5px;
  color: var(--color-text-dim);
  line-height: 1.5;
}

.sc-item.is-readonly .sc-item-label {
  color: var(--color-text-dim);
}

/* ─── Controls ────────────────────────────────────────────────────────────── */

.sc-item-control {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-shrink: 0;
}

/* Toggle */
.sc-toggle {
  width: 40px;
  height: 22px;
  border-radius: 100px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-input);
  cursor: pointer;
  position: relative;
  transition: background 0.2s, border-color 0.2s;
  padding: 0;
  flex-shrink: 0;
}

.sc-toggle.is-on {
  background: rgba(0, 229, 184, 0.2);
  border-color: rgba(0, 229, 184, 0.5);
}

.sc-toggle:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.sc-toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-text-muted);
  transition: transform 0.2s, background 0.2s;
}

.sc-toggle.is-on .sc-toggle-thumb {
  transform: translateX(18px);
  background: var(--color-accent);
}

.sc-toggle-label {
  font-size: 12px;
  color: var(--color-text-dim);
  min-width: 65px;
}

/* Number input */
.sc-number-input {
  width: 100px;
  padding: 6px 10px;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-family: var(--font-mono);
  font-size: 13px;
  text-align: right;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.sc-number-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px var(--color-accent-glow);
}

.sc-number-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Text input */
.sc-text-input {
  width: 200px;
  padding: 6px 10px;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.sc-text-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px var(--color-accent-glow);
}

.sc-text-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Empty */
.sc-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
  font-size: 13px;
}

.sc-empty .pi {
  font-size: 1.75rem;
  opacity: 0.4;
}
</style>
