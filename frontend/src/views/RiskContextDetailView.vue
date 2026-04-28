<template>
  <div class="rcd-page">

    <div v-if="loading" class="rcd-centered">
      <ProgressSpinner style="width: 36px; height: 36px" />
    </div>
    <div v-else-if="loadError" class="rcd-error-banner">
      <i class="pi pi-exclamation-circle" /> {{ loadError }}
    </div>

    <template v-else-if="context">

      <!-- ─── Header ──────────────────────────────────────────────────────── -->
      <div class="rcd-header">
        <div class="rcd-header-left">
          <button class="rcd-back-btn" type="button" @click="goBack">
            <i class="pi pi-arrow-left" />
          </button>
          <div>
            <div class="rcd-breadcrumb">
              Framework / {{ context.framework.code }} / Konteks
            </div>
            <h1 class="rcd-title">{{ context.name }}</h1>
            <div class="rcd-meta">
              <span class="rcd-code">{{ context.code }}</span>
              <span class="rcd-type">{{ CONTEXT_TYPE_LABELS[context.contextType] }}</span>
              <span class="rcd-period">{{ context.periodStart }}–{{ context.periodEnd }}</span>
              <span class="rcd-matrix-size">{{ context.matrixRows }}×{{ context.matrixCols }}</span>
              <span class="rcd-status" :class="`cs-${context.status.toLowerCase()}`">
                {{ RISK_CONTEXT_STATUS_LABELS[context.status] }}
              </span>
            </div>
          </div>
        </div>
        <div class="rcd-header-actions">
          <button
            v-if="context.status !== 'ACTIVE' && canWrite"
            class="rcd-activate-btn"
            type="button"
            @click="openActivate"
          >
            <i class="pi pi-check-circle" /> Aktifkan
          </button>
          <button
            v-if="context.status === 'ACTIVE' && canWrite"
            class="rcd-deactivate-btn"
            type="button"
            @click="openDeactivate"
          >
            <i class="pi pi-pause-circle" /> Nonaktifkan
          </button>
        </div>
      </div>

      <!-- ─── Tabs ────────────────────────────────────────────────────────── -->
      <div class="rcd-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="rcd-tab"
          :class="{ 'tab-active': activeTab === tab.key }"
          type="button"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
          <span v-if="tab.count !== undefined" class="tab-count">{{ tab.count }}</span>
        </button>
      </div>

      <!-- ─── Tab: Ikhtisar ────────────────────────────────────────────────── -->
      <div v-if="activeTab === 'overview'" class="ov-root">

        <!-- Status banner -->
        <div class="ov-status-banner" :class="`ov-status-${context.status.toLowerCase()}`">
          <div class="ov-status-left">
            <i :class="context.status === 'ACTIVE' ? 'pi pi-check-circle' : 'pi pi-pause-circle'" />
            <div>
              <div class="ov-status-title">
                {{ context.status === 'ACTIVE' ? 'Konteks Aktif' : context.status === 'INACTIVE' ? 'Konteks Tidak Aktif' : 'Konteks Diarsipkan' }}
              </div>
              <div class="ov-status-sub">
                {{ context.status === 'ACTIVE'
                  ? 'Konteks ini sedang digunakan untuk penilaian risiko dalam framework ' + context.framework.code + '.'
                  : 'Konteks ini belum aktif. Aktifkan untuk mulai menggunakannya dalam proses penilaian risiko.' }}
              </div>
            </div>
          </div>
          <button
            v-if="context.status !== 'ACTIVE' && canWrite"
            class="ov-activate-inline"
            type="button"
            @click="openActivate"
          >
            <i class="pi pi-check-circle" /> Aktifkan Sekarang
          </button>
          <button
            v-if="context.status === 'ACTIVE' && canWrite"
            class="ov-deactivate-inline"
            type="button"
            @click="openDeactivate"
          >
            <i class="pi pi-pause-circle" /> Nonaktifkan
          </button>
        </div>

        <!-- Stat cards -->
        <div class="ov-stats">
          <div class="ov-stat" @click="activeTab = 'categories'">
            <div class="ov-stat-icon" style="background: rgba(139,92,246,0.1); color:#a78bfa; border-color:rgba(139,92,246,0.2)">
              <i class="pi pi-tag" />
            </div>
            <div class="ov-stat-body">
              <div class="ov-stat-val">{{ context.riskCategories.length }}</div>
              <div class="ov-stat-label">Kategori Risiko</div>
            </div>
            <div class="ov-stat-status" :class="context.riskCategories.length > 0 ? 'ss-ok' : 'ss-empty'">
              {{ context.riskCategories.length > 0 ? 'Terisi' : 'Kosong' }}
            </div>
          </div>
          <div class="ov-stat" @click="activeTab = 'impact'">
            <div class="ov-stat-icon" style="background: rgba(14,165,233,0.1); color:#38bdf8; border-color:rgba(14,165,233,0.2)">
              <i class="pi pi-percentage" />
            </div>
            <div class="ov-stat-body">
              <div class="ov-stat-val">{{ totalLikelihoodCount }}<span class="ov-stat-max">/{{ context.matrixRows * context.impactAreas.length }}</span></div>
              <div class="ov-stat-label">Kriteria Kemungkinan</div>
            </div>
            <div class="ov-stat-status" :class="totalLikelihoodCount > 0 && totalLikelihoodCount === context.matrixRows * context.impactAreas.length ? 'ss-ok' : totalLikelihoodCount > 0 ? 'ss-partial' : 'ss-empty'">
              {{ totalLikelihoodCount > 0 && totalLikelihoodCount === context.matrixRows * context.impactAreas.length ? 'Lengkap' : totalLikelihoodCount > 0 ? 'Sebagian' : 'Kosong' }}
            </div>
          </div>
          <div class="ov-stat" @click="activeTab = 'impact'">
            <div class="ov-stat-icon" style="background: rgba(249,115,22,0.1); color:#fb923c; border-color:rgba(249,115,22,0.2)">
              <i class="pi pi-chart-bar" />
            </div>
            <div class="ov-stat-body">
              <div class="ov-stat-val">{{ context.impactAreas.length }}</div>
              <div class="ov-stat-label">Area Dampak</div>
            </div>
            <div class="ov-stat-status" :class="context.impactAreas.length > 0 ? 'ss-ok' : 'ss-empty'">
              {{ context.impactAreas.length > 0 ? 'Terisi' : 'Kosong' }}
            </div>
          </div>
          <div class="ov-stat" @click="activeTab = 'treatment'">
            <div class="ov-stat-icon" style="background: rgba(16,185,129,0.1); color:#34d399; border-color:rgba(16,185,129,0.2)">
              <i class="pi pi-shield" />
            </div>
            <div class="ov-stat-body">
              <div class="ov-stat-val">{{ context.treatmentOptions.length }}</div>
              <div class="ov-stat-label">Opsi Penanganan</div>
            </div>
            <div class="ov-stat-status" :class="context.treatmentOptions.length > 0 ? 'ss-ok' : 'ss-empty'">
              {{ context.treatmentOptions.length > 0 ? 'Terisi' : 'Kosong' }}
            </div>
          </div>
          <div class="ov-stat" @click="activeTab = 'matrix'">
            <div class="ov-stat-icon" style="background: rgba(0,229,184,0.08); color:var(--color-accent); border-color:rgba(0,229,184,0.2)">
              <i class="pi pi-table" />
            </div>
            <div class="ov-stat-body">
              <div class="ov-stat-val">{{ context.matrixCells.length }}<span class="ov-stat-max">/{{ context.matrixRows * context.matrixCols }}</span></div>
              <div class="ov-stat-label">Sel Matriks</div>
            </div>
            <div class="ov-stat-status" :class="context.matrixCells.length === context.matrixRows * context.matrixCols ? 'ss-ok' : context.matrixCells.length > 0 ? 'ss-partial' : 'ss-empty'">
              {{ context.matrixCells.length === context.matrixRows * context.matrixCols ? 'Lengkap' : context.matrixCells.length > 0 ? 'Sebagian' : 'Kosong' }}
            </div>
          </div>
        </div>

        <!-- Detail info + Matrix visualization -->
        <div class="ov-lower">

          <!-- Left column: Info card -->
          <div class="ov-info-stack">
            <div class="ov-detail-card">
              <div class="ov-card-header">
                <i class="pi pi-info-circle" /> Informasi Konteks
                <button v-if="canModify" class="ov-card-header-edit" type="button" @click="openEditContext">
                  <i class="pi pi-pencil" /> Edit
                </button>
              </div>
              <div class="ov-card-body">

                <div class="ov-info-field">
                  <div class="ov-info-field-label"><i class="pi pi-tag" /> Tipe Konteks</div>
                  <div class="ov-info-field-val">
                    <i :class="context.contextType === 'ASSET' ? 'pi pi-server' : 'pi pi-sitemap'" class="ov-row-icon" />
                    {{ CONTEXT_TYPE_LABELS[context.contextType] }}
                  </div>
                </div>

                <div class="ov-info-field">
                  <div class="ov-info-field-label"><i class="pi pi-sitemap" /> Framework</div>
                  <div class="ov-info-field-val">
                    <span class="ov-chip-accent">{{ context.framework.code }}</span>
                    <span class="ov-info-field-text">{{ context.framework.name }}</span>
                  </div>
                </div>

                <div class="ov-info-field">
                  <div class="ov-info-field-label"><i class="pi pi-calendar" /> Periode</div>
                  <div class="ov-info-field-val">
                    <span class="ov-info-period">{{ context.periodStart }}</span>
                    <span class="ov-info-period-sep">–</span>
                    <span class="ov-info-period">{{ context.periodEnd }}</span>
                    <span v-if="context.periodEnd > context.periodStart" class="ov-info-field-sub">
                      {{ context.periodEnd - context.periodStart + 1 }} tahun
                    </span>
                  </div>
                </div>

                <div class="ov-info-field">
                  <div class="ov-info-field-label"><i class="pi pi-table" /> Dimensi Matriks</div>
                  <div class="ov-info-field-val">
                    <span class="ov-matrix-badge">{{ context.matrixRows }}×{{ context.matrixCols }}</span>
                    <span class="ov-info-field-sub">{{ context.matrixRows }} kemungkinan × {{ context.matrixCols }} dampak</span>
                  </div>
                </div>

                <div v-if="context.description" class="ov-info-field ov-info-field-block ov-info-field-grow">
                  <div class="ov-info-field-label"><i class="pi pi-align-left" /> Deskripsi</div>
                  <div class="ov-info-field-desc">{{ context.description }}</div>
                </div>
                <div v-else class="ov-info-field-grow" />

              </div>
            </div>
          </div>

          <!-- Right column: Matrix visualization -->
          <div class="ov-matrix-panel">
            <div class="ov-mx-header">
              <div class="ov-mx-title">
                <i class="pi pi-table" />
                Matriks Risiko
                <span class="ov-mx-size-badge">{{ context.matrixRows }}×{{ context.matrixCols }}</span>
              </div>
              <div v-if="ovAppetiteLevel" class="ov-mx-appetite-chip"
                :style="{ background: ovAppetiteLevel.color + '22', color: ovAppetiteLevel.color, borderColor: ovAppetiteLevel.color + '55' }"
              >
                <i class="pi pi-flag" />
                Selera: {{ ovAppetiteLevel.name }}
              </div>
              <button v-if="canModify" class="ov-mx-edit-btn" type="button" @click="activeTab = 'matrix'">
                <i class="pi pi-pencil" /> Edit
              </button>
            </div>

            <!-- Empty state -->
            <div v-if="context.matrixCells.length === 0" class="ov-mx-empty">
              <i class="pi pi-table" style="font-size:2rem; color:var(--color-text-muted); margin-bottom:0.5rem" />
              <span>Matriks belum dikonfigurasi</span>
              <button v-if="canModify" class="ov-card-cta" style="margin-top:0.75rem" type="button" @click="activeTab = 'matrix'">
                <i class="pi pi-cog" /> Konfigurasi Matriks
              </button>
            </div>

            <!-- Matrix table + sidebar legend -->
            <template v-else>
              <div class="ov-mx-body">
                <div class="ov-mx-wrap">
                  <table class="ov-mx-table">
                    <thead>
                      <tr>
                        <th class="ov-mx-corner">
                          <span class="ov-mx-cr">K</span>
                          <div class="ov-mx-corner-line" />
                          <span class="ov-mx-cc">D</span>
                        </th>
                        <th v-for="c in context.matrixCols" :key="`och-${c}`" class="ov-mx-col-h">D{{ c }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="r in context.matrixRows" :key="`omr-${r}`">
                        <td class="ov-mx-row-h">L{{ r }}</td>
                        <td v-for="c in context.matrixCols" :key="`omc-${r}-${c}`" class="ov-mx-cell-td">
                          <div
                            class="ov-mx-cell"
                            :class="{
                              'ov-mx-appetite': ovCellMatchesAppetite(r, c),
                              'ov-mx-above': ovCellAboveAppetite(r, c),
                            }"
                            :style="{
                              background: matchingRiskLevel(ovGetCell(r, c)?.value ?? 0)?.color
                                ? matchingRiskLevel(ovGetCell(r, c)!.value)!.color + (ovCellAboveAppetite(r, c) ? '18' : '40')
                                : 'rgba(255,255,255,0.03)',
                              borderColor: ovCellMatchesAppetite(r, c)
                                ? (ovAppetiteLevel?.color || 'var(--color-border)')
                                : (matchingRiskLevel(ovGetCell(r, c)?.value ?? 0)?.color || 'var(--color-border)'),
                              boxShadow: ovCellMatchesAppetite(r, c) && ovAppetiteLevel
                                ? `0 0 10px ${ovAppetiteLevel.color}99, 0 0 4px ${ovAppetiteLevel.color}cc, inset 0 0 8px ${ovAppetiteLevel.color}22`
                                : 'none',
                            }"
                            :title="ovGetCell(r, c)
                              ? `L${r}×D${c} = ${ovGetCell(r, c)!.value}${matchingRiskLevel(ovGetCell(r, c)!.value)?.name ? ' (' + matchingRiskLevel(ovGetCell(r, c)!.value)!.name + ')' : ''}`
                              : `L${r}×D${c}`"
                          >
                            <span
                              class="ov-mx-val"
                              :style="{
                                color: ovCellMatchesAppetite(r, c) && ovAppetiteLevel
                                  ? ovAppetiteLevel.color
                                  : (matchingRiskLevel(ovGetCell(r, c)?.value ?? 0)?.color || 'var(--color-text-muted)'),
                                opacity: ovCellAboveAppetite(r, c) ? 0.4 : 1,
                                textShadow: ovCellMatchesAppetite(r, c) && ovAppetiteLevel
                                  ? `0 0 8px ${ovAppetiteLevel.color}`
                                  : 'none',
                              }"
                            >
                              {{ ovGetCell(r, c)?.value ?? '' }}
                            </span>
                            <span
                              v-if="matchingRiskLevel(ovGetCell(r, c)?.value ?? 0)"
                              class="ov-mx-lbl"
                              :style="{
                                color: matchingRiskLevel(ovGetCell(r, c)?.value ?? 0)?.color || 'var(--color-text-muted)',
                                opacity: ovCellAboveAppetite(r, c) ? 0.3 : 0.85,
                              }"
                            >
                              {{ matchingRiskLevel(ovGetCell(r, c)!.value)!.name }}
                            </span>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Right sidebar: risk level legend -->
                <div v-if="context.riskLevels.length > 0" class="ov-mx-sidebar">
                  <div class="ov-mx-sidebar-title">Level Risiko</div>
                  <div class="ov-mx-sidebar-levels">
                    <div
                      v-for="lvl in context.riskLevels"
                      :key="lvl.id"
                      class="ov-mx-sidebar-item"
                      :style="{ borderLeftColor: lvl.color || '#334155' }"
                    >
                      <span class="ov-mx-sidebar-dot" :style="{ background: lvl.color || '#64748b' }" />
                      <div class="ov-mx-sidebar-info">
                        <span class="ov-mx-sidebar-name" :style="{ color: lvl.color || 'var(--color-text)' }">{{ lvl.name }}</span>
                        <span class="ov-mx-sidebar-range">{{ lvl.minScore }}–{{ lvl.maxScore }}</span>
                      </div>
                    </div>
                  </div>
                  <div v-if="ovAppetiteLevel" class="ov-mx-sidebar-appetite" :style="{ borderColor: ovAppetiteLevel.color + '55', background: ovAppetiteLevel.color + '0d' }">
                    <span class="ov-mx-sidebar-appetite-dot" :style="{ background: ovAppetiteLevel.color, boxShadow: `0 0 6px ${ovAppetiteLevel.color}` }" />
                    <div>
                      <div class="ov-mx-sidebar-appetite-label" :style="{ color: ovAppetiteLevel.color }">Selera Risiko</div>
                      <div class="ov-mx-sidebar-appetite-name">{{ ovAppetiteLevel.name }}</div>
                    </div>
                  </div>
                  <div v-else-if="!context.riskAppetiteLevel" class="ov-mx-sidebar-hint">
                    <i class="pi pi-info-circle" />
                    <span>Selera risiko belum diatur</span>
                  </div>
                </div>
              </div>
            </template>
          </div>

        </div>

        <!-- Preview cards: 3 sub-sections (kategori, area dampak, opsi penanganan) -->
        <div class="ov-previews">

          <!-- Kategori Risiko preview -->
          <div class="ov-preview-card">
            <div class="ov-preview-card-header">
              <span class="ov-preview-card-title"><i class="pi pi-tag" /> Kategori Risiko</span>
              <div style="display:flex;align-items:center;gap:0.5rem">
                <span class="ov-preview-card-count">{{ context.riskCategories.length }}</span>
                <button v-if="canModify" class="ov-preview-edit-btn" type="button" @click="activeTab = 'categories'">
                  <i class="pi pi-pencil" /> Edit
                </button>
              </div>
            </div>
            <div class="ov-preview-card-body">
              <div v-if="context.riskCategories.length === 0" class="ov-preview-empty">
                <i class="pi pi-tag" />
                <span>Belum ada kategori risiko</span>
              </div>
              <div
                v-for="(cat, idx) in context.riskCategories"
                :key="cat.id"
                class="ov-preview-cat-item"
              >
                <span class="ov-preview-number">{{ idx + 1 }}</span>
                <span v-if="cat.color" class="ov-preview-color-swatch" :style="{ background: cat.color }" />
                <div class="ov-preview-cat-body">
                  <div class="ov-preview-cat-top">
                    <span class="ov-preview-cat-name">{{ cat.name }}</span>
                    <span v-if="cat.code" class="ov-preview-code-badge">{{ cat.code }}</span>
                  </div>
                  <span v-if="cat.description" class="ov-preview-cat-desc">{{ cat.description }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Area Dampak & Kriteria preview -->
          <div class="ov-preview-card">
            <div class="ov-preview-card-header">
              <span class="ov-preview-card-title"><i class="pi pi-chart-bar" /> Area Dampak & Kriteria</span>
              <div style="display:flex;align-items:center;gap:0.5rem">
                <span class="ov-preview-card-count">{{ context.impactAreas.length }}</span>
                <button v-if="canModify" class="ov-preview-edit-btn" type="button" @click="activeTab = 'impact'">
                  <i class="pi pi-pencil" /> Edit
                </button>
              </div>
            </div>
            <div class="ov-preview-card-body">
              <div v-if="context.impactAreas.length === 0" class="ov-preview-empty">
                <i class="pi pi-chart-bar" />
                <span>Belum ada area dampak</span>
              </div>
              <div
                v-for="(area, idx) in context.impactAreas"
                :key="area.id"
                class="ov-preview-area-item"
              >
                <span class="ov-preview-number">{{ idx + 1 }}</span>
                <span class="ov-preview-area-name">{{ area.name }}</span>
                <span class="ov-preview-area-meta">({{ area.impactCriteria.length }} imp / {{ area.likelihoodCriteria.length }} kem)</span>
              </div>
            </div>
          </div>

          <!-- Opsi Penanganan preview -->
          <div class="ov-preview-card">
            <div class="ov-preview-card-header">
              <span class="ov-preview-card-title"><i class="pi pi-shield" /> Opsi Penanganan</span>
              <div style="display:flex;align-items:center;gap:0.5rem">
                <span class="ov-preview-card-count">{{ context.treatmentOptions.length }}</span>
                <button v-if="canModify" class="ov-preview-edit-btn" type="button" @click="activeTab = 'treatment'">
                  <i class="pi pi-pencil" /> Edit
                </button>
              </div>
            </div>
            <div class="ov-preview-card-body">
              <div v-if="context.treatmentOptions.length === 0" class="ov-preview-empty">
                <i class="pi pi-shield" />
                <span>Belum ada opsi penanganan</span>
              </div>
              <div
                v-for="opt in context.treatmentOptions"
                :key="opt.id"
                class="ov-preview-opt-item"
              >
                <span class="ov-preview-number">{{ opt.order }}</span>
                <div class="ov-preview-opt-body">
                  <span class="ov-preview-opt-name">{{ opt.name }}</span>
                  <span v-if="opt.description" class="ov-preview-opt-desc">{{ opt.description }}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      <!-- ─── Tab: Level Risiko ───────────────────────────────────────────── -->
      <div v-if="activeTab === 'riskLevels'" class="rcd-panel">
        <div class="rcd-panel-header">
          <span class="rcd-panel-title">Level Risiko</span>
          <button v-if="canModify" class="rcd-add-btn" type="button" @click="openCreateRiskLevel">
            <i class="pi pi-plus" /> Tambah Level
          </button>
        </div>

        <!-- Empty state -->
        <div v-if="context.riskLevels.length === 0" class="rl-empty">
          <i class="pi pi-list-check" />
          <span>Belum ada level risiko.</span>
          <span class="rl-empty-hint">Level risiko mendefinisikan kategori hasil penilaian (mis. Rendah, Sedang, Tinggi) berdasarkan rentang skor matriks.</span>
          <button v-if="canModify" class="rcd-add-btn" type="button" @click="openCreateRiskLevel">
            <i class="pi pi-plus" /> Tambah Level Pertama
          </button>
        </div>

        <div v-else class="rl-layout">
          <!-- ── 70%: Pengaturan ── -->
          <div class="rl-settings">
            <!-- Visual score bar -->
            <div class="rl-bar-wrap">
              <div class="rl-bar-label">Distribusi Rentang Skor:</div>
              <div class="rl-bar">
                <div
                  v-for="lvl in context.riskLevels"
                  :key="lvl.id"
                  class="rl-bar-seg"
                  :style="{
                    background: (lvl.color || '#64748b') + '33',
                    borderColor: lvl.color || '#64748b',
                    flex: Math.max(lvl.maxScore - lvl.minScore + 1, 1),
                  }"
                  :title="`${lvl.name}: ${lvl.minScore}–${lvl.maxScore}`"
                >
                  <span class="rl-bar-name" :style="{ color: lvl.color || '#94a3b8' }">{{ lvl.name }}</span>
                  <span class="rl-bar-range">{{ lvl.minScore }}–{{ lvl.maxScore }}</span>
                </div>
              </div>
            </div>

            <!-- Level cards -->
            <div class="rl-cards">
              <div
                v-for="lvl in context.riskLevels"
                :key="lvl.id"
                class="rl-card"
                :style="{ borderLeftColor: lvl.color || '#334155' }"
              >
                <div class="rl-card-left">
                  <div class="rl-card-color-dot" :style="{ background: lvl.color || '#334155' }" />
                  <div class="rl-card-info">
                    <div class="rl-card-name">{{ lvl.name }}</div>
                    <div v-if="lvl.description" class="rl-card-desc">{{ lvl.description }}</div>
                  </div>
                </div>
                <div class="rl-card-right">
                  <div class="rl-score-range">
                    <span class="rl-score-val" :style="{ color: lvl.color || 'var(--color-text)' }">
                      {{ lvl.minScore }}
                    </span>
                    <span class="rl-score-sep">–</span>
                    <span class="rl-score-val" :style="{ color: lvl.color || 'var(--color-text)' }">
                      {{ lvl.maxScore }}
                    </span>
                    <span class="rl-score-unit">skor</span>
                  </div>
                  <div class="rl-card-order">urutan {{ lvl.order }}</div>
                  <div v-if="canModify" class="rl-card-actions">
                    <button class="btn-icon" title="Edit" @click="openEditRiskLevel(lvl)"><i class="pi pi-pencil" /></button>
                    <button class="btn-icon btn-icon-danger" title="Hapus" @click="openDeleteRiskLevel(lvl)"><i class="pi pi-trash" /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ── 30%: Visualisasi Risk Matrix ── -->
          <div class="rl-matrix-preview">
            <div class="rl-mx-title">Visualisasi Risk Matrix</div>
            <div v-if="context.matrixCells.length === 0" class="rl-mx-empty">
              <i class="pi pi-table" />
              <span>Matriks belum diisi</span>
              <span class="rl-mx-empty-hint">Isi matriks di tab "Matriks" untuk melihat visualisasi</span>
            </div>
            <div v-else class="rl-mx-wrap">
              <table class="rl-mx-table">
                <thead>
                  <tr>
                    <th class="rl-mx-corner"></th>
                    <th v-for="c in context.matrixCols" :key="`rl-ch-${c}`" class="rl-mx-col-hdr">D{{ c }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="r in context.matrixRows" :key="`rl-row-${r}`">
                    <td class="rl-mx-row-hdr">L{{ r }}</td>
                    <td v-for="c in context.matrixCols" :key="`rl-cell-${r}-${c}`" class="rl-mx-cell">
                      <div
                        class="rl-mx-cell-inner"
                        :style="{
                          background: matchingRiskLevel(ovGetCell(r, c)?.value ?? 0)?.color
                            ? (matchingRiskLevel(ovGetCell(r, c)?.value ?? 0)!.color + '30')
                            : 'rgba(255,255,255,0.03)',
                          borderColor: matchingRiskLevel(ovGetCell(r, c)?.value ?? 0)?.color || 'var(--color-border)',
                        }"
                        :title="ovGetCell(r, c)
                          ? `L${r}×D${c} = ${ovGetCell(r, c)!.value}${matchingRiskLevel(ovGetCell(r, c)!.value)?.name ? ' (' + matchingRiskLevel(ovGetCell(r, c)!.value)!.name + ')' : ''}`
                          : `L${r}×D${c} — kosong`"
                      >
                        <span
                          class="rl-mx-cell-val"
                          :style="{ color: matchingRiskLevel(ovGetCell(r, c)?.value ?? 0)?.color || 'var(--color-text-dim)' }"
                        >{{ ovGetCell(r, c)?.value ?? '' }}</span>
                        <span
                          v-if="matchingRiskLevel(ovGetCell(r, c)?.value ?? 0)"
                          class="rl-mx-cell-lbl"
                          :style="{ color: matchingRiskLevel(ovGetCell(r, c)?.value ?? 0)!.color || 'var(--color-text-muted)' }"
                        >{{ matchingRiskLevel(ovGetCell(r, c)?.value ?? 0)!.name }}</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div class="rl-mx-legend">
                <span v-for="lvl in context.riskLevels" :key="lvl.id" class="rl-mx-legend-item">
                  <span class="rl-mx-legend-dot" :style="{ background: lvl.color || '#64748b' }" />
                  {{ lvl.name }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ─── Tab: Kategori Risiko ─────────────────────────────────────────── -->
      <div v-if="activeTab === 'categories'" class="rcd-panel">
        <div class="rcd-panel-header">
          <span class="rcd-panel-title">Kategori Risiko</span>
          <button v-if="canModify" class="rcd-add-btn" type="button" @click="openCreateCategory">
            <i class="pi pi-plus" /> Tambah Kategori
          </button>
        </div>
        <div v-if="context.riskCategories.length === 0" class="rcd-empty-sm">
          Belum ada kategori risiko
        </div>
        <table v-else class="rcd-table">
          <thead>
            <tr>
              <th>Urutan</th>
              <th>Kode</th>
              <th>Nama</th>
              <th>Warna</th>
              <th>Deskripsi</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cat in context.riskCategories" :key="cat.id">
              <td class="td-center">{{ cat.order }}</td>
              <td>
                <span v-if="cat.code" class="rcd-mono">{{ cat.code }}</span>
                <span v-else class="td-muted">—</span>
              </td>
              <td class="td-name">{{ cat.name }}</td>
              <td>
                <div v-if="cat.color" class="color-swatch" :style="{ background: cat.color }" :title="cat.color" />
                <span v-else class="td-muted">—</span>
              </td>
              <td class="td-desc">{{ cat.description ?? '—' }}</td>
              <td v-if="canModify" class="td-actions">
                <button class="btn-icon" @click="openEditCategory(cat)"><i class="pi pi-pencil" /></button>
                <button class="btn-icon btn-icon-danger" @click="openDeleteCategory(cat)"><i class="pi pi-trash" /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ─── Tab: Area Dampak & Kriteria ─────────────────────────────────── -->
      <div v-if="activeTab === 'impact'" class="rcd-panel impact-panel">

        <!-- Empty state: belum ada area dampak -->
        <div v-if="context.impactAreas.length === 0" class="impact-no-area">
          <div class="impact-no-area-icon"><i class="pi pi-chart-bar" /></div>
          <div class="impact-no-area-title">Belum ada Area Dampak</div>
          <div class="impact-no-area-hint">
            Buat area dampak terlebih dahulu (mis. Finansial, Operasional, Reputasi), kemudian tambahkan
            <strong>level dampak</strong> dan <strong>level kemungkinan</strong> di masing-masing area.
          </div>
          <button v-if="canModify" class="rcd-add-btn" type="button" @click="openCreateImpactArea">
            <i class="pi pi-plus" /> Tambah Area Dampak Pertama
          </button>
        </div>

        <!-- Layout 70/30 -->
        <div v-else class="impact-split">

          <!-- ── LEFT 70%: area list ───────────────────────────────────────── -->
          <div class="impact-left">
            <div class="impact-left-header">
              <span class="rcd-panel-title">Area Dampak & Kriteria</span>
              <button v-if="canModify" class="rcd-add-btn" type="button" @click="openCreateImpactArea">
                <i class="pi pi-plus" /> Tambah Area
              </button>
            </div>

            <div class="impact-areas-list">
              <div v-for="area in context.impactAreas" :key="area.id" class="impact-area-block">

                <!-- Area header (clickable to collapse) -->
                <div
                  class="impact-area-header"
                  :class="{ 'impact-area-header-collapsed': collapsedAreas.has(area.id) }"
                  @click.self="toggleArea(area.id)"
                >
                  <div class="impact-area-info" style="cursor:pointer" @click="toggleArea(area.id)">
                    <button
                      class="impact-collapse-btn"
                      type="button"
                      :class="{ 'impact-collapse-btn-open': !collapsedAreas.has(area.id) }"
                      @click.stop="toggleArea(area.id)"
                    >
                      <i class="pi pi-chevron-right" />
                    </button>
                    <span class="impact-area-badge">{{ area.order }}</span>
                    <div>
                      <div class="impact-area-name">{{ area.name }}</div>
                      <div v-if="area.description" class="impact-area-desc">{{ area.description }}</div>
                    </div>
                  </div>
                  <div class="impact-area-header-right">
                    <!-- Summary chips shown when collapsed -->
                    <template v-if="collapsedAreas.has(area.id)">
                      <span class="impact-summary-chip impact-summary-impact">
                        <i class="pi pi-arrow-right" />
                        {{ area.impactCriteria.length }}/{{ context.matrixCols }} dampak
                      </span>
                      <span class="impact-summary-chip impact-summary-likelihood">
                        <i class="pi pi-arrow-up" />
                        {{ area.likelihoodCriteria.length }}/{{ context.matrixRows }} kemungkinan
                      </span>
                    </template>
                    <div v-if="canModify" class="impact-area-actions">
                      <button class="btn-icon" title="Edit area" @click.stop="openEditImpactArea(area)"><i class="pi pi-pencil" /></button>
                      <button class="btn-icon btn-icon-danger" title="Hapus area" @click.stop="openDeleteImpactArea(area)"><i class="pi pi-trash" /></button>
                    </div>
                  </div>
                </div>

                <!-- Two sub-panels side by side (collapsible) -->
                <div v-show="!collapsedAreas.has(area.id)" class="impact-criteria-panels">

                  <!-- Level Dampak -->
                  <div class="criteria-sub-panel">
                    <div class="criteria-sub-header">
                      <div class="criteria-sub-title">
                        <i class="pi pi-arrow-right" style="font-size:10px;color:var(--color-accent)" />
                        Level Dampak
                        <span class="criteria-sub-count">({{ area.impactCriteria.length }}/{{ context.matrixCols }})</span>
                      </div>
                      <button
                        v-if="canModify"
                        class="rcd-add-xs-btn"
                        type="button"
                        :disabled="area.impactCriteria.length >= context.matrixCols"
                        @click="openCreateImpactCriteria(area)"
                      >
                        <i class="pi pi-plus" />
                      </button>
                    </div>
                    <div v-if="area.impactCriteria.length === 0" class="criteria-empty">
                      Belum ada level dampak
                    </div>
                    <div v-else class="criteria-rows">
                      <div
                        v-for="ic in area.impactCriteria"
                        :key="ic.id"
                        class="criteria-row"
                        :class="{ 'criteria-row-hovered': hoveredImpactLevel === ic.level }"
                        :title="ic.description || ic.name"
                        @mouseenter="hoveredImpactLevel = ic.level; hoveredLikelihoodLevel = null"
                        @mouseleave="hoveredImpactLevel = null"
                      >
                        <span class="criteria-level-badge impact-level">D{{ ic.level }}</span>
                        <div class="criteria-row-body">
                          <div class="criteria-row-desc">{{ ic.description || ic.name }}</div>
                          <div v-if="ic.description" class="criteria-row-meta">
                            <span class="criteria-row-name-sub">{{ ic.name }}</span>
                          </div>
                        </div>
                        <div v-if="canModify" class="criteria-row-actions">
                          <button class="btn-icon btn-icon-xs" @click="openEditImpactCriteria(area, ic)"><i class="pi pi-pencil" /></button>
                          <button class="btn-icon btn-icon-xs btn-icon-danger" @click="openDeleteImpactCriteria(area, ic)"><i class="pi pi-trash" /></button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Level Kemungkinan -->
                  <div class="criteria-sub-panel">
                    <div class="criteria-sub-header">
                      <div class="criteria-sub-title">
                        <i class="pi pi-arrow-up" style="font-size:10px;color:#38bdf8" />
                        Level Kemungkinan
                        <span class="criteria-sub-count">({{ area.likelihoodCriteria.length }}/{{ context.matrixRows }})</span>
                      </div>
                      <button
                        v-if="canModify"
                        class="rcd-add-xs-btn rcd-add-xs-blue"
                        type="button"
                        :disabled="area.likelihoodCriteria.length >= context.matrixRows"
                        @click="openCreateLikelihood(area)"
                      >
                        <i class="pi pi-plus" />
                      </button>
                    </div>
                    <div v-if="area.likelihoodCriteria.length === 0" class="criteria-empty">
                      Belum ada level kemungkinan
                    </div>
                    <div v-else class="criteria-rows">
                      <div
                        v-for="lc in area.likelihoodCriteria"
                        :key="lc.id"
                        class="criteria-row"
                        :class="{ 'criteria-row-hovered': hoveredLikelihoodLevel === lc.level }"
                        :title="lc.description || lc.name"
                        @mouseenter="hoveredLikelihoodLevel = lc.level; hoveredImpactLevel = null"
                        @mouseleave="hoveredLikelihoodLevel = null"
                      >
                        <span class="criteria-level-badge likelihood-level">L{{ lc.level }}</span>
                        <div class="criteria-row-body">
                          <div class="criteria-row-desc">{{ lc.description || lc.name }}</div>
                          <div v-if="lc.description" class="criteria-row-meta">
                            <span class="criteria-row-name-sub">{{ lc.name }}</span>
                          </div>
                        </div>
                        <div v-if="canModify" class="criteria-row-actions">
                          <button class="btn-icon btn-icon-xs" @click="openEditLikelihood(area, lc)"><i class="pi pi-pencil" /></button>
                          <button class="btn-icon btn-icon-xs btn-icon-danger" @click="openDeleteLikelihood(area, lc)"><i class="pi pi-trash" /></button>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

          <!-- ── RIGHT 30%: matrix preview (redesigned) ──────────────────── -->
          <div class="impact-matrix-preview">
            <div class="imp-card">

              <!-- Card header -->
              <div class="imp-card-header">
                <div class="imp-card-title">
                  <i class="pi pi-table" /> Matriks Risiko
                </div>
                <span class="imp-card-badge">{{ context.matrixRows }}×{{ context.matrixCols }}</span>
              </div>

              <!-- Empty state -->
              <div v-if="context.matrixCells.length === 0" class="imp-card-empty">
                <i class="pi pi-table" />
                <span>Belum ada nilai sel</span>
                <span class="imp-card-empty-sub">Isi di tab <strong>Matriks</strong></span>
              </div>

              <template v-else>
                <!-- Matrix grid -->
                <div class="imp-grid-wrap">
                  <!-- Axis hint: Dampak -->
                  <div class="imp-axis-row">
                    <div class="imp-axis-spacer" />
                    <div class="imp-axis-label-h">Dampak →</div>
                  </div>

                  <div class="imp-grid-body">
                    <!-- Axis hint: Kemungkinan (rotated) -->
                    <div class="imp-axis-label-v">
                      <span>↑ Kemungkinan</span>
                    </div>

                    <table class="imp-table">
                      <thead>
                        <tr>
                          <th class="imp-corner">
                            <span class="imp-corner-k">K</span>
                            <div class="imp-corner-line" />
                            <span class="imp-corner-d">D</span>
                          </th>
                          <th
                            v-for="c in context.matrixCols"
                            :key="`ich-${c}`"
                            class="imp-col-hdr"
                            :class="{ 'imp-hdr-impact-active': hoveredImpactLevel === c }"
                            @mouseenter="hoveredImpactLevel = c"
                            @mouseleave="hoveredImpactLevel = null"
                          >
                            D{{ c }}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="r in context.matrixRows" :key="`irw-${r}`">
                          <td
                            class="imp-row-hdr"
                            :class="{ 'imp-hdr-likelihood-active': hoveredLikelihoodLevel === r }"
                            @mouseenter="hoveredLikelihoodLevel = r"
                            @mouseleave="hoveredLikelihoodLevel = null"
                          >
                            L{{ r }}
                          </td>
                          <td
                            v-for="c in context.matrixCols"
                            :key="`icell-${r}-${c}`"
                            class="imp-cell"
                            :class="{
                              'imp-cell-col-hl': hoveredImpactLevel === c && hoveredLikelihoodLevel !== r,
                              'imp-cell-row-hl': hoveredLikelihoodLevel === r && hoveredImpactLevel !== c,
                              'imp-cell-cross': hoveredImpactLevel === c && hoveredLikelihoodLevel === r,
                            }"
                            :style="{
                              background: matchingRiskLevel(impGetCell(r,c)?.value ?? 0)?.color
                                ? matchingRiskLevel(impGetCell(r,c)!.value)!.color + '28'
                                : 'rgba(255,255,255,0.02)',
                              borderColor: matchingRiskLevel(impGetCell(r,c)?.value ?? 0)?.color || 'var(--color-border)',
                            }"
                            @mouseenter="hoveredImpactLevel = c; hoveredLikelihoodLevel = r"
                            @mouseleave="hoveredImpactLevel = null; hoveredLikelihoodLevel = null"
                          >
                            <span
                              class="imp-cell-val"
                              :style="{ color: matchingRiskLevel(impGetCell(r,c)?.value ?? 0)?.color || 'var(--color-text-dim)' }"
                            >
                              {{ impGetCell(r,c)?.value ?? '–' }}
                            </span>
                            <span
                              v-if="matchingRiskLevel(impGetCell(r,c)?.value ?? 0)"
                              class="imp-cell-lbl"
                              :style="{ color: matchingRiskLevel(impGetCell(r,c)!.value)!.color }"
                            >
                              {{ matchingRiskLevel(impGetCell(r,c)!.value)!.name }}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Legend -->
                <div v-if="context.riskLevels.length > 0" class="imp-legend">
                  <div
                    v-for="lvl in context.riskLevels"
                    :key="lvl.id"
                    class="imp-legend-item"
                    :style="{ borderLeftColor: lvl.color || '#334155' }"
                  >
                    <span class="imp-legend-dot" :style="{ background: lvl.color || '#64748b' }" />
                    <span class="imp-legend-name" :style="{ color: lvl.color || 'var(--color-text-dim)' }">{{ lvl.name }}</span>
                    <span class="imp-legend-range">{{ lvl.minScore }}–{{ lvl.maxScore }}</span>
                  </div>
                </div>
              </template>

            </div>
          </div>

        </div>
      </div>

      <!-- ─── Tab: Opsi Penanganan ─────────────────────────────────────────── -->
      <div v-if="activeTab === 'treatment'" class="rcd-panel">
        <div class="rcd-panel-header">
          <span class="rcd-panel-title">Opsi Penanganan Risiko</span>
          <button v-if="canModify" class="rcd-add-btn" type="button" @click="openCreateTreatment">
            <i class="pi pi-plus" /> Tambah Opsi
          </button>
        </div>
        <div v-if="context.treatmentOptions.length === 0" class="rcd-empty-sm">
          Belum ada opsi penanganan risiko
        </div>
        <table v-else class="rcd-table">
          <thead>
            <tr>
              <th>Urutan</th>
              <th>Nama</th>
              <th>Deskripsi</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="opt in context.treatmentOptions" :key="opt.id">
              <td class="td-center">{{ opt.order }}</td>
              <td class="td-name">{{ opt.name }}</td>
              <td class="td-desc">{{ opt.description ?? '—' }}</td>
              <td v-if="canModify" class="td-actions">
                <button class="btn-icon" @click="openEditTreatment(opt)"><i class="pi pi-pencil" /></button>
                <button class="btn-icon btn-icon-danger" @click="openDeleteTreatment(opt)"><i class="pi pi-trash" /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ─── Tab: Matriks ─────────────────────────────────────────────────── -->
      <div v-if="activeTab === 'matrix'" class="rcd-panel">
        <div class="rcd-panel-header">
          <div class="mx-header-left">
            <span class="rcd-panel-title">Matriks Risiko</span>
            <span class="mx-dim-badge">{{ context.matrixRows }}×{{ context.matrixCols }}</span>
            <span class="mx-axis-hint">
              <i class="pi pi-arrow-up" style="transform:rotate(-90deg)" /> Baris = Kemungkinan &nbsp;·&nbsp;
              <i class="pi pi-arrow-right" /> Kolom = Dampak
            </span>
          </div>
          <button v-if="canModify" class="rcd-add-btn" type="button" :disabled="matrixSaving" @click="saveMatrix">
            <i :class="matrixSaving ? 'pi pi-spin pi-spinner' : 'pi pi-save'" />
            {{ matrixSaving ? 'Menyimpan…' : 'Simpan Matriks' }}
          </button>
        </div>

        <div v-if="matrixSaveError" class="rcd-alert-error" style="margin: 0 1.5rem 1rem;">
          <i class="pi pi-exclamation-triangle" /> {{ matrixSaveError }}
        </div>

        <div class="mx-body">
          <!-- Matrix table -->
          <div class="mx-table-wrap">
            <table class="mx-table">
              <thead>
                <tr>
                  <!-- Corner cell -->
                  <th class="mx-corner">
                    <span class="mx-corner-row">Kemungkinan</span>
                    <div class="mx-corner-divider" />
                    <span class="mx-corner-col">Dampak</span>
                  </th>
                  <!-- Column (impact) headers -->
                  <th v-for="c in context.matrixCols" :key="`ch-${c}`" class="mx-col-header">
                    <div class="mx-col-level">D{{ c }}</div>
                    <div v-if="getImpactLevelHint(c)" class="mx-col-hint">{{ getImpactLevelHint(c) }}</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in matrixGrid" :key="`row-${row[0].row}`">
                  <!-- Row (likelihood) header -->
                  <td class="mx-row-header">
                    <div class="mx-row-level">L{{ row[0].row }}</div>
                    <div class="mx-row-name">{{ getLikelihoodName(row[0].row) }}</div>
                  </td>
                  <!-- Cells -->
                  <td
                    v-for="cell in row"
                    :key="`cell-${cell.row}-${cell.col}`"
                    class="mx-cell-td"
                    :class="{ 'mx-cell-selected': selectedCell === cell }"
                    @click="selectCell(cell)"
                  >
                    <div
                      class="mx-cell-inner"
                      :style="{
                        background: matchingRiskLevel(cell.value)?.color ? matchingRiskLevel(cell.value)!.color + '22' : 'transparent',
                        borderColor: matchingRiskLevel(cell.value)?.color || 'var(--color-border)',
                      }"
                    >
                      <div class="mx-cell-value" :style="{ color: matchingRiskLevel(cell.value)?.color || 'var(--color-text-dim)' }">
                        {{ cell.value || 0 }}
                      </div>
                      <div v-if="matchingRiskLevel(cell.value)" class="mx-cell-lbl">{{ matchingRiskLevel(cell.value)!.name }}</div>
                      <div v-if="!cell.value && !matchingRiskLevel(cell.value)" class="mx-cell-empty">—</div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Cell editor -->
          <div v-if="canModify" class="mx-editor" :class="{ 'mx-editor-open': selectedCell }">
            <template v-if="selectedCell">
              <div class="mx-editor-header">
                <div class="mx-editor-title">
                  <span class="mx-editor-pos">L{{ selectedCell.row }} × D{{ selectedCell.col }}</span>
                  Edit Sel
                </div>
                <button class="mx-editor-close" type="button" @click="selectedCell = null">
                  <i class="pi pi-times" />
                </button>
              </div>
              <div class="mx-editor-body">
                <div class="form-group">
                  <label class="form-label">Nilai Risiko</label>
                  <input v-model.number="selectedCell.value" class="rcd-input" type="number" min="0" />
                  <!-- Risk level suggestion -->
                  <div v-if="matchingRiskLevel(selectedCell.value)" class="mx-level-match">
                    <div
                      class="mx-level-badge"
                      :style="{
                        background: (matchingRiskLevel(selectedCell.value)!.color || '#64748b') + '22',
                        color: matchingRiskLevel(selectedCell.value)!.color || '#94a3b8',
                        borderColor: (matchingRiskLevel(selectedCell.value)!.color || '#64748b') + '55',
                      }"
                    >
                      <i class="pi pi-circle-fill" style="font-size:7px" />
                      {{ matchingRiskLevel(selectedCell.value)!.name }}
                    </div>
                    <button
                      type="button"
                      class="mx-apply-level"
                      @click="applyRiskLevel(selectedCell, matchingRiskLevel(selectedCell.value)!)"
                    >
                      Terapkan warna & label
                    </button>
                  </div>
                  <span v-else-if="context.riskLevels.length > 0 && selectedCell.value > 0" class="form-hint">
                    Nilai tidak cocok dengan level risiko yang ada.
                  </span>
                  <span v-else-if="context.riskLevels.length === 0" class="form-hint">
                    <i class="pi pi-info-circle" /> Buat level risiko di tab "Level Risiko" untuk saran otomatis.
                  </span>
                </div>
                <div class="form-group">
                  <label class="form-label">Label</label>
                  <select
                    v-if="context.riskLevels.length > 0"
                    v-model="selectedCell.label"
                    class="rcd-input"
                  >
                    <option value="">— Tidak ada label —</option>
                    <option v-for="lvl in context.riskLevels" :key="lvl.id" :value="lvl.name">
                      {{ lvl.name }}
                    </option>
                  </select>
                  <input
                    v-else
                    v-model="selectedCell.label"
                    class="rcd-input"
                    type="text"
                    placeholder="mis. Rendah, Sedang, Tinggi"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Warna Sel</label>
                  <div class="mx-color-row">
                    <!-- Risk level color presets (prioritized) -->
                    <div v-if="context.riskLevels.length > 0" class="mx-color-presets">
                      <button
                        v-for="lvl in context.riskLevels"
                        :key="lvl.id"
                        class="mx-color-preset"
                        :style="{ background: lvl.color || '#334155' }"
                        :title="lvl.name"
                        :class="{ 'preset-active': selectedCell.color === lvl.color }"
                        type="button"
                        @click="selectedCell.color = lvl.color || '#334155'"
                      />
                    </div>
                    <div v-else class="mx-color-presets">
                      <button
                        v-for="preset in colorPresets"
                        :key="preset.value"
                        class="mx-color-preset"
                        :style="{ background: preset.value }"
                        :title="preset.label"
                        :class="{ 'preset-active': selectedCell.color === preset.value }"
                        type="button"
                        @click="selectedCell.color = preset.value"
                      />
                    </div>
                    <input v-model="selectedCell.color" class="rcd-input mx-color-hex" type="text" placeholder="#334155" />
                    <input v-model="selectedCell.color" type="color" class="mx-color-picker" />
                  </div>
                  <div class="mx-color-preview" :style="{ background: selectedCell.color + '33', borderColor: selectedCell.color }">
                    <span :style="{ color: selectedCell.color }">{{ selectedCell.value || 0 }}</span>
                    <span v-if="selectedCell.label" :style="{ color: selectedCell.color }">{{ selectedCell.label }}</span>
                  </div>
                </div>
              </div>
            </template>
            <div v-else class="mx-editor-placeholder">
              <i class="pi pi-hand-pointer" />
              <span>Klik sel pada matriks untuk mengeditnya</span>
            </div>
          </div>
        </div>

        <!-- Legend -->
        <div class="mx-legend">
          <template v-if="context.riskLevels.length > 0">
            <span class="mx-legend-title">Level Risiko:</span>
            <span v-for="lvl in context.riskLevels" :key="lvl.id" class="mx-legend-item">
              <span class="mx-legend-dot" :style="{ background: lvl.color || '#64748b' }" />
              {{ lvl.name }}
              <span class="mx-legend-score">({{ lvl.minScore }}–{{ lvl.maxScore }})</span>
            </span>
          </template>
          <template v-else>
            <span class="mx-legend-title">Legenda:</span>
            <span v-for="preset in colorPresets" :key="preset.value" class="mx-legend-item">
              <span class="mx-legend-dot" :style="{ background: preset.value }" />
              {{ preset.label }}
            </span>
          </template>
          <span v-if="canModify" class="mx-legend-hint">· Klik sel untuk mengedit · Simpan setelah selesai</span>
        </div>
      </div>

    </template>

    <!-- ─── Edit Context Dialog ──────────────────────────────────────────────── -->
    <Dialog v-model:visible="showEditCtx" modal header="Edit Konteks Risiko" :style="{ width: '560px' }">
      <form class="rcd-form" @submit.prevent="submitEditContext">
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Periode Awal <span class="req">*</span></label>
            <input v-model.number="editCtxForm.periodStart" class="rcd-input" type="number" min="2000" max="2100" />
          </div>
          <div class="form-group">
            <label class="form-label">Periode Akhir <span class="req">*</span></label>
            <input v-model.number="editCtxForm.periodEnd" class="rcd-input" :class="{ 'is-error': editCtxErrors.periodEnd }" type="number" min="2000" max="2100" />
            <span v-if="editCtxErrors.periodEnd" class="form-err">{{ editCtxErrors.periodEnd }}</span>
          </div>
        </div>
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Dimensi Baris (Kemungkinan) <span class="req">*</span></label>
            <input v-model.number="editCtxForm.matrixRows" class="rcd-input" :class="{ 'is-error': editCtxErrors.matrixRows }" type="number" min="1" max="10" />
            <span v-if="editCtxErrors.matrixRows" class="form-err">{{ editCtxErrors.matrixRows }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">Dimensi Kolom (Dampak) <span class="req">*</span></label>
            <input v-model.number="editCtxForm.matrixCols" class="rcd-input" :class="{ 'is-error': editCtxErrors.matrixCols }" type="number" min="1" max="10" />
            <span v-if="editCtxErrors.matrixCols" class="form-err">{{ editCtxErrors.matrixCols }}</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Deskripsi <span class="form-opt">(opsional)</span></label>
          <textarea v-model="editCtxForm.description" class="rcd-input rcd-textarea" rows="2" />
        </div>
        <div class="form-group">
          <label class="form-label">Level Selera Risiko <span class="form-opt">(opsional)</span></label>
          <select v-model="editCtxForm.riskAppetiteLevel" class="rcd-input">
            <option value="">— Tidak diatur —</option>
            <option v-for="lvl in context?.riskLevels" :key="lvl.id" :value="lvl.name">{{ lvl.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Deskripsi Selera Risiko <span class="form-opt">(opsional)</span></label>
          <textarea v-model="editCtxForm.riskAppetiteDescription" class="rcd-input rcd-textarea" rows="3" />
        </div>
        <div v-if="editCtxError" class="rcd-alert-error"><i class="pi pi-exclamation-triangle" /> {{ editCtxError }}</div>
        <div class="form-actions">
          <Button label="Batal" severity="secondary" type="button" :disabled="editCtxLoading" @click="showEditCtx = false" />
          <Button label="Simpan" type="submit" :loading="editCtxLoading" />
        </div>
      </form>
    </Dialog>

    <!-- ─── Activate Dialog ──────────────────────────────────────────────────── -->
    <Dialog v-model:visible="showActivate" modal header="Aktifkan Konteks" :style="{ width: '400px' }">
      <div class="del-body">
        <div class="act-icon-wrap"><i class="pi pi-check-circle" /></div>
        <p class="del-text">Aktifkan konteks <strong>{{ context?.name }}</strong>?</p>
        <p class="del-warn">Konteks aktif lain di framework ini akan dinonaktifkan secara otomatis.</p>
        <div v-if="activateError" class="rcd-alert-error"><i class="pi pi-exclamation-triangle" /> {{ activateError }}</div>
      </div>
      <template #footer>
        <Button label="Batal" severity="secondary" :disabled="activateLoading" @click="showActivate = false" />
        <Button label="Aktifkan" :loading="activateLoading" @click="submitActivate" />
      </template>
    </Dialog>

    <!-- ─── Deactivate Dialog ────────────────────────────────────────────────── -->
    <Dialog v-model:visible="showDeactivate" modal header="Nonaktifkan Konteks" :style="{ width: '400px' }">
      <div class="del-body">
        <div class="deact-icon-wrap"><i class="pi pi-pause-circle" /></div>
        <p class="del-text">Nonaktifkan konteks <strong>{{ context?.name }}</strong>?</p>
        <p class="del-warn">Konteks tidak akan dapat digunakan untuk penilaian risiko sampai diaktifkan kembali.</p>
        <div v-if="deactivateError" class="rcd-alert-error"><i class="pi pi-exclamation-triangle" /> {{ deactivateError }}</div>
      </div>
      <template #footer>
        <Button label="Batal" severity="secondary" :disabled="deactivateLoading" @click="showDeactivate = false" />
        <Button label="Nonaktifkan" severity="warn" :loading="deactivateLoading" @click="submitDeactivate" />
      </template>
    </Dialog>

    <!-- ─── Category Dialogs ─────────────────────────────────────────────────── -->
    <Dialog v-model:visible="showCategoryForm" modal :header="categoryFormTitle" :style="{ width: '480px' }">
      <form class="rcd-form" @submit.prevent="submitCategory">
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Nama <span class="req">*</span></label>
            <input v-model="categoryForm.name" class="rcd-input" :class="{ 'is-error': categoryErrors.name }" type="text" />
            <span v-if="categoryErrors.name" class="form-err">{{ categoryErrors.name }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">Kode <span class="form-opt">(opsional)</span></label>
            <input v-model="categoryForm.code" class="rcd-input" type="text" />
          </div>
        </div>
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Urutan</label>
            <input v-model.number="categoryForm.order" class="rcd-input" type="number" min="0" />
          </div>
          <div class="form-group">
            <label class="form-label">Warna <span class="form-opt">(opsional)</span></label>
            <div style="display:flex;gap:8px;align-items:center">
              <input v-model="categoryForm.color" class="rcd-input" type="text" placeholder="#RRGGBB" />
              <input v-if="categoryForm.color" v-model="categoryForm.color" type="color" style="width:36px;height:36px;border:none;background:none;cursor:pointer" />
            </div>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Deskripsi <span class="form-opt">(opsional)</span></label>
          <textarea v-model="categoryForm.description" class="rcd-input rcd-textarea" rows="2" />
        </div>
        <div v-if="categoryApiError" class="rcd-alert-error"><i class="pi pi-exclamation-triangle" /> {{ categoryApiError }}</div>
        <div class="form-actions">
          <Button label="Batal" severity="secondary" type="button" :disabled="categoryLoading" @click="showCategoryForm = false" />
          <Button label="Simpan" type="submit" :loading="categoryLoading" />
        </div>
      </form>
    </Dialog>

    <Dialog v-model:visible="showDeleteCategory" modal header="Hapus Kategori" :style="{ width: '380px' }">
      <div class="del-body">
        <div class="del-icon-wrap"><i class="pi pi-exclamation-triangle" /></div>
        <p class="del-text">Hapus kategori <strong>{{ deleteCategoryTarget?.name }}</strong>?</p>
        <div v-if="deleteCategoryError" class="rcd-alert-error"><i class="pi pi-exclamation-triangle" /> {{ deleteCategoryError }}</div>
      </div>
      <template #footer>
        <Button label="Batal" severity="secondary" :disabled="deleteCategoryLoading" @click="showDeleteCategory = false" />
        <Button label="Hapus" severity="danger" :loading="deleteCategoryLoading" @click="submitDeleteCategory" />
      </template>
    </Dialog>

    <!-- ─── Likelihood Dialogs ───────────────────────────────────────────────── -->
    <Dialog v-model:visible="showLikelihoodForm" modal :header="likelihoodFormTitle" :style="{ width: '480px' }">
      <form class="rcd-form" @submit.prevent="submitLikelihood">
        <div class="form-group">
          <label class="form-label">Level <span class="req">*</span></label>
          <input v-model.number="likelihoodForm.level" class="rcd-input" :class="{ 'is-error': likelihoodErrors.level }" type="number" min="1" :max="context?.matrixRows" :disabled="!!likelihoodEditTarget" />
          <span v-if="likelihoodErrors.level" class="form-err">{{ likelihoodErrors.level }}</span>
        </div>
        <div class="form-group">
          <label class="form-label">Nama <span class="req">*</span></label>
          <input v-model="likelihoodForm.name" class="rcd-input" :class="{ 'is-error': likelihoodErrors.name }" type="text" />
          <span v-if="likelihoodErrors.name" class="form-err">{{ likelihoodErrors.name }}</span>
        </div>
        <div class="form-group">
          <label class="form-label">Deskripsi <span class="form-opt">(opsional)</span></label>
          <textarea v-model="likelihoodForm.description" class="rcd-input rcd-textarea" rows="2" />
        </div>
        <div v-if="likelihoodApiError" class="rcd-alert-error"><i class="pi pi-exclamation-triangle" /> {{ likelihoodApiError }}</div>
        <div class="form-actions">
          <Button label="Batal" severity="secondary" type="button" :disabled="likelihoodLoading" @click="showLikelihoodForm = false" />
          <Button label="Simpan" type="submit" :loading="likelihoodLoading" />
        </div>
      </form>
    </Dialog>

    <Dialog v-model:visible="showDeleteLikelihood" modal header="Hapus Kriteria Kemungkinan" :style="{ width: '380px' }">
      <div class="del-body">
        <div class="del-icon-wrap"><i class="pi pi-exclamation-triangle" /></div>
        <p class="del-text">Hapus kriteria <strong>{{ deleteLikelihoodTarget?.name }}</strong>?</p>
        <div v-if="deleteLikelihoodError" class="rcd-alert-error"><i class="pi pi-exclamation-triangle" /> {{ deleteLikelihoodError }}</div>
      </div>
      <template #footer>
        <Button label="Batal" severity="secondary" :disabled="deleteLikelihoodLoading" @click="showDeleteLikelihood = false" />
        <Button label="Hapus" severity="danger" :loading="deleteLikelihoodLoading" @click="submitDeleteLikelihood" />
      </template>
    </Dialog>

    <!-- ─── Impact Area Dialogs ──────────────────────────────────────────────── -->
    <Dialog v-model:visible="showImpactAreaForm" modal :header="impactAreaFormTitle" :style="{ width: '480px' }">
      <form class="rcd-form" @submit.prevent="submitImpactArea">
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Nama <span class="req">*</span></label>
            <input v-model="impactAreaForm.name" class="rcd-input" :class="{ 'is-error': impactAreaErrors.name }" type="text" />
            <span v-if="impactAreaErrors.name" class="form-err">{{ impactAreaErrors.name }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">Urutan</label>
            <input v-model.number="impactAreaForm.order" class="rcd-input" type="number" min="0" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Deskripsi <span class="form-opt">(opsional)</span></label>
          <textarea v-model="impactAreaForm.description" class="rcd-input rcd-textarea" rows="2" />
        </div>
        <div v-if="impactAreaApiError" class="rcd-alert-error"><i class="pi pi-exclamation-triangle" /> {{ impactAreaApiError }}</div>
        <div class="form-actions">
          <Button label="Batal" severity="secondary" type="button" :disabled="impactAreaLoading" @click="showImpactAreaForm = false" />
          <Button label="Simpan" type="submit" :loading="impactAreaLoading" />
        </div>
      </form>
    </Dialog>

    <Dialog v-model:visible="showDeleteImpactArea" modal header="Hapus Area Dampak" :style="{ width: '380px' }">
      <div class="del-body">
        <div class="del-icon-wrap"><i class="pi pi-exclamation-triangle" /></div>
        <p class="del-text">Hapus area dampak <strong>{{ deleteImpactAreaTarget?.name }}</strong>?</p>
        <p class="del-warn">Semua kriteria dampak dan kriteria kemungkinan di dalam area ini akan ikut terhapus.</p>
        <div v-if="deleteImpactAreaError" class="rcd-alert-error"><i class="pi pi-exclamation-triangle" /> {{ deleteImpactAreaError }}</div>
      </div>
      <template #footer>
        <Button label="Batal" severity="secondary" :disabled="deleteImpactAreaLoading" @click="showDeleteImpactArea = false" />
        <Button label="Hapus" severity="danger" :loading="deleteImpactAreaLoading" @click="submitDeleteImpactArea" />
      </template>
    </Dialog>

    <!-- ─── Impact Criteria Dialogs ──────────────────────────────────────────── -->
    <Dialog v-model:visible="showImpactCriteriaForm" modal :header="impactCriteriaFormTitle" :style="{ width: '480px' }">
      <form class="rcd-form" @submit.prevent="submitImpactCriteria">
        <div class="form-group">
          <label class="form-label">Level <span class="req">*</span></label>
          <input v-model.number="impactCriteriaForm.level" class="rcd-input" :class="{ 'is-error': impactCriteriaErrors.level }" type="number" min="1" :max="context?.matrixCols" :disabled="!!impactCriteriaEditTarget" />
          <span v-if="impactCriteriaErrors.level" class="form-err">{{ impactCriteriaErrors.level }}</span>
        </div>
        <div class="form-group">
          <label class="form-label">Nama <span class="req">*</span></label>
          <input v-model="impactCriteriaForm.name" class="rcd-input" :class="{ 'is-error': impactCriteriaErrors.name }" type="text" />
          <span v-if="impactCriteriaErrors.name" class="form-err">{{ impactCriteriaErrors.name }}</span>
        </div>
        <div class="form-group">
          <label class="form-label">Deskripsi <span class="form-opt">(opsional)</span></label>
          <textarea v-model="impactCriteriaForm.description" class="rcd-input rcd-textarea" rows="2" />
        </div>
        <div v-if="impactCriteriaApiError" class="rcd-alert-error"><i class="pi pi-exclamation-triangle" /> {{ impactCriteriaApiError }}</div>
        <div class="form-actions">
          <Button label="Batal" severity="secondary" type="button" :disabled="impactCriteriaLoading" @click="showImpactCriteriaForm = false" />
          <Button label="Simpan" type="submit" :loading="impactCriteriaLoading" />
        </div>
      </form>
    </Dialog>

    <Dialog v-model:visible="showDeleteImpactCriteria" modal header="Hapus Kriteria Dampak" :style="{ width: '380px' }">
      <div class="del-body">
        <div class="del-icon-wrap"><i class="pi pi-exclamation-triangle" /></div>
        <p class="del-text">Hapus kriteria <strong>{{ deleteImpactCriteriaTarget?.name }}</strong>?</p>
        <div v-if="deleteImpactCriteriaError" class="rcd-alert-error"><i class="pi pi-exclamation-triangle" /> {{ deleteImpactCriteriaError }}</div>
      </div>
      <template #footer>
        <Button label="Batal" severity="secondary" :disabled="deleteImpactCriteriaLoading" @click="showDeleteImpactCriteria = false" />
        <Button label="Hapus" severity="danger" :loading="deleteImpactCriteriaLoading" @click="submitDeleteImpactCriteria" />
      </template>
    </Dialog>

    <!-- ─── Treatment Option Dialogs ─────────────────────────────────────────── -->
    <Dialog v-model:visible="showTreatmentForm" modal :header="treatmentFormTitle" :style="{ width: '480px' }">
      <form class="rcd-form" @submit.prevent="submitTreatment">
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Nama <span class="req">*</span></label>
            <input v-model="treatmentForm.name" class="rcd-input" :class="{ 'is-error': treatmentErrors.name }" type="text" />
            <span v-if="treatmentErrors.name" class="form-err">{{ treatmentErrors.name }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">Urutan</label>
            <input v-model.number="treatmentForm.order" class="rcd-input" type="number" min="0" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Deskripsi <span class="form-opt">(opsional)</span></label>
          <textarea v-model="treatmentForm.description" class="rcd-input rcd-textarea" rows="2" />
        </div>
        <div class="form-group">
          <label class="rcd-checkbox-label">
            <input v-model="treatmentForm.isAcceptance" type="checkbox" class="rcd-checkbox" />
            <span>Tandai sebagai opsi <strong>Penerimaan Risiko</strong></span>
          </label>
          <p class="rcd-field-hint">
            Jika dicentang, opsi ini hanya tersedia untuk risiko yang berada <em>dalam</em> selera risiko (skor ≤ threshold). Risiko di atas selera risiko tidak dapat menggunakan opsi ini.
          </p>
        </div>
        <div v-if="treatmentApiError" class="rcd-alert-error"><i class="pi pi-exclamation-triangle" /> {{ treatmentApiError }}</div>
        <div class="form-actions">
          <Button label="Batal" severity="secondary" type="button" :disabled="treatmentLoading" @click="showTreatmentForm = false" />
          <Button label="Simpan" type="submit" :loading="treatmentLoading" />
        </div>
      </form>
    </Dialog>

    <Dialog v-model:visible="showDeleteTreatment" modal header="Hapus Opsi Penanganan" :style="{ width: '380px' }">
      <div class="del-body">
        <div class="del-icon-wrap"><i class="pi pi-exclamation-triangle" /></div>
        <p class="del-text">Hapus opsi <strong>{{ deleteTreatmentTarget?.name }}</strong>?</p>
        <div v-if="deleteTreatmentError" class="rcd-alert-error"><i class="pi pi-exclamation-triangle" /> {{ deleteTreatmentError }}</div>
      </div>
      <template #footer>
        <Button label="Batal" severity="secondary" :disabled="deleteTreatmentLoading" @click="showDeleteTreatment = false" />
        <Button label="Hapus" severity="danger" :loading="deleteTreatmentLoading" @click="submitDeleteTreatment" />
      </template>
    </Dialog>

    <!-- ─── Risk Level Dialogs ───────────────────────────────────────────────── -->
    <Dialog v-model:visible="showRiskLevelForm" modal :header="riskLevelFormTitle" :style="{ width: '500px' }">
      <form class="rcd-form" @submit.prevent="submitRiskLevel">
        <div class="form-group">
          <label class="form-label">Nama Level <span class="req">*</span></label>
          <input v-model="riskLevelForm.name" class="rcd-input" :class="{ 'is-error': riskLevelErrors.name }" type="text" placeholder="mis. Rendah, Sedang, Tinggi, Kritikal" />
          <span v-if="riskLevelErrors.name" class="form-err">{{ riskLevelErrors.name }}</span>
        </div>
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Skor Minimum <span class="req">*</span></label>
            <input v-model.number="riskLevelForm.minScore" class="rcd-input" :class="{ 'is-error': riskLevelErrors.score }" type="number" min="0" />
          </div>
          <div class="form-group">
            <label class="form-label">Skor Maksimum <span class="req">*</span></label>
            <input v-model.number="riskLevelForm.maxScore" class="rcd-input" :class="{ 'is-error': riskLevelErrors.score }" type="number" min="0" />
            <span v-if="riskLevelErrors.score" class="form-err">{{ riskLevelErrors.score }}</span>
          </div>
        </div>
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Urutan</label>
            <input v-model.number="riskLevelForm.order" class="rcd-input" type="number" min="0" />
          </div>
          <div class="form-group">
            <label class="form-label">Warna</label>
            <div style="display:flex;gap:8px;align-items:center">
              <input v-model="riskLevelForm.color" class="rcd-input" type="text" placeholder="#22c55e" />
              <input v-model="riskLevelForm.color" type="color" style="width:36px;height:36px;border:none;background:none;cursor:pointer;border-radius:4px" />
            </div>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Deskripsi <span class="form-opt">(opsional)</span></label>
          <textarea v-model="riskLevelForm.description" class="rcd-input rcd-textarea" rows="2" />
        </div>
        <!-- Preview -->
        <div v-if="riskLevelForm.name" class="rl-form-preview" :style="{ background: riskLevelForm.color + '22', borderColor: riskLevelForm.color + '55', color: riskLevelForm.color }">
          <i class="pi pi-circle-fill" style="font-size:10px" />
          {{ riskLevelForm.name }}
          <span style="font-size:11px;opacity:0.7">· skor {{ riskLevelForm.minScore }}–{{ riskLevelForm.maxScore }}</span>
        </div>
        <div v-if="riskLevelApiError" class="rcd-alert-error"><i class="pi pi-exclamation-triangle" /> {{ riskLevelApiError }}</div>
        <div class="form-actions">
          <Button label="Batal" severity="secondary" type="button" :disabled="riskLevelLoading" @click="showRiskLevelForm = false" />
          <Button label="Simpan" type="submit" :loading="riskLevelLoading" />
        </div>
      </form>
    </Dialog>

    <Dialog v-model:visible="showDeleteRiskLevel" modal header="Hapus Level Risiko" :style="{ width: '380px' }">
      <div class="del-body">
        <div class="del-icon-wrap"><i class="pi pi-exclamation-triangle" /></div>
        <p class="del-text">Hapus level <strong>{{ deleteRiskLevelTarget?.name }}</strong>?</p>
        <div v-if="deleteRiskLevelError" class="rcd-alert-error"><i class="pi pi-exclamation-triangle" /> {{ deleteRiskLevelError }}</div>
      </div>
      <template #footer>
        <Button label="Batal" severity="secondary" :disabled="deleteRiskLevelLoading" @click="showDeleteRiskLevel = false" />
        <Button label="Hapus" severity="danger" :loading="deleteRiskLevelLoading" @click="submitDeleteRiskLevel" />
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
  type RiskContextDetail,
  type RiskLevel,
  type RiskCategory,
  type LikelihoodCriteria,
  type ImpactArea,
  type ImpactCriteria,
  type TreatmentOption,
} from '@/api/riskContext'
import { extractApiError } from '@/utils/apiError'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const auth = useAuthStore()
const canWrite = computed(() =>
  auth.user?.roles.some(r => ['ADMINISTRATOR', 'KOMITE_PUSAT'].includes(r)) ?? false
)
const canModify = computed(() =>
  canWrite.value && context.value?.status !== 'ACTIVE'
)

const contextId = route.params.contextId as string

// ─── Load context ─────────────────────────────────────────────────────────────

const context = ref<RiskContextDetail | null>(null)
const loading = ref(false)
const loadError = ref('')

async function loadContext() {
  loading.value = true
  loadError.value = ''
  try {
    const res = await riskContextApi.getById(contextId)
    context.value = res.data.data
    initMatrix()
  } catch (err: any) {
    loadError.value = extractApiError(err, 'Gagal memuat data konteks risiko.')
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.back()
}

// ─── Computed helpers ─────────────────────────────────────────────────────────

const totalLikelihoodCount = computed(() =>
  context.value?.impactAreas.reduce((s, a) => s + a.likelihoodCriteria.length, 0) ?? 0
)

// ─── Overview: matrix & appetite helpers ─────────────────────────────────────

const ovCellMap = computed(() => {
  const map = new Map<string, { value: number; label: string | null; color: string | null }>()
  if (!context.value) return map
  for (const cell of context.value.matrixCells) {
    map.set(`${cell.row}-${cell.col}`, { value: cell.value, label: cell.label ?? null, color: cell.color ?? null })
  }
  return map
})

const ovAppetiteLevel = computed(() => {
  if (!context.value?.riskAppetiteLevel) return null
  return context.value.riskLevels.find((l) => l.name === context.value!.riskAppetiteLevel) ?? null
})

function ovGetCell(r: number, c: number) {
  return ovCellMap.value.get(`${r}-${c}`) ?? null
}

function ovCellMatchesAppetite(r: number, c: number): boolean {
  const cell = ovGetCell(r, c)
  if (!cell || !context.value?.riskAppetiteLevel) return false
  return matchingRiskLevel(cell.value)?.name === context.value.riskAppetiteLevel
}

function ovCellAboveAppetite(r: number, c: number): boolean {
  const cell = ovGetCell(r, c)
  if (!cell || !ovAppetiteLevel.value || !cell.value) return false
  return cell.value > ovAppetiteLevel.value.maxScore
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const activeTab = ref('overview')

const tabs = computed(() => {
  if (!context.value) return []
  const totalLikelihood = context.value.impactAreas.reduce((s, a) => s + a.likelihoodCriteria.length, 0)
  const totalImpactCriteria = context.value.impactAreas.reduce((s, a) => s + a.impactCriteria.length, 0)
  return [
    { key: 'overview', label: 'Ikhtisar' },
    { key: 'riskLevels', label: 'Level Risiko', count: context.value.riskLevels.length },
    { key: 'categories', label: 'Kategori Risiko', count: context.value.riskCategories.length },
    { key: 'impact', label: 'Area Dampak & Kriteria', count: context.value.impactAreas.length, subCount: totalImpactCriteria + totalLikelihood },
    { key: 'treatment', label: 'Opsi Penanganan', count: context.value.treatmentOptions.length },
    { key: 'matrix', label: 'Matriks', count: context.value.matrixCells.length },
  ]
})

// ─── Edit Context ─────────────────────────────────────────────────────────────

const showEditCtx = ref(false)
const editCtxLoading = ref(false)
const editCtxError = ref('')
const editCtxForm = reactive({ periodStart: 2025, periodEnd: 2025, matrixRows: 5, matrixCols: 5, description: '', riskAppetiteLevel: '', riskAppetiteDescription: '' })
const editCtxErrors = reactive({ periodEnd: '', matrixRows: '', matrixCols: '' })

function openEditContext() {
  if (!context.value) return
  editCtxForm.periodStart = context.value.periodStart
  editCtxForm.periodEnd = context.value.periodEnd
  editCtxForm.matrixRows = context.value.matrixRows
  editCtxForm.matrixCols = context.value.matrixCols
  editCtxForm.description = context.value.description ?? ''
  editCtxForm.riskAppetiteLevel = context.value.riskAppetiteLevel ?? ''
  editCtxForm.riskAppetiteDescription = context.value.riskAppetiteDescription ?? ''
  Object.assign(editCtxErrors, { periodEnd: '', matrixRows: '', matrixCols: '' })
  editCtxError.value = ''
  showEditCtx.value = true
}

async function submitEditContext() {
  editCtxErrors.periodEnd = ''
  editCtxErrors.matrixRows = ''
  editCtxErrors.matrixCols = ''
  let valid = true
  if (editCtxForm.periodEnd < editCtxForm.periodStart) { editCtxErrors.periodEnd = 'Periode akhir tidak boleh sebelum periode awal'; valid = false }
  if (!editCtxForm.matrixRows || editCtxForm.matrixRows < 1) { editCtxErrors.matrixRows = 'Dimensi baris minimal 1'; valid = false }
  if (!editCtxForm.matrixCols || editCtxForm.matrixCols < 1) { editCtxErrors.matrixCols = 'Dimensi kolom minimal 1'; valid = false }
  if (!valid) return

  editCtxLoading.value = true
  editCtxError.value = ''
  try {
    await riskContextApi.update(contextId, {
      periodStart: editCtxForm.periodStart,
      periodEnd: editCtxForm.periodEnd,
      matrixRows: editCtxForm.matrixRows,
      matrixCols: editCtxForm.matrixCols,
      description: editCtxForm.description.trim() || undefined,
      riskAppetiteLevel: editCtxForm.riskAppetiteLevel || undefined,
      riskAppetiteDescription: editCtxForm.riskAppetiteDescription.trim() || undefined,
    })
    showEditCtx.value = false
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Konteks risiko diperbarui', life: 3000 })
    loadContext()
  } catch (err: any) {
    editCtxError.value = extractApiError(err, 'Gagal memperbarui konteks.')
  } finally {
    editCtxLoading.value = false
  }
}

// ─── Activate ─────────────────────────────────────────────────────────────────

const showActivate = ref(false)
const activateLoading = ref(false)
const activateError = ref('')

function openActivate() { activateError.value = ''; showActivate.value = true }

async function submitActivate() {
  activateLoading.value = true
  activateError.value = ''
  try {
    await riskContextApi.activate(contextId)
    showActivate.value = false
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Konteks risiko diaktifkan', life: 3000 })
    loadContext()
  } catch (err: any) {
    activateError.value = extractApiError(err, 'Gagal mengaktifkan konteks.')
  } finally {
    activateLoading.value = false
  }
}

// ─── Deactivate ───────────────────────────────────────────────────────────────

const showDeactivate = ref(false)
const deactivateLoading = ref(false)
const deactivateError = ref('')

function openDeactivate() { deactivateError.value = ''; showDeactivate.value = true }

async function submitDeactivate() {
  deactivateLoading.value = true
  deactivateError.value = ''
  try {
    await riskContextApi.deactivate(contextId)
    showDeactivate.value = false
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Konteks risiko dinonaktifkan', life: 3000 })
    loadContext()
  } catch (err: any) {
    deactivateError.value = extractApiError(err, 'Gagal menonaktifkan konteks.')
  } finally {
    deactivateLoading.value = false
  }
}

// ─── Categories ───────────────────────────────────────────────────────────────

const showCategoryForm = ref(false)
const categoryLoading = ref(false)
const categoryApiError = ref('')
const categoryEditTarget = ref<RiskCategory | null>(null)
const categoryFormTitle = computed(() => categoryEditTarget.value ? 'Edit Kategori Risiko' : 'Tambah Kategori Risiko')
const categoryForm = reactive({ name: '', code: '', color: '', description: '', order: 0 })
const categoryErrors = reactive({ name: '' })

function openCreateCategory() {
  categoryEditTarget.value = null
  Object.assign(categoryForm, { name: '', code: '', color: '', description: '', order: 0 })
  categoryErrors.name = ''
  categoryApiError.value = ''
  showCategoryForm.value = true
}

function openEditCategory(cat: RiskCategory) {
  categoryEditTarget.value = cat
  Object.assign(categoryForm, { name: cat.name, code: cat.code ?? '', color: cat.color ?? '', description: cat.description ?? '', order: cat.order })
  categoryErrors.name = ''
  categoryApiError.value = ''
  showCategoryForm.value = true
}

async function submitCategory() {
  categoryErrors.name = ''
  if (!categoryForm.name.trim()) { categoryErrors.name = 'Nama wajib diisi'; return }
  categoryLoading.value = true
  categoryApiError.value = ''
  try {
    const payload = {
      name: categoryForm.name.trim(),
      code: categoryForm.code.trim() || undefined,
      color: categoryForm.color.trim() || undefined,
      description: categoryForm.description.trim() || undefined,
      order: categoryForm.order,
    }
    if (categoryEditTarget.value) {
      await riskContextApi.updateCategory(contextId, categoryEditTarget.value.id, payload)
    } else {
      await riskContextApi.createCategory(contextId, payload)
    }
    showCategoryForm.value = false
    toast.add({ severity: 'success', summary: 'Berhasil', detail: `Kategori berhasil ${categoryEditTarget.value ? 'diperbarui' : 'ditambahkan'}`, life: 3000 })
    loadContext()
  } catch (err: any) {
    categoryApiError.value = extractApiError(err, 'Gagal menyimpan kategori.')
  } finally {
    categoryLoading.value = false
  }
}

const showDeleteCategory = ref(false)
const deleteCategoryLoading = ref(false)
const deleteCategoryError = ref('')
const deleteCategoryTarget = ref<RiskCategory | null>(null)

function openDeleteCategory(cat: RiskCategory) {
  deleteCategoryTarget.value = cat
  deleteCategoryError.value = ''
  showDeleteCategory.value = true
}

async function submitDeleteCategory() {
  if (!deleteCategoryTarget.value) return
  deleteCategoryLoading.value = true
  deleteCategoryError.value = ''
  try {
    await riskContextApi.removeCategory(contextId, deleteCategoryTarget.value.id)
    showDeleteCategory.value = false
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Kategori dihapus', life: 3000 })
    loadContext()
  } catch (err: any) {
    deleteCategoryError.value = extractApiError(err, 'Gagal menghapus kategori.')
  } finally {
    deleteCategoryLoading.value = false
  }
}

// ─── Impact tab: collapsed areas ─────────────────────────────────────────────

const collapsedAreas = ref<Set<string>>(new Set())

function toggleArea(id: string) {
  const s = new Set(collapsedAreas.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  collapsedAreas.value = s
}

// ─── Impact tab: hover highlight state ───────────────────────────────────────

const hoveredImpactLevel = ref<number | null>(null)
const hoveredLikelihoodLevel = ref<number | null>(null)

// Matrix helpers for impact tab preview
const impCellMap = computed(() => {
  const map = new Map<string, { value: number; color: string | null }>()
  if (!context.value) return map
  for (const cell of context.value.matrixCells) {
    map.set(`${cell.row}-${cell.col}`, { value: cell.value, color: cell.color ?? null })
  }
  return map
})

function impGetCell(r: number, c: number) {
  return impCellMap.value.get(`${r}-${c}`) ?? null
}

function impGetCellStyle(r: number, c: number) {
  const cell = impGetCell(r, c)
  const color = matchingRiskLevel(cell?.value ?? 0)?.color ?? null
  const isColHl = hoveredImpactLevel.value === c
  const isRowHl = hoveredLikelihoodLevel.value === r
  const isBoth = isColHl && isRowHl
  if (isBoth) return { background: color ? color + '55' : 'rgba(255,255,255,0.18)', borderColor: color || 'var(--color-accent)' }
  if (color) return { background: isColHl || isRowHl ? color + '44' : color + '22', borderColor: color }
  return {}
}

function getLikelihoodNameForMatrix(level: number): string {
  // Find first area that has a likelihood criteria at this level
  for (const area of context.value?.impactAreas ?? []) {
    const lc = area.likelihoodCriteria.find((l) => l.level === level)
    if (lc) return lc.name
  }
  return ''
}

// ─── Likelihood Criteria ──────────────────────────────────────────────────────

const showLikelihoodForm = ref(false)
const likelihoodLoading = ref(false)
const likelihoodApiError = ref('')
const likelihoodAreaTarget = ref<ImpactArea | null>(null)
const likelihoodEditTarget = ref<LikelihoodCriteria | null>(null)
const likelihoodFormTitle = computed(() =>
  likelihoodEditTarget.value
    ? 'Edit Kriteria Kemungkinan'
    : `Tambah Kriteria Kemungkinan — ${likelihoodAreaTarget.value?.name}`
)
const likelihoodForm = reactive({ level: 1, name: '', description: '' })
const likelihoodErrors = reactive({ level: '', name: '' })

function openCreateLikelihood(area: ImpactArea) {
  likelihoodAreaTarget.value = area
  likelihoodEditTarget.value = null
  const nextLevel = area.likelihoodCriteria.length + 1
  Object.assign(likelihoodForm, { level: nextLevel, name: '', description: '' })
  Object.assign(likelihoodErrors, { level: '', name: '' })
  likelihoodApiError.value = ''
  showLikelihoodForm.value = true
}

function openEditLikelihood(area: ImpactArea, lc: LikelihoodCriteria) {
  likelihoodAreaTarget.value = area
  likelihoodEditTarget.value = lc
  Object.assign(likelihoodForm, { level: lc.level, name: lc.name, description: lc.description ?? '' })
  Object.assign(likelihoodErrors, { level: '', name: '' })
  likelihoodApiError.value = ''
  showLikelihoodForm.value = true
}

async function submitLikelihood() {
  Object.assign(likelihoodErrors, { level: '', name: '' })
  let valid = true
  if (!likelihoodForm.name.trim()) { likelihoodErrors.name = 'Nama wajib diisi'; valid = false }
  if (!likelihoodEditTarget.value && (!likelihoodForm.level || likelihoodForm.level < 1)) { likelihoodErrors.level = 'Level minimal 1'; valid = false }
  if (!valid || !likelihoodAreaTarget.value) return

  likelihoodLoading.value = true
  likelihoodApiError.value = ''
  try {
    if (likelihoodEditTarget.value) {
      await riskContextApi.updateLikelihoodCriteria(contextId, likelihoodAreaTarget.value.id, likelihoodEditTarget.value.id, {
        name: likelihoodForm.name.trim(),
        description: likelihoodForm.description.trim() || undefined,
      })
    } else {
      await riskContextApi.createLikelihoodCriteria(contextId, likelihoodAreaTarget.value.id, {
        level: likelihoodForm.level,
        name: likelihoodForm.name.trim(),
        description: likelihoodForm.description.trim() || undefined,
      })
    }
    showLikelihoodForm.value = false
    toast.add({ severity: 'success', summary: 'Berhasil', detail: `Kriteria kemungkinan berhasil ${likelihoodEditTarget.value ? 'diperbarui' : 'ditambahkan'}`, life: 3000 })
    loadContext()
  } catch (err: any) {
    likelihoodApiError.value = extractApiError(err, 'Gagal menyimpan kriteria.')
  } finally {
    likelihoodLoading.value = false
  }
}

const showDeleteLikelihood = ref(false)
const deleteLikelihoodLoading = ref(false)
const deleteLikelihoodError = ref('')
const deleteLikelihoodAreaTarget = ref<ImpactArea | null>(null)
const deleteLikelihoodTarget = ref<LikelihoodCriteria | null>(null)

function openDeleteLikelihood(area: ImpactArea, lc: LikelihoodCriteria) {
  deleteLikelihoodAreaTarget.value = area
  deleteLikelihoodTarget.value = lc
  deleteLikelihoodError.value = ''
  showDeleteLikelihood.value = true
}

async function submitDeleteLikelihood() {
  if (!deleteLikelihoodAreaTarget.value || !deleteLikelihoodTarget.value) return
  deleteLikelihoodLoading.value = true
  deleteLikelihoodError.value = ''
  try {
    await riskContextApi.removeLikelihoodCriteria(contextId, deleteLikelihoodAreaTarget.value.id, deleteLikelihoodTarget.value.id)
    showDeleteLikelihood.value = false
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Kriteria kemungkinan dihapus', life: 3000 })
    loadContext()
  } catch (err: any) {
    deleteLikelihoodError.value = extractApiError(err, 'Gagal menghapus kriteria.')
  } finally {
    deleteLikelihoodLoading.value = false
  }
}

// ─── Impact Areas ─────────────────────────────────────────────────────────────

const showImpactAreaForm = ref(false)
const impactAreaLoading = ref(false)
const impactAreaApiError = ref('')
const impactAreaEditTarget = ref<ImpactArea | null>(null)
const impactAreaFormTitle = computed(() => impactAreaEditTarget.value ? 'Edit Area Dampak' : 'Tambah Area Dampak')
const impactAreaForm = reactive({ name: '', description: '', order: 0 })
const impactAreaErrors = reactive({ name: '' })

function openCreateImpactArea() {
  impactAreaEditTarget.value = null
  Object.assign(impactAreaForm, { name: '', description: '', order: context.value?.impactAreas.length ?? 0 })
  impactAreaErrors.name = ''
  impactAreaApiError.value = ''
  showImpactAreaForm.value = true
}

function openEditImpactArea(area: ImpactArea) {
  impactAreaEditTarget.value = area
  Object.assign(impactAreaForm, { name: area.name, description: area.description ?? '', order: area.order })
  impactAreaErrors.name = ''
  impactAreaApiError.value = ''
  showImpactAreaForm.value = true
}

async function submitImpactArea() {
  impactAreaErrors.name = ''
  if (!impactAreaForm.name.trim()) { impactAreaErrors.name = 'Nama wajib diisi'; return }
  impactAreaLoading.value = true
  impactAreaApiError.value = ''
  try {
    const payload = {
      name: impactAreaForm.name.trim(),
      description: impactAreaForm.description.trim() || undefined,
      order: impactAreaForm.order,
    }
    if (impactAreaEditTarget.value) {
      await riskContextApi.updateImpactArea(contextId, impactAreaEditTarget.value.id, payload)
    } else {
      await riskContextApi.createImpactArea(contextId, payload)
    }
    showImpactAreaForm.value = false
    toast.add({ severity: 'success', summary: 'Berhasil', detail: `Area dampak berhasil ${impactAreaEditTarget.value ? 'diperbarui' : 'ditambahkan'}`, life: 3000 })
    loadContext()
  } catch (err: any) {
    impactAreaApiError.value = extractApiError(err, 'Gagal menyimpan area dampak.')
  } finally {
    impactAreaLoading.value = false
  }
}

const showDeleteImpactArea = ref(false)
const deleteImpactAreaLoading = ref(false)
const deleteImpactAreaError = ref('')
const deleteImpactAreaTarget = ref<ImpactArea | null>(null)

function openDeleteImpactArea(area: ImpactArea) {
  deleteImpactAreaTarget.value = area
  deleteImpactAreaError.value = ''
  showDeleteImpactArea.value = true
}

async function submitDeleteImpactArea() {
  if (!deleteImpactAreaTarget.value) return
  deleteImpactAreaLoading.value = true
  deleteImpactAreaError.value = ''
  try {
    await riskContextApi.removeImpactArea(contextId, deleteImpactAreaTarget.value.id)
    showDeleteImpactArea.value = false
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Area dampak dihapus', life: 3000 })
    loadContext()
  } catch (err: any) {
    deleteImpactAreaError.value = extractApiError(err, 'Gagal menghapus area dampak.')
  } finally {
    deleteImpactAreaLoading.value = false
  }
}

// ─── Impact Criteria ──────────────────────────────────────────────────────────

const showImpactCriteriaForm = ref(false)
const impactCriteriaLoading = ref(false)
const impactCriteriaApiError = ref('')
const impactCriteriaAreaTarget = ref<ImpactArea | null>(null)
const impactCriteriaEditTarget = ref<ImpactCriteria | null>(null)
const impactCriteriaFormTitle = computed(() => impactCriteriaEditTarget.value ? 'Edit Kriteria Dampak' : `Tambah Kriteria Dampak — ${impactCriteriaAreaTarget.value?.name}`)
const impactCriteriaForm = reactive({ level: 1, name: '', description: '' })
const impactCriteriaErrors = reactive({ level: '', name: '' })

function openCreateImpactCriteria(area: ImpactArea) {
  impactCriteriaAreaTarget.value = area
  impactCriteriaEditTarget.value = null
  const nextLevel = area.impactCriteria.length + 1
  Object.assign(impactCriteriaForm, { level: nextLevel, name: '', description: '' })
  Object.assign(impactCriteriaErrors, { level: '', name: '' })
  impactCriteriaApiError.value = ''
  showImpactCriteriaForm.value = true
}

function openEditImpactCriteria(area: ImpactArea, ic: ImpactCriteria) {
  impactCriteriaAreaTarget.value = area
  impactCriteriaEditTarget.value = ic
  Object.assign(impactCriteriaForm, { level: ic.level, name: ic.name, description: ic.description ?? '' })
  Object.assign(impactCriteriaErrors, { level: '', name: '' })
  impactCriteriaApiError.value = ''
  showImpactCriteriaForm.value = true
}

async function submitImpactCriteria() {
  Object.assign(impactCriteriaErrors, { level: '', name: '' })
  let valid = true
  if (!impactCriteriaForm.name.trim()) { impactCriteriaErrors.name = 'Nama wajib diisi'; valid = false }
  if (!valid) return
  if (!impactCriteriaAreaTarget.value) return

  impactCriteriaLoading.value = true
  impactCriteriaApiError.value = ''
  try {
    if (impactCriteriaEditTarget.value) {
      await riskContextApi.updateImpactCriteria(contextId, impactCriteriaAreaTarget.value.id, impactCriteriaEditTarget.value.id, {
        name: impactCriteriaForm.name.trim(),
        description: impactCriteriaForm.description.trim() || undefined,
      })
    } else {
      await riskContextApi.createImpactCriteria(contextId, impactCriteriaAreaTarget.value.id, {
        level: impactCriteriaForm.level,
        name: impactCriteriaForm.name.trim(),
        description: impactCriteriaForm.description.trim() || undefined,
      })
    }
    showImpactCriteriaForm.value = false
    toast.add({ severity: 'success', summary: 'Berhasil', detail: `Kriteria dampak berhasil ${impactCriteriaEditTarget.value ? 'diperbarui' : 'ditambahkan'}`, life: 3000 })
    loadContext()
  } catch (err: any) {
    impactCriteriaApiError.value = extractApiError(err, 'Gagal menyimpan kriteria dampak.')
  } finally {
    impactCriteriaLoading.value = false
  }
}

const showDeleteImpactCriteria = ref(false)
const deleteImpactCriteriaLoading = ref(false)
const deleteImpactCriteriaError = ref('')
const deleteImpactCriteriaAreaTarget = ref<ImpactArea | null>(null)
const deleteImpactCriteriaTarget = ref<ImpactCriteria | null>(null)

function openDeleteImpactCriteria(area: ImpactArea, ic: ImpactCriteria) {
  deleteImpactCriteriaAreaTarget.value = area
  deleteImpactCriteriaTarget.value = ic
  deleteImpactCriteriaError.value = ''
  showDeleteImpactCriteria.value = true
}

async function submitDeleteImpactCriteria() {
  if (!deleteImpactCriteriaAreaTarget.value || !deleteImpactCriteriaTarget.value) return
  deleteImpactCriteriaLoading.value = true
  deleteImpactCriteriaError.value = ''
  try {
    await riskContextApi.removeImpactCriteria(contextId, deleteImpactCriteriaAreaTarget.value.id, deleteImpactCriteriaTarget.value.id)
    showDeleteImpactCriteria.value = false
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Kriteria dampak dihapus', life: 3000 })
    loadContext()
  } catch (err: any) {
    deleteImpactCriteriaError.value = extractApiError(err, 'Gagal menghapus kriteria dampak.')
  } finally {
    deleteImpactCriteriaLoading.value = false
  }
}

// ─── Treatment Options ────────────────────────────────────────────────────────

const showTreatmentForm = ref(false)
const treatmentLoading = ref(false)
const treatmentApiError = ref('')
const treatmentEditTarget = ref<TreatmentOption | null>(null)
const treatmentFormTitle = computed(() => treatmentEditTarget.value ? 'Edit Opsi Penanganan' : 'Tambah Opsi Penanganan')
const treatmentForm = reactive({ name: '', description: '', isAcceptance: false, order: 0 })
const treatmentErrors = reactive({ name: '' })

function openCreateTreatment() {
  treatmentEditTarget.value = null
  Object.assign(treatmentForm, { name: '', description: '', isAcceptance: false, order: context.value?.treatmentOptions.length ?? 0 })
  treatmentErrors.name = ''
  treatmentApiError.value = ''
  showTreatmentForm.value = true
}

function openEditTreatment(opt: TreatmentOption) {
  treatmentEditTarget.value = opt
  Object.assign(treatmentForm, { name: opt.name, description: opt.description ?? '', isAcceptance: opt.isAcceptance, order: opt.order })
  treatmentErrors.name = ''
  treatmentApiError.value = ''
  showTreatmentForm.value = true
}

async function submitTreatment() {
  treatmentErrors.name = ''
  if (!treatmentForm.name.trim()) { treatmentErrors.name = 'Nama wajib diisi'; return }
  treatmentLoading.value = true
  treatmentApiError.value = ''
  try {
    const payload = {
      name: treatmentForm.name.trim(),
      description: treatmentForm.description.trim() || undefined,
      isAcceptance: treatmentForm.isAcceptance,
      order: treatmentForm.order,
    }
    if (treatmentEditTarget.value) {
      await riskContextApi.updateTreatmentOption(contextId, treatmentEditTarget.value.id, payload)
    } else {
      await riskContextApi.createTreatmentOption(contextId, payload)
    }
    showTreatmentForm.value = false
    toast.add({ severity: 'success', summary: 'Berhasil', detail: `Opsi penanganan berhasil ${treatmentEditTarget.value ? 'diperbarui' : 'ditambahkan'}`, life: 3000 })
    loadContext()
  } catch (err: any) {
    treatmentApiError.value = extractApiError(err, 'Gagal menyimpan opsi penanganan.')
  } finally {
    treatmentLoading.value = false
  }
}

const showDeleteTreatment = ref(false)
const deleteTreatmentLoading = ref(false)
const deleteTreatmentError = ref('')
const deleteTreatmentTarget = ref<TreatmentOption | null>(null)

function openDeleteTreatment(opt: TreatmentOption) {
  deleteTreatmentTarget.value = opt
  deleteTreatmentError.value = ''
  showDeleteTreatment.value = true
}

async function submitDeleteTreatment() {
  if (!deleteTreatmentTarget.value) return
  deleteTreatmentLoading.value = true
  deleteTreatmentError.value = ''
  try {
    await riskContextApi.removeTreatmentOption(contextId, deleteTreatmentTarget.value.id)
    showDeleteTreatment.value = false
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Opsi penanganan dihapus', life: 3000 })
    loadContext()
  } catch (err: any) {
    deleteTreatmentError.value = extractApiError(err, 'Gagal menghapus opsi penanganan.')
  } finally {
    deleteTreatmentLoading.value = false
  }
}

// ─── Matrix ───────────────────────────────────────────────────────────────────

interface EditableCell { row: number; col: number; value: number; label: string; color: string }

const matrixGrid = ref<EditableCell[][]>([])
const matrixSaving = ref(false)
const matrixSaveError = ref('')
const selectedCell = ref<EditableCell | null>(null)

const colorPresets = [
  { label: 'Sangat Rendah', value: '#22c55e' },
  { label: 'Rendah', value: '#84cc16' },
  { label: 'Sedang', value: '#eab308' },
  { label: 'Tinggi', value: '#f97316' },
  { label: 'Sangat Tinggi', value: '#ef4444' },
  { label: 'Kritis', value: '#9333ea' },
]

function selectCell(cell: EditableCell) {
  selectedCell.value = selectedCell.value === cell ? null : cell
}

function matchingRiskLevel(score: number): RiskLevel | undefined {
  return context.value?.riskLevels.find((l) => score >= l.minScore && score <= l.maxScore)
}

function applyRiskLevel(cell: EditableCell, level: RiskLevel) {
  cell.label = level.name
  cell.color = level.color || '#334155'
}

function getLikelihoodName(level: number): string {
  for (const area of context.value?.impactAreas ?? []) {
    const lc = area.likelihoodCriteria.find((l) => l.level === level)
    if (lc) return lc.name
  }
  return ''
}

function getLikelihoodDesc(level: number): string {
  for (const area of context.value?.impactAreas ?? []) {
    const lc = area.likelihoodCriteria.find((l) => l.level === level)
    if (lc?.description) return lc.description
  }
  return ''
}

function getImpactLevelHint(col: number): string {
  // Collect unique impact criteria names at this col level across all impact areas
  const names = context.value?.impactAreas
    .flatMap((a) => a.impactCriteria.filter((ic) => ic.level === col).map((ic) => ic.name))
    .filter(Boolean) ?? []
  if (names.length === 0) return ''
  // If all areas use the same name at this level, show it; otherwise just show the level
  const unique = [...new Set(names)]
  return unique.length === 1 ? unique[0] : ''
}

function getImpactLevelDesc(col: number): string {
  const descs = context.value?.impactAreas
    .flatMap((a) => a.impactCriteria.filter((ic) => ic.level === col).map((ic) => ic.description))
    .filter(Boolean) ?? []
  if (descs.length === 0) return ''
  const unique = [...new Set(descs)]
  return unique.length === 1 ? unique[0]! : ''
}

function initMatrix() {
  if (!context.value) return
  const { matrixRows, matrixCols, matrixCells } = context.value
  const grid: EditableCell[][] = []
  for (let r = 1; r <= matrixRows; r++) {
    const row: EditableCell[] = []
    for (let c = 1; c <= matrixCols; c++) {
      const cell = matrixCells.find((mc) => mc.row === r && mc.col === c)
      row.push({ row: r, col: c, value: cell?.value ?? 0, label: cell?.label ?? '', color: cell?.color ?? '#334155' })
    }
    grid.push(row)
  }
  matrixGrid.value = grid
}

async function saveMatrix() {
  if (!context.value) return
  matrixSaving.value = true
  matrixSaveError.value = ''
  try {
    const cells = matrixGrid.value.flat().map((c) => ({
      row: c.row,
      col: c.col,
      value: c.value,
      label: c.label.trim() || undefined,
      color: c.color || undefined,
    }))
    await riskContextApi.setMatrix(contextId, { cells })
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Matriks risiko berhasil disimpan', life: 3000 })
    loadContext()
  } catch (err: any) {
    matrixSaveError.value = extractApiError(err, 'Gagal menyimpan matriks.')
  } finally {
    matrixSaving.value = false
  }
}

// ─── Risk Levels ──────────────────────────────────────────────────────────────

const showRiskLevelForm = ref(false)
const riskLevelLoading = ref(false)
const riskLevelApiError = ref('')
const riskLevelEditTarget = ref<RiskLevel | null>(null)
const riskLevelFormTitle = computed(() => riskLevelEditTarget.value ? 'Edit Level Risiko' : 'Tambah Level Risiko')
const riskLevelForm = reactive({ name: '', description: '', minScore: 0, maxScore: 10, color: '#22c55e', order: 0 })
const riskLevelErrors = reactive({ name: '', score: '' })

function openCreateRiskLevel() {
  riskLevelEditTarget.value = null
  const existing = context.value?.riskLevels ?? []
  const nextOrder = existing.length + 1
  const lastMax = existing.length > 0 ? Math.max(...existing.map((l) => l.maxScore)) : -1
  Object.assign(riskLevelForm, { name: '', description: '', minScore: lastMax + 1, maxScore: lastMax + 5, color: '#22c55e', order: nextOrder })
  Object.assign(riskLevelErrors, { name: '', score: '' })
  riskLevelApiError.value = ''
  showRiskLevelForm.value = true
}

function openEditRiskLevel(lvl: RiskLevel) {
  riskLevelEditTarget.value = lvl
  Object.assign(riskLevelForm, { name: lvl.name, description: lvl.description ?? '', minScore: lvl.minScore, maxScore: lvl.maxScore, color: lvl.color ?? '#22c55e', order: lvl.order })
  Object.assign(riskLevelErrors, { name: '', score: '' })
  riskLevelApiError.value = ''
  showRiskLevelForm.value = true
}

async function submitRiskLevel() {
  Object.assign(riskLevelErrors, { name: '', score: '' })
  let valid = true
  if (!riskLevelForm.name.trim()) { riskLevelErrors.name = 'Nama wajib diisi'; valid = false }
  if (riskLevelForm.maxScore < riskLevelForm.minScore) { riskLevelErrors.score = 'Skor maks tidak boleh < skor min'; valid = false }
  if (!valid) return

  riskLevelLoading.value = true
  riskLevelApiError.value = ''
  try {
    const payload = {
      name: riskLevelForm.name.trim(),
      description: riskLevelForm.description.trim() || undefined,
      minScore: riskLevelForm.minScore,
      maxScore: riskLevelForm.maxScore,
      color: riskLevelForm.color || undefined,
      order: riskLevelForm.order,
    }
    if (riskLevelEditTarget.value) {
      await riskContextApi.updateRiskLevel(contextId, riskLevelEditTarget.value.id, payload)
    } else {
      await riskContextApi.createRiskLevel(contextId, payload)
    }
    showRiskLevelForm.value = false
    toast.add({ severity: 'success', summary: 'Berhasil', detail: `Level risiko berhasil ${riskLevelEditTarget.value ? 'diperbarui' : 'ditambahkan'}`, life: 3000 })
    loadContext()
  } catch (err: any) {
    riskLevelApiError.value = extractApiError(err, 'Gagal menyimpan level risiko.')
  } finally {
    riskLevelLoading.value = false
  }
}

const showDeleteRiskLevel = ref(false)
const deleteRiskLevelLoading = ref(false)
const deleteRiskLevelError = ref('')
const deleteRiskLevelTarget = ref<RiskLevel | null>(null)

function openDeleteRiskLevel(lvl: RiskLevel) {
  deleteRiskLevelTarget.value = lvl
  deleteRiskLevelError.value = ''
  showDeleteRiskLevel.value = true
}

async function submitDeleteRiskLevel() {
  if (!deleteRiskLevelTarget.value) return
  deleteRiskLevelLoading.value = true
  deleteRiskLevelError.value = ''
  try {
    await riskContextApi.removeRiskLevel(contextId, deleteRiskLevelTarget.value.id)
    showDeleteRiskLevel.value = false
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Level risiko dihapus', life: 3000 })
    loadContext()
  } catch (err: any) {
    deleteRiskLevelError.value = extractApiError(err, 'Gagal menghapus level risiko.')
  } finally {
    deleteRiskLevelLoading.value = false
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

onMounted(loadContext)
</script>

<style scoped>
.rcd-page {
  padding: 2rem;
  max-width: 1280px;
  margin: 0 auto;
}

/* ─── Header ──────────────────────────────────────────────────────────────── */

.rcd-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.75rem;
  gap: 1rem;
}

.rcd-header-left {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.rcd-back-btn {
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

.rcd-back-btn:hover { border-color: var(--color-accent); color: var(--color-accent); }

.rcd-breadcrumb {
  font-size: 11px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 4px;
}

.rcd-title {
  font-family: var(--font-display);
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-text);
  margin: 0 0 0.5rem;
}

.rcd-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.rcd-code {
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

.rcd-type, .rcd-period, .rcd-matrix-size {
  font-size: 11px;
  color: var(--color-text-muted);
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  padding: 1px 7px;
  border-radius: var(--radius-sm);
}

.rcd-status {
  font-size: 10px;
  font-weight: 500;
  padding: 1px 7px;
  border-radius: 100px;
}

.cs-active { background: rgba(0, 229, 184, 0.1); color: var(--color-accent); border: 1px solid rgba(0, 229, 184, 0.2); }
.cs-inactive { background: rgba(100, 116, 139, 0.1); color: #94a3b8; border: 1px solid rgba(100, 116, 139, 0.2); }
.cs-archived { background: var(--color-bg-input); color: var(--color-text-muted); border: 1px solid var(--color-border); }

.rcd-header-actions { display: flex; gap: 8px; flex-shrink: 0; }

.rcd-activate-btn {
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
}

.rcd-activate-btn:hover { background: rgba(0, 229, 184, 0.18); }

.rcd-deactivate-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: rgba(234, 179, 8, 0.1);
  border: 1px solid rgba(234, 179, 8, 0.25);
  border-radius: var(--radius-sm);
  color: #eab308;
  font-size: 12px;
  font-family: var(--font-body);
  cursor: pointer;
  transition: all 0.15s;
}

.rcd-deactivate-btn:hover { background: rgba(234, 179, 8, 0.18); }

.rcd-edit-btn {
  display: flex;
  align-items: center;
  gap: 6px;
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

.rcd-edit-btn:hover { border-color: var(--color-accent); color: var(--color-accent); }

/* ─── Tabs ────────────────────────────────────────────────────────────────── */

.rcd-tabs {
  display: flex;
  gap: 2px;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 1.5rem;
  overflow-x: auto;
}

.rcd-tab {
  padding: 8px 16px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--color-text-dim);
  font-size: 12px;
  font-family: var(--font-body);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: -1px;
}

.rcd-tab:hover { color: var(--color-text); }

.rcd-tab.tab-active {
  color: var(--color-accent);
  border-bottom-color: var(--color-accent);
}

.tab-count {
  background: rgba(0, 229, 184, 0.15);
  color: var(--color-accent);
  font-size: 10px;
  font-weight: 600;
  padding: 0 5px;
  border-radius: 100px;
  min-width: 18px;
  text-align: center;
}

/* ─── Panel ───────────────────────────────────────────────────────────────── */

.rcd-panel {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.rcd-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  background: rgba(22, 40, 68, 0.4);
}

.rcd-panel-title {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-dim);
}

.rcd-add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  background: rgba(0, 229, 184, 0.1);
  border: 1px solid rgba(0, 229, 184, 0.25);
  border-radius: var(--radius-sm);
  color: var(--color-accent);
  font-size: 11px;
  font-family: var(--font-body);
  cursor: pointer;
  transition: all 0.15s;
}

.rcd-add-btn:hover { background: rgba(0, 229, 184, 0.18); }
.rcd-add-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.rcd-empty-sm {
  padding: 3rem;
  text-align: center;
  font-size: 13px;
  color: var(--color-text-muted);
}

/* ─── Overview ────────────────────────────────────────────────────────────── */

.ov-root {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Status banner */
.ov-status-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-radius: var(--radius-md);
  border: 1px solid;
}

.ov-status-active {
  background: rgba(0, 229, 184, 0.06);
  border-color: rgba(0, 229, 184, 0.2);
}

.ov-status-inactive {
  background: rgba(100, 116, 139, 0.06);
  border-color: rgba(100, 116, 139, 0.2);
}

.ov-status-archived {
  background: rgba(100, 116, 139, 0.04);
  border-color: var(--color-border);
}

.ov-status-left {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.ov-status-active .ov-status-left .pi { color: var(--color-accent); font-size: 18px; margin-top: 1px; }
.ov-status-inactive .ov-status-left .pi { color: #94a3b8; font-size: 18px; margin-top: 1px; }
.ov-status-archived .ov-status-left .pi { color: var(--color-text-muted); font-size: 18px; margin-top: 1px; }

.ov-status-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 2px;
}

.ov-status-sub {
  font-size: 11px;
  color: var(--color-text-muted);
  line-height: 1.5;
  max-width: 520px;
}

.ov-activate-inline {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: rgba(0, 229, 184, 0.1);
  border: 1px solid rgba(0, 229, 184, 0.3);
  border-radius: var(--radius-sm);
  color: var(--color-accent);
  font-family: var(--font-body);
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
  flex-shrink: 0;
}

.ov-activate-inline:hover { background: rgba(0, 229, 184, 0.18); }

.ov-deactivate-inline {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: rgba(234, 179, 8, 0.1);
  border: 1px solid rgba(234, 179, 8, 0.3);
  border-radius: var(--radius-sm);
  color: #eab308;
  font-family: var(--font-body);
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
  flex-shrink: 0;
}

.ov-deactivate-inline:hover { background: rgba(234, 179, 8, 0.18); }

.deact-icon-wrap {
  font-size: 2rem;
  color: #eab308;
  text-align: center;
  margin-bottom: 0.5rem;
}

/* Stat cards */
.ov-stats {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.75rem;
}

.ov-stat {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1rem 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.ov-stat:hover {
  border-color: rgba(0, 229, 184, 0.25);
  background: rgba(0, 229, 184, 0.02);
}

.ov-stat-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  border: 1px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  flex-shrink: 0;
}

.ov-stat-body { flex: 1; min-width: 0; }

.ov-stat-val {
  font-family: var(--font-mono);
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1;
  margin-bottom: 3px;
}

.ov-stat-max {
  font-size: 12px;
  color: var(--color-text-muted);
  font-weight: 400;
}

.ov-stat-label {
  font-size: 10px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.ov-stat-status {
  font-size: 9px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 100px;
  white-space: nowrap;
}

.ss-ok { background: rgba(0, 229, 184, 0.1); color: var(--color-accent); border: 1px solid rgba(0,229,184,0.2); }
.ss-partial { background: rgba(234,179,8,0.1); color: #fbbf24; border: 1px solid rgba(234,179,8,0.2); }
.ss-empty { background: rgba(100,116,139,0.1); color: #94a3b8; border: 1px solid rgba(100,116,139,0.2); }

/* Detail grid */
/* Lower two-column layout */
.ov-lower {
  display: flex;
  align-items: stretch;
  gap: 0.75rem;
}

.ov-info-stack {
  flex: 0 0 340px;
  display: flex;
  flex-direction: column;
}

/* ─── Overview Matrix Panel ───────────────────────────────────────────────── */

.ov-matrix-panel {
  flex: 1;
  min-width: 0;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.ov-mx-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
  background: rgba(255,255,255,0.02);
  flex-wrap: wrap;
}

.ov-mx-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-dim);
  flex: 1;
}

.ov-mx-title .pi { color: var(--color-accent); }

.ov-mx-size-badge {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text);
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  padding: 1px 7px;
  border-radius: var(--radius-sm);
}

.ov-mx-appetite-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border: 1px solid;
  border-radius: 100px;
}

.ov-mx-edit-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-dim);
  font-family: var(--font-body);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
}

.ov-mx-edit-btn:hover { border-color: var(--color-accent); color: var(--color-accent); }

.ov-mx-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 12px;
  flex: 1;
}

.ov-mx-wrap {
  padding: 1rem 1.25rem;
  overflow-x: auto;
  flex: 1;
  min-width: 0;
}

.ov-mx-table {
  border-collapse: separate;
  border-spacing: 4px;
}

.ov-mx-corner {
  width: 40px; min-width: 40px;
  position: relative;
  padding: 6px;
  vertical-align: middle;
  background: transparent;
}

.ov-mx-cr {
  position: absolute; bottom: 6px; left: 6px;
  font-size: 8px; color: var(--color-text-muted); font-weight: 600;
}

.ov-mx-cc {
  position: absolute; top: 6px; right: 6px;
  font-size: 8px; color: var(--color-text-muted); font-weight: 600;
}

.ov-mx-corner-line {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(
    to bottom right,
    transparent calc(50% - 0.5px),
    var(--color-border) calc(50% - 0.5px),
    var(--color-border) calc(50% + 0.5px),
    transparent calc(50% + 0.5px)
  );
}

.ov-mx-col-h {
  text-align: center;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  color: var(--color-accent);
  padding: 2px 4px 6px;
  min-width: 60px;
}

.ov-mx-row-h {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  color: var(--color-accent);
  padding: 0 8px 0 0;
  vertical-align: middle;
  white-space: nowrap;
}

.ov-mx-cell-td { padding: 0; }

.ov-mx-cell {
  width: 60px; height: 50px;
  border: 1px solid;
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  position: relative;
  transition: all 0.15s;
}

/* Appetite boundary cell: neon glow emphasis */
.ov-mx-appetite {
  z-index: 1;
  border-width: 2px !important;
}

/* Above-appetite cells: dimmed to de-emphasize */
.ov-mx-above {
  opacity: 0.45;
}

.ov-mx-val {
  font-family: var(--font-mono);
  font-size: 15px;
  font-weight: 700;
}

.ov-mx-lbl {
  font-size: 7px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 56px;
  text-align: center;
}

/* Matrix body: table + sidebar side-by-side */
.ov-mx-body {
  display: flex;
  align-items: flex-start;
  flex: 1;
  min-height: 0;
}

/* Right sidebar: risk level legend */
.ov-mx-sidebar {
  flex: 0 0 140px;
  padding: 0.85rem 0.9rem;
  border-left: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-self: stretch;
  background: rgba(255,255,255,0.015);
}

.ov-mx-sidebar-title {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  margin-bottom: 0.15rem;
}

.ov-mx-sidebar-levels {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.ov-mx-sidebar-item {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 3px 6px;
  border-left: 2px solid;
  border-radius: 0 4px 4px 0;
  background: rgba(255,255,255,0.02);
}

.ov-mx-sidebar-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.ov-mx-sidebar-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.ov-mx-sidebar-name {
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
}

.ov-mx-sidebar-range {
  font-size: 9px;
  font-family: var(--font-mono);
  color: var(--color-text-muted);
}

.ov-mx-sidebar-appetite {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 5px 7px;
  border: 1px solid;
  border-radius: var(--radius-sm);
  margin-top: 0.25rem;
}

.ov-mx-sidebar-appetite-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.ov-mx-sidebar-appetite-label {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.ov-mx-sidebar-appetite-name {
  font-size: 11px;
  color: var(--color-text);
  font-weight: 500;
}

.ov-mx-sidebar-hint {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  font-size: 10px;
  color: var(--color-text-muted);
  margin-top: 0.25rem;
  line-height: 1.4;
}

.ov-inline-link {
  background: none;
  border: none;
  color: var(--color-accent);
  font-size: 11px;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  font-family: var(--font-body);
}

.ov-detail-card {
  flex: 1;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.ov-card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
  background: rgba(255,255,255,0.02);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-dim);
}

.ov-card-header .pi { color: var(--color-accent); }

.ov-card-header-edit {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  font-family: var(--font-body);
  transition: all 0.15s;
  text-transform: none;
  letter-spacing: 0;
  font-weight: 500;
}
.ov-card-header-edit:hover { border-color: var(--color-accent); color: var(--color-accent); }

.ov-card-body {
  padding: 0;
  display: flex;
  flex-direction: column;
  flex: 1;
}

/* Redesigned info fields */
.ov-info-field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0.7rem 1.25rem;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}

.ov-info-field-grow {
  flex: 1;
}

.ov-info-field-label {
  font-size: 9.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  gap: 0.35rem;
}
.ov-info-field-label .pi { font-size: 9px; }

.ov-info-field-val {
  font-size: 13px;
  color: var(--color-text);
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.ov-info-field-text {
  font-size: 13px;
  color: var(--color-text);
}

.ov-info-field-sub {
  font-size: 11px;
  color: var(--color-text-muted);
}

.ov-info-period {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

.ov-info-period-sep {
  color: var(--color-text-muted);
  font-size: 12px;
}

.ov-info-field-block {
  border-bottom: none;
}

.ov-info-field-desc {
  font-size: 12px;
  color: var(--color-text-dim);
  line-height: 1.65;
}

/* Legacy row classes kept for compatibility with any remaining usage */
.ov-row-icon { color: var(--color-text-muted); font-size: 12px; }
.ov-row-sub { font-size: 11px; color: var(--color-text-muted); }
.ov-row-desc { font-size: 12px; color: var(--color-text-dim); line-height: 1.6; }

.ov-chip-accent {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-accent);
  background: rgba(0,229,184,0.1);
  border: 1px solid rgba(0,229,184,0.2);
  padding: 1px 6px;
  border-radius: var(--radius-sm);
}

.ov-matrix-badge {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text);
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  padding: 1px 8px;
  border-radius: var(--radius-sm);
}

.ov-card-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem 1.25rem;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 12px;
}

.ov-card-empty .pi { font-size: 1.8rem; opacity: 0.25; }

.ov-card-cta {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  background: rgba(0,229,184,0.08);
  border: 1px solid rgba(0,229,184,0.2);
  border-radius: var(--radius-sm);
  color: var(--color-accent);
  font-family: var(--font-body);
  font-size: 11px;
  cursor: pointer;
  margin-top: 0.25rem;
  transition: background 0.15s;
}

.ov-card-cta:hover { background: rgba(0,229,184,0.15); }

/* ─── Table ───────────────────────────────────────────────────────────────── */

.rcd-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.rcd-table-nested {
  margin: 0;
  background: rgba(15, 25, 45, 0.4);
}

.rcd-table th {
  padding: 10px 16px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  border-bottom: 1px solid var(--color-border);
  text-align: left;
  background: rgba(22, 40, 68, 0.3);
}

.rcd-table td {
  padding: 10px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  color: var(--color-text-dim);
  vertical-align: middle;
}

.rcd-table tr:last-child td { border-bottom: none; }

.td-center { text-align: center; }
.td-name { color: var(--color-text); font-weight: 500; }
.td-desc { font-size: 12px; color: var(--color-text-muted); max-width: 280px; }
.td-muted { color: var(--color-text-muted); }
.td-actions { white-space: nowrap; text-align: right; }

.rcd-mono { font-family: var(--font-mono); }

.rcd-level {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(0, 229, 184, 0.1);
  border: 1px solid rgba(0, 229, 184, 0.2);
  color: var(--color-accent);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
}

.color-swatch {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  display: inline-block;
}

/* ─── Impact area blocks ──────────────────────────────────────────────────── */

.impact-areas-list { display: flex; flex-direction: column; }

.impact-area-block {
  border-bottom: 1px solid var(--color-border);
}

.impact-area-block:last-child { border-bottom: none; }

.impact-area-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: rgba(22, 40, 68, 0.2);
  gap: 1rem;
}

.impact-area-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.impact-order {
  font-size: 11px;
  color: var(--color-text-muted);
}

.impact-area-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}

.impact-area-desc {
  font-size: 11px;
  color: var(--color-text-muted);
}

.impact-area-actions { display: flex; gap: 4px; align-items: center; }

.rcd-add-sm-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(0, 229, 184, 0.08);
  border: 1px solid rgba(0, 229, 184, 0.2);
  border-radius: var(--radius-sm);
  color: var(--color-accent);
  font-size: 11px;
  font-family: var(--font-body);
  cursor: pointer;
  transition: all 0.15s;
}

.rcd-add-sm-btn:hover { background: rgba(0, 229, 184, 0.15); }

.impact-empty {
  padding: 1rem 1.5rem;
  font-size: 12px;
  color: var(--color-text-muted);
  font-style: italic;
}

/* ─── Risk Level Tab ──────────────────────────────────────────────────────── */

.rl-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 1.5rem;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 13px;
}

.rl-empty .pi { font-size: 2rem; opacity: 0.2; }
.rl-empty-hint { font-size: 11px; color: var(--color-text-muted); max-width: 380px; line-height: 1.6; }

.rl-bar-wrap {
  padding: 1rem 1.5rem 0.75rem;
  border-bottom: 1px solid var(--color-border);
}

.rl-bar-label {
  font-size: 10px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin-bottom: 6px;
}

.rl-bar {
  display: flex;
  height: 32px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  gap: 2px;
}

.rl-bar-seg {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid;
  border-radius: 3px;
  min-width: 50px;
  padding: 0 6px;
  overflow: hidden;
}

.rl-bar-name {
  font-size: 9px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.rl-bar-range {
  font-family: var(--font-mono);
  font-size: 8px;
  color: var(--color-text-muted);
}

.rl-cards {
  display: flex;
  flex-direction: column;
}

.rl-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 1.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  border-left: 3px solid;
  transition: background 0.15s;
}

.rl-card:last-child { border-bottom: none; }
.rl-card:hover { background: rgba(255,255,255,0.02); }

.rl-card-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.rl-card-color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.rl-card-info { min-width: 0; }

.rl-card-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}

.rl-card-desc {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.rl-card-right {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.rl-score-range {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.rl-score-val {
  font-family: var(--font-mono);
  font-size: 16px;
  font-weight: 700;
}

.rl-score-sep {
  color: var(--color-text-muted);
  font-size: 12px;
}

.rl-score-unit {
  font-size: 10px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.rl-card-order {
  font-size: 10px;
  color: var(--color-text-muted);
}

.rl-card-actions { display: flex; gap: 3px; }

/* ─── Risk Level tab 70/30 layout ──────────────────────────────────────── */
.rl-layout {
  display: flex;
  align-items: stretch;
  min-height: 0;
}

.rl-settings {
  flex: 7;
  border-right: 1px solid var(--color-border);
  min-width: 0;
  overflow: auto;
}

.rl-matrix-preview {
  flex: 3;
  display: flex;
  flex-direction: column;
  padding: 1rem 1rem 1.25rem;
  gap: 0.75rem;
  min-width: 0;
  overflow: auto;
}

.rl-mx-title {
  font-size: 10px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  font-weight: 600;
}

.rl-mx-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 0.4rem;
  color: var(--color-text-muted);
  font-size: 11px;
  text-align: center;
  opacity: 0.6;
  padding: 2rem 0.5rem;
}
.rl-mx-empty .pi { font-size: 1.6rem; }
.rl-mx-empty-hint { font-size: 10px; line-height: 1.5; max-width: 160px; }

.rl-mx-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow: auto;
}

.rl-mx-table {
  border-collapse: collapse;
  width: 100%;
  table-layout: fixed;
}

.rl-mx-corner { width: 22px; }

.rl-mx-col-hdr,
.rl-mx-row-hdr {
  font-size: 8px;
  color: var(--color-text-muted);
  text-align: center;
  padding: 2px;
  font-family: var(--font-mono);
  font-weight: 600;
}

.rl-mx-cell { padding: 2px; }

.rl-mx-cell-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid;
  border-radius: 3px;
  min-height: 28px;
  padding: 2px 3px;
  transition: filter 0.1s;
}
.rl-mx-cell-inner:hover { filter: brightness(1.15); }

.rl-mx-cell-val {
  font-size: 10px;
  font-weight: 700;
  font-family: var(--font-mono);
  line-height: 1;
}

.rl-mx-cell-lbl {
  font-size: 7px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  line-height: 1.3;
}

.rl-mx-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
}

.rl-mx-legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: var(--color-text-dim);
}

.rl-mx-legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Form preview */
.rl-form-preview {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 8px 12px;
  border: 1px solid;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 1rem;
}

/* Matrix cell level suggestion */
.mx-level-match {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 4px;
}

.mx-level-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border: 1px solid;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 600;
}

.mx-apply-level {
  font-size: 10px;
  color: var(--color-accent);
  background: transparent;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
  font-family: var(--font-body);
}

.mx-legend-score {
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--color-text-muted);
}

/* ─── Matrix ──────────────────────────────────────────────────────────────── */

.mx-header-left {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.mx-dim-badge {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
  color: var(--color-accent);
  background: rgba(0,229,184,0.1);
  border: 1px solid rgba(0,229,184,0.2);
  padding: 1px 8px;
  border-radius: var(--radius-sm);
}

.mx-axis-hint {
  font-size: 11px;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  gap: 4px;
}

.mx-axis-hint .pi { font-size: 10px; }

/* Layout */
.mx-body {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 0;
  border-top: 1px solid var(--color-border);
  min-height: 300px;
}

/* Table */
.mx-table-wrap {
  overflow: auto;
  padding: 1.25rem 1.5rem;
}

.mx-table {
  border-collapse: separate;
  border-spacing: 4px;
  min-width: max-content;
}

/* Corner */
.mx-corner {
  width: 90px;
  min-width: 90px;
  background: transparent;
  position: relative;
  padding: 6px 8px;
  vertical-align: middle;
}

.mx-corner-row {
  position: absolute;
  bottom: 8px;
  left: 8px;
  font-size: 9px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.mx-corner-col {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 9px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.mx-corner-divider {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom right, transparent calc(50% - 0.5px), var(--color-border) calc(50% - 0.5px), var(--color-border) calc(50% + 0.5px), transparent calc(50% + 0.5px));
}

/* Column headers */
.mx-col-header {
  text-align: center;
  padding: 4px 4px 8px;
  background: transparent;
  min-width: 70px;
}

.mx-col-level {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--color-accent);
  display: block;
}

.mx-col-hint {
  font-size: 9px;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 70px;
  margin-top: 2px;
}

/* Row headers */
.mx-row-header {
  padding: 4px 12px 4px 0;
  white-space: nowrap;
  vertical-align: middle;
}

.mx-row-level {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--color-accent);
}

.mx-row-name {
  font-size: 9px;
  color: var(--color-text-muted);
  max-width: 80px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}

/* Cells */
.mx-cell-td {
  padding: 0;
  cursor: pointer;
}

.mx-cell-inner {
  width: 70px;
  height: 56px;
  border: 1px solid;
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  transition: all 0.15s;
  position: relative;
}

.mx-cell-td:hover .mx-cell-inner {
  filter: brightness(1.15);
  transform: scale(1.04);
}

.mx-cell-selected .mx-cell-inner {
  outline: 2px solid var(--color-accent);
  outline-offset: 1px;
}

.mx-cell-value {
  font-family: var(--font-mono);
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
}

.mx-cell-lbl {
  font-size: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.8;
}

.mx-cell-empty {
  font-size: 14px;
  color: var(--color-text-muted);
  opacity: 0.4;
}

/* Cell editor panel */
.mx-editor {
  border-left: 1px solid var(--color-border);
  background: rgba(255,255,255,0.01);
  display: flex;
  flex-direction: column;
  transition: all 0.15s;
}

.mx-editor-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 100%;
  color: var(--color-text-muted);
  font-size: 11px;
  text-align: center;
  padding: 1.5rem;
}

.mx-editor-placeholder .pi {
  font-size: 1.8rem;
  opacity: 0.2;
}

.mx-editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border);
  background: rgba(255,255,255,0.02);
}

.mx-editor-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-dim);
}

.mx-editor-pos {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-accent);
  background: rgba(0,229,184,0.1);
  border: 1px solid rgba(0,229,184,0.2);
  padding: 1px 6px;
  border-radius: var(--radius-sm);
}

.mx-editor-close {
  width: 24px;
  height: 24px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  transition: all 0.15s;
}

.mx-editor-close:hover { border-color: var(--color-border); color: var(--color-text); }

.mx-editor-body {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow-y: auto;
  flex: 1;
}

/* Color row */
.mx-color-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.mx-color-presets {
  display: flex;
  gap: 4px;
}

.mx-color-preset {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.1s, border-color 0.1s;
  padding: 0;
}

.mx-color-preset:hover { transform: scale(1.2); }
.mx-color-preset.preset-active { border-color: white; transform: scale(1.15); }

.mx-color-hex {
  flex: 1;
  min-width: 0;
  font-family: var(--font-mono);
  font-size: 11px;
}

.mx-color-picker {
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  background: none;
  flex-shrink: 0;
}

.mx-color-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px;
  border: 1px solid;
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 16px;
  font-weight: 700;
}

/* Legend */
.mx-legend {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.5rem;
  border-top: 1px solid var(--color-border);
  background: rgba(255,255,255,0.01);
  flex-wrap: wrap;
}

.mx-legend-title {
  font-size: 10px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  font-weight: 500;
}

.mx-legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  color: var(--color-text-dim);
}

.mx-legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.mx-legend-hint {
  font-size: 10px;
  color: var(--color-text-muted);
  margin-left: auto;
}

/* ─── States ──────────────────────────────────────────────────────────────── */

.rcd-centered {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 5rem;
}

.rcd-error-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.25rem;
  font-size: 13px;
  color: #ff8fa3;
  background: var(--color-danger-dim);
  border-radius: var(--radius-md);
}

/* ─── Form ────────────────────────────────────────────────────────────────── */

.rcd-form { display: flex; flex-direction: column; padding: 0.25rem 0; }

.form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

.form-group { display: flex; flex-direction: column; gap: 4px; margin-bottom: 1rem; }

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

.rcd-input {
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

.rcd-input:focus { border-color: var(--color-accent); box-shadow: 0 0 0 2px var(--color-accent-glow); }
.rcd-input.is-error { border-color: var(--color-danger); }
.rcd-input:disabled { opacity: 0.5; cursor: not-allowed; }

.rcd-textarea { resize: vertical; min-height: 60px; line-height: 1.6; }

.form-err { font-size: 11px; color: #ff8fa3; }

.form-hint { font-size: 11px; color: var(--color-text-muted); line-height: 1.5; }

.rcd-checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 13px;
  color: var(--color-text);
}
.rcd-checkbox { width: 15px; height: 15px; cursor: pointer; accent-color: var(--color-accent); }
.rcd-field-hint { font-size: 11px; color: var(--color-text-muted); line-height: 1.5; margin-top: 0.25rem; }

.rcd-alert-error {
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

.form-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.5rem; }

/* ─── Button icons ────────────────────────────────────────────────────────── */

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

.btn-icon:hover { background: var(--color-accent-glow); border-color: rgba(0, 229, 184, 0.2); color: var(--color-accent); }
.btn-icon-danger:hover { background: var(--color-danger-dim); border-color: rgba(255, 77, 109, 0.3); color: var(--color-danger); }

.btn-icon-xs { width: 22px; height: 22px; font-size: 10px; }

/* ─── Impact tab layout ───────────────────────────────────────────────────── */

.impact-panel { padding: 0; overflow: hidden; }

.impact-no-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 4rem 2rem;
  text-align: center;
}

.impact-no-area-icon {
  width: 64px; height: 64px; border-radius: 50%;
  background: rgba(249,115,22,0.08);
  border: 1px solid rgba(249,115,22,0.2);
  display: flex; align-items: center; justify-content: center;
}
.impact-no-area-icon .pi { font-size: 1.8rem; color: #fb923c; }
.impact-no-area-title { font-size: 1.1rem; font-weight: 600; color: var(--color-text); }
.impact-no-area-hint { font-size: 13px; color: var(--color-text-dim); max-width: 440px; line-height: 1.6; }

.impact-split {
  display: grid;
  grid-template-columns: 70% 30%;
  min-height: 500px;
  border-top: 1px solid var(--color-border);
}

/* ── Left panel ── */
.impact-left {
  border-right: 1px solid var(--color-border);
  overflow-y: auto;
  max-height: calc(100vh - 220px);
}
.impact-left-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  background: var(--color-bg-panel);
  z-index: 2;
}
.impact-areas-list { padding: 1rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; }

.impact-area-block {
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  overflow: hidden;
}
.impact-area-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--color-bg-input);
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  transition: background 0.15s;
  user-select: none;
}
.impact-area-header:hover { background: var(--color-bg-hover, rgba(255,255,255,0.04)); }
.impact-area-header-collapsed { border-bottom: none; }

.impact-collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px; height: 20px;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s, border-color 0.15s, transform 0.2s;
  padding: 0;
}
.impact-collapse-btn .pi { font-size: 9px; transition: transform 0.2s; }
.impact-collapse-btn-open .pi { transform: rotate(90deg); }
.impact-collapse-btn:hover { border-color: var(--color-accent); color: var(--color-accent); background: rgba(0,229,184,0.06); }

.impact-area-info { display: flex; align-items: center; gap: 0.6rem; }
.impact-area-header-right { display: flex; align-items: center; gap: 0.5rem; }

.impact-area-badge {
  min-width: 24px; height: 24px;
  border-radius: 50%;
  background: rgba(249,115,22,0.12);
  border: 1px solid rgba(249,115,22,0.3);
  color: #fb923c;
  font-size: 11px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.impact-area-name { font-size: 13px; font-weight: 600; color: var(--color-text); }
.impact-area-desc { font-size: 11px; color: var(--color-text-muted); margin-top: 2px; }
.impact-area-actions { display: flex; gap: 0.25rem; }

.impact-summary-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 100px;
  border: 1px solid;
  white-space: nowrap;
}
.impact-summary-chip .pi { font-size: 8px; }
.impact-summary-impact {
  background: rgba(249,115,22,0.08);
  border-color: rgba(249,115,22,0.3);
  color: #fb923c;
}
.impact-summary-likelihood {
  background: rgba(56,189,248,0.08);
  border-color: rgba(56,189,248,0.3);
  color: #38bdf8;
}

.impact-criteria-panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-top: none;
}

.criteria-sub-panel {
  padding: 0.875rem 1rem;
}
.criteria-sub-panel + .criteria-sub-panel {
  border-left: 1px solid var(--color-border);
}

.criteria-sub-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.625rem;
}
.criteria-sub-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-dim);
  display: flex;
  align-items: center;
  gap: 0.35rem;
}
.criteria-sub-count { font-weight: 400; color: var(--color-text-muted); }

.rcd-add-xs-btn {
  width: 22px; height: 22px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-input);
  color: var(--color-accent);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px;
  transition: all 0.15s;
}
.rcd-add-xs-btn:hover:not(:disabled) { border-color: var(--color-accent); background: var(--color-accent-glow); }
.rcd-add-xs-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.rcd-add-xs-blue { color: #38bdf8; }
.rcd-add-xs-blue:hover:not(:disabled) { border-color: #38bdf8; background: rgba(56,189,248,0.08); }

.criteria-empty { font-size: 12px; color: var(--color-text-muted); padding: 0.5rem 0; font-style: italic; }

.criteria-rows { display: flex; flex-direction: column; gap: 0.35rem; }

.criteria-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.5rem;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  transition: all 0.15s;
  cursor: default;
}
.criteria-row:hover, .criteria-row-hovered {
  background: var(--color-bg-input);
  border-color: var(--color-border);
}

.criteria-level-badge {
  font-size: 10px; font-weight: 700;
  padding: 2px 6px;
  border-radius: 9999px;
  flex-shrink: 0;
  font-family: var(--font-mono);
}
.impact-level { background: rgba(249,115,22,0.12); color: #fb923c; border: 1px solid rgba(249,115,22,0.25); }
.likelihood-level { background: rgba(56,189,248,0.12); color: #38bdf8; border: 1px solid rgba(56,189,248,0.25); }

.criteria-row-body { flex: 1; min-width: 0; overflow: hidden; }
.criteria-row-desc {
  font-size: 12px; font-weight: 600; color: var(--color-text);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden; line-height: 1.4;
}
.criteria-row-meta { display: flex; align-items: center; gap: 6px; margin-top: 2px; flex-wrap: wrap; }
.criteria-row-name-sub {
  font-size: 10px; color: var(--color-text-dim);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px;
}
.criteria-row-score { font-size: 10px; color: var(--color-text-muted); white-space: nowrap; }
.criteria-row-actions { display: flex; gap: 0.2rem; opacity: 0; transition: opacity 0.15s; }
.criteria-row:hover .criteria-row-actions { opacity: 1; }

/* ── Right panel: matrix preview ── */
/* ─── Impact tab: matrix preview (redesigned) ──────────────────────────────── */

.impact-matrix-preview {
  padding: 1rem;
  position: sticky;
  top: 0;
  align-self: start;
  max-height: calc(100vh - 220px);
  overflow-y: auto;
}

.imp-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.imp-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0.85rem;
  border-bottom: 1px solid var(--color-border);
  background: rgba(255,255,255,0.02);
  flex-shrink: 0;
}

.imp-card-title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-dim);
}

.imp-card-title .pi { color: var(--color-accent); font-size: 11px; }

.imp-card-badge {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 1px 6px;
  color: var(--color-text-muted);
}

.imp-card-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  padding: 2.5rem 1rem;
  color: var(--color-text-muted);
  font-size: 12px;
  text-align: center;
}

.imp-card-empty .pi { font-size: 1.75rem; opacity: 0.25; margin-bottom: 0.25rem; }
.imp-card-empty-sub { font-size: 11px; color: var(--color-text-muted); margin-top: 0.2rem; }

/* Grid area */
.imp-grid-wrap {
  padding: 0.75rem 0.85rem 0.5rem;
}

.imp-axis-row {
  display: flex;
  align-items: center;
  margin-bottom: 3px;
}

.imp-axis-spacer {
  width: 24px;
  flex-shrink: 0;
}

.imp-axis-label-h {
  flex: 1;
  text-align: center;
  font-size: 8.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--color-text-muted);
}

.imp-grid-body {
  display: flex;
  align-items: center;
  gap: 4px;
}

.imp-axis-label-v {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-size: 8.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--color-text-muted);
  white-space: nowrap;
  flex-shrink: 0;
  width: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Table */
.imp-table {
  border-collapse: separate;
  border-spacing: 3px;
  width: 100%;
}

/* Corner cell */
.imp-corner {
  position: relative;
  width: 26px; height: 26px;
  min-width: 26px;
  padding: 0;
  background: transparent;
}

.imp-corner-k {
  position: absolute; bottom: 2px; left: 3px;
  font-size: 7px; font-weight: 700;
  color: var(--color-text-muted);
}

.imp-corner-d {
  position: absolute; top: 2px; right: 3px;
  font-size: 7px; font-weight: 700;
  color: var(--color-text-muted);
}

.imp-corner-line {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(
    to bottom right,
    transparent calc(50% - 0.5px),
    var(--color-border) calc(50% - 0.5px),
    var(--color-border) calc(50% + 0.5px),
    transparent calc(50% + 0.5px)
  );
}

/* Column headers */
.imp-col-hdr {
  text-align: center;
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  color: var(--color-accent);
  padding: 4px 2px;
  background: rgba(0,229,184,0.05);
  border: 1px solid rgba(0,229,184,0.15);
  border-radius: 3px;
  min-width: 36px;
  cursor: default;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.imp-col-hdr.imp-hdr-impact-active {
  background: rgba(249,115,22,0.14);
  border-color: rgba(249,115,22,0.45);
  color: #fb923c;
}

/* Row headers */
.imp-row-hdr {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  color: var(--color-accent);
  padding: 2px 6px;
  background: rgba(0,229,184,0.05);
  border: 1px solid rgba(0,229,184,0.15);
  border-radius: 3px;
  text-align: center;
  vertical-align: middle;
  white-space: nowrap;
  cursor: default;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.imp-row-hdr.imp-hdr-likelihood-active {
  background: rgba(56,189,248,0.14);
  border-color: rgba(56,189,248,0.45);
  color: #38bdf8;
}

/* Cells */
.imp-cell {
  border: 1px solid;
  border-radius: 4px;
  width: 36px;
  height: 36px;
  text-align: center;
  vertical-align: middle;
  cursor: default;
  transition: background 0.12s, border-color 0.12s, box-shadow 0.12s;
  padding: 0;
}

.imp-cell-val {
  display: block;
  font-size: 12px;
  font-weight: 700;
  font-family: var(--font-mono);
  line-height: 1.15;
}

.imp-cell-lbl {
  display: block;
  font-size: 6.5px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 34px;
  margin: 0 auto;
  opacity: 0.85;
}

/* Hover highlight states — !important to override inline background/border */
.imp-cell-col-hl {
  background: rgba(249,115,22,0.15) !important;
  border-color: rgba(249,115,22,0.4) !important;
}

.imp-cell-row-hl {
  background: rgba(56,189,248,0.15) !important;
  border-color: rgba(56,189,248,0.4) !important;
}

.imp-cell-cross {
  background: rgba(255,255,255,0.12) !important;
  border-color: rgba(0,229,184,0.65) !important;
  box-shadow: 0 0 0 1px rgba(0,229,184,0.3), inset 0 0 6px rgba(0,229,184,0.1);
}

/* Legend */
.imp-legend {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0.55rem 0.85rem;
  border-top: 1px solid var(--color-border);
  background: rgba(255,255,255,0.01);
}

.imp-legend-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 2px 5px;
  border-left: 2px solid;
  border-radius: 0 3px 3px 0;
  background: rgba(255,255,255,0.015);
}

.imp-legend-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.imp-legend-name {
  flex: 1;
  font-size: 10px;
  font-weight: 600;
}

.imp-legend-range {
  font-size: 9px;
  font-family: var(--font-mono);
  color: var(--color-text-muted);
}

/* ─── Dialog delete bodies ────────────────────────────────────────────────── */

.del-body { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 0.5rem 0 1rem; gap: 0.75rem; }

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

.del-icon-wrap .pi { font-size: 1.4rem; color: var(--color-danger); }

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

.del-text { font-size: 14px; color: var(--color-text); margin: 0; }

.del-warn { font-size: 12px; color: var(--color-text-dim); margin: 0; line-height: 1.6; max-width: 300px; }

/* ─── Overview Preview Cards ───────────────────────────────────────────────── */
.ov-previews {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 1rem;
}
.ov-preview-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}
.ov-preview-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0.9rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-input);
}
.ov-preview-card-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-dim);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.ov-preview-card-count {
  font-size: 11px;
  font-family: monospace;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 1px 5px;
  color: var(--color-text-dim);
}
.ov-preview-edit-btn {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 5px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  color: var(--color-text-dim);
  cursor: pointer;
  transition: all 0.15s;
}
.ov-preview-edit-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
  border-color: var(--color-accent);
}
.ov-preview-card-body {
  padding: 0.75rem 1rem;
  max-height: 220px;
  overflow-y: auto;
}
.ov-preview-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 1rem;
  color: var(--color-text-muted);
  font-size: 12px;
  text-align: center;
}
.ov-preview-empty i {
  font-size: 1.5rem;
  opacity: 0.4;
}
/* Shared numbering badge */
.ov-preview-number {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(0,229,184,0.08);
  border: 1px solid rgba(0,229,184,0.2);
  color: var(--color-accent);
  font-size: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
}
/* Kategori Risiko items */
.ov-preview-cat-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 5px 0;
  font-size: 12px;
  border-bottom: 1px solid rgba(22,40,68,0.6);
}
.ov-preview-cat-item:last-child { border-bottom: none; }
.ov-preview-color-swatch {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  flex-shrink: 0;
  margin-top: 3px;
}
.ov-preview-cat-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.ov-preview-cat-top {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}
.ov-preview-cat-name {
  color: var(--color-text);
  font-weight: 500;
}
.ov-preview-cat-desc {
  color: var(--color-text-dim);
  font-size: 11px;
  line-height: 1.5;
  white-space: pre-line;
}
.ov-preview-code-badge {
  font-size: 10px;
  font-family: monospace;
  background: rgba(0,229,184,0.1);
  color: var(--color-accent);
  border: 1px solid rgba(0,229,184,0.25);
  border-radius: 3px;
  padding: 1px 5px;
  flex-shrink: 0;
}
/* Area Dampak items */
.ov-preview-area-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 5px 0;
  font-size: 12px;
  border-bottom: 1px solid rgba(22,40,68,0.6);
}
.ov-preview-area-item:last-child { border-bottom: none; }
.ov-preview-area-name {
  flex: 1;
  color: var(--color-text);
  font-weight: 500;
}
.ov-preview-area-meta {
  font-size: 11px;
  color: var(--color-text-muted);
}
/* Opsi Penanganan items */
.ov-preview-opt-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 5px 0;
  font-size: 12px;
  border-bottom: 1px solid rgba(22,40,68,0.6);
}
.ov-preview-opt-item:last-child { border-bottom: none; }
.ov-preview-opt-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.ov-preview-opt-name {
  color: var(--color-text);
  font-weight: 500;
}
.ov-preview-opt-desc {
  font-size: 11px;
  color: var(--color-text-muted);
}
</style>
