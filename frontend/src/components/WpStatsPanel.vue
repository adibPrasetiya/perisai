<template>
  <div class="wsp-panel">
    <button class="wsp-header" type="button" @click="open = !open">
      <i class="pi pi-chart-bar" />
      <span>Ringkasan Statistik</span>
      <i class="pi pi-chevron-down wsp-chevron" :class="{ open }" />
    </button>

    <div v-if="open" class="wsp-body">

      <!-- ── Donut Charts Row ──────────────────────────────────────────────── -->
      <div class="wsp-charts-row">

        <!-- Inherent Risk Levels -->
        <div class="wsp-chart-card">
          <span class="wsp-chart-title">Risiko Inheren</span>
          <div class="wsp-donut-wrap">
            <div class="wsp-donut" :style="donutStyle(stats.inherentLevels)">
              <div class="wsp-donut-hole">
                <span class="wsp-donut-center-val">{{ stats.summary.withInherent }}</span>
                <span class="wsp-donut-center-label">dinilai</span>
              </div>
            </div>
          </div>
          <div class="wsp-legend">
            <div v-for="seg in stats.inherentLevels" :key="seg.name" class="wsp-legend-item">
              <span class="wsp-legend-dot" :style="{ background: seg.color }" />
              <span class="wsp-legend-name">{{ seg.name }}</span>
              <span class="wsp-legend-count">{{ seg.count }}</span>
            </div>
          </div>
        </div>

        <!-- Residual Risk Levels -->
        <div class="wsp-chart-card">
          <span class="wsp-chart-title">Risiko Residual</span>
          <div class="wsp-donut-wrap">
            <div class="wsp-donut" :style="donutStyle(stats.residualLevels)">
              <div class="wsp-donut-hole">
                <span class="wsp-donut-center-val">{{ stats.summary.withResidual }}</span>
                <span class="wsp-donut-center-label">selesai</span>
              </div>
            </div>
          </div>
          <div class="wsp-legend">
            <div v-for="seg in stats.residualLevels" :key="seg.name" class="wsp-legend-item">
              <span class="wsp-legend-dot" :style="{ background: seg.color }" />
              <span class="wsp-legend-name">{{ seg.name }}</span>
              <span class="wsp-legend-count">{{ seg.count }}</span>
            </div>
          </div>
        </div>

        <!-- Treatment Plan Statuses -->
        <div class="wsp-chart-card">
          <span class="wsp-chart-title">Status Rencana Penanganan</span>
          <div class="wsp-donut-wrap">
            <div class="wsp-donut" :style="donutStyle(treatmentSegments)">
              <div class="wsp-donut-hole">
                <span class="wsp-donut-center-val">{{ totalPlans }}</span>
                <span class="wsp-donut-center-label">rencana</span>
              </div>
            </div>
          </div>
          <div class="wsp-legend">
            <div v-for="seg in treatmentSegments" :key="seg.name" class="wsp-legend-item">
              <span class="wsp-legend-dot" :style="{ background: seg.color }" />
              <span class="wsp-legend-name">{{ TREATMENT_LABELS[seg.name] ?? seg.name }}</span>
              <span class="wsp-legend-count">{{ seg.count }}</span>
            </div>
          </div>
        </div>

        <!-- Control Effectiveness -->
        <div class="wsp-chart-card">
          <span class="wsp-chart-title">Efektivitas Kontrol</span>
          <div class="wsp-donut-wrap">
            <div class="wsp-donut" :style="donutStyle(controlSegments)">
              <div class="wsp-donut-hole">
                <span class="wsp-donut-center-val">{{ totalControls }}</span>
                <span class="wsp-donut-center-label">kontrol</span>
              </div>
            </div>
          </div>
          <div class="wsp-legend">
            <div v-for="seg in controlSegments" :key="seg.name" class="wsp-legend-item">
              <span class="wsp-legend-dot" :style="{ background: seg.color }" />
              <span class="wsp-legend-name">{{ CONTROL_LABELS[seg.name] ?? seg.name }}</span>
              <span class="wsp-legend-count">{{ seg.count }}</span>
            </div>
          </div>
        </div>

      </div>

      <!-- ── Bottom Row ────────────────────────────────────────────────────── -->
      <div class="wsp-bottom-row">

        <!-- Category Distribution -->
        <div class="wsp-bottom-card wsp-category-card">
          <span class="wsp-chart-title">Distribusi per Kategori</span>
          <div v-if="stats.categoryDistribution.length === 0" class="wsp-empty-note">Belum ada data</div>
          <div v-else class="wsp-category-bars">
            <div
              v-for="cat in stats.categoryDistribution"
              :key="cat.name"
              class="wsp-cat-row"
            >
              <span class="wsp-cat-name" :title="cat.name">{{ cat.name }}</span>
              <div class="wsp-cat-bar-track">
                <div
                  class="wsp-cat-bar-fill"
                  :style="{
                    width: stats.summary.total > 0 ? (cat.count / stats.summary.total * 100).toFixed(1) + '%' : '0%',
                    background: cat.color || 'var(--color-accent)'
                  }"
                />
              </div>
              <span class="wsp-cat-count">{{ cat.count }}</span>
            </div>
          </div>
        </div>

        <!-- Top 5 Highest Inherent Risks -->
        <div class="wsp-bottom-card wsp-top5-card">
          <span class="wsp-chart-title">Top 5 Risiko Tertinggi (Inheren)</span>
          <div v-if="stats.top5ByInherent.length === 0" class="wsp-empty-note">Belum ada penilaian inheren</div>
          <table v-else class="wsp-top5-tbl">
            <tbody>
              <tr v-for="(item, i) in stats.top5ByInherent" :key="i">
                <td class="wsp-top5-rank">{{ i + 1 }}</td>
                <td class="wsp-top5-name" :title="item.name">{{ item.name }}</td>
                <td class="wsp-top5-score">{{ item.finalScore }}</td>
                <td>
                  <span
                    v-if="item.riskLevelName"
                    class="wsp-level-badge"
                    :style="{ background: item.riskLevelColor + '22', color: item.riskLevelColor, borderColor: item.riskLevelColor + '66' }"
                  >{{ item.riskLevelName }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Top 5 Highest Residual Risks -->
        <div class="wsp-bottom-card wsp-top5-card">
          <span class="wsp-chart-title">Top 5 Risiko Tertinggi (Residual)</span>
          <div v-if="stats.top5ByResidual.length === 0" class="wsp-empty-note">Belum ada penilaian residual</div>
          <table v-else class="wsp-top5-tbl">
            <tbody>
              <tr v-for="(item, i) in stats.top5ByResidual" :key="i">
                <td class="wsp-top5-rank">{{ i + 1 }}</td>
                <td class="wsp-top5-name" :title="item.name">{{ item.name }}</td>
                <td class="wsp-top5-score">{{ item.finalScore }}</td>
                <td>
                  <span
                    v-if="item.riskLevelName"
                    class="wsp-level-badge"
                    :style="{ background: item.riskLevelColor + '22', color: item.riskLevelColor, borderColor: item.riskLevelColor + '66' }"
                  >{{ item.riskLevelName }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { WpStats } from '@/api/workingPaper'

const props = defineProps<{ stats: WpStats }>()

const open = ref(true)

const TREATMENT_LABELS: Record<string, string> = {
  PLANNED: 'Direncanakan',
  IN_PROGRESS: 'Berjalan',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
  SUBMITTED_FOR_REVIEW: 'Diajukan',
  VERIFIED: 'Terverifikasi',
}

const TREATMENT_COLORS: Record<string, string> = {
  PLANNED: '#64b5f6',
  IN_PROGRESS: '#ffb74d',
  COMPLETED: '#81c784',
  CANCELLED: '#e57373',
  SUBMITTED_FOR_REVIEW: '#ba68c8',
  VERIFIED: '#4db6ac',
}

const CONTROL_LABELS: Record<string, string> = {
  ADEQUATE: 'Memadai',
  PARTIAL: 'Sebagian',
  INADEQUATE: 'Tidak Memadai',
}

const CONTROL_COLORS: Record<string, string> = {
  ADEQUATE: '#81c784',
  PARTIAL: '#ffb74d',
  INADEQUATE: '#e57373',
}

const treatmentSegments = computed(() =>
  props.stats.treatmentStatuses.map(t => ({
    name: t.status,
    color: TREATMENT_COLORS[t.status] ?? '#888',
    count: t.count,
  }))
)

const controlSegments = computed(() =>
  props.stats.controlEffectiveness.map(c => ({
    name: c.effectiveness,
    color: CONTROL_COLORS[c.effectiveness] ?? '#888',
    count: c.count,
  }))
)

const totalPlans = computed(() =>
  props.stats.treatmentStatuses.reduce((s, t) => s + t.count, 0)
)

const totalControls = computed(() =>
  props.stats.controlEffectiveness.reduce((s, c) => s + c.count, 0)
)

function donutStyle(segments: { color: string; count: number }[]) {
  const total = segments.reduce((s, x) => s + x.count, 0)
  if (total === 0) return { background: 'var(--color-border, #333)' }
  let acc = 0
  const stops: string[] = []
  for (const seg of segments) {
    const pct = (seg.count / total) * 100
    stops.push(`${seg.color} ${acc.toFixed(2)}%`)
    acc += pct
    stops.push(`${seg.color} ${acc.toFixed(2)}%`)
  }
  return { background: `conic-gradient(${stops.join(', ')})` }
}
</script>

<style scoped>
.wsp-panel {
  border: 1px solid var(--color-border, #2a2a3a);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
  background: var(--color-surface, #0f0f1a);
}

.wsp-header {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 16px;
  background: var(--color-surface-alt, #14141f);
  border: none;
  cursor: pointer;
  color: var(--color-text, #e0e0e0);
  font-weight: 600;
  font-size: 13px;
  text-align: left;
}
.wsp-header i:first-child { color: var(--color-accent, #7c5cbf); font-size: 14px; }
.wsp-header span { flex: 1; }

.wsp-chevron { font-size: 10px; transition: transform 0.2s; }
.wsp-chevron.open { transform: rotate(180deg); }

.wsp-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── Donut Charts ── */
.wsp-charts-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.wsp-chart-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--color-border, #2a2a3a);
  background: var(--color-surface-alt, #14141f);
}
.wsp-chart-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted, #888);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.wsp-donut-wrap {
  display: flex;
  justify-content: center;
  padding: 4px 0;
}
.wsp-donut {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  position: relative;
}
.wsp-donut-hole {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--color-surface, #0f0f1a);
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.wsp-donut-center-val { font-size: 16px; font-weight: 700; color: var(--color-text, #e0e0e0); line-height: 1; }
.wsp-donut-center-label { font-size: 9px; color: var(--color-text-muted, #888); }

.wsp-legend { display: flex; flex-direction: column; gap: 3px; }
.wsp-legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--color-text, #e0e0e0);
}
.wsp-legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.wsp-legend-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wsp-legend-count { font-weight: 600; color: var(--color-text-muted, #888); }

/* ── Bottom Row ── */
.wsp-bottom-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}
.wsp-bottom-card {
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--color-border, #2a2a3a);
  background: var(--color-surface-alt, #14141f);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Category Bars */
.wsp-category-bars { display: flex; flex-direction: column; gap: 5px; }
.wsp-cat-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}
.wsp-cat-name {
  width: 80px;
  flex-shrink: 0;
  color: var(--color-text, #e0e0e0);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.wsp-cat-bar-track {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: var(--color-border, #2a2a3a);
  overflow: hidden;
}
.wsp-cat-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s ease;
}
.wsp-cat-count {
  width: 24px;
  text-align: right;
  color: var(--color-text-muted, #888);
  font-weight: 600;
}

/* Top 5 */
.wsp-top5-tbl { width: 100%; border-collapse: collapse; font-size: 11px; }
.wsp-top5-tbl tr { border-bottom: 1px solid var(--color-border, #2a2a3a); }
.wsp-top5-tbl td { padding: 4px 4px; vertical-align: middle; }
.wsp-top5-rank { color: var(--color-text-muted, #888); width: 16px; font-weight: 600; }
.wsp-top5-name { max-width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--color-text, #e0e0e0); }
.wsp-top5-score { width: 32px; text-align: center; font-weight: 700; color: var(--color-text, #e0e0e0); }
.wsp-level-badge {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 4px;
  border: 1px solid;
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
}

.wsp-empty-note {
  font-size: 11px;
  color: var(--color-text-muted, #888);
  font-style: italic;
  padding: 8px 0;
}

@media (max-width: 1024px) {
  .wsp-charts-row { grid-template-columns: repeat(2, 1fr); }
  .wsp-bottom-row { grid-template-columns: 1fr; }
}
</style>
