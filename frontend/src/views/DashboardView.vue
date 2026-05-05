<template>
  <div class="dash-page">

    <!-- ─── Header ────────────────────────────────────────────────────────── -->
    <div class="dash-header">
      <div>
        <h1 class="dash-title">Dashboard Monitoring Risiko</h1>
        <p class="dash-desc">
          Postur risiko keamanan organisasi secara keseluruhan — seluruh unit kerja.
        </p>
      </div>
      <div class="dash-filter-row">
        <select v-model="filterProgramId" class="dash-select" :disabled="filtersLoading" @change="onFilterChange">
          <option value="">Semua Program</option>
          <option v-for="p in filterOptions.programs" :key="p.id" :value="p.id">
            {{ p.year }} — {{ p.name }}
          </option>
        </select>
        <select v-model="filterContextId" class="dash-select" :disabled="filtersLoading" @change="onFilterChange">
          <option value="">Semua Konteks</option>
          <option v-for="c in filterOptions.contexts" :key="c.id" :value="c.id">
            {{ c.code }} — {{ c.name }}
          </option>
        </select>
        <button v-if="filterProgramId || filterContextId" class="btn-reset" type="button" title="Reset filter" @click="resetFilters">
          <i class="pi pi-filter-slash" />
        </button>
      </div>
    </div>

    <!-- ─── Full loading ──────────────────────────────────────────────────── -->
    <div v-if="overviewLoading" class="dash-full-loading">
      <ProgressSpinner style="width:32px;height:32px" />
      <span>Memuat data postur risiko...</span>
    </div>

    <template v-else-if="overview">

      <!-- ══════════════════════════════════════════════════════════════════ -->
      <!-- Section 1: Summary cards                                          -->
      <!-- ══════════════════════════════════════════════════════════════════ -->
      <div class="section-label">Postur Risiko Organisasi</div>
      <div class="cards-row">
        <div class="stat-card">
          <div class="stat-top">
            <span class="stat-label">Total Risiko</span>
            <i class="pi pi-shield stat-icon" />
          </div>
          <div class="stat-value">{{ overview.summary.totalRisks }}</div>
          <div class="stat-sub">{{ overview.summary.inherentAssessedCount }} dinilai inheren</div>
        </div>
        <div class="stat-card">
          <div class="stat-top">
            <span class="stat-label">Penilaian Residual</span>
            <i class="pi pi-chart-line stat-icon" />
          </div>
          <div class="stat-value">{{ overview.summary.residualAssessedPct }}<span class="stat-pct">%</span></div>
          <div class="stat-sub">{{ overview.summary.residualAssessedCount }} dari {{ overview.summary.totalRisks }}</div>
        </div>
        <div class="stat-card" :class="{ 'card-warn': overview.summary.overdueCount > 0 }">
          <div class="stat-top">
            <span class="stat-label">Jatuh Tempo</span>
            <i class="pi pi-clock stat-icon" />
          </div>
          <div class="stat-value">{{ overview.summary.overdueCount }}</div>
          <div class="stat-sub">rencana melewati target</div>
        </div>
        <div class="stat-card">
          <div class="stat-top">
            <span class="stat-label">Treatment Selesai</span>
            <i class="pi pi-check-circle stat-icon stat-ok" />
          </div>
          <div class="stat-value">{{ overview.summary.treatmentCompletedPct }}<span class="stat-pct">%</span></div>
          <div class="stat-sub">{{ overview.summary.treatmentCompleted }}/{{ overview.summary.treatmentTotal }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-top">
            <span class="stat-label">Unit Kerja</span>
            <i class="pi pi-building stat-icon" />
          </div>
          <div class="stat-value">{{ overview.summary.totalUnitsWithPapers }}</div>
          <div class="stat-sub">{{ overview.summary.approvedPapersCount }} KK disetujui</div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════════════════ -->
      <!-- Section 2: Risk level distribution — donut charts                 -->
      <!-- ══════════════════════════════════════════════════════════════════ -->
      <div class="section-label">Distribusi Level Risiko</div>
      <div class="dist-row">

        <!-- Donut: Inheren -->
        <div class="dist-card">
          <div class="dist-card-header">
            <span class="dist-card-title">Risiko Inheren</span>
            <span class="dist-badge">Sebelum Pengendalian</span>
          </div>
          <DonutChart
            :items="overview.inherentLevelDist.filter(l => l.name !== 'Belum dinilai')"
            :size="160"
            :thickness="26"
            center-label="risiko"
          />
        </div>

        <!-- Donut: Residual -->
        <div class="dist-card">
          <div class="dist-card-header">
            <span class="dist-card-title">Risiko Residual</span>
            <span class="dist-badge dist-badge-ok">Setelah Pengendalian</span>
          </div>
          <DonutChart
            :items="overview.residualLevelDist.filter(l => l.name !== 'Belum dinilai')"
            :size="160"
            :thickness="26"
            center-label="dinilai"
          />
        </div>

        <!-- Bar: Kategori Risiko -->
        <div class="dist-card dist-card-wide">
          <div class="dist-card-header">
            <span class="dist-card-title">Kategori Risiko</span>
            <span class="dist-badge">Top {{ overview.categoryDist.length }}</span>
          </div>
          <div v-if="overview.categoryDist.length === 0" class="dist-empty">Belum ada data</div>
          <div v-else class="hbar-chart">
            <div
              v-for="item in overview.categoryDist"
              :key="item.name"
              class="hbar-row"
            >
              <div class="hbar-label-wrap">
                <span class="hbar-dot" :style="{ background: item.color || '#888' }" />
                <span class="hbar-label">{{ item.name }}</span>
              </div>
              <div class="hbar-track">
                <div
                  class="hbar-fill"
                  :style="{
                    width: maxCategoryCount > 0 ? (item.count / maxCategoryCount * 100) + '%' : '0%',
                    background: item.color || '#888',
                  }"
                />
              </div>
              <span class="hbar-value">{{ item.count }}</span>
            </div>
          </div>
        </div>

      </div>

      <!-- ══════════════════════════════════════════════════════════════════ -->
      <!-- Section 3: Impact area + Asset category distribution              -->
      <!-- ══════════════════════════════════════════════════════════════════ -->
      <div class="section-label">Distribusi Berdasarkan Area Dampak &amp; Kategori Aset</div>
      <div class="dist-row">

        <!-- Impact Area -->
        <div class="dist-card dist-card-wide">
          <div class="dist-card-header">
            <span class="dist-card-title">Area Dampak</span>
            <span class="dist-badge">Rata-rata skor efektif</span>
          </div>
          <div v-if="overview.impactAreaDist.length === 0" class="dist-empty">
            Belum ada penilaian
          </div>
          <div v-else class="hbar-chart">
            <div
              v-for="area in overview.impactAreaDist"
              :key="area.name"
              class="hbar-row"
            >
              <div class="hbar-label-wrap">
                <span class="hbar-dot hbar-dot-area" />
                <span class="hbar-label">{{ area.name }}</span>
              </div>
              <div class="hbar-track">
                <div
                  class="hbar-fill hbar-fill-area"
                  :style="{
                    width: maxAreaScore > 0 ? (area.avgScore / maxAreaScore * 100) + '%' : '0%',
                  }"
                />
              </div>
              <div class="hbar-area-meta">
                <span class="hbar-value">{{ area.avgScore }}</span>
                <span class="hbar-area-sub">avg · max {{ area.maxScore }} · {{ area.count }} entri</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Asset Category -->
        <div class="dist-card dist-card-wide">
          <div class="dist-card-header">
            <span class="dist-card-title">Kategori Aset Berisiko</span>
            <span class="dist-badge">Jumlah risiko per kategori</span>
          </div>
          <div v-if="overview.assetCategoryDist.length === 0" class="dist-empty">
            Belum ada risiko terkait aset
          </div>
          <div v-else class="hbar-chart">
            <div
              v-for="cat in overview.assetCategoryDist"
              :key="cat.name"
              class="hbar-row"
            >
              <div class="hbar-label-wrap">
                <span class="hbar-dot hbar-dot-asset" />
                <span class="hbar-label">{{ cat.name }}</span>
              </div>
              <div class="hbar-track">
                <div
                  class="hbar-fill hbar-fill-asset"
                  :style="{
                    width: maxAssetCatCount > 0 ? (cat.count / maxAssetCatCount * 100) + '%' : '0%',
                  }"
                />
              </div>
              <span class="hbar-value">{{ cat.count }}</span>
            </div>
          </div>
        </div>

        <!-- Status pills -->
        <div class="dist-card">
          <div class="dist-card-header">
            <span class="dist-card-title">Status Kertas Kerja</span>
          </div>
          <div class="pill-list">
            <div v-for="[status, label] in WP_STATUS_ENTRIES" :key="status" class="pill-row">
              <span class="status-chip" :class="`chip-${status.toLowerCase()}`">{{ label }}</span>
              <span class="pill-count">{{ overview.wpStatusCounts[status] ?? 0 }}</span>
            </div>
          </div>
          <div class="dist-divider" />
          <div class="dist-card-header" style="margin-top:0.6rem">
            <span class="dist-card-title">Status Treatment</span>
          </div>
          <div class="pill-list">
            <div v-for="[status, label] in TREATMENT_STATUS_ENTRIES" :key="status" class="pill-row">
              <span class="treatment-badge" :class="`tp-${status.toLowerCase()}`">{{ label }}</span>
              <span class="pill-count">{{ overview.treatmentStatusCounts[status] ?? 0 }}</span>
            </div>
          </div>
        </div>

      </div>

      <!-- ══════════════════════════════════════════════════════════════════ -->
      <!-- Section 4: Top 10 risks                                           -->
      <!-- ══════════════════════════════════════════════════════════════════ -->
      <div class="section-label">
        Top {{ topRisks.length }} Risiko Tertinggi
        <span class="section-hint">skor efektif (residual diutamakan)</span>
      </div>

      <div v-if="topRisksLoading" class="inner-loading">
        <ProgressSpinner style="width:24px;height:24px" />
      </div>
      <div v-else-if="topRisksError" class="error-banner">
        <i class="pi pi-exclamation-circle" /> {{ topRisksError }}
      </div>
      <div v-else-if="topRisks.length === 0" class="empty-section">
        <i class="pi pi-inbox" /> Belum ada risiko yang dinilai
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th class="th-rank">#</th>
              <th>Nama Risiko</th>
              <th>Unit Kerja</th>
              <th>Kategori</th>
              <th class="th-center">Inheren</th>
              <th class="th-center">Residual</th>
              <th class="th-center">Treatment</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="risk in topRisks" :key="risk.id" :class="{ 'row-overdue': risk.treatmentSummary.overdue > 0 }">
              <td class="td-center">
                <span class="rank-badge" :class="risk.rank <= 3 ? `rank-${risk.rank}` : ''">{{ risk.rank }}</span>
              </td>
              <td>
                <div class="risk-name-cell">
                  <span class="risk-name">{{ risk.name }}</span>
                  <span class="risk-meta">
                    <span class="mono-sm">{{ risk.code }}</span>
                    <span v-if="risk.contextName" class="text-muted"> · {{ risk.contextName }}</span>
                  </span>
                </div>
              </td>
              <td>
                <span class="unit-name">{{ risk.unitKerja.name }}</span>
                <span class="mono-sm text-muted">{{ risk.unitKerja.code }}</span>
              </td>
              <td>
                <span
                  v-if="risk.riskCategory"
                  class="cat-chip"
                  :style="chipStyle(risk.riskCategory.color)"
                >{{ risk.riskCategory.name }}</span>
                <span v-else class="text-muted">—</span>
              </td>
              <td class="td-center">
                <span v-if="risk.inherentLevel" class="level-chip" :style="chipStyle(risk.inherentLevel.color)">
                  {{ risk.inherentLevel.name }}
                  <span class="level-score">{{ risk.inherentLevel.score }}</span>
                </span>
                <span v-else class="text-muted">—</span>
              </td>
              <td class="td-center">
                <span v-if="risk.residualLevel" class="level-chip" :style="chipStyle(risk.residualLevel.color)">
                  {{ risk.residualLevel.name }}
                  <span class="level-score">{{ risk.residualLevel.score }}</span>
                </span>
                <span v-else class="text-muted text-sm">Belum dinilai</span>
              </td>
              <td class="td-center">
                <div class="treatment-cell">
                  <template v-if="risk.treatmentSummary.total > 0">
                    <div class="treat-progress">
                      <div class="treat-track">
                        <div class="treat-fill" :style="{ width: (risk.treatmentSummary.completed / risk.treatmentSummary.total * 100) + '%' }" />
                      </div>
                      <span class="mono-sm">{{ risk.treatmentSummary.completed }}/{{ risk.treatmentSummary.total }}</span>
                    </div>
                  </template>
                  <span v-else class="text-muted">—</span>
                  <span v-if="risk.treatmentSummary.overdue > 0" class="overdue-pill">
                    {{ risk.treatmentSummary.overdue }} jatuh tempo
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ══════════════════════════════════════════════════════════════════ -->
      <!-- Section 5: Recent activity                                        -->
      <!-- ══════════════════════════════════════════════════════════════════ -->
      <div class="section-label">Aktivitas Manajemen Risiko Terbaru</div>

      <div v-if="activityLoading" class="inner-loading">
        <ProgressSpinner style="width:24px;height:24px" />
      </div>
      <div v-else-if="activityError" class="error-banner">
        <i class="pi pi-exclamation-circle" /> {{ activityError }}
      </div>
      <div v-else-if="activity.length === 0" class="empty-section">
        <i class="pi pi-inbox" /> Belum ada aktivitas
      </div>
      <div v-else class="activity-list">
        <div v-for="(event, idx) in activity" :key="idx" class="activity-row">
          <div class="activity-icon-col">
            <div class="activity-icon" :class="`aicon-${event.type.toLowerCase()}`">
              <i :class="activityIcon(event.type)" />
            </div>
            <div v-if="idx < activity.length - 1" class="activity-line" />
          </div>
          <div class="activity-body">
            <div class="activity-head">
              <span class="activity-title">{{ event.title }}</span>
              <span class="activity-time">{{ timeAgo(event.timestamp) }}</span>
            </div>
            <div class="activity-detail">{{ event.detail }}</div>
            <div class="activity-foot">
              <span class="activity-meta"><i class="pi pi-building" /> {{ event.unitKerja.name }}</span>
              <span v-if="event.actor" class="activity-meta"><i class="pi pi-user" /> {{ event.actor }}</span>
              <span v-if="event.meta?.programName" class="activity-meta"><i class="pi pi-briefcase" /> {{ event.meta.programName }}</span>
            </div>
          </div>
        </div>
      </div>

    </template>

    <div v-else-if="overviewError" class="error-full">
      <i class="pi pi-exclamation-triangle" />
      <span>{{ overviewError }}</span>
      <button class="btn-retry" @click="fetchAll">Coba Lagi</button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import ProgressSpinner from 'primevue/progressspinner'
import DonutChart from '@/components/DonutChart.vue'
import {
  dashboardApi,
  type DashboardFilters,
  type DashboardOverview,
  type TopRiskEntry,
  type ActivityEvent,
  type ActivityType,
} from '@/api/dashboard'
import { extractApiError } from '@/utils/apiError'

// ─── Filter ───────────────────────────────────────────────────────────────────

const filterProgramId = ref('')
const filterContextId = ref('')
const filtersLoading = ref(false)
const filterOptions = ref<DashboardFilters>({ programs: [], contexts: [] })

// ─── Data ─────────────────────────────────────────────────────────────────────

const overview = ref<DashboardOverview | null>(null)
const overviewLoading = ref(false)
const overviewError = ref('')

const topRisks = ref<TopRiskEntry[]>([])
const topRisksLoading = ref(false)
const topRisksError = ref('')

const activity = ref<ActivityEvent[]>([])
const activityLoading = ref(false)
const activityError = ref('')

// ─── Derived max values for bar charts ────────────────────────────────────────

const maxCategoryCount = computed(() =>
  overview.value ? Math.max(1, ...overview.value.categoryDist.map((c) => c.count)) : 1,
)
const maxAreaScore = computed(() =>
  overview.value ? Math.max(1, ...overview.value.impactAreaDist.map((a) => a.avgScore)) : 1,
)
const maxAssetCatCount = computed(() =>
  overview.value ? Math.max(1, ...overview.value.assetCategoryDist.map((c) => c.count)) : 1,
)

// ─── Labels ───────────────────────────────────────────────────────────────────

const WP_STATUS_ENTRIES: [string, string][] = [
  ['DRAFT', 'Draft'],
  ['SUBMITTED', 'Diajukan'],
  ['REVISION', 'Revisi'],
  ['APPROVED', 'Disetujui'],
  ['LOCKED', 'Dikunci'],
]

const TREATMENT_STATUS_ENTRIES: [string, string][] = [
  ['PLANNED', 'Direncanakan'],
  ['IN_PROGRESS', 'Berjalan'],
  ['SUBMITTED_FOR_REVIEW', 'Menunggu Review'],
  ['COMPLETED', 'Selesai'],
  ['VERIFIED', 'Diverifikasi'],
  ['CANCELLED', 'Dibatalkan'],
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function chipStyle(color: string | null | undefined) {
  const c = color ?? '#888'
  return { background: c + '22', color: c, border: `1px solid ${c}55` }
}

function activityIcon(type: ActivityType): string {
  const map: Record<ActivityType, string> = {
    RISK_IDENTIFIED: 'pi pi-plus-circle',
    WP_SUBMITTED: 'pi pi-send',
    WP_APPROVED: 'pi pi-check-circle',
    TREATMENT_COMPLETED: 'pi pi-verified',
    TREATMENT_VERIFIED: 'pi pi-shield',
  }
  return map[type] ?? 'pi pi-circle'
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Baru saja'
  if (m < 60) return `${m} menit lalu`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} jam lalu`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d} hari lalu`
  return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

const fp = () => ({
  programId: filterProgramId.value || undefined,
  riskContextId: filterContextId.value || undefined,
})

async function fetchFilters() {
  filtersLoading.value = true
  try {
    const res = await dashboardApi.getFilters()
    filterOptions.value = res.data.data
  } catch { /* non-critical */ } finally { filtersLoading.value = false }
}

async function fetchOverview() {
  overviewLoading.value = true
  overviewError.value = ''
  try {
    const res = await dashboardApi.getOverview(fp())
    overview.value = res.data.data
  } catch (err) {
    overviewError.value = extractApiError(err, 'Gagal memuat data postur risiko')
  } finally { overviewLoading.value = false }
}

async function fetchTopRisks() {
  topRisksLoading.value = true
  topRisksError.value = ''
  try {
    const res = await dashboardApi.getTopRisks({ ...fp(), limit: 10 })
    topRisks.value = res.data.data
  } catch (err) {
    topRisksError.value = extractApiError(err, 'Gagal memuat top risiko')
  } finally { topRisksLoading.value = false }
}

async function fetchActivity() {
  activityLoading.value = true
  activityError.value = ''
  try {
    const res = await dashboardApi.getRecentActivity(fp())
    activity.value = res.data.data
  } catch (err) {
    activityError.value = extractApiError(err, 'Gagal memuat aktivitas')
  } finally { activityLoading.value = false }
}

async function fetchAll() {
  await fetchOverview()
  fetchTopRisks()
  fetchActivity()
}

function onFilterChange() { fetchAll() }
function resetFilters() { filterProgramId.value = ''; filterContextId.value = ''; fetchAll() }

onMounted(() => { fetchFilters(); fetchAll() })
</script>

<style scoped>
.dash-page { display: flex; flex-direction: column; gap: 1.5rem; }

/* ─── Header ────────────────────────────────────────────────── */
.dash-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: 1rem; flex-wrap: wrap;
}
.dash-title { font-size: 1.35rem; font-weight: 700; color: var(--color-text); margin: 0 0 0.2rem; }
.dash-desc  { font-size: 13px; color: var(--color-text-dim); margin: 0; }
.dash-filter-row { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
.dash-select {
  background: var(--color-bg-input); border: 1px solid var(--color-border);
  border-radius: var(--radius-md); color: var(--color-text);
  font-size: 13px; padding: 0.4rem 0.65rem; height: 34px; cursor: pointer; max-width: 230px;
}
.dash-select:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-reset {
  width: 34px; height: 34px; background: transparent;
  border: 1px solid var(--color-border); border-radius: var(--radius-md);
  color: var(--color-text-muted); cursor: pointer; font-size: 13px;
  display: flex; align-items: center; justify-content: center;
}
.btn-reset:hover { border-color: var(--color-accent); color: var(--color-accent); }

/* ─── Section label ─────────────────────────────────────────── */
.section-label {
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.09em; color: var(--color-text-muted);
  display: flex; align-items: center; gap: 0.5rem;
}
.section-hint { font-weight: 400; text-transform: none; letter-spacing: 0; opacity: 0.7; }

/* ─── Summary cards ─────────────────────────────────────────── */
.cards-row {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 0.85rem;
}
.stat-card {
  background: var(--color-bg-card); border: 1px solid var(--color-border);
  border-radius: var(--radius-lg); padding: 1rem 1.1rem;
  display: flex; flex-direction: column; gap: 0.15rem;
}
.stat-card.card-warn { border-color: #c08020; }
.stat-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem; }
.stat-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); }
.stat-icon { font-size: 0.95rem; color: var(--color-accent); opacity: 0.7; }
.stat-ok   { color: #40c080; }
.card-warn .stat-icon { color: #e0a020; }
.stat-value { font-size: 2rem; font-weight: 800; font-family: var(--font-mono); color: var(--color-text); line-height: 1; }
.card-warn .stat-value { color: #e0a020; }
.stat-pct  { font-size: 1rem; font-weight: 600; color: var(--color-text-muted); }
.stat-sub  { font-size: 11px; color: var(--color-text-muted); margin-top: 0.15rem; }

/* ─── Distribution row ──────────────────────────────────────── */
.dist-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}

.dist-card {
  background: var(--color-bg-card); border: 1px solid var(--color-border);
  border-radius: var(--radius-lg); padding: 1.1rem 1.2rem;
  display: flex; flex-direction: column; gap: 0.75rem;
}

.dist-card-wide { min-width: 260px; }

.dist-card-header {
  display: flex; justify-content: space-between; align-items: center;
}

.dist-card-title {
  font-size: 12px; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.06em; color: var(--color-text-muted);
}

.dist-badge {
  font-size: 10px; padding: 2px 7px; border-radius: 99px;
  background: #1e1e2e; color: var(--color-text-muted);
}
.dist-badge-ok { background: #1a2e1e; color: #50b870; }

.dist-empty { font-size: 12px; color: var(--color-text-muted); text-align: center; padding: 1.5rem 0; }
.dist-divider { height: 1px; background: var(--color-border); }

/* ─── Horizontal bar chart ──────────────────────────────────── */
.hbar-chart { display: flex; flex-direction: column; gap: 0.6rem; }

.hbar-row {
  display: grid;
  grid-template-columns: 130px 1fr auto;
  align-items: center;
  gap: 0.6rem;
}

.hbar-label-wrap {
  display: flex; align-items: center; gap: 6px;
  overflow: hidden;
}

.hbar-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
}
.hbar-dot-area  { background: var(--color-accent, #5090e0); }
.hbar-dot-asset { background: #50c0a0; }

.hbar-label {
  font-size: 12px; color: var(--color-text-dim);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.hbar-track {
  height: 9px; background: var(--color-bg-input);
  border-radius: 99px; overflow: hidden;
}

.hbar-fill {
  height: 100%; border-radius: 99px;
  transition: width 0.5s ease; min-width: 2px;
}
.hbar-fill-area  { background: var(--color-accent, #5090e0); }
.hbar-fill-asset { background: #50c0a0; }

.hbar-value {
  font-size: 12px; font-family: var(--font-mono); font-weight: 600;
  color: var(--color-text); text-align: right; white-space: nowrap;
}

.hbar-area-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; }
.hbar-area-sub  { font-size: 10px; color: var(--color-text-muted); white-space: nowrap; }

/* ─── Status pills ───────────────────────────────────────────── */
.pill-list { display: flex; flex-direction: column; gap: 0.38rem; }
.pill-row  { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
.pill-count { font-size: 13px; font-family: var(--font-mono); font-weight: 600; color: var(--color-text); }

.status-chip {
  display: inline-block; font-size: 11px; font-weight: 600; padding: 2px 8px;
  border-radius: 99px; text-transform: uppercase; letter-spacing: 0.04em;
}
.chip-draft     { background: #2a2a1e; color: #c0a030; }
.chip-submitted { background: #1e2a3a; color: #4090d0; }
.chip-revision  { background: #3a1e1e; color: #d04040; }
.chip-approved  { background: #1e3a2a; color: #40c080; }
.chip-locked    { background: #2a1e3a; color: #9060d0; }

.treatment-badge {
  display: inline-block; font-size: 11px; font-weight: 500;
  padding: 2px 7px; border-radius: 3px;
}
.tp-planned              { background: #22223a; color: #8080b0; }
.tp-in_progress          { background: #1e2a3a; color: #4090d0; }
.tp-submitted_for_review { background: #2a2a1e; color: #c0a030; }
.tp-completed            { background: #1e3a2a; color: #40c080; }
.tp-verified             { background: #1a2e36; color: #40d0d0; }
.tp-cancelled            { background: #2a2020; color: #a05050; }

/* ─── Top risks table ────────────────────────────────────────── */
.table-wrap {
  background: var(--color-bg-card); border: 1px solid var(--color-border);
  border-radius: var(--radius-lg); overflow: hidden;
}
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table thead tr { border-bottom: 1px solid var(--color-border); }
.data-table th {
  padding: 0.6rem 0.85rem; font-size: 11px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-text-muted);
  text-align: left; white-space: nowrap;
}
.th-rank { width: 36px; }
.th-center { text-align: center !important; }
.data-table td { padding: 0.65rem 0.85rem; border-bottom: 1px solid var(--color-border); vertical-align: middle; }
.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover td { background: rgba(255,255,255,0.015); }
.row-overdue td { background: rgba(180,60,30,0.04); }
.td-center { text-align: center; }

.rank-badge {
  display: inline-flex; align-items: center; justify-content: center;
  width: 24px; height: 24px; border-radius: 50%;
  font-size: 11px; font-weight: 700; font-family: var(--font-mono);
  background: var(--color-bg-input); color: var(--color-text-muted);
}
.rank-1 { background: #b8860020; color: #d4a017; border: 1px solid #b8860040; }
.rank-2 { background: #80808020; color: #a0a0a0; border: 1px solid #80808040; }
.rank-3 { background: #cd7f3220; color: #cd7f32; border: 1px solid #cd7f3240; }

.risk-name-cell { display: flex; flex-direction: column; gap: 2px; }
.risk-name { font-weight: 500; color: var(--color-text); }
.risk-meta { display: flex; align-items: center; gap: 4px; }

.unit-name { display: block; font-weight: 500; color: var(--color-text); }

.mono-sm   { font-size: 11px; font-family: var(--font-mono); color: var(--color-text-muted); }
.text-muted { color: var(--color-text-muted); font-size: 12px; }
.text-sm   { font-size: 11px; }

.cat-chip {
  font-size: 11px; font-weight: 600; padding: 2px 7px; border-radius: 3px; white-space: nowrap;
}
.level-chip {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; font-weight: 600; padding: 2px 7px; border-radius: 99px; white-space: nowrap;
}
.level-score { font-size: 10px; font-family: var(--font-mono); opacity: 0.8; }

.treatment-cell { display: flex; flex-direction: column; align-items: center; gap: 3px; }
.treat-progress { display: flex; align-items: center; gap: 5px; }
.treat-track { width: 52px; height: 5px; background: var(--color-bg-input); border-radius: 99px; overflow: hidden; }
.treat-fill  { height: 100%; background: var(--color-accent); border-radius: 99px; }
.overdue-pill { font-size: 10px; padding: 1px 5px; border-radius: 3px; background: #3a1a1a; color: #e06060; }

/* ─── Activity feed ──────────────────────────────────────────── */
.activity-list {
  background: var(--color-bg-card); border: 1px solid var(--color-border);
  border-radius: var(--radius-lg); padding: 1.25rem 1.5rem;
}
.activity-row { display: flex; gap: 1rem; }
.activity-icon-col { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }
.activity-icon {
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; font-size: 13px; z-index: 1;
}
.aicon-risk_identified     { background: #1e2a3a; color: #4090d0; }
.aicon-wp_submitted        { background: #2a2a1e; color: #c0a030; }
.aicon-wp_approved         { background: #1e3a2a; color: #40c080; }
.aicon-treatment_completed { background: #1e3a3a; color: #40c0c0; }
.aicon-treatment_verified  { background: #2a1e3a; color: #9060d0; }

.activity-line { width: 1px; flex: 1; background: var(--color-border); margin: 4px 0; min-height: 12px; }
.activity-body { flex: 1; padding-bottom: 1.25rem; min-width: 0; }
.activity-row:last-child .activity-body { padding-bottom: 0; }
.activity-head { display: flex; justify-content: space-between; align-items: baseline; gap: 0.5rem; margin-bottom: 0.2rem; }
.activity-title { font-size: 13px; font-weight: 600; color: var(--color-text); }
.activity-time  { font-size: 11px; color: var(--color-text-muted); white-space: nowrap; }
.activity-detail { font-size: 12px; color: var(--color-text-dim); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 0.3rem; }
.activity-foot { display: flex; flex-wrap: wrap; gap: 0.75rem; }
.activity-meta { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--color-text-muted); }

/* ─── States ─────────────────────────────────────────────────── */
.dash-full-loading { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 4rem; color: var(--color-text-muted); font-size: 13px; }
.inner-loading { display: flex; justify-content: center; padding: 2rem; }
.error-banner { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: var(--radius-lg); color: #e05050; font-size: 13px; }
.error-full { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 4rem; color: var(--color-text-muted); font-size: 13px; text-align: center; }
.error-full i { font-size: 2rem; color: #e05050; }
.empty-section { display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 2.5rem; background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: var(--radius-lg); color: var(--color-text-muted); font-size: 13px; }
.btn-retry { padding: 0.4rem 1rem; background: var(--color-accent); border: none; border-radius: var(--radius-md); color: #000; font-size: 13px; cursor: pointer; }
</style>
