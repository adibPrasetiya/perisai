<template>
  <div class="donut-root">
    <svg
      :width="size"
      :height="size"
      :viewBox="`0 0 ${size} ${size}`"
      class="donut-svg"
    >
      <!-- Track ring -->
      <circle
        :cx="cx" :cy="cy" :r="r"
        fill="none"
        stroke="var(--color-bg-input, #2a2a3a)"
        :stroke-width="thickness"
      />

      <!-- Empty state ring -->
      <circle
        v-if="total === 0"
        :cx="cx" :cy="cy" :r="r"
        fill="none"
        stroke="var(--color-border, #333)"
        :stroke-width="thickness"
        stroke-dasharray="4 4"
      />

      <!-- Segments -->
      <circle
        v-for="seg in segments"
        :key="seg.name"
        :cx="cx" :cy="cy" :r="r"
        fill="none"
        :stroke="seg.color"
        :stroke-width="thickness - 3"
        :stroke-dasharray="`${seg.dashLen.toFixed(2)} ${circumference.toFixed(2)}`"
        stroke-dashoffset="0"
        :transform="`rotate(${seg.rotate} ${cx} ${cy})`"
        style="transition: stroke-dasharray 0.6s ease"
      />

      <!-- Center value -->
      <text
        :x="cx" :y="cy + 1"
        text-anchor="middle"
        dominant-baseline="middle"
        :font-size="centerFontSize"
        font-weight="700"
        font-family="monospace"
        fill="var(--color-text, #e8e8e8)"
      >{{ total }}</text>

      <!-- Center label -->
      <text
        v-if="centerLabel"
        :x="cx" :y="cy + centerFontSize * 0.9"
        text-anchor="middle"
        dominant-baseline="hanging"
        :font-size="centerFontSize * 0.45"
        fill="var(--color-text-muted, #777)"
        font-family="sans-serif"
      >{{ centerLabel }}</text>
    </svg>

    <!-- Legend -->
    <div class="donut-legend">
      <div
        v-for="item in displayItems"
        :key="item.name"
        class="legend-row"
      >
        <span class="legend-dot" :style="{ background: item.color }" />
        <span class="legend-name">{{ item.name }}</span>
        <span class="legend-count">{{ item.count }}</span>
        <span class="legend-pct">{{ total > 0 ? Math.round(item.count / total * 100) : 0 }}%</span>
      </div>
      <div v-if="total === 0" class="legend-empty">Belum ada data</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface DonutItem {
  name: string
  color: string
  count: number
}

const props = withDefaults(
  defineProps<{
    items: DonutItem[]
    size?: number
    thickness?: number
    centerLabel?: string
  }>(),
  { size: 150, thickness: 24 },
)

const cx = computed(() => props.size / 2)
const cy = computed(() => props.size / 2)
const r = computed(() => (props.size - props.thickness) / 2 - 3)
const circumference = computed(() => 2 * Math.PI * r.value)
const centerFontSize = computed(() => Math.round(props.size * 0.175))

const displayItems = computed(() =>
  props.items.filter((i) => i.count > 0),
)

const total = computed(() => props.items.reduce((s, i) => s + i.count, 0))

const segments = computed(() => {
  if (total.value === 0) return []
  let cumulativeAngle = -90 // start at 12 o'clock
  return displayItems.value.map((item) => {
    const fraction = item.count / total.value
    const dashLen = fraction * circumference.value
    const rotate = cumulativeAngle
    cumulativeAngle += fraction * 360
    return { name: item.name, color: item.color, dashLen, rotate }
  })
})
</script>

<style scoped>
.donut-root {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
}

.donut-svg {
  flex-shrink: 0;
  overflow: visible;
}

.donut-legend {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.legend-row {
  display: grid;
  grid-template-columns: 10px 1fr auto auto;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-name {
  color: var(--color-text-dim);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.legend-count {
  font-family: var(--font-mono);
  font-weight: 600;
  color: var(--color-text);
  text-align: right;
}

.legend-pct {
  font-size: 10.5px;
  color: var(--color-text-muted);
  text-align: right;
  width: 32px;
}

.legend-empty {
  font-size: 12px;
  color: var(--color-text-muted);
  text-align: center;
  padding: 0.5rem 0;
}
</style>
