<template>
  <div class="wpd-page">

    <!-- ─── Loading ───────────────────────────────────────────────────────────── -->
    <div v-if="loading" class="wpd-centered">
      <ProgressSpinner style="width: 36px; height: 36px" />
    </div>
    <div v-else-if="error" class="wpd-alert-error">
      <i class="pi pi-exclamation-circle" /> {{ error }}
    </div>

    <template v-else-if="wp">

      <!-- ─── Breadcrumb ────────────────────────────────────────────────────────── -->
      <div class="wpd-breadcrumb-row">
        <button class="wpd-back-btn" type="button" @click="router.push({ name: 'working-papers' })">
          <i class="pi pi-arrow-left" />
        </button>
        <span class="wpd-breadcrumb-text" @click="router.push({ name: 'working-papers' })">
          Kertas Kerja
        </span>
        <span class="wpd-breadcrumb-sep">/</span>
        <span class="wpd-breadcrumb-current">{{ wp.title }}</span>
      </div>

      <!-- ─── Compact Header Bar ─────────────────────────────────────────────────── -->
      <div class="wpd-header-bar">
        <div class="wpd-header-bar-left">
          <i class="pi pi-file-edit wpd-header-icon" />
          <div class="wpd-header-info">
            <h1 class="wpd-header-title">{{ wp.title }}</h1>
            <div class="wpd-header-meta">
              <span class="wpd-status-chip" :class="`chip-${wp.status.toLowerCase()}`">
                {{ WORKING_PAPER_STATUS_LABELS[wp.status] }}
              </span>
              <span class="wpd-header-sep">·</span>
              <i class="pi pi-briefcase" style="font-size:11px;color:var(--color-text-muted)" />
              <span class="wpd-header-meta-text">{{ wp.program?.name ?? '—' }}</span>
              <span v-if="wp.program?.year" class="wpd-year-badge">{{ wp.program.year }}</span>
              <span class="wpd-header-sep">·</span>
              <i class="pi pi-building" style="font-size:11px;color:var(--color-text-muted)" />
              <span v-if="wp.unitKerja?.code" class="wpd-code-badge">{{ wp.unitKerja.code }}</span>
              <span class="wpd-header-meta-text">{{ wp.unitKerja?.name ?? '—' }}</span>
              <span class="wpd-header-sep">·</span>
              <i class="pi pi-user" style="font-size:11px;color:var(--color-text-muted)" />
              <span class="wpd-header-meta-text">{{ wp.createdBy ?? '—' }}</span>
            </div>
          </div>
        </div>
        <div class="wpd-header-bar-right">
          <button class="wpd-download-btn" type="button" title="Unduh Laporan PDF" :disabled="downloadingReport" @click="downloadReport">
            <i :class="downloadingReport ? 'pi pi-spin pi-spinner' : 'pi pi-download'" />
          </button>
          <button v-if="canEdit" class="wpd-edit-btn" type="button" title="Edit judul" @click="openEdit">
            <i class="pi pi-pencil" />
          </button>
        </div>
      </div>

      <!-- ─── Konteks Risiko Program Accordion ────────────────────────────────── -->
      <div class="wpd-accordion">
        <button class="wpd-accordion-header" type="button" @click="contextSectionOpen = !contextSectionOpen">
          <i class="pi pi-layer" />
          <span>Konteks Risiko Program</span>
          <span class="wpd-count-badge">
            {{ totalContextCount }}
            <span class="wpd-count-label">konteks</span>
          </span>
          <i class="pi pi-chevron-down wpd-accordion-chevron" :class="{ open: contextSectionOpen }" />
        </button>
        <div v-if="contextSectionOpen" class="wpd-accordion-body">
          <!-- Loading -->
          <div v-if="contextsLoading" class="wpd-ctx-loading">
            <ProgressSpinner style="width: 28px; height: 28px" />
          </div>
          <!-- Error -->
          <div v-else-if="contextsError" class="wpd-ctx-error">
            <i class="pi pi-exclamation-circle" /> {{ contextsError }}
          </div>
          <!-- Empty: no frameworks -->
          <div v-else-if="programFrameworks.length === 0" class="wpd-empty">
            <div class="wpd-empty-icon"><i class="pi pi-layer" /></div>
            <p class="wpd-empty-title">Belum ada framework dalam program ini</p>
            <p class="wpd-empty-desc">Tambahkan framework ke program kerja untuk melihat konteks risiko.</p>
          </div>
          <!-- Framework groups -->
          <div v-else class="wpd-fw-groups">
            <div v-for="pf in programFrameworks" :key="pf.id" class="wpd-fw-group">
              <div class="wpd-fw-group-header">
                <span class="wpd-fw-code">{{ pf.framework.code }}</span>
                <span v-if="pf.framework.version" class="wpd-fw-version">v{{ pf.framework.version }}</span>
                <span class="wpd-fw-group-name">{{ pf.framework.name }}</span>
                <span class="wpd-fw-ctx-count">{{ (contextsMap[pf.id] ?? []).length }} konteks</span>
              </div>
              <div v-if="!(contextsMap[pf.id] ?? []).length" class="wpd-fw-empty">
                Tidak ada konteks terpilih untuk framework ini.
              </div>
              <div v-else class="wpd-ctx-list">
                <div v-for="ctx in contextsMap[pf.id]" :key="ctx.id" class="wpd-ctx-row">
                  <div class="wpd-ctx-row-left">
                    <span class="wpd-ctx-code">{{ ctx.code }}</span>
                    <span class="wpd-ctx-type" :class="ctx.contextType === 'ASSET' ? 'type-asset' : 'type-process'">
                      {{ ctx.contextType === 'ASSET' ? 'Aset' : 'Proses' }}
                    </span>
                    <div class="wpd-ctx-info">
                      <span class="wpd-ctx-name">{{ ctx.name }}</span>
                      <span class="wpd-ctx-period">Periode {{ ctx.periodStart }}–{{ ctx.periodEnd }}</span>
                    </div>
                  </div>
                  <div class="wpd-ctx-row-right">
                    <button type="button" class="btn-icon" title="Lihat detail konteks" @click="goToContext(ctx.id)">
                      <i class="pi pi-eye" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ─── Statistics Panel ──────────────────────────────────────────────────── -->
      <WpStatsPanel v-if="wpStats" :stats="wpStats" />
      <div v-else-if="statsLoading" class="wpd-ctx-loading" style="min-height:64px">
        <ProgressSpinner style="width: 24px; height: 24px" />
      </div>

      <!-- ─── Register Risiko ──────────────────────────────────────────────────── -->
      <div class="wpd-rr-header">
        <div class="wpd-rr-header-left">
          <h2 class="wpd-section-title">Register Risiko</h2>
          <span class="wpd-count-badge">
            {{ entries.length }}
            <span class="wpd-count-label">entri</span>
          </span>
        </div>
        <div class="wpd-rr-header-right">
          <button
            v-if="canEdit"
            type="button"
            class="wpd-add-entry-btn"
            @click="router.push({ name: 'risk-entry-create', params: { id: wpId } })"
          >
            <i class="pi pi-plus" /> Tambah Entri
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="entriesLoading" class="wpd-ctx-loading">
        <ProgressSpinner style="width: 28px; height: 28px" />
      </div>

      <!-- Error -->
      <div v-else-if="entriesError" class="wpd-ctx-error">
        <i class="pi pi-exclamation-circle" /> {{ entriesError }}
      </div>

      <!-- Empty -->
      <div v-else-if="entries.length === 0" class="wpd-empty wpd-empty-standalone">
        <div class="wpd-empty-icon"><i class="pi pi-inbox" /></div>
        <p class="wpd-empty-title">Belum ada entri risiko</p>
        <p class="wpd-empty-desc">
          {{ canEdit ? 'Klik "Tambah Entri" untuk memulai identifikasi risiko.' : 'Belum ada risiko yang diidentifikasi.' }}
        </p>
      </div>

      <!-- Filter Bar -->
      <div v-else class="wpd-rr-filter-bar">
        <div class="wpd-rr-filter-left">
          <span class="wpd-rr-filter-label">Tampilkan</span>
          <div class="wpd-rr-type-tabs">
            <button
              type="button"
              class="wpd-rr-tab"
              :class="{ active: filterType === 'all' }"
              @click="filterType = 'all'"
            >Semua</button>
            <button
              type="button"
              class="wpd-rr-tab"
              :class="{ active: filterType === 'asset' }"
              @click="filterType = 'asset'"
            >
              <span class="wpd-rr-tab-dot dot-asset" />
              Aset
            </button>
            <button
              type="button"
              class="wpd-rr-tab"
              :class="{ active: filterType === 'process' }"
              @click="filterType = 'process'"
            >
              <span class="wpd-rr-tab-dot dot-process" />
              Proses Bisnis
            </button>
          </div>
          <select
            v-if="filterType !== 'all'"
            v-model="filterGroupKey"
            class="wpd-rr-filter-select"
          >
            <option value="">— Semua {{ filterType === 'asset' ? 'aset' : 'proses bisnis' }} —</option>
            <option v-for="g in availableGroupOptions" :key="g.key" :value="g.key">
              {{ g.label }}
            </option>
          </select>
        </div>
        <div class="wpd-rr-filter-right">
          <span class="wpd-rr-filter-count">
            <span class="wpd-rr-filter-count-num">{{ filteredEntryCount }}</span>
            <span class="wpd-rr-filter-count-sep">/</span>
            {{ entries.length }} entri
          </span>
          <button
            v-if="filterType !== 'all' || filterGroupKey"
            type="button"
            class="wpd-rr-filter-clear"
            @click="clearFilter"
          >
            <i class="pi pi-times" /> Reset
          </button>
        </div>
      </div>

      <!-- Risk Register Table -->
      <div v-if="!entriesLoading && !entriesError && entries.length > 0" class="wpd-rr-wrap">
        <table class="wpd-rr-table">
          <colgroup>
            <col class="col-no">
            <col class="col-code">
            <col class="col-kerawanan">
            <col class="col-ancaman">
            <col class="col-kategori">
            <col class="col-kontrol-detail">
            <col class="col-dampak">
            <col class="col-kem">
            <col class="col-damp">
            <col class="col-kem">
            <col class="col-keputusan-detail">
            <col class="col-status-mitigasi">
            <col class="col-uraian">
            <col class="col-target">
            <col class="col-pic">
            <col class="col-kem">
            <col class="col-damp">
            <col class="col-kem">
            <col class="col-aksi">
          </colgroup>
          <thead>
            <tr class="wpd-rr-thead-top">
              <th rowspan="2" class="wpd-rr-th-no">NO</th>
              <th rowspan="2" class="wpd-rr-th-code">KODE</th>
              <th colspan="3" class="wpd-rr-th-group">DESKRIPSI RISIKO</th>
              <th rowspan="2" class="wpd-rr-th-kontrol">KONTROL BAWAAN</th>
              <th rowspan="2" class="wpd-rr-th-dampak">AREA DAMPAK</th>
              <th colspan="3" class="wpd-rr-th-group wpd-rr-th-inheren">RISIKO INHEREN</th>
              <th rowspan="2" class="wpd-rr-th-keputusan">KEPUTUSAN</th>
              <th rowspan="2" class="wpd-rr-th-status-mitigasi">STATUS MITIGASI</th>
              <th colspan="3" class="wpd-rr-th-group wpd-rr-th-mitigasi">RENCANA MITIGASI</th>
              <th colspan="3" class="wpd-rr-th-group wpd-rr-th-residu">RISIKO RESIDU</th>
              <th rowspan="2" class="wpd-rr-th-aksi">AKSI</th>
            </tr>
            <tr class="wpd-rr-thead-sub">
              <th>Kerawanan</th>
              <th>Ancaman</th>
              <th>Kategori</th>
              <th>Kem.</th>
              <th>Damp.</th>
              <th>Nilai</th>
              <th>Uraian</th>
              <th>Target</th>
              <th>PIC</th>
              <th>Kem.</th>
              <th>Damp.</th>
              <th>Nilai</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredGroups.length === 0">
              <td colspan="19" class="wpd-rr-empty-filtered">
                <i class="pi pi-filter-slash" />
                Tidak ada entri yang cocok dengan filter yang dipilih.
              </td>
            </tr>
            <template v-for="group in filteredGroups" :key="group.key">
              <tr class="wpd-rr-group-row">
                <td colspan="18" class="wpd-rr-group-td">
                  <div class="wpd-rr-group-cell">
                    <span class="wpd-rr-group-type-badge" :class="group.type === 'asset' ? 'badge-asset' : group.type === 'process' ? 'badge-process' : 'badge-uncategorized'">
                      {{ group.type === 'asset' ? 'Aset' : group.type === 'process' ? 'Proses' : 'Lainnya' }}
                    </span>
                    <span class="wpd-rr-group-label">{{ group.label }}</span>
                    <span class="wpd-rr-group-count">{{ group.entries.length }} risiko</span>
                  </div>
                </td>
              </tr>
              <!-- Split rows per area score using rowspan -->
              <template v-for="(entry, idx) in group.entries" :key="entry.id">
                <template v-for="(areaScore, aIdx) in (entry.inherentAssessment?.areaScores?.length ? entry.inherentAssessment.areaScores : [null])" :key="aIdx">
                  <tr class="wpd-rr-data-row" :class="{ 'wpd-rr-area-subrow': aIdx > 0 }">
                    <!-- Rowspan cells: only render on first area row -->
                    <td v-if="aIdx === 0" class="wpd-rr-td-no" :rowspan="entry.inherentAssessment?.areaScores?.length || 1">{{ idx + 1 }}</td>
                    <td v-if="aIdx === 0" class="wpd-rr-td-code" :rowspan="entry.inherentAssessment?.areaScores?.length || 1">
                      <span class="wpd-entry-code">{{ entry.code }}</span>
                    </td>
                    <td v-if="aIdx === 0" class="wpd-rr-td-text" :rowspan="entry.inherentAssessment?.areaScores?.length || 1">
                      <div class="wpd-rr-cell-text">{{ entry.name }}</div>
                    </td>
                    <td v-if="aIdx === 0" class="wpd-rr-td-text" :rowspan="entry.inherentAssessment?.areaScores?.length || 1">
                      <div v-if="entry.description" class="wpd-rr-cell-text">{{ entry.description }}</div>
                      <span v-else class="wpd-rr-dash">—</span>
                    </td>
                    <!-- Kategori: rowspan -->
                    <td v-if="aIdx === 0" class="wpd-rr-td-chip" :rowspan="entry.inherentAssessment?.areaScores?.length || 1">
                      <span v-if="entry.riskCategory" class="wpd-entry-cat"
                        :style="{ borderColor: entry.riskCategory.color ?? 'var(--color-border)', color: entry.riskCategory.color ?? 'var(--color-text-muted)' }">
                        {{ entry.riskCategory.name }}
                      </span>
                      <span v-else class="wpd-rr-dash">—</span>
                    </td>
                    <!-- Kontrol Bawaan: rowspan (1 inputan untuk semua area) -->
                    <td v-if="aIdx === 0" class="wpd-rr-td-kontrol-detail" :rowspan="entry.inherentAssessment?.areaScores?.length || 1">
                      <template v-if="entry.controls?.length">
                        <div v-for="ctrl in entry.controls" :key="ctrl.id" class="wpd-rr-ctrl-row">
                          <span class="wpd-rr-ctrl-name">{{ ctrl.name }}</span>
                          <span class="wpd-rr-eff-badge" :class="`eff-${ctrl.effectiveness.toLowerCase()}`">
                            {{ CONTROL_EFFECTIVENESS_LABELS[ctrl.effectiveness] }}
                          </span>
                        </div>
                      </template>
                      <span v-else class="wpd-rr-dash">—</span>
                    </td>
                    <!-- Area-specific cells: Dampak, Kem., Damp., Nilai inheren -->
                    <td class="wpd-rr-td-areas">
                      <span v-if="areaScore" class="wpd-rr-area-label">{{ areaScore.impactArea.name }}</span>
                      <span v-else class="wpd-rr-dash">—</span>
                    </td>
                    <td class="wpd-rr-td-score">
                      <span v-if="areaScore" class="wpd-rr-score-pill">{{ areaScore.likelihoodLevel }}</span>
                      <span v-else class="wpd-rr-dash">—</span>
                    </td>
                    <td class="wpd-rr-td-score">
                      <span v-if="areaScore" class="wpd-rr-score-pill">{{ areaScore.impactLevel }}</span>
                      <span v-else class="wpd-rr-dash">—</span>
                    </td>
                    <!-- Nilai inheren: per area using areaScore.score -->
                    <td class="wpd-rr-td-score">
                      <span v-if="areaScore?.score != null" class="wpd-rr-score-pill wpd-rr-score-nilai">{{ areaScore.score }}</span>
                      <span v-else class="wpd-rr-dash">—</span>
                    </td>
                    <!-- Keputusan: filter by impactAreaId of this sub-row -->
                    <td class="wpd-rr-td-keputusan-detail">
                      <template v-if="areaScore && entry.treatmentPlans?.filter(p => p.impactAreaId === areaScore.impactAreaId).length">
                        <div
                          v-for="plan in entry.treatmentPlans.filter(p => p.impactAreaId === areaScore.impactAreaId)"
                          :key="plan.id"
                          class="wpd-rr-plan-row"
                        >
                          <span
                            v-if="plan.treatmentOption"
                            class="wpd-rr-decision"
                            :class="plan.treatmentOption.name.toLowerCase().includes('mitigasi') ? 'decision-mitigasi' : 'decision-other'"
                          >{{ plan.treatmentOption.name }}</span>
                          <span v-else class="wpd-rr-decision decision-pending">Belum dipilih</span>
                        </div>
                      </template>
                      <span v-else class="wpd-rr-dash">—</span>
                    </td>
                    <!-- Status Mitigasi (Direncanakan) -->
                    <td class="wpd-rr-td-status-mitigasi">
                      <template v-if="areaScore && entry.treatmentPlans?.filter(p => p.impactAreaId === areaScore.impactAreaId).length">
                        <div
                          v-for="plan in entry.treatmentPlans.filter(p => p.impactAreaId === areaScore.impactAreaId)"
                          :key="plan.id"
                          class="wpd-rr-plan-row"
                        >
                          <span class="wpd-rr-plan-status" :class="`pstatus-${plan.status.toLowerCase()}`">
                            {{ TREATMENT_STATUS_LABELS[plan.status] }}
                          </span>
                        </div>
                      </template>
                      <span v-else class="wpd-rr-dash">—</span>
                    </td>
                    <!-- Uraian: filter by area -->
                    <td class="wpd-rr-td-text">
                      <template v-if="areaScore">
                        <div
                          v-for="plan in (entry.treatmentPlans ?? []).filter(p => p.impactAreaId === areaScore.impactAreaId && p.description)"
                          :key="plan.id"
                          class="wpd-rr-cell-text"
                        >{{ plan.description }}</div>
                        <span v-if="!(entry.treatmentPlans ?? []).filter(p => p.impactAreaId === areaScore.impactAreaId && p.description).length" class="wpd-rr-dash">—</span>
                      </template>
                      <span v-else class="wpd-rr-dash">—</span>
                    </td>
                    <!-- Target: filter by area (first plan for this area) -->
                    <td class="wpd-rr-td-date">
                      <span class="wpd-rr-date">{{ formatDate(areaScore ? ((entry.treatmentPlans ?? []).find(p => p.impactAreaId === areaScore.impactAreaId)?.targetDate ?? null) : null) }}</span>
                    </td>
                    <!-- PIC: filter by area (first plan for this area) -->
                    <td class="wpd-rr-td-pic">
                      <span v-if="areaScore && (entry.treatmentPlans ?? []).find(p => p.impactAreaId === areaScore.impactAreaId)?.picUserId" class="wpd-rr-pic">
                        {{ (entry.treatmentPlans ?? []).find(p => p.impactAreaId === areaScore.impactAreaId)!.picUserId!.substring(0, 8) }}…
                      </span>
                      <span v-else class="wpd-rr-dash">—</span>
                    </td>
                    <!-- Risiko Residu: match by impactAreaId -->
                    <td class="wpd-rr-td-score">
                      <template v-if="areaScore && entry.residualAssessment?.areaScores?.find(r => r.impactAreaId === areaScore.impactAreaId)">
                        <span class="wpd-rr-score-pill">{{ entry.residualAssessment!.areaScores.find(r => r.impactAreaId === areaScore!.impactAreaId)!.likelihoodLevel }}</span>
                      </template>
                      <span v-else class="wpd-rr-dash">—</span>
                    </td>
                    <td class="wpd-rr-td-score">
                      <template v-if="areaScore && entry.residualAssessment?.areaScores?.find(r => r.impactAreaId === areaScore.impactAreaId)">
                        <span class="wpd-rr-score-pill">{{ entry.residualAssessment!.areaScores.find(r => r.impactAreaId === areaScore!.impactAreaId)!.impactLevel }}</span>
                      </template>
                      <span v-else class="wpd-rr-dash">—</span>
                    </td>
                    <td class="wpd-rr-td-score">
                      <template v-if="areaScore && entry.residualAssessment?.areaScores?.find(r => r.impactAreaId === areaScore.impactAreaId)?.score != null">
                        <span class="wpd-rr-score-pill wpd-rr-score-nilai">{{ entry.residualAssessment!.areaScores.find(r => r.impactAreaId === areaScore!.impactAreaId)!.score }}</span>
                      </template>
                      <span v-else class="wpd-rr-dash">—</span>
                    </td>
                    <!-- Aksi: rowspan (action menu only on first sub-row) -->
                    <td v-if="aIdx === 0" class="wpd-rr-td-aksi" :rowspan="entry.inherentAssessment?.areaScores?.length || 1">
                      <div class="wpd-action-wrap">
                        <button
                          type="button"
                          class="wpd-action-menu-btn"
                          @click.stop="toggleActionMenu(entry.id, $event)"
                        >
                          Aksi <i class="pi pi-chevron-down" style="font-size:9px" />
                        </button>
                        <Teleport to="body">
                        <div
                          v-if="activeActionMenu === entry.id"
                          class="wpd-action-menu-panel"
                          :style="{ top: actionMenuPos.top + 'px', right: actionMenuPos.right + 'px' }"
                          @click.stop
                        >
                          <button class="wpd-action-item" @click="openDetailModal(entry); activeActionMenu = null">
                            Lihat Detail
                          </button>
                          <template v-if="canEdit">
                            <button class="wpd-action-item" @click="openEditEntry(entry); activeActionMenu = null">
                              Edit Entri
                            </button>
                            <div class="wpd-action-divider" />
                            <button class="wpd-action-item" @click="openInherentModal(entry); activeActionMenu = null">
                              Penilaian Inherent
                            </button>
                            <button
                              class="wpd-action-item"
                              :class="{ disabled: !entry.inherentAssessment }"
                              :disabled="!entry.inherentAssessment"
                              @click="entry.inherentAssessment && openTreatmentModal(entry); activeActionMenu = null"
                            >
                              Rencana Penanganan
                            </button>
                            <button
                              class="wpd-action-item"
                              :class="{ disabled: !entry.treatmentPlans?.some(p => p.status === 'PLANNED') }"
                              :disabled="!entry.treatmentPlans?.some(p => p.status === 'PLANNED')"
                              @click="entry.treatmentPlans?.some(p => p.status === 'PLANNED') && openResidualModal(entry); activeActionMenu = null"
                            >
                              Tandai Mitigasi Selesai
                            </button>
                            <div class="wpd-action-divider" />
                            <button class="wpd-action-item wpd-action-item--danger" @click="openDeleteEntry(entry); activeActionMenu = null">
                              Hapus
                            </button>
                          </template>
                        </div>
                        </Teleport>
                      </div>
                    </td>
                  </tr>
                </template>
              </template>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Infinite scroll sentinel -->
      <div ref="loadMoreSentinel" class="wpd-load-more-sentinel">
        <ProgressSpinner v-if="loadingMore" style="width: 24px; height: 24px" />
        <span v-else-if="!hasMore && entries.length > 0" class="wpd-load-more-end">Semua entri telah dimuat</span>
      </div>

    </template>

  <!-- ─── Edit Dialog ───────────────────────────────────────────────────────── -->
  <Dialog v-model:visible="showEdit" modal header="Edit Kertas Kerja" :style="{ width: '440px' }">
    <form class="wpd-edit-form" @submit.prevent="submitEdit">
      <div class="wpd-form-group">
        <label class="wpd-form-label">Judul <span class="wpd-req">*</span></label>
        <input
          v-model="editForm.title"
          class="wpd-form-input"
          :class="{ 'is-error': editTitleError }"
          type="text"
          maxlength="255"
          autocomplete="off"
        />
        <span v-if="editTitleError" class="wpd-form-err">{{ editTitleError }}</span>
      </div>
      <div v-if="editError" class="wpd-form-api-error">
        <i class="pi pi-exclamation-triangle" /> {{ editError }}
      </div>
      <div class="wpd-form-actions">
        <Button label="Batal" severity="secondary" type="button" :disabled="editLoading" @click="showEdit = false" />
        <Button label="Simpan" type="submit" :loading="editLoading" />
      </div>
    </form>
  </Dialog>

  <!-- ─── Edit Entry Dialog ─────────────────────────────────────────────────── -->
  <Dialog v-model:visible="showEditEntry" modal header="Edit Entri Risiko" :style="{ width: '560px' }">
    <form class="wpd-edit-form" @submit.prevent="submitEditEntry">
      <!-- Konteks -->
      <div class="wpd-form-group">
        <label class="wpd-form-label">Konteks <span class="wpd-req">*</span></label>
        <select v-model="editEntryForm.programFrameworkContextId" class="wpd-form-input">
          <option value="">— Pilih konteks —</option>
          <option v-for="opt in pfcOptions" :key="opt.id" :value="opt.id">
            [{{ opt.frameworkCode }}] {{ opt.label }}
          </option>
        </select>
      </div>

      <!-- Kode -->
      <div class="wpd-form-group">
        <label class="wpd-form-label">Kode <span class="wpd-req">*</span></label>
        <input
          v-model="editEntryForm.code"
          class="wpd-form-input"
          :class="{ 'is-error': editEntryErrors.code }"
          type="text"
          maxlength="50"
          autocomplete="off"
        />
        <span v-if="editEntryErrors.code" class="wpd-form-err">{{ editEntryErrors.code }}</span>
      </div>

      <!-- Nama Risiko -->
      <div class="wpd-form-group">
        <label class="wpd-form-label">Nama Risiko <span class="wpd-req">*</span></label>
        <input
          v-model="editEntryForm.name"
          class="wpd-form-input"
          :class="{ 'is-error': editEntryErrors.name }"
          type="text"
          maxlength="500"
          autocomplete="off"
        />
        <span v-if="editEntryErrors.name" class="wpd-form-err">{{ editEntryErrors.name }}</span>
      </div>

      <!-- Deskripsi -->
      <div class="wpd-form-group">
        <label class="wpd-form-label">Deskripsi <span class="wpd-form-opt">(opsional)</span></label>
        <textarea v-model="editEntryForm.description" class="wpd-form-input wpd-form-textarea" rows="2" />
      </div>

      <!-- Kategori -->
      <div class="wpd-form-group">
        <label class="wpd-form-label">
          Kategori Risiko
          <span class="wpd-form-opt">(opsional)</span>
          <span v-if="categoryLoading" class="wpd-cat-loading"><i class="pi pi-spin pi-spinner" /></span>
        </label>
        <select v-model="editEntryForm.riskCategoryId" class="wpd-form-input" :disabled="categoryLoading">
          <option value="">— Tanpa kategori —</option>
          <option v-for="cat in editEntryCategories" :key="cat.id" :value="cat.id">
            {{ cat.name }}
          </option>
        </select>
      </div>

      <div v-if="editEntryError" class="wpd-form-api-error">
        <i class="pi pi-exclamation-triangle" /> {{ editEntryError }}
      </div>
      <div class="wpd-form-actions">
        <Button label="Batal" severity="secondary" type="button" :disabled="editEntryLoading" @click="showEditEntry = false" />
        <Button label="Simpan" type="submit" :loading="editEntryLoading" />
      </div>
    </form>
  </Dialog>

  <!-- ─── Treatment Plans Dialog ───────────────────────────────────────────── -->
  <Dialog v-model:visible="showTreatmentPlans" modal header="Rencana Penanganan" :style="{ width: '620px' }">
    <div v-if="treatmentPlansLoading" class="wpd-centered"><ProgressSpinner style="width:28px;height:28px" /></div>
    <div v-else-if="treatmentPlansError" class="wpd-ctx-error">{{ treatmentPlansError }}</div>
    <template v-else-if="treatmentPlanEntry">
      <p class="wpd-tp-entry-name">{{ treatmentPlanEntry.name }}</p>
      <div v-if="!treatmentPlanEntry.treatmentPlans?.length" class="wpd-empty" style="padding:1.5rem 0">
        Belum ada rencana penanganan.
      </div>
      <div v-for="plan in treatmentPlanEntry.treatmentPlans" :key="plan.id" class="wpd-tp-card">
        <div v-if="plan.impactArea" class="wpd-tp-area-label">
          <i class="pi pi-chart-scatter" />
          {{ plan.impactArea.name }}
        </div>
        <div class="wpd-tp-card-header">
          <span class="wpd-tp-option">{{ plan.treatmentOption?.name ?? '—' }}</span>
          <span class="wpd-tp-status-badge" :class="`status-${plan.status.toLowerCase().replace(/_/g, '-')}`">
            {{ TREATMENT_STATUS_LABELS[plan.status] }}
          </span>
        </div>
        <p v-if="plan.description" class="wpd-tp-desc">{{ plan.description }}</p>
        <div class="wpd-tp-meta">
          <span v-if="plan.targetDate">Target: {{ formatDate(plan.targetDate) }}</span>
          <span v-if="plan.needsKomiteReview" class="wpd-tp-komite-badge">Perlu Review Komite</span>
        </div>
        <div class="wpd-tp-actions">
          <Button
            v-if="isOwner && plan.status === 'COMPLETED' && plan.needsKomiteReview"
            label="Ajukan ke Komite"
            size="small"
            severity="warn"
            :loading="submitPlanLoading === plan.id"
            @click="doSubmitPlan(plan.id)"
          />
          <Button
            v-if="isReviewer && (plan.status === 'SUBMITTED_FOR_REVIEW' || (plan.status === 'COMPLETED' && !plan.needsKomiteReview))"
            label="Verifikasi"
            size="small"
            severity="success"
            :loading="verifyPlanLoading === plan.id"
            @click="doVerifyPlan(plan.id)"
          />
        </div>
      </div>
    </template>
  </Dialog>

  <!-- ─── Delete Entry Dialog ───────────────────────────────────────────────── -->
  <Dialog v-model:visible="showDeleteEntry" modal header="Hapus Entri Risiko" :style="{ width: '420px' }">
    <div class="wpd-confirm-body">
      <div class="wpd-confirm-icon wpd-confirm-icon--delete">
        <i class="pi pi-trash" />
      </div>
      <p class="wpd-confirm-text">
        Hapus entri risiko <strong>{{ deleteEntryTarget?.code }} – {{ deleteEntryTarget?.name }}</strong>?
      </p>
      <p class="wpd-confirm-hint">Tindakan ini tidak dapat dibatalkan.</p>
      <div v-if="deleteEntryError" class="wpd-form-api-error">
        <i class="pi pi-exclamation-triangle" /> {{ deleteEntryError }}
      </div>
    </div>
    <template #footer>
      <Button label="Batal" severity="secondary" :disabled="deleteEntryLoading" @click="showDeleteEntry = false" />
      <Button label="Hapus" severity="danger" :loading="deleteEntryLoading" @click="doDeleteEntry" />
    </template>
  </Dialog>

  <!-- ─── Detail Entry Modal ────────────────────────────────────────────────── -->
  <Dialog v-model:visible="showDetailModal" modal header="Detail Entri Risiko" :style="{ width: '860px' }">
    <div v-if="expandedEntryLoading" class="wpd-expand-loading">
      <ProgressSpinner style="width:24px;height:24px" />
    </div>
    <div v-else-if="expandedEntryError" class="wpd-expand-error">{{ expandedEntryError }}</div>
    <div v-else-if="expandedEntryDetail" class="wpd-expand-panel">
      <!-- Section 1: Penilaian Risiko Inheren -->
      <div class="wpd-ep-section">
        <div class="wpd-ep-section-header">
          <i class="pi pi-chart-bar" />
          <span>Penilaian Risiko Inheren</span>
          <div v-if="expandedEntryDetail.inherentAssessment?.riskLevel"
            class="wpd-ep-risk-summary"
            :style="{ background: expandedEntryDetail.inherentAssessment.riskLevel.color + '22', color: expandedEntryDetail.inherentAssessment.riskLevel.color ?? undefined }">
            Skor {{ expandedEntryDetail.inherentAssessment.finalScore }} —
            {{ expandedEntryDetail.inherentAssessment.riskLevel.name }}
          </div>
        </div>
        <table class="wpd-ep-area-table">
          <thead>
            <tr>
              <th>Area Dampak</th>
              <th>Kemungkinan</th>
              <th>Dampak</th>
              <th>Skor</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="as in expandedEntryDetail.inherentAssessment?.areaScores" :key="as.id">
              <td>{{ as.impactArea.name }}</td>
              <td>
                <span class="wpd-ep-level-pill">{{ as.likelihoodLevel }}</span>
                <span v-if="as.likelihoodDescription" class="wpd-ep-level-desc">{{ as.likelihoodDescription }}</span>
              </td>
              <td>
                <span class="wpd-ep-level-pill">{{ as.impactLevel }}</span>
                <span v-if="as.impactDescription" class="wpd-ep-level-desc">{{ as.impactDescription }}</span>
              </td>
              <td><span class="wpd-ep-score">{{ as.score }}</span></td>
            </tr>
          </tbody>
        </table>
        <p v-if="expandedEntryDetail.inherentAssessment?.notes" class="wpd-ep-notes">
          <i class="pi pi-info-circle" /> {{ expandedEntryDetail.inherentAssessment.notes }}
        </p>
      </div>
      <!-- Section 2: Kontrol Risiko -->
      <div class="wpd-ep-section">
        <div class="wpd-ep-section-header">
          <i class="pi pi-shield" />
          <span>Kontrol Risiko</span>
          <span class="wpd-ep-count-pill">{{ expandedEntryDetail.controls?.length ?? 0 }}</span>
        </div>
        <div v-if="!expandedEntryDetail.controls?.length" class="wpd-ep-empty">Tidak ada kontrol terdaftar.</div>
        <div v-else class="wpd-ep-controls-list">
          <div v-for="ctrl in expandedEntryDetail.controls" :key="ctrl.id" class="wpd-ep-control-item">
            <span class="wpd-ep-ctrl-name">{{ ctrl.name }}</span>
            <span class="wpd-ep-effectiveness" :class="`eff-${ctrl.effectiveness.toLowerCase()}`">
              {{ CONTROL_EFFECTIVENESS_LABELS[ctrl.effectiveness] }}
            </span>
          </div>
        </div>
      </div>
      <!-- Section 3: Rencana Penanganan -->
      <div class="wpd-ep-section">
        <div class="wpd-ep-section-header">
          <i class="pi pi-list-check" />
          <span>Rencana Penanganan</span>
          <span class="wpd-ep-count-pill">{{ expandedEntryDetail.treatmentPlans?.length ?? 0 }}</span>
          <button v-if="expandedEntryDetail._count?.treatmentPlans"
            type="button" class="wpd-ep-view-plans-btn"
            @click="openTreatmentPlans(expandedEntryDetail)">
            Lihat Detail <i class="pi pi-arrow-right" />
          </button>
        </div>
        <div v-if="!expandedEntryDetail.treatmentPlans?.length" class="wpd-ep-empty">Tidak ada rencana penanganan.</div>
        <div v-else class="wpd-ep-plans-summary">
          <div v-for="plan in expandedEntryDetail.treatmentPlans" :key="plan.id" class="wpd-ep-plan-row">
            <span class="wpd-ep-plan-area">{{ plan.impactArea?.name ?? '—' }}</span>
            <span class="wpd-ep-plan-option">{{ plan.treatmentOption?.name ?? 'Opsi belum dipilih' }}</span>
            <span class="wpd-tp-status-badge" :class="`status-${plan.status.toLowerCase().replace(/_/g, '-')}`">
              {{ TREATMENT_STATUS_LABELS[plan.status] }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </Dialog>

  <!-- ─── Penilaian Inherent Modal ──────────────────────────────────────────── -->
  <Dialog v-model:visible="showInherentModal" modal header="Penilaian Risiko Inheren" :style="{ width: '900px' }">
    <div v-if="inherentContextLoading" class="wpd-centered"><ProgressSpinner style="width:28px;height:28px" /></div>
    <div v-else-if="inherentContextError" class="wpd-ctx-error">{{ inherentContextError }}</div>
    <template v-else-if="inherentContextDetail">
      <p class="wpd-modal-entry-name">{{ inherentModalEntry?.name }}</p>

      <!-- Header row: label + add button -->
      <div class="wpd-inh-tbl-header">
        <span class="wpd-inh-tbl-label">Penilaian Area Dampak</span>
        <button type="button" class="wpd-inh-add-btn" @click="openAddAreaScore">
          <i class="pi pi-plus" /> Tambah Penilaian
        </button>
      </div>

      <div v-if="inherentAreaError" class="wpd-form-api-error" style="margin-bottom:0.75rem">
        <i class="pi pi-exclamation-circle" /> {{ inherentAreaError }}
      </div>

      <!-- Empty state -->
      <div v-if="!inherentScoresList.length" class="wpd-inh-empty">
        <i class="pi pi-chart-bar" />
        <span>Belum ada penilaian. Klik "Tambah Penilaian" untuk menilai area dampak.</span>
      </div>

      <!-- Table -->
      <table v-else class="wpd-inh-tbl">
        <thead>
          <tr>
            <th>Area Dampak</th>
            <th>Kemungkinan</th>
            <th>Deskripsi Kemungkinan</th>
            <th>Dampak</th>
            <th>Deskripsi Dampak</th>
            <th>Skor</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in inherentScoresList" :key="item.impactAreaId">
            <td class="wpd-inh-td-area">{{ getAreaNameById(item.impactAreaId) }}</td>
            <td class="wpd-inh-td-level">
              <span class="wpd-inh-lvl-num">{{ item.likelihoodLevel }}</span>
              <span class="wpd-inh-lvl-name">{{ getLikelihoodLabelById(item.impactAreaId, item.likelihoodLevel) }}</span>
            </td>
            <td class="wpd-inh-td-desc">{{ getLikelihoodDescById(item.impactAreaId, item.likelihoodLevel) }}</td>
            <td class="wpd-inh-td-level">
              <span class="wpd-inh-lvl-num">{{ item.impactLevel }}</span>
              <span class="wpd-inh-lvl-name">{{ getImpactLabelById(item.impactAreaId, item.impactLevel) }}</span>
            </td>
            <td class="wpd-inh-td-desc">{{ getImpactDescById(item.impactAreaId, item.impactLevel) }}</td>
            <td class="wpd-inh-td-score">
              <span class="wpd-inh-score-chip" :style="getScoreBadgeStyle(item.score)">{{ item.score }}</span>
            </td>
            <td class="wpd-inh-td-aksi">
              <button class="wpd-inh-row-btn" title="Edit" @click="openEditAreaScore(idx)"><i class="pi pi-pencil" /></button>
              <button class="wpd-inh-row-btn wpd-inh-row-btn--danger" title="Hapus" @click="removeAreaScore(idx)"><i class="pi pi-trash" /></button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Overall score -->
      <div v-if="inherentOverallScore !== null" class="wpd-inh-score-summary">
        <span class="wpd-inh-score-label">Skor Tertinggi</span>
        <span class="wpd-inh-score-value" :style="{ color: inherentOverallRiskLevel?.color ?? 'var(--color-accent)' }">
          {{ inherentOverallScore }}
        </span>
        <span v-if="inherentOverallRiskLevel" class="wpd-inh-level-pill"
          :style="{ background: (inherentOverallRiskLevel.color ?? '#64748b') + '22', color: inherentOverallRiskLevel.color ?? '#64748b', borderColor: (inherentOverallRiskLevel.color ?? '#64748b') + '44' }">
          {{ inherentOverallRiskLevel.name }}
        </span>
      </div>

      <div v-if="inherentSubmitError" class="wpd-form-api-error" style="margin-top:0.75rem">
        <i class="pi pi-exclamation-triangle" /> {{ inherentSubmitError }}
      </div>
    </template>
    <template #footer>
      <Button label="Batal" severity="secondary" :disabled="inherentSubmitLoading" @click="showInherentModal = false" />
      <Button label="Simpan Penilaian" :loading="inherentSubmitLoading" :disabled="inherentContextLoading || !!inherentContextError" @click="submitInherentAssessment" />
    </template>
  </Dialog>

  <!-- ─── Area Score Sub-modal ──────────────────────────────────────────────── -->
  <Dialog
    v-model:visible="showAreaScoreSubModal"
    modal
    :header="editingAreaScoreIndex !== null ? 'Edit Penilaian' : 'Tambah Penilaian'"
    :style="{ width: '500px' }"
  >
    <!-- Area Dampak -->
    <div class="wpd-form-group">
      <label class="wpd-form-label">Area Dampak <span class="wpd-req">*</span></label>
      <select
        v-model="areaScoreSubForm.impactAreaId"
        class="wpd-form-input"
        :disabled="editingAreaScoreIndex !== null"
        @change="areaScoreSubForm.likelihoodLevel = 0; areaScoreSubForm.impactLevel = 0"
      >
        <option value="">— Pilih area dampak —</option>
        <option
          v-for="area in availableAreasForSubModal"
          :key="area.id"
          :value="area.id"
        >{{ area.name }}</option>
      </select>
      <span v-if="areaScoreSubErrors.impactAreaId" class="wpd-form-err">{{ areaScoreSubErrors.impactAreaId }}</span>
    </div>

    <!-- Kemungkinan (Likelihood) -->
    <div class="wpd-form-group">
      <label class="wpd-form-label">Kemungkinan <span class="wpd-req">*</span></label>
      <div v-if="!areaScoreSubForm.impactAreaId" class="wpd-crit-placeholder">Pilih area dampak terlebih dahulu</div>
      <div v-else class="wpd-crit-list">
        <button
          v-for="crit in subModalSelectedArea?.likelihoodCriteria ?? []"
          :key="crit.level"
          type="button"
          class="wpd-crit-item"
          :class="{ 'is-selected': areaScoreSubForm.likelihoodLevel === crit.level }"
          @click="areaScoreSubForm.likelihoodLevel = crit.level"
        >
          <span class="wpd-crit-badge">{{ crit.level }}</span>
          <span class="wpd-crit-body">
            <span class="wpd-crit-desc">{{ crit.description || crit.name }}</span>
            <span class="wpd-crit-name">{{ crit.name }}</span>
          </span>
        </button>
      </div>
      <span v-if="areaScoreSubErrors.likelihoodLevel" class="wpd-form-err">{{ areaScoreSubErrors.likelihoodLevel }}</span>
    </div>

    <!-- Dampak (Impact) -->
    <div class="wpd-form-group">
      <label class="wpd-form-label">Dampak <span class="wpd-req">*</span></label>
      <div v-if="!areaScoreSubForm.impactAreaId" class="wpd-crit-placeholder">Pilih area dampak terlebih dahulu</div>
      <div v-else class="wpd-crit-list">
        <button
          v-for="crit in subModalSelectedArea?.impactCriteria ?? []"
          :key="crit.level"
          type="button"
          class="wpd-crit-item"
          :class="{ 'is-selected': areaScoreSubForm.impactLevel === crit.level }"
          @click="areaScoreSubForm.impactLevel = crit.level"
        >
          <span class="wpd-crit-badge">{{ crit.level }}</span>
          <span class="wpd-crit-body">
            <span class="wpd-crit-desc">{{ crit.description || crit.name }}</span>
            <span class="wpd-crit-name">{{ crit.name }}</span>
          </span>
        </button>
      </div>
      <span v-if="areaScoreSubErrors.impactLevel" class="wpd-form-err">{{ areaScoreSubErrors.impactLevel }}</span>
    </div>

    <!-- Preview score -->
    <div v-if="subModalPreviewScore !== null" class="wpd-inh-preview-score">
      <span class="wpd-inh-preview-label">Skor:</span>
      <span class="wpd-inh-score-chip" :style="getScoreBadgeStyle(subModalPreviewScore)">{{ subModalPreviewScore }}</span>
    </div>

    <template #footer>
      <Button label="Batal" severity="secondary" @click="showAreaScoreSubModal = false" />
      <Button :label="editingAreaScoreIndex !== null ? 'Simpan' : 'Tambahkan'" @click="confirmAreaScore" />
    </template>
  </Dialog>

  <!-- ─── Tandai Mitigasi Selesai & Penilaian Residual Modal ──────────────── -->
  <Dialog v-model:visible="showResidualModal" modal header="Tandai Mitigasi Selesai" :style="{ width: '700px' }">
    <div v-if="residualContextLoading" class="wpd-centered"><ProgressSpinner style="width:28px;height:28px" /></div>
    <div v-else-if="residualContextError" class="wpd-ctx-error">{{ residualContextError }}</div>
    <template v-else-if="residualContextDetail">
      <p class="wpd-modal-entry-name">{{ residualModalEntry?.name }}</p>

      <!-- Step 1: pilih rencana penanganan yang selesai -->
      <div class="wpd-form-group">
        <label class="wpd-form-label">Pilih Rencana Penanganan yang Selesai <span class="wpd-req">*</span></label>
        <div v-if="!plannedPlansWithInherentScore.length" class="wpd-crit-placeholder">
          Tidak ada rencana penanganan PLANNED yang memiliki penilaian inheren.
        </div>
        <select v-else v-model="residualSelectedPlanId" class="wpd-form-input" @change="onResidualPlanChange">
          <option value="">— Pilih rencana penanganan —</option>
          <option v-for="plan in plannedPlansWithInherentScore" :key="plan.id" :value="plan.id">
            {{ plan.impactArea?.name ?? '—' }}{{ plan.treatmentOption?.name ? ` · ${plan.treatmentOption.name}` : '' }}{{ plan.description ? ` – ${plan.description.slice(0, 60)}` : '' }}
          </option>
        </select>
        <span v-if="residualFormErrors.planId" class="wpd-form-err">{{ residualFormErrors.planId }}</span>
      </div>

      <!-- Step 2: penilaian residual untuk area dampak yang dipilih -->
      <template v-if="residualSelectedPlan">
        <div class="wpd-res-divider" />

        <!-- Referensi skor inheren -->
        <div class="wpd-res-inherent-ref">
          <span class="wpd-res-inherent-ref-label">Skor Inheren Area Ini:</span>
          <span class="wpd-inh-score-chip" :style="getResidualScoreBadgeStyle(residualInherentScore!)">
            {{ residualInherentScore }}
          </span>
        </div>

        <div class="wpd-inh-tbl-label" style="margin:0.75rem 0 0.5rem">Penilaian Risiko Residual — {{ residualSelectedArea?.name }}</div>

        <!-- Kemungkinan -->
        <div class="wpd-form-group">
          <label class="wpd-form-label">Kemungkinan <span class="wpd-req">*</span></label>
          <div class="wpd-crit-list">
            <button
              v-for="crit in residualSelectedArea?.likelihoodCriteria ?? []"
              :key="crit.level"
              type="button"
              class="wpd-crit-item"
              :class="{ 'is-selected': residualForm.likelihoodLevel === crit.level }"
              @click="residualForm.likelihoodLevel = crit.level"
            >
              <span class="wpd-crit-badge">{{ crit.level }}</span>
              <span class="wpd-crit-body">
                <span class="wpd-crit-desc">{{ crit.description || crit.name }}</span>
                <span class="wpd-crit-name">{{ crit.name }}</span>
              </span>
            </button>
          </div>
          <span v-if="residualFormErrors.likelihoodLevel" class="wpd-form-err">{{ residualFormErrors.likelihoodLevel }}</span>
        </div>

        <!-- Dampak -->
        <div class="wpd-form-group">
          <label class="wpd-form-label">Dampak <span class="wpd-req">*</span></label>
          <div class="wpd-crit-list">
            <button
              v-for="crit in residualSelectedArea?.impactCriteria ?? []"
              :key="crit.level"
              type="button"
              class="wpd-crit-item"
              :class="{ 'is-selected': residualForm.impactLevel === crit.level }"
              @click="residualForm.impactLevel = crit.level"
            >
              <span class="wpd-crit-badge">{{ crit.level }}</span>
              <span class="wpd-crit-body">
                <span class="wpd-crit-desc">{{ crit.description || crit.name }}</span>
                <span class="wpd-crit-name">{{ crit.name }}</span>
              </span>
            </button>
          </div>
          <span v-if="residualFormErrors.impactLevel" class="wpd-form-err">{{ residualFormErrors.impactLevel }}</span>
        </div>

        <!-- Preview skor -->
        <div v-if="residualPreviewScore !== null" class="wpd-inh-preview-score">
          <span class="wpd-inh-preview-label">Skor Residual:</span>
          <span class="wpd-inh-score-chip" :style="getResidualScoreBadgeStyle(residualPreviewScore)">{{ residualPreviewScore }}</span>
        </div>
      </template>

      <div v-if="residualSubmitError" class="wpd-form-api-error" style="margin-top:0.75rem">
        <i class="pi pi-exclamation-triangle" /> {{ residualSubmitError }}
      </div>
    </template>
    <template #footer>
      <Button label="Batal" severity="secondary" :disabled="residualSubmitLoading" @click="showResidualModal = false" />
      <Button
        label="Tandai Selesai & Simpan Penilaian"
        :loading="residualSubmitLoading"
        :disabled="residualContextLoading || !!residualContextError || !residualSelectedPlanId"
        @click="submitResidualAssessment"
      />
    </template>
  </Dialog>

  <!-- ─── Rencana Penanganan Modal ──────────────────────────────────────────── -->
  <Dialog v-model:visible="showTreatmentModal" modal header="Rencana Penanganan" :style="{ width: '900px' }">
    <div v-if="treatmentModalLoading" class="wpd-centered"><ProgressSpinner style="width:28px;height:28px" /></div>
    <div v-else-if="treatmentModalError" class="wpd-ctx-error">{{ treatmentModalError }}</div>
    <template v-else>
      <p class="wpd-modal-entry-name">{{ treatmentModalEntry?.name }}</p>

      <!-- Header row -->
      <div class="wpd-inh-tbl-header">
        <span class="wpd-inh-tbl-label">Daftar Rencana Penanganan</span>
        <button type="button" class="wpd-inh-add-btn" @click="openAddTreatmentPlan">
          <i class="pi pi-plus" /> Tambah Rencana
        </button>
      </div>

      <!-- Empty state -->
      <div v-if="!treatmentPlansForm.length" class="wpd-inh-empty">
        <i class="pi pi-clipboard" />
        <span>Belum ada rencana penanganan. Klik "Tambah Rencana" untuk menambahkan.</span>
      </div>

      <!-- Table -->
      <table v-else class="wpd-inh-tbl">
        <thead>
          <tr>
            <th>Area Dampak</th>
            <th>Opsi Penanganan</th>
            <th>Deskripsi Rencana</th>
            <th>PIC</th>
            <th>Target Selesai</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(plan, idx) in treatmentPlansForm" :key="idx">
            <td class="wpd-inh-td-area">{{ getTreatmentAreaName(plan.impactAreaId) }}</td>
            <td class="wpd-tp-td-option">{{ getTreatmentOptionName(plan.treatmentOptionId) }}</td>
            <td class="wpd-inh-td-desc">{{ plan.description || '—' }}</td>
            <td class="wpd-tp-td-pic">{{ getTreatmentPicName(plan.picUserId) }}</td>
            <td class="wpd-tp-td-date">{{ plan.targetDate || '—' }}</td>
            <td class="wpd-inh-td-aksi">
              <button class="wpd-inh-row-btn" title="Edit" @click="openEditTreatmentPlan(idx)"><i class="pi pi-pencil" /></button>
              <button class="wpd-inh-row-btn wpd-inh-row-btn--danger" title="Hapus" @click="removeTreatmentPlan(idx)"><i class="pi pi-trash" /></button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="treatmentSubmitError" class="wpd-form-api-error" style="margin-top:0.75rem">
        <i class="pi pi-exclamation-triangle" /> {{ treatmentSubmitError }}
      </div>
    </template>
    <template #footer>
      <Button label="Batal" severity="secondary" :disabled="treatmentSubmitLoading" @click="showTreatmentModal = false" />
      <Button label="Simpan" :loading="treatmentSubmitLoading" :disabled="treatmentModalLoading || !!treatmentModalError" @click="submitTreatmentPlans" />
    </template>
  </Dialog>

  <!-- ─── Treatment Plan Sub-modal ─────────────────────────────────────────── -->
  <Dialog
    v-model:visible="showTreatmentSubModal"
    modal
    :header="editingTreatmentPlanIndex !== null ? 'Edit Rencana Penanganan' : 'Tambah Rencana Penanganan'"
    :style="{ width: '500px' }"
  >
    <!-- Area Dampak -->
    <div class="wpd-form-group">
      <label class="wpd-form-label">Area Dampak <span class="wpd-req">*</span></label>
      <select
        v-model="treatmentSubForm.impactAreaId"
        class="wpd-form-input"
        :disabled="editingTreatmentPlanIndex !== null"
      >
        <option value="">— Pilih area dampak —</option>
        <option
          v-for="area in availableAreasForTreatmentSubModal"
          :key="area.impactAreaId"
          :value="area.impactAreaId"
        >{{ area.name }}</option>
      </select>
      <span v-if="treatmentSubErrors.impactAreaId" class="wpd-form-err">{{ treatmentSubErrors.impactAreaId }}</span>
    </div>

    <!-- Opsi Penanganan -->
    <div class="wpd-form-group">
      <label class="wpd-form-label">
        Opsi Penanganan
        <span v-if="subModalAreaScore != null && appetiteThreshold" class="wpd-form-opt">
          ({{ subModalAreaScore <= appetiteThreshold.maxScore ? 'wajib Diterima' : 'tidak dapat Diterima' }})
        </span>
        <span v-else class="wpd-form-opt">(opsional)</span>
      </label>
      <div
        v-if="subModalAreaScore != null && appetiteThreshold"
        class="wpd-tp-appetite-hint"
        :class="subModalAreaScore <= appetiteThreshold.maxScore ? 'hint-accept' : 'hint-reject'"
      >
        <i :class="subModalAreaScore <= appetiteThreshold.maxScore ? 'pi pi-check-circle' : 'pi pi-exclamation-circle'" />
        <span v-if="subModalAreaScore <= appetiteThreshold.maxScore">
          Skor area ini ({{ subModalAreaScore }}) berada dalam selera risiko — hanya opsi <strong>Diterima</strong> yang tersedia.
        </span>
        <span v-else>
          Skor area ini ({{ subModalAreaScore }}) melebihi selera risiko — opsi <strong>Diterima</strong> tidak tersedia.
        </span>
      </div>
      <select v-model="treatmentSubForm.treatmentOptionId" class="wpd-form-input">
        <option value="">— Tanpa opsi spesifik —</option>
        <option v-for="opt in availableTreatmentOptionsForSubModal" :key="opt.id" :value="opt.id">
          {{ opt.name }}{{ opt.isAcceptance ? ' (Diterima)' : '' }}
        </option>
      </select>
      <p v-if="treatmentSubSelectedOption?.isAcceptance" class="wpd-tp-acceptance-note">
        <i class="pi pi-info-circle" /> Opsi ini menandakan risiko <strong>diterima</strong> — status mitigasi akan otomatis <strong>Selesai</strong> dan penilaian residual akan disalin dari inheren saat disimpan.
      </p>
    </div>

    <!-- Deskripsi Rencana -->
    <div class="wpd-form-group">
      <label class="wpd-form-label">Deskripsi Rencana <span class="wpd-form-opt">(opsional)</span></label>
      <textarea v-model="treatmentSubForm.description" class="wpd-form-input wpd-form-textarea" rows="3" />
    </div>

    <!-- PIC -->
    <div class="wpd-form-group">
      <label class="wpd-form-label">PIC Pelaksana <span class="wpd-form-opt">(opsional)</span></label>
      <input v-model="treatmentSubForm.picUserId" type="text" class="wpd-form-input" placeholder="Nama PIC pelaksana" />
    </div>

    <!-- Target Selesai -->
    <div class="wpd-form-group">
      <label class="wpd-form-label">Target Selesai <span class="wpd-form-opt">(opsional)</span></label>
      <input v-model="treatmentSubForm.targetDate" type="date" class="wpd-form-input" />
    </div>

    <template #footer>
      <Button label="Batal" severity="secondary" @click="showTreatmentSubModal = false" />
      <Button :label="editingTreatmentPlanIndex !== null ? 'Simpan' : 'Tambahkan'" @click="confirmTreatmentPlan" />
    </template>
  </Dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'
import { workingPaperApi, WORKING_PAPER_STATUS_LABELS, type WorkingPaper, type WpStats } from '@/api/workingPaper'
import WpStatsPanel from '@/components/WpStatsPanel.vue'
import { programFrameworkApi, type ProgramFramework } from '@/api/programFramework'
import { riskContextApi, type RiskContext, type RiskCategory, type RiskContextDetail, type ImpactArea } from '@/api/riskContext'
import { programFrameworkContextApi, type ProgramFrameworkContext } from '@/api/programFrameworkContext'
import { riskEntryApi, TREATMENT_STATUS_LABELS, CONTROL_EFFECTIVENESS_LABELS, type RiskEntry, type RiskTreatmentPlan } from '@/api/riskEntry'
import { extractApiError } from '@/utils/apiError'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const auth = useAuthStore()

const wpId = route.params.id as string

const isReviewer = computed(() =>
  auth.user?.roles?.includes('KOMITE_PUSAT') || auth.user?.roles?.includes('ADMINISTRATOR')
)
const isOwner = computed(() =>
  auth.user?.roles?.includes('PENGELOLA_RISIKO_UKER')
)

const wp = ref<WorkingPaper | null>(null)
const loading = ref(false)
const error = ref('')

const programFrameworks = ref<ProgramFramework[]>([])
// for display: all active contexts per programFramework (keyed by pf.id)
const contextsMap = ref<Record<string, RiskContext[]>>({})
// for form dropdown: only contexts linked via ProgramFrameworkContext (keyed by pf.id)
const pfcMap = ref<Record<string, ProgramFrameworkContext[]>>({})
const contextsLoading = ref(false)
const contextsError = ref('')

const totalContextCount = computed(() =>
  Object.values(contextsMap.value).reduce((sum, arr) => sum + arr.length, 0)
)

// flat list of all PFCs across all frameworks, for the entry form dropdown
const pfcOptions = computed(() => {
  const opts: { id: string; riskContextId: string; label: string; frameworkCode: string }[] = []
  for (const pf of programFrameworks.value) {
    const pfcs = pfcMap.value[pf.id] ?? []
    for (const pfc of pfcs) {
      opts.push({
        id: pfc._linkId,
        riskContextId: pfc.id,
        label: `[${pfc.code}] ${pfc.name}`,
        frameworkCode: pf.framework.code,
      })
    }
  }
  return opts
})

const contextSectionOpen = ref(false)
const showDetailModal = ref(false)

// ─── Risk Entries ─────────────────────────────────────────────────────────────

const entries = ref<RiskEntry[]>([])
const entriesLoading = ref(false)
const entriesError = ref('')
const wpStats = ref<WpStats | null>(null)
const statsLoading = ref(false)
const PAGE_LIMIT = 10
const currentPage = ref(0)
const hasMore = ref(true)
const loadingMore = ref(false)
const loadMoreSentinel = ref<HTMLElement | null>(null)

// ─── Expand Entry ─────────────────────────────────────────────────────────────

const expandedEntryId = ref<string | null>(null)
const expandedEntryDetail = ref<RiskEntry | null>(null)
const expandedEntryLoading = ref(false)
const expandedEntryError = ref('')

interface EntryGroup {
  key: string
  label: string
  type: 'asset' | 'process' | 'uncategorized'
  entries: RiskEntry[]
}

const groupedEntries = computed((): EntryGroup[] => {
  const map = new Map<string, EntryGroup>()
  for (const entry of entries.value) {
    let key: string, label: string, type: 'asset' | 'process' | 'uncategorized'
    if (entry.asset) {
      key = `asset-${entry.asset.id}`; label = entry.asset.name; type = 'asset'
    } else if (entry.businessProcess) {
      key = `process-${entry.businessProcess.id}`; label = entry.businessProcess.name; type = 'process'
    } else {
      key = '__uncategorized__'; label = 'Tidak Dikategorikan'; type = 'uncategorized'
    }
    if (!map.has(key)) map.set(key, { key, label, type, entries: [] })
    map.get(key)!.entries.push(entry)
  }
  const order = { asset: 0, process: 1, uncategorized: 2 }
  return [...map.values()]
    .map(g => ({ ...g, entries: [...g.entries].sort((a, b) => a.order - b.order) }))
    .sort((a, b) => order[a.type] - order[b.type])
})

// ─── Filter ───────────────────────────────────────────────────────────────────

const filterType = ref<'all' | 'asset' | 'process'>('all')
const filterGroupKey = ref('')

watch(filterType, () => { filterGroupKey.value = '' })

const availableGroupOptions = computed(() =>
  filterType.value === 'all'
    ? groupedEntries.value
    : groupedEntries.value.filter(g => g.type === filterType.value)
)

const filteredGroups = computed(() => {
  let groups = groupedEntries.value
  if (filterType.value !== 'all') groups = groups.filter(g => g.type === filterType.value)
  if (filterGroupKey.value)       groups = groups.filter(g => g.key === filterGroupKey.value)
  return groups
})

const filteredEntryCount = computed(() =>
  filteredGroups.value.reduce((sum, g) => sum + g.entries.length, 0)
)

function clearFilter() {
  filterType.value = 'all'
  filterGroupKey.value = ''
}

async function openDetailModal(entry: RiskEntry) {
  expandedEntryDetail.value = null
  expandedEntryError.value = ''
  showDetailModal.value = true
  expandedEntryLoading.value = true
  try {
    const res = await riskEntryApi.getById(entry.id)
    expandedEntryDetail.value = res.data.data
  } catch (err: any) {
    expandedEntryError.value = extractApiError(err, 'Gagal memuat detail penilaian.')
  } finally {
    expandedEntryLoading.value = false
  }
}

// category cache: riskContextId → RiskCategory[]
const categoryCache = ref<Record<string, RiskCategory[]>>({})
const categoryLoading = ref(false)

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

async function loadContexts(programId: string) {
  contextsLoading.value = true
  contextsError.value = ''
  try {
    const pfRes = await programFrameworkApi.listByProgram(programId)
    programFrameworks.value = pfRes.data.data ?? []

    // Load display contexts (all active in framework) AND PFCs (linked to program) in parallel
    const [ctxResults, pfcResults] = await Promise.all([
      Promise.all(
        programFrameworks.value.map(pf =>
          riskContextApi.listByFramework(pf.frameworkId)
            .then(r => ({
              pfId: pf.id,
              contexts: (r.data.data ?? []).filter(ctx => ctx.status === 'ACTIVE'),
            }))
        )
      ),
      Promise.all(
        programFrameworks.value.map(pf =>
          programFrameworkContextApi.list(pf.id)
            .then(r => ({ pfId: pf.id, pfcs: r.data.data ?? [] }))
        )
      ),
    ])

    const ctxMap: Record<string, RiskContext[]> = {}
    ctxResults.forEach(r => { ctxMap[r.pfId] = r.contexts })
    contextsMap.value = ctxMap

    const pMap: Record<string, ProgramFrameworkContext[]> = {}
    pfcResults.forEach(r => { pMap[r.pfId] = r.pfcs })
    pfcMap.value = pMap
  } catch (err: any) {
    contextsError.value = extractApiError(err, 'Gagal memuat konteks risiko program.')
  } finally {
    contextsLoading.value = false
  }
}

function goToContext(contextId: string) {
  router.push({ name: 'risk-context-detail', params: { contextId } })
}

async function loadWorkingPaper() {
  loading.value = true
  error.value = ''
  try {
    const res = await workingPaperApi.getById(wpId)
    wp.value = res.data.data
    loadContexts(res.data.data.programId)
  } catch (err: any) {
    error.value = extractApiError(err, 'Gagal memuat data kertas kerja.')
  } finally {
    loading.value = false
  }
}

// ─── Edit ─────────────────────────────────────────────────────────────────────

const showEdit = ref(false)
const editLoading = ref(false)
const editError = ref('')
const editForm = reactive({ title: '' })
const editTitleError = ref('')

const canEdit = computed(() => wp.value?.status === 'DRAFT')

const downloadingReport = ref(false)

async function downloadReport() {
  if (downloadingReport.value) return
  downloadingReport.value = true
  try {
    const res = await workingPaperApi.downloadReport(wpId)
    const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `Register-Risiko-${wp.value?.unitKerja?.code ?? wpId}-${wp.value?.program?.year ?? ''}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  } catch (err: any) {
    toast.add({ severity: 'error', summary: 'Gagal', detail: extractApiError(err, 'Gagal mengunduh laporan PDF.'), life: 4000 })
  } finally {
    downloadingReport.value = false
  }
}

function openEdit() {
  editForm.title = wp.value?.title ?? ''
  editTitleError.value = ''
  editError.value = ''
  showEdit.value = true
}

async function submitEdit() {
  editTitleError.value = ''
  if (!editForm.title.trim()) {
    editTitleError.value = 'Judul tidak boleh kosong'
    return
  }
  editLoading.value = true
  editError.value = ''
  try {
    const res = await workingPaperApi.update(wpId, { title: editForm.title.trim() })
    wp.value = res.data.data
    showEdit.value = false
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Kertas kerja berhasil diperbarui', life: 3000 })
  } catch (err: any) {
    editError.value = extractApiError(err, 'Gagal memperbarui kertas kerja.')
  } finally {
    editLoading.value = false
  }
}

async function toggleExpandEntry(entry: RiskEntry) {
  if (expandedEntryId.value === entry.id) {
    expandedEntryId.value = null
    expandedEntryDetail.value = null
    return
  }
  expandedEntryId.value = entry.id
  expandedEntryDetail.value = null
  expandedEntryError.value = ''
  expandedEntryLoading.value = true
  try {
    const res = await riskEntryApi.getById(entry.id)
    expandedEntryDetail.value = res.data.data
  } catch (err: any) {
    expandedEntryError.value = extractApiError(err, 'Gagal memuat detail penilaian.')
  } finally {
    expandedEntryLoading.value = false
  }
}

async function loadEntries() {
  currentPage.value = 0
  hasMore.value = true
  entriesLoading.value = true
  entriesError.value = ''
  try {
    const res = await riskEntryApi.listByWorkingPaper(wpId, { page: 1, limit: PAGE_LIMIT })
    entries.value = res.data.data ?? []
    currentPage.value = 1
    hasMore.value = res.data.meta?.hasMore ?? false
  } catch (err: any) {
    entriesError.value = extractApiError(err, 'Gagal memuat daftar entri risiko.')
  } finally {
    entriesLoading.value = false
  }
}

async function loadStats() {
  statsLoading.value = true
  try {
    const res = await workingPaperApi.getStats(wpId)
    wpStats.value = res.data.data
  } catch {
    // non-critical — stats failing shouldn't block the page
  } finally {
    statsLoading.value = false
  }
}

async function loadMoreEntries() {
  if (!hasMore.value || loadingMore.value || entriesLoading.value) return
  loadingMore.value = true
  try {
    const res = await riskEntryApi.listByWorkingPaper(wpId, { page: currentPage.value + 1, limit: PAGE_LIMIT })
    entries.value = [...entries.value, ...res.data.data]
    currentPage.value += 1
    hasMore.value = res.data.meta?.hasMore ?? false
  } catch {
    // silent — user can scroll again to retry
  } finally {
    loadingMore.value = false
  }
}

let _observer: IntersectionObserver | null = null

function _setupObserver() {
  _observer?.disconnect()
  if (!loadMoreSentinel.value) return
  _observer = new IntersectionObserver(
    ([entry]) => { if (entry.isIntersecting) loadMoreEntries() },
    { rootMargin: '0px 0px 300px 0px' },
  )
  _observer.observe(loadMoreSentinel.value)
}

watch(loadMoreSentinel, _setupObserver)

async function loadCategoriesForContext(riskContextId: string) {
  if (categoryCache.value[riskContextId]) return
  categoryLoading.value = true
  try {
    const res = await riskContextApi.getById(riskContextId)
    categoryCache.value[riskContextId] = res.data.data.riskCategories ?? []
  } catch {
    categoryCache.value[riskContextId] = []
  } finally {
    categoryLoading.value = false
  }
}

// ─── Edit Entry ───────────────────────────────────────────────────────────────

const showEditEntry = ref(false)
const editEntryLoading = ref(false)
const editEntryError = ref('')
const editEntryId = ref('')
const editEntryForm = reactive({
  programFrameworkContextId: '',
  code: '',
  name: '',
  description: '',
  riskCategoryId: '',
})
const editEntryErrors = reactive({
  code: '',
  name: '',
})

const editEntryCategories = computed(() => {
  const pfc = pfcOptions.value.find(o => o.id === editEntryForm.programFrameworkContextId)
  if (!pfc) return []
  return categoryCache.value[pfc.riskContextId] ?? []
})

watch(() => editEntryForm.programFrameworkContextId, (pfcId) => {
  if (!pfcId) return
  const pfc = pfcOptions.value.find(o => o.id === pfcId)
  if (pfc) loadCategoriesForContext(pfc.riskContextId)
})

function openEditEntry(entry: RiskEntry) {
  editEntryId.value = entry.id
  editEntryForm.programFrameworkContextId = entry.programFrameworkContextId
  editEntryForm.code = entry.code
  editEntryForm.name = entry.name
  editEntryForm.description = entry.description ?? ''
  editEntryForm.riskCategoryId = entry.riskCategoryId ?? ''
  editEntryErrors.code = ''
  editEntryErrors.name = ''
  editEntryError.value = ''
  // pre-load categories for the current context
  const pfc = pfcOptions.value.find(o => o.id === entry.programFrameworkContextId)
  if (pfc) loadCategoriesForContext(pfc.riskContextId)
  showEditEntry.value = true
}

async function submitEditEntry() {
  editEntryErrors.code = ''
  editEntryErrors.name = ''

  let hasError = false
  if (!editEntryForm.code.trim()) {
    editEntryErrors.code = 'Kode tidak boleh kosong'
    hasError = true
  }
  if (!editEntryForm.name.trim()) {
    editEntryErrors.name = 'Nama risiko tidak boleh kosong'
    hasError = true
  }
  if (hasError) return

  editEntryLoading.value = true
  editEntryError.value = ''
  try {
    await riskEntryApi.update(editEntryId.value, {
      programFrameworkContextId: editEntryForm.programFrameworkContextId,
      code: editEntryForm.code.trim(),
      name: editEntryForm.name.trim(),
      description: editEntryForm.description.trim() || null,
      riskCategoryId: editEntryForm.riskCategoryId || null,
    })
    showEditEntry.value = false
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Entri risiko berhasil diperbarui', life: 3000 })
    loadEntries()
    loadStats()
  } catch (err: any) {
    editEntryError.value = extractApiError(err, 'Gagal memperbarui entri risiko.')
  } finally {
    editEntryLoading.value = false
  }
}

// ─── Delete Entry ─────────────────────────────────────────────────────────────

const showDeleteEntry = ref(false)
const deleteEntryLoading = ref(false)
const deleteEntryError = ref('')
const deleteEntryTarget = ref<RiskEntry | null>(null)

function openDeleteEntry(entry: RiskEntry) {
  deleteEntryTarget.value = entry
  deleteEntryError.value = ''
  showDeleteEntry.value = true
}

async function doDeleteEntry() {
  if (!deleteEntryTarget.value) return
  deleteEntryLoading.value = true
  deleteEntryError.value = ''
  try {
    await riskEntryApi.remove(deleteEntryTarget.value.id)
    showDeleteEntry.value = false
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Entri risiko berhasil dihapus', life: 3000 })
    loadEntries()
    loadStats()
    loadWorkingPaper()
  } catch (err: any) {
    deleteEntryError.value = extractApiError(err, 'Gagal menghapus entri risiko.')
  } finally {
    deleteEntryLoading.value = false
  }
}

// ─── Treatment Plans ──────────────────────────────────────────────────────────

const showTreatmentPlans = ref(false)
const treatmentPlanEntry = ref<RiskEntry | null>(null)
const treatmentPlansLoading = ref(false)
const treatmentPlansError = ref('')

async function openTreatmentPlans(entry: RiskEntry) {
  treatmentPlanEntry.value = null
  treatmentPlansError.value = ''
  showTreatmentPlans.value = true
  treatmentPlansLoading.value = true
  try {
    const res = await riskEntryApi.getById(entry.id)
    treatmentPlanEntry.value = res.data.data
  } catch (err: any) {
    treatmentPlansError.value = extractApiError(err, 'Gagal memuat rencana penanganan.')
  } finally {
    treatmentPlansLoading.value = false
  }
}

const submitPlanLoading = ref<string | null>(null)
async function doSubmitPlan(planId: string) {
  if (!treatmentPlanEntry.value) return
  submitPlanLoading.value = planId
  try {
    await riskEntryApi.submitTreatmentPlan(treatmentPlanEntry.value.id, planId)
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Rencana diajukan ke Komite Pusat', life: 3000 })
    const res = await riskEntryApi.getById(treatmentPlanEntry.value.id)
    treatmentPlanEntry.value = res.data.data
  } catch (err: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: extractApiError(err, 'Gagal mengajukan rencana.'), life: 4000 })
  } finally {
    submitPlanLoading.value = null
  }
}

const verifyPlanLoading = ref<string | null>(null)
async function doVerifyPlan(planId: string) {
  if (!treatmentPlanEntry.value) return
  verifyPlanLoading.value = planId
  try {
    await riskEntryApi.verifyTreatmentPlan(treatmentPlanEntry.value.id, planId)
    toast.add({ severity: 'success', summary: 'Terverifikasi', detail: 'Rencana terverifikasi dan kontrol telah dibuat', life: 3000 })
    const res = await riskEntryApi.getById(treatmentPlanEntry.value.id)
    treatmentPlanEntry.value = res.data.data
    loadEntries()
    loadStats()
  } catch (err: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: extractApiError(err, 'Gagal memverifikasi rencana.'), life: 4000 })
  } finally {
    verifyPlanLoading.value = null
  }
}

// ─── Action Menu (dropdown per entry) ────────────────────────────────────────

const activeActionMenu = ref<string | null>(null)
const actionMenuPos = ref({ top: 0, right: 0 })

function toggleActionMenu(entryId: string, event: MouseEvent) {
  if (activeActionMenu.value === entryId) {
    activeActionMenu.value = null
    return
  }
  const btn = event.currentTarget as HTMLElement
  const rect = btn.getBoundingClientRect()
  actionMenuPos.value = {
    top: rect.bottom + 4,
    right: window.innerWidth - rect.right,
  }
  activeActionMenu.value = entryId
}

function handleDocumentClick() {
  activeActionMenu.value = null
}

// ─── Penilaian Inherent Modal ─────────────────────────────────────────────────

const showInherentModal = ref(false)
const inherentModalEntry = ref<RiskEntry | null>(null)
const inherentContextDetail = ref<RiskContextDetail | null>(null)
const inherentContextLoading = ref(false)
const inherentContextError = ref('')
const inherentAreaError = ref('')
const inherentSubmitLoading = ref(false)
const inherentSubmitError = ref('')

interface InherentScoreItem {
  impactAreaId: string
  likelihoodLevel: number
  impactLevel: number
  score: number
}

const inherentScoresList = ref<InherentScoreItem[]>([])

// Sub-modal state
const showAreaScoreSubModal = ref(false)
const editingAreaScoreIndex = ref<number | null>(null)
const areaScoreSubForm = ref({ impactAreaId: '', likelihoodLevel: 0, impactLevel: 0 })
const areaScoreSubErrors = ref<{ impactAreaId?: string; likelihoodLevel?: string; impactLevel?: string }>({})

function calcScore(impactAreaId: string, likelihoodLevel: number, impactLevel: number): number {
  if (!inherentContextDetail.value) return likelihoodLevel * impactLevel
  const cell = inherentContextDetail.value.matrixCells?.find(
    c => c.row === likelihoodLevel && c.col === impactLevel
  )
  return cell ? cell.value : likelihoodLevel * impactLevel
}

const availableAreasForSubModal = computed<ImpactArea[]>(() => {
  if (!inherentContextDetail.value) return []
  const usedIds = new Set(inherentScoresList.value.map(s => s.impactAreaId))
  if (editingAreaScoreIndex.value !== null) {
    // When editing, current item's area is still "available" (it's the one being edited)
    usedIds.delete(inherentScoresList.value[editingAreaScoreIndex.value]?.impactAreaId ?? '')
  }
  return inherentContextDetail.value.impactAreas.filter(a => !usedIds.has(a.id))
})

const subModalSelectedArea = computed<ImpactArea | null>(() => {
  if (!areaScoreSubForm.value.impactAreaId || !inherentContextDetail.value) return null
  return inherentContextDetail.value.impactAreas.find(a => a.id === areaScoreSubForm.value.impactAreaId) ?? null
})

const subModalPreviewScore = computed<number | null>(() => {
  const { likelihoodLevel, impactLevel, impactAreaId } = areaScoreSubForm.value
  if (!impactAreaId || !likelihoodLevel || !impactLevel) return null
  return calcScore(impactAreaId, likelihoodLevel, impactLevel)
})

function getAreaNameById(areaId: string): string {
  return inherentContextDetail.value?.impactAreas.find(a => a.id === areaId)?.name ?? areaId
}

function getLikelihoodLabelById(areaId: string, level: number): string {
  const area = inherentContextDetail.value?.impactAreas.find(a => a.id === areaId)
  return area?.likelihoodCriteria?.find(c => c.level === level)?.name ?? `Level ${level}`
}

function getLikelihoodDescById(areaId: string, level: number): string {
  const area = inherentContextDetail.value?.impactAreas.find(a => a.id === areaId)
  return area?.likelihoodCriteria?.find(c => c.level === level)?.description ?? '—'
}

function getImpactLabelById(areaId: string, level: number): string {
  const area = inherentContextDetail.value?.impactAreas.find(a => a.id === areaId)
  return area?.impactCriteria?.find(c => c.level === level)?.name ?? `Level ${level}`
}

function getImpactDescById(areaId: string, level: number): string {
  const area = inherentContextDetail.value?.impactAreas.find(a => a.id === areaId)
  return area?.impactCriteria?.find(c => c.level === level)?.description ?? '—'
}

function getScoreBadgeStyle(score: number) {
  const rl = inherentContextDetail.value?.riskLevels?.find(r => score >= r.minScore && score <= r.maxScore)
  const color = rl?.color ?? '#64748b'
  return { background: color + '22', color, borderColor: color + '55' }
}

function openAddAreaScore() {
  editingAreaScoreIndex.value = null
  areaScoreSubForm.value = { impactAreaId: '', likelihoodLevel: 0, impactLevel: 0 }
  areaScoreSubErrors.value = {}
  showAreaScoreSubModal.value = true
}

function openEditAreaScore(idx: number) {
  editingAreaScoreIndex.value = idx
  const item = inherentScoresList.value[idx]
  areaScoreSubForm.value = { impactAreaId: item.impactAreaId, likelihoodLevel: item.likelihoodLevel, impactLevel: item.impactLevel }
  areaScoreSubErrors.value = {}
  showAreaScoreSubModal.value = true
}

function removeAreaScore(idx: number) {
  inherentScoresList.value.splice(idx, 1)
}

function confirmAreaScore() {
  areaScoreSubErrors.value = {}
  const { impactAreaId, likelihoodLevel, impactLevel } = areaScoreSubForm.value
  if (!impactAreaId) { areaScoreSubErrors.value.impactAreaId = 'Pilih area dampak'; return }
  if (!likelihoodLevel) { areaScoreSubErrors.value.likelihoodLevel = 'Pilih level kemungkinan'; return }
  if (!impactLevel) { areaScoreSubErrors.value.impactLevel = 'Pilih level dampak'; return }
  const score = calcScore(impactAreaId, likelihoodLevel, impactLevel)
  if (editingAreaScoreIndex.value !== null) {
    inherentScoresList.value[editingAreaScoreIndex.value] = { impactAreaId, likelihoodLevel, impactLevel, score }
  } else {
    inherentScoresList.value.push({ impactAreaId, likelihoodLevel, impactLevel, score })
  }
  showAreaScoreSubModal.value = false
}

const inherentOverallScore = computed<number | null>(() => {
  if (!inherentScoresList.value.length) return null
  return Math.max(...inherentScoresList.value.map(s => s.score))
})

const inherentOverallRiskLevel = computed(() => {
  if (inherentOverallScore.value === null || !inherentContextDetail.value) return null
  return inherentContextDetail.value.riskLevels?.find(
    rl => inherentOverallScore.value! >= rl.minScore && inherentOverallScore.value! <= rl.maxScore
  ) ?? null
})

async function openInherentModal(entry: RiskEntry) {
  inherentModalEntry.value = entry
  inherentContextDetail.value = null
  inherentScoresList.value = []
  inherentAreaError.value = ''
  inherentSubmitError.value = ''
  showInherentModal.value = true
  inherentContextLoading.value = true
  inherentContextError.value = ''
  try {
    const riskContextId = entry.programFrameworkContext?.riskContext?.id
    if (!riskContextId) throw new Error('Context ID tidak ditemukan')
    const res = await riskContextApi.getById(riskContextId)
    inherentContextDetail.value = res.data.data
    // Pre-fill if assessment exists
    if (entry.inherentAssessment?.areaScores?.length) {
      inherentScoresList.value = entry.inherentAssessment.areaScores.map(as => ({
        impactAreaId: as.impactAreaId,
        likelihoodLevel: as.likelihoodLevel,
        impactLevel: as.impactLevel,
        score: calcScore(as.impactAreaId, as.likelihoodLevel, as.impactLevel),
      }))
    }
  } catch (err: any) {
    inherentContextError.value = extractApiError(err, 'Gagal memuat konteks risiko.')
  } finally {
    inherentContextLoading.value = false
  }
}

async function submitInherentAssessment() {
  inherentAreaError.value = ''
  inherentSubmitError.value = ''
  if (!inherentScoresList.value.length) {
    inherentAreaError.value = 'Tambahkan minimal satu penilaian area dampak.'
    return
  }
  inherentSubmitLoading.value = true
  try {
    await riskEntryApi.createInherentAssessment(inherentModalEntry.value!.id, {
      notes: null,
      areaScores: inherentScoresList.value.map(s => ({
        impactAreaId: s.impactAreaId,
        likelihoodLevel: s.likelihoodLevel,
        impactLevel: s.impactLevel,
      })),
    })
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Penilaian risiko inheren berhasil disimpan', life: 3000 })
    showInherentModal.value = false
    loadEntries()
    loadStats()
  } catch (err: any) {
    inherentSubmitError.value = extractApiError(err, 'Gagal menyimpan penilaian.')
  } finally {
    inherentSubmitLoading.value = false
  }
}

// ─── Penilaian Residual Modal ─────────────────────────────────────────────────

const showResidualModal = ref(false)
const residualModalEntry = ref<RiskEntry | null>(null)
const residualContextDetail = ref<RiskContextDetail | null>(null)
const residualContextLoading = ref(false)
const residualContextError = ref('')
const residualSubmitLoading = ref(false)
const residualSubmitError = ref('')

// Selected plan & form state
const residualSelectedPlanId = ref('')
const residualForm = ref({ likelihoodLevel: 0, impactLevel: 0 })
const residualFormErrors = ref<{ planId?: string; likelihoodLevel?: string; impactLevel?: string }>({})

// Only PLANNED plans whose impactAreaId was assessed in inherent
const plannedPlansWithInherentScore = computed(() => {
  const inherentAreaIds = new Set(
    residualModalEntry.value?.inherentAssessment?.areaScores?.map(s => s.impactAreaId) ?? [],
  )
  return (residualModalEntry.value?.treatmentPlans ?? []).filter(
    p => p.status === 'PLANNED' && p.impactAreaId && inherentAreaIds.has(p.impactAreaId),
  )
})

const residualSelectedPlan = computed(() =>
  plannedPlansWithInherentScore.value.find(p => p.id === residualSelectedPlanId.value) ?? null,
)

const residualSelectedArea = computed<ImpactArea | null>(() => {
  const plan = residualSelectedPlan.value
  if (!plan?.impactAreaId || !residualContextDetail.value) return null
  return residualContextDetail.value.impactAreas.find(a => a.id === plan.impactAreaId) ?? null
})

const residualInherentScore = computed<number | null>(() => {
  const plan = residualSelectedPlan.value
  if (!plan?.impactAreaId) return null
  return residualModalEntry.value?.inherentAssessment?.areaScores?.find(
    s => s.impactAreaId === plan.impactAreaId,
  )?.score ?? null
})

const residualPreviewScore = computed<number | null>(() => {
  const { likelihoodLevel, impactLevel } = residualForm.value
  if (!residualSelectedPlan.value?.impactAreaId || !likelihoodLevel || !impactLevel) return null
  return calcResidualScore(residualSelectedPlan.value.impactAreaId, likelihoodLevel, impactLevel)
})

function calcResidualScore(impactAreaId: string, likelihoodLevel: number, impactLevel: number): number {
  const cell = residualContextDetail.value?.matrixCells?.find(
    c => c.row === likelihoodLevel && c.col === impactLevel,
  )
  return cell ? cell.value : likelihoodLevel * impactLevel
}

function getResidualScoreBadgeStyle(score: number) {
  const rl = residualContextDetail.value?.riskLevels?.find(r => score >= r.minScore && score <= r.maxScore)
  const color = rl?.color ?? '#64748b'
  return { background: color + '22', color, borderColor: color + '55' }
}

function onResidualPlanChange() {
  residualForm.value = { likelihoodLevel: 0, impactLevel: 0 }
  residualFormErrors.value = {}
}

async function openResidualModal(entry: RiskEntry) {
  residualModalEntry.value = entry
  residualContextDetail.value = null
  residualSelectedPlanId.value = ''
  residualForm.value = { likelihoodLevel: 0, impactLevel: 0 }
  residualFormErrors.value = {}
  residualSubmitError.value = ''
  showResidualModal.value = true
  residualContextLoading.value = true
  residualContextError.value = ''
  try {
    const riskContextId = entry.programFrameworkContext?.riskContext?.id
    if (!riskContextId) throw new Error('Context ID tidak ditemukan')
    const res = await riskContextApi.getById(riskContextId)
    residualContextDetail.value = res.data.data
  } catch (err: any) {
    residualContextError.value = extractApiError(err, 'Gagal memuat konteks risiko.')
  } finally {
    residualContextLoading.value = false
  }
}

async function submitResidualAssessment() {
  residualFormErrors.value = {}
  residualSubmitError.value = ''
  if (!residualSelectedPlanId.value) {
    residualFormErrors.value.planId = 'Pilih rencana penanganan'
    return
  }
  if (!residualForm.value.likelihoodLevel) {
    residualFormErrors.value.likelihoodLevel = 'Pilih level kemungkinan'
    return
  }
  if (!residualForm.value.impactLevel) {
    residualFormErrors.value.impactLevel = 'Pilih level dampak'
    return
  }
  residualSubmitLoading.value = true
  try {
    await riskEntryApi.completeTreatmentPlan(
      residualModalEntry.value!.id,
      residualSelectedPlanId.value,
      {
        areaScore: {
          impactAreaId: residualSelectedPlan.value!.impactAreaId!,
          likelihoodLevel: residualForm.value.likelihoodLevel,
          impactLevel: residualForm.value.impactLevel,
        },
      },
    )
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Mitigasi ditandai selesai dan penilaian residual berhasil disimpan', life: 3000 })
    showResidualModal.value = false
    loadEntries()
    loadStats()
  } catch (err: any) {
    residualSubmitError.value = extractApiError(err, 'Gagal menyimpan penilaian.')
  } finally {
    residualSubmitLoading.value = false
  }
}

// ─── Rencana Penanganan Modal ─────────────────────────────────────────────────

const showTreatmentModal = ref(false)
const treatmentModalEntry = ref<RiskEntry | null>(null)
const treatmentModalContextDetail = ref<RiskContextDetail | null>(null)
const treatmentModalLoading = ref(false)
const treatmentModalError = ref('')
const treatmentSubmitLoading = ref(false)
const treatmentSubmitError = ref('')

interface TreatmentPlanForm {
  impactAreaId: string
  treatmentOptionId: string
  description: string
  picUserId: string
  targetDate: string
}

const treatmentPlansForm = ref<TreatmentPlanForm[]>([])

// Scored areas available for treatment plan selection
interface ScoredArea { impactAreaId: string; name: string }
const treatmentScoredAreas = ref<ScoredArea[]>([])

const availableAreasForTreatmentSubModal = computed<ScoredArea[]>(() => {
  const usedIds = new Set(treatmentPlansForm.value.map(p => p.impactAreaId))
  if (editingTreatmentPlanIndex.value !== null) {
    usedIds.delete(treatmentPlansForm.value[editingTreatmentPlanIndex.value]?.impactAreaId ?? '')
  }
  return treatmentScoredAreas.value.filter(a => !usedIds.has(a.impactAreaId))
})

// Sub-modal state
const showTreatmentSubModal = ref(false)
const editingTreatmentPlanIndex = ref<number | null>(null)
const treatmentSubForm = ref<TreatmentPlanForm>({ impactAreaId: '', treatmentOptionId: '', description: '', picUserId: '', targetDate: '' })
const treatmentSubErrors = ref<{ impactAreaId?: string }>({})

// Risk appetite threshold derived from context
const appetiteThreshold = computed(() => {
  const ctx = treatmentModalContextDetail.value
  if (!ctx || !ctx.riskAppetiteLevel) return null
  return ctx.riskLevels.find(l => l.name === ctx.riskAppetiteLevel) ?? null
})

// Area score for the currently selected impact area in sub-modal
const subModalAreaScore = computed<number | null>(() => {
  const areaId = treatmentSubForm.value.impactAreaId
  if (!areaId) return null
  return (treatmentModalEntry.value?.inherentAssessment?.areaScores ?? [])
    .find(s => s.impactAreaId === areaId)?.score ?? null
})

// Filtered treatment options based on score vs risk appetite
const availableTreatmentOptionsForSubModal = computed(() => {
  const opts = treatmentModalContextDetail.value?.treatmentOptions ?? []
  const score = subModalAreaScore.value
  const threshold = appetiteThreshold.value
  if (score == null || !threshold) return opts
  if (score <= threshold.maxScore) return opts.filter(o => o.isAcceptance)
  return opts.filter(o => !o.isAcceptance)
})

// Auto-set/clear treatmentOptionId when area changes based on appetite rules
watch(() => treatmentSubForm.value.impactAreaId, (newAreaId) => {
  if (!newAreaId || !appetiteThreshold.value) return
  const score = (treatmentModalEntry.value?.inherentAssessment?.areaScores ?? [])
    .find(s => s.impactAreaId === newAreaId)?.score
  if (score == null) return
  const currentOpt = treatmentModalContextDetail.value?.treatmentOptions?.find(
    o => o.id === treatmentSubForm.value.treatmentOptionId
  )
  // Clear option if it violates the appetite rule
  if (currentOpt) {
    const invalid = (score <= appetiteThreshold.value.maxScore && !currentOpt.isAcceptance)
      || (score > appetiteThreshold.value.maxScore && currentOpt.isAcceptance)
    if (invalid) treatmentSubForm.value.treatmentOptionId = ''
  }
  // Auto-select if below appetite and exactly one acceptance option exists
  if (score <= appetiteThreshold.value.maxScore && !treatmentSubForm.value.treatmentOptionId) {
    const acceptanceOpts = (treatmentModalContextDetail.value?.treatmentOptions ?? []).filter(o => o.isAcceptance)
    if (acceptanceOpts.length === 1) treatmentSubForm.value.treatmentOptionId = acceptanceOpts[0].id
  }
})

const treatmentSubSelectedOption = computed(() => {
  if (!treatmentSubForm.value.treatmentOptionId || !treatmentModalContextDetail.value) return null
  return treatmentModalContextDetail.value.treatmentOptions?.find(o => o.id === treatmentSubForm.value.treatmentOptionId) ?? null
})

function getTreatmentAreaName(areaId: string): string {
  return treatmentScoredAreas.value.find(a => a.impactAreaId === areaId)?.name ?? areaId
}

function getTreatmentOptionName(optionId: string): string {
  if (!optionId) return '—'
  return treatmentModalContextDetail.value?.treatmentOptions?.find(o => o.id === optionId)?.name ?? optionId
}

function getTreatmentPicName(picUserId: string): string {
  return picUserId || '—'
}

function openAddTreatmentPlan() {
  editingTreatmentPlanIndex.value = null
  treatmentSubForm.value = { impactAreaId: '', treatmentOptionId: '', description: '', picUserId: '', targetDate: '' }
  treatmentSubErrors.value = {}
  showTreatmentSubModal.value = true
}

function openEditTreatmentPlan(idx: number) {
  editingTreatmentPlanIndex.value = idx
  treatmentSubForm.value = { ...treatmentPlansForm.value[idx] }
  treatmentSubErrors.value = {}
  // Clear treatmentOptionId if it violates the appetite rule for the pre-filled area
  const threshold = appetiteThreshold.value
  if (threshold && treatmentSubForm.value.impactAreaId && treatmentSubForm.value.treatmentOptionId) {
    const areaScore = (treatmentModalEntry.value?.inherentAssessment?.areaScores ?? [])
      .find(s => s.impactAreaId === treatmentSubForm.value.impactAreaId)?.score
    const opt = treatmentModalContextDetail.value?.treatmentOptions?.find(
      o => o.id === treatmentSubForm.value.treatmentOptionId
    )
    if (areaScore != null && opt) {
      const invalid = (areaScore <= threshold.maxScore && !opt.isAcceptance)
        || (areaScore > threshold.maxScore && opt.isAcceptance)
      if (invalid) treatmentSubForm.value.treatmentOptionId = ''
    }
  }
  showTreatmentSubModal.value = true
}

function removeTreatmentPlan(idx: number) {
  treatmentPlansForm.value.splice(idx, 1)
}

function confirmTreatmentPlan() {
  treatmentSubErrors.value = {}
  if (!treatmentSubForm.value.impactAreaId) {
    treatmentSubErrors.value.impactAreaId = 'Pilih area dampak'
    return
  }
  if (editingTreatmentPlanIndex.value !== null) {
    treatmentPlansForm.value[editingTreatmentPlanIndex.value] = { ...treatmentSubForm.value }
  } else {
    treatmentPlansForm.value.push({ ...treatmentSubForm.value })
  }
  showTreatmentSubModal.value = false
}

async function openTreatmentModal(entry: RiskEntry) {
  treatmentModalEntry.value = entry
  treatmentSubmitError.value = ''
  treatmentModalError.value = ''
  treatmentPlansForm.value = []
  treatmentScoredAreas.value = []
  showTreatmentModal.value = true
  treatmentModalLoading.value = true
  try {
    const riskContextId = entry.programFrameworkContext?.riskContext?.id
    if (!riskContextId) throw new Error('Context ID tidak ditemukan')
    const contextRes = await riskContextApi.getById(riskContextId)
    treatmentModalContextDetail.value = contextRes.data.data
    // Build scored areas list from inherent assessment
    treatmentScoredAreas.value = (entry.inherentAssessment?.areaScores ?? []).map(as => ({
      impactAreaId: as.impactAreaId,
      name: as.impactArea?.name ?? as.impactAreaId,
    }))
    // Pre-fill existing PLANNED plans
    const existingPlans = (entry.treatmentPlans ?? []).filter(p => p.status === 'PLANNED')
    treatmentPlansForm.value = existingPlans.map(p => ({
      impactAreaId: p.impactAreaId ?? '',
      treatmentOptionId: p.treatmentOption?.id ?? p.treatmentOptionId ?? '',
      description: p.description ?? '',
      picUserId: p.picUserId ?? '',
      targetDate: p.targetDate ? p.targetDate.split('T')[0] : '',
    }))
  } catch (err: any) {
    treatmentModalError.value = extractApiError(err, 'Gagal memuat data.')
  } finally {
    treatmentModalLoading.value = false
  }
}

async function submitTreatmentPlans() {
  treatmentSubmitError.value = ''
  if (!treatmentModalEntry.value) return
  treatmentSubmitLoading.value = true
  try {
    await riskEntryApi.createTreatmentPlans(treatmentModalEntry.value.id, {
      plans: treatmentPlansForm.value.map(p => ({
        impactAreaId: p.impactAreaId,
        treatmentOptionId: p.treatmentOptionId || null,
        description: p.description.trim() || null,
        picUserId: p.picUserId || null,
        targetDate: p.targetDate || null,
        needsKomiteReview: false,
      })),
    })
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Rencana penanganan berhasil disimpan', life: 3000 })
    showTreatmentModal.value = false
    loadEntries()
    loadStats()
  } catch (err: any) {
    treatmentSubmitError.value = extractApiError(err, 'Gagal menyimpan rencana penanganan.')
  } finally {
    treatmentSubmitLoading.value = false
  }
}

onMounted(() => {
  loadWorkingPaper()
  loadEntries()
  loadStats()
  document.addEventListener('click', handleDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
  _observer?.disconnect()
})
</script>

<style scoped>

/* ─── Page ────────────────────────────────────────────────────────────────── */

.wpd-load-more-sentinel {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px 0;
  min-height: 48px;
}
.wpd-load-more-end {
  font-size: 12px;
  color: var(--color-text-muted, #888);
}

.wpd-page {
  padding: 1.25rem 1.5rem;
}

/* ─── Breadcrumb ──────────────────────────────────────────────────────────── */

.wpd-breadcrumb-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.75rem;
}

.wpd-back-btn {
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

.wpd-back-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.wpd-breadcrumb-text {
  font-size: 13px;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: color 0.15s;
}

.wpd-breadcrumb-text:hover { color: var(--color-accent); }

.wpd-breadcrumb-sep {
  font-size: 13px;
  color: var(--color-text-muted);
  opacity: 0.4;
}

.wpd-breadcrumb-current {
  font-size: 13px;
  color: var(--color-text-dim);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ─── Header Bar ──────────────────────────────────────────────────────────── */

.wpd-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 0.875rem 1.25rem;
  margin-bottom: 0.75rem;
}

.wpd-header-bar-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  flex: 1;
}

.wpd-header-info {
  min-width: 0;
  flex: 1;
}

.wpd-header-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 0.375rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.wpd-header-meta {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.wpd-header-sep {
  color: var(--color-text-muted);
  opacity: 0.4;
  font-size: 12px;
}

.wpd-header-meta-text {
  font-size: 12px;
  color: var(--color-text-dim);
}

.wpd-header-bar-right {
  flex-shrink: 0;
}

.wpd-header-icon {
  font-size: 1.25rem;
  color: var(--color-accent);
  opacity: 0.8;
  flex-shrink: 0;
}

.wpd-edit-btn {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
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
}

.wpd-edit-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.wpd-download-btn {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
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
}

.wpd-download-btn:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.wpd-download-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ─── Accordion ───────────────────────────────────────────────────────────── */

.wpd-accordion {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin-bottom: 0.75rem;
}

.wpd-accordion-header {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.875rem 1.25rem;
  background: transparent;
  border: none;
  color: var(--color-text-dim);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
}

.wpd-accordion-header:hover { background: var(--color-bg-alt); }
.wpd-accordion-header .pi:first-child { color: var(--color-accent); font-size: 13px; }

.wpd-accordion-chevron {
  margin-left: auto;
  font-size: 11px;
  transition: transform 0.2s;
  color: var(--color-text-muted);
}

.wpd-accordion-chevron.open { transform: rotate(180deg); }

.wpd-accordion-body {
  border-top: 1px solid var(--color-border);
}

.wpd-status-chip {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 100px;
}

.chip-draft {
  background: rgba(100, 116, 139, 0.12);
  color: #94a3b8;
  border: 1px solid rgba(100, 116, 139, 0.25);
}

.chip-submitted {
  background: rgba(96, 165, 250, 0.12);
  color: #60a5fa;
  border: 1px solid rgba(96, 165, 250, 0.25);
}

.chip-revision {
  background: rgba(251, 146, 60, 0.12);
  color: #fb923c;
  border: 1px solid rgba(251, 146, 60, 0.25);
}

.chip-approved {
  background: rgba(0, 229, 184, 0.12);
  color: var(--color-accent);
  border: 1px solid rgba(0, 229, 184, 0.25);
}

.chip-locked {
  background: rgba(167, 139, 250, 0.12);
  color: #a78bfa;
  border: 1px solid rgba(167, 139, 250, 0.25);
}

/* ─── Status chip ─────────────────────────────────────────────────────────── */

.wpd-year-badge {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  color: var(--color-text-dim);
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  padding: 1px 6px;
  border-radius: var(--radius-sm);
}

.wpd-code-badge {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  color: var(--color-accent);
  background: rgba(0, 229, 184, 0.08);
  border: 1px solid rgba(0, 229, 184, 0.2);
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  letter-spacing: 0.04em;
}

/* ─── Review note ─────────────────────────────────────────────────────────── */

.wpd-review-note {
  padding: 0.875rem 1.25rem;
  border-top: 1px solid var(--color-border);
}

.wpd-review-note-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  margin-bottom: 0.5rem;
}

.wpd-review-note-text {
  font-size: 12px;
  color: var(--color-text-dim);
  line-height: 1.55;
  margin: 0;
  white-space: pre-line;
}

/* ─── Register Risiko header ──────────────────────────────────────────────── */

.wpd-rr-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 0 0.625rem;
}

.wpd-rr-header-left {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.wpd-rr-header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* ─── Section title (reused) ──────────────────────────────────────────────── */

.wpd-section-title {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-dim);
  margin: 0;
}

.wpd-count-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  font-size: 11px;
  font-family: var(--font-mono);
  font-weight: 600;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: 100px;
  color: var(--color-text-dim);
}

.wpd-count-label {
  font-family: var(--font-body);
  font-weight: 400;
  color: var(--color-text-muted);
}

/* ─── Empty state ─────────────────────────────────────────────────────────── */

.wpd-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 3rem 1rem 1.5rem;
  text-align: center;
}

.wpd-empty-icon {
  font-size: 2rem;
  color: var(--color-text-muted);
  opacity: 0.3;
  margin-bottom: 0.25rem;
}

.wpd-empty-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-dim);
  margin: 0;
}

.wpd-empty-desc {
  font-size: 12px;
  color: var(--color-text-muted);
  margin: 0;
  max-width: 320px;
  line-height: 1.5;
}

/* ─── Entry info ──────────────────────────────────────────────────────────── */

.wpd-entry-info {
  padding: 1.25rem;
}

.wpd-entry-count-text {
  font-size: 13px;
  color: var(--color-text-dim);
  margin: 0;
}

/* ─── Development banner ──────────────────────────────────────────────────── */

.wpd-dev-banner {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  font-size: 12px;
  color: var(--color-accent);
  background: rgba(0, 229, 184, 0.05);
  border-top: 1px solid rgba(0, 229, 184, 0.15);
  line-height: 1.5;
}

.wpd-dev-banner .pi {
  flex-shrink: 0;
  margin-top: 1px;
}

/* ─── States ──────────────────────────────────────────────────────────────── */

.wpd-centered {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;
}

.wpd-alert-error {
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

/* ─── Contexts section ────────────────────────────────────────────────────── */

.wpd-ctx-loading {
  display: flex;
  justify-content: center;
  padding: 2rem;
}

.wpd-ctx-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.25rem;
  font-size: 12px;
  color: #ff8fa3;
  background: var(--color-danger-dim);
}

.wpd-fw-groups {
  display: flex;
  flex-direction: column;
}

.wpd-fw-group {
  border-bottom: 1px solid var(--color-border);
}

.wpd-fw-group:last-child {
  border-bottom: none;
}

.wpd-fw-group-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: var(--color-bg-input);
  border-bottom: 1px solid var(--color-border);
  flex-wrap: wrap;
}

.wpd-fw-code {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  color: var(--color-accent);
  background: rgba(0, 229, 184, 0.08);
  border: 1px solid rgba(0, 229, 184, 0.2);
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  letter-spacing: 0.04em;
  flex-shrink: 0;
}

.wpd-fw-version {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.wpd-fw-group-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-dim);
  flex: 1;
  min-width: 0;
}

.wpd-fw-ctx-count {
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--color-text-muted);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  padding: 1px 8px;
  border-radius: 100px;
  flex-shrink: 0;
}

.wpd-fw-empty {
  padding: 0.875rem 1.25rem;
  font-size: 12px;
  color: var(--color-text-muted);
  font-style: italic;
}

.wpd-ctx-list {
  display: flex;
  flex-direction: column;
}

.wpd-ctx-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.625rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
  transition: background 0.1s;
}

.wpd-ctx-row:last-child {
  border-bottom: none;
}

.wpd-ctx-row:hover {
  background: rgba(0, 229, 184, 0.02);
}

.wpd-ctx-row-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  flex: 1;
  flex-wrap: wrap;
}

.wpd-ctx-code {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  color: var(--color-accent);
  background: rgba(0, 229, 184, 0.08);
  border: 1px solid rgba(0, 229, 184, 0.2);
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  letter-spacing: 0.04em;
  flex-shrink: 0;
}

.wpd-ctx-type {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 7px;
  border-radius: 100px;
  flex-shrink: 0;
}

.wpd-ctx-type.type-asset {
  background: rgba(96, 165, 250, 0.12);
  color: #60a5fa;
  border: 1px solid rgba(96, 165, 250, 0.25);
}

.wpd-ctx-type.type-process {
  background: rgba(251, 146, 60, 0.12);
  color: #fb923c;
  border: 1px solid rgba(251, 146, 60, 0.25);
}

.wpd-ctx-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.wpd-ctx-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-dim);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.wpd-ctx-period {
  font-size: 11px;
  color: var(--color-text-muted);
}

.wpd-ctx-row-right {
  flex-shrink: 0;
}

.btn-icon {
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

.btn-icon:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.btn-icon-danger:hover {
  border-color: #f87171;
  color: #f87171;
}

/* ─── Aksi status ─────────────────────────────────────────────────────────── */

.wpd-actions {
  padding: 0.875rem 1.25rem;
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.wpd-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 7px 14px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-family: var(--font-body);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid transparent;
}

.wpd-action-submit {
  background: rgba(0, 229, 184, 0.1);
  border-color: rgba(0, 229, 184, 0.3);
  color: var(--color-accent);
}
.wpd-action-submit:hover {
  background: rgba(0, 229, 184, 0.18);
}

.wpd-action-revision {
  background: rgba(251, 146, 60, 0.1);
  border-color: rgba(251, 146, 60, 0.3);
  color: #fb923c;
}
.wpd-action-revision:hover {
  background: rgba(251, 146, 60, 0.18);
}

.wpd-action-approve {
  background: rgba(96, 165, 250, 0.1);
  border-color: rgba(96, 165, 250, 0.3);
  color: #60a5fa;
}
.wpd-action-approve:hover {
  background: rgba(96, 165, 250, 0.18);
}

.wpd-action-lock {
  background: rgba(167, 139, 250, 0.1);
  border-color: rgba(167, 139, 250, 0.3);
  color: #a78bfa;
}
.wpd-action-lock:hover {
  background: rgba(167, 139, 250, 0.18);
}

/* ─── Confirm dialog body ─────────────────────────────────────────────────── */

.wpd-confirm-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 0.5rem;
  text-align: center;
}

.wpd-confirm-icon {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
}

.wpd-confirm-icon--submit {
  background: rgba(0, 229, 184, 0.1);
  border: 1px solid rgba(0, 229, 184, 0.3);
  color: var(--color-accent);
}

.wpd-confirm-icon--approve {
  background: rgba(96, 165, 250, 0.1);
  border: 1px solid rgba(96, 165, 250, 0.3);
  color: #60a5fa;
}

.wpd-confirm-icon--lock {
  background: rgba(167, 139, 250, 0.1);
  border: 1px solid rgba(167, 139, 250, 0.3);
  color: #a78bfa;
}

.wpd-confirm-text {
  font-size: 14px;
  color: var(--color-text);
  margin: 0;
  line-height: 1.5;
}

.wpd-confirm-hint {
  font-size: 12px;
  color: var(--color-text-muted);
  margin: 0;
  max-width: 300px;
  line-height: 1.5;
}

.wpd-form-textarea {
  resize: vertical;
  min-height: 90px;
  line-height: 1.6;
}

/* ─── Edit form (dialog) ──────────────────────────────────────────────────── */

.wpd-edit-form {
  display: flex;
  flex-direction: column;
  padding: 0.25rem 0;
}

.wpd-form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 1rem;
}

.wpd-form-label {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-dim);
}

.wpd-req { color: var(--color-danger); }

.wpd-form-input {
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

.wpd-form-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px var(--color-accent-glow);
}

.wpd-form-input.is-error { border-color: var(--color-danger); }

.wpd-form-err {
  font-size: 11px;
  color: #ff8fa3;
}

.wpd-form-api-error {
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

.wpd-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

/* ─── Filter Bar ──────────────────────────────────────────────────────────── */

.wpd-rr-filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.625rem 1rem;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.wpd-rr-filter-left {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  flex-wrap: wrap;
}

.wpd-rr-filter-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.wpd-rr-type-tabs {
  display: flex;
  background: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.wpd-rr-tab {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 500;
  font-family: var(--font-body);
  color: var(--color-text-muted);
  background: transparent;
  border: none;
  border-right: 1px solid var(--color-border);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.wpd-rr-tab:last-child { border-right: none; }
.wpd-rr-tab:hover { background: var(--color-bg-input); color: var(--color-text-dim); }
.wpd-rr-tab.active {
  background: var(--color-bg-input);
  color: var(--color-text);
  font-weight: 600;
}

.wpd-rr-tab-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-asset   { background: #60a5fa; }
.dot-process { background: #fb923c; }

.wpd-rr-filter-select {
  padding: 4px 28px 4px 10px;
  font-size: 12px;
  font-family: var(--font-body);
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-dim);
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2364748b'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  transition: border-color 0.15s;
  min-width: 180px;
  max-width: 280px;
}

.wpd-rr-filter-select:focus {
  outline: none;
  border-color: var(--color-accent);
}

.wpd-rr-filter-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.wpd-rr-filter-count {
  font-size: 12px;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.wpd-rr-filter-count-num {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 13px;
  color: var(--color-text-dim);
}

.wpd-rr-filter-count-sep {
  margin: 0 1px;
  opacity: 0.4;
}

.wpd-rr-filter-clear {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 500;
  font-family: var(--font-body);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.15s;
}

.wpd-rr-filter-clear:hover {
  border-color: #f87171;
  color: #f87171;
}

.wpd-rr-filter-clear .pi { font-size: 10px; }

/* empty filtered state */
.wpd-rr-empty-filtered {
  padding: 2.5rem 1.5rem;
  text-align: center;
  font-size: 13px;
  color: var(--color-text-muted);
}

.wpd-rr-empty-filtered .pi {
  font-size: 1.25rem;
  display: block;
  margin-bottom: 0.5rem;
  opacity: 0.4;
}

.wpd-add-entry-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  background: var(--color-accent);
  color: #000;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: opacity 0.15s;
}

.wpd-add-entry-btn:hover { opacity: 0.85; }

/* ─── Standalone empty state ──────────────────────────────────────────────── */

.wpd-empty-standalone {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

/* ─── Risk Register table ─────────────────────────────────────────────────── */

.wpd-rr-wrap {
  overflow-x: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.wpd-rr-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 12px;
  min-width: 1820px;
}

/* ── Column widths via colgroup ── */
.col-no       { width: 40px; }
.col-code     { width: 80px; }
.col-kerawanan{ width: 130px; }
.col-ancaman  { width: 150px; }
.col-dampak   { width: 110px; }
.col-kategori { width: 100px; }
.col-kem              { width: 52px; }
.col-damp             { width: 52px; }
.col-kontrol-detail   { width: 180px; }
.col-keputusan-detail  { width: 120px; }
.col-status-mitigasi   { width: 120px; }
.col-uraian   { width: 130px; }
.col-target   { width: 90px; }
.col-pic      { width: 80px; }
.col-aksi     { width: 80px; }

/* ── thead ── */
.wpd-rr-thead-top th,
.wpd-rr-thead-sub th {
  background: var(--color-bg-alt);
  padding: 8px 6px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  text-align: center;
  white-space: nowrap;
  border-bottom: 1px solid var(--color-border);
  border-right: 1px solid rgba(255,255,255,0.04);
  position: sticky;
  top: 0;
  z-index: 1;
}

.wpd-rr-thead-top th { padding: 7px 6px; }
.wpd-rr-thead-sub th { font-size: 9px; }

.wpd-rr-th-group {
  border-bottom: 2px solid rgba(255,255,255,0.06) !important;
  padding-bottom: 5px !important;
}
.wpd-rr-th-inheren {
  background: rgba(96, 165, 250, 0.06) !important;
  border-top: 2px solid rgba(96, 165, 250, 0.35) !important;
  color: #60a5fa !important;
}
.wpd-rr-th-residu {
  background: rgba(52, 211, 153, 0.06) !important;
  border-top: 2px solid rgba(52, 211, 153, 0.35) !important;
  color: #34d399 !important;
}
.wpd-rr-th-mitigasi {
  background: rgba(251, 191, 36, 0.06) !important;
  border-top: 2px solid rgba(251, 191, 36, 0.35) !important;
  color: #fbbf24 !important;
}

/* ── group separator row ── */
.wpd-rr-group-row .wpd-rr-group-td {
  padding: 0;
  border-top: 2px solid rgba(0, 229, 184, 0.3);
  border-bottom: 1px solid rgba(0, 229, 184, 0.12);
  background: linear-gradient(90deg, rgba(0, 229, 184, 0.06) 0%, transparent 60%);
}

.wpd-rr-group-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 14px;
  min-height: 34px;
}

.wpd-rr-group-type-badge {
  font-size: 9px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 3px;
  border: 1px solid;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  flex-shrink: 0;
  line-height: 1.4;
}

.badge-asset        { background: rgba(96, 165, 250, 0.12); color: #60a5fa; border-color: rgba(96, 165, 250, 0.3); }
.badge-process      { background: rgba(251, 146, 60, 0.12);  color: #fb923c; border-color: rgba(251, 146, 60, 0.3); }
.badge-uncategorized{ background: rgba(100, 116, 139, 0.1);  color: #94a3b8; border-color: rgba(100, 116, 139, 0.25); }

.wpd-rr-group-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text);
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.wpd-rr-group-count {
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--color-text-muted);
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--color-border);
  padding: 1px 9px;
  border-radius: 3px;
  white-space: nowrap;
  flex-shrink: 0;
}

/* ── data rows ── */
.wpd-rr-data-row td {
  padding: 9px 8px;
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
  overflow: hidden;
}

/* area sub-rows (aIdx > 0): dashed top border on area-specific cells, suppress bottom border */
.wpd-rr-area-subrow td {
  border-top: 1px dashed rgba(255,255,255,0.08);
  border-bottom: none;
}

/* last row in tbody should have no bottom border */
.wpd-rr-data-row:last-child td { border-bottom: none; }

/* hover highlight: apply to whole entry block including sub-rows */
.wpd-rr-data-row:hover td,
.wpd-rr-area-subrow:hover td { background: rgba(0, 229, 184, 0.025); }

/* column cell alignment */
.wpd-rr-td-no       { text-align: center; font-size: 11px; color: var(--color-text-muted); font-family: var(--font-mono); }
.wpd-rr-td-code     { text-align: center; }
.wpd-rr-td-text     { }
.wpd-rr-td-chip     { text-align: center; }
.wpd-rr-td-areas    { }
.wpd-rr-td-score    { text-align: center; }
.wpd-rr-td-risk     { text-align: left; padding-left: 6px !important; padding-right: 6px !important; }
.wpd-rr-td-date     { text-align: center; }
.wpd-rr-td-pic      { text-align: center; }
.wpd-rr-td-aksi     { text-align: center; }

/* ── Area label chip ── */
.wpd-rr-area-label {
  display: inline-block;
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-dim);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  padding: 2px 6px;
  background: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  border-radius: 3px;
}

.wpd-rr-cell-text {
  font-size: 12px;
  color: var(--color-text-dim);
  line-height: 1.4;
  word-break: break-word;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.wpd-rr-dash {
  color: var(--color-text-muted);
  opacity: 0.3;
  font-size: 13px;
  display: block;
  text-align: center;
}

.wpd-rr-score-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 4px;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  font-size: 12px;
  font-weight: 700;
  font-family: var(--font-mono);
  color: var(--color-text-dim);
}

/* Nilai pill: slightly wider + accent border to distinguish from Kem./Damp. */
.wpd-rr-score-nilai {
  width: 32px;
  border-color: var(--color-accent);
  color: var(--color-accent);
  background: rgba(0, 229, 184, 0.06);
}

.wpd-rr-area-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 8px;
  font-size: 10px;
  font-weight: 600;
  background: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  border-radius: 3px;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.wpd-rr-area-chip:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
  background: rgba(0, 229, 184, 0.06);
}

.wpd-rr-ctrl-chip {
  display: inline-block;
  padding: 3px 8px;
  font-size: 10px;
  font-weight: 600;
  background: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  border-radius: 3px;
  color: var(--color-text-muted);
  white-space: nowrap;
}

/* ── Control detail list ── */
.wpd-rr-td-kontrol-detail { vertical-align: top !important; padding: 6px 8px !important; }
.wpd-rr-ctrl-row {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  padding: 3px 0;
  border-bottom: 1px dashed rgba(255,255,255,0.06);
  flex-wrap: wrap;
}
.wpd-rr-ctrl-row:last-child { border-bottom: none; }
.wpd-rr-ctrl-name {
  font-size: 11px;
  color: var(--color-text-dim);
  line-height: 1.35;
  flex: 1;
  min-width: 0;
  word-break: break-word;
}
.wpd-rr-eff-badge {
  flex-shrink: 0;
  font-size: 9px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 3px;
  border: 1px solid;
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.eff-adequate    { color: #34d399; border-color: #34d39966; background: #34d39914; }
.eff-partial     { color: #fbbf24; border-color: #fbbf2466; background: #fbbf2414; }
.eff-inadequate  { color: #f87171; border-color: #f8717166; background: #f8717114; }

/* ── Treatment plan decision list ── */
.wpd-rr-td-keputusan-detail { vertical-align: top !important; padding: 6px 8px !important; }
.wpd-rr-td-status-mitigasi  { vertical-align: top !important; padding: 6px 8px !important; }
.wpd-rr-plan-row {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  padding: 3px 0;
  border-bottom: 1px dashed rgba(255,255,255,0.06);
  flex-wrap: wrap;
}
.wpd-rr-plan-row:last-child { border-bottom: none; }
.wpd-rr-decision {
  font-size: 11px;
  font-weight: 600;
  flex: 1;
  min-width: 0;
  word-break: break-word;
  line-height: 1.35;
  padding: 1px 6px;
  border-radius: 3px;
  border: 1px solid;
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Mitigasi: accent hijau */
.decision-mitigasi {
  color: #34d399;
  border-color: #34d39955;
  background: #34d39912;
}

/* Selain mitigasi (Terima, Tolak, Transfer, dll): warna berbeda */
.decision-other {
  color: #94a3b8;
  border-color: #94a3b855;
  background: #94a3b810;
}

/* Opsi belum dipilih: muted/italic */
.decision-pending {
  color: #64748b;
  border-color: #334155;
  background: transparent;
  font-style: italic;
}
.wpd-rr-plan-status {
  flex-shrink: 0;
  font-size: 9px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 3px;
  border: 1px solid;
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.pstatus-planned              { color: #94a3b8; border-color: #94a3b866; background: #94a3b814; }
.pstatus-in_progress          { color: #60a5fa; border-color: #60a5fa66; background: #60a5fa14; }
.pstatus-completed            { color: #34d399; border-color: #34d39966; background: #34d39914; }
.pstatus-cancelled            { color: #f87171; border-color: #f8717166; background: #f8717114; }
.pstatus-submitted_for_review { color: #fbbf24; border-color: #fbbf2466; background: #fbbf2414; }
.pstatus-verified             { color: #a78bfa; border-color: #a78bfa66; background: #a78bfa14; }

.wpd-rr-date {
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--color-text-muted);
  display: block;
  text-align: center;
}

.wpd-rr-pic {
  font-size: 9px;
  font-family: var(--font-mono);
  color: var(--color-text-muted);
  display: block;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ─── Entry code + cat (shared) ───────────────────────────────────────────── */

.wpd-entry-code {
  display: inline-block;
  padding: 2px 7px;
  font-size: 11px;
  font-weight: 600;
  font-family: var(--font-mono);
  background: rgba(0, 229, 184, 0.08);
  color: var(--color-accent);
  border: 1px solid rgba(0, 229, 184, 0.2);
  border-radius: var(--radius-sm);
  white-space: nowrap;
}

.wpd-entry-cat {
  display: inline-block;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid;
  border-radius: 100px;
  white-space: nowrap;
}

/* ─── Action Dropdown ─────────────────────────────────────────────────────── */

.wpd-action-wrap {
  position: relative;
  display: inline-block;
}

.wpd-action-menu-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 500;
  background: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-dim);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}

.wpd-action-menu-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.wpd-action-menu-panel {
  position: fixed;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 16px rgba(0,0,0,0.35);
  min-width: 170px;
  z-index: 9999;
  padding: 0.25rem 0;
  display: flex;
  flex-direction: column;
}

.wpd-action-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 0.45rem 0.875rem;
  font-size: 12px;
  color: var(--color-text);
  background: none;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.1s;
}

.wpd-action-item:hover:not(:disabled) {
  background: var(--color-bg-alt);
}

.wpd-action-item:disabled,
.wpd-action-item.disabled {
  color: var(--color-text-muted);
  cursor: not-allowed;
}

.wpd-action-item--danger {
  color: #f87171;
}

.wpd-action-item--danger:hover:not(:disabled) {
  background: rgba(248, 113, 113, 0.08);
}

.wpd-action-divider {
  height: 1px;
  background: var(--color-border);
  margin: 0.25rem 0;
}

/* ─── Confirm icon — delete ───────────────────────────────────────────────── */

.wpd-confirm-icon--delete {
  background: rgba(248, 113, 113, 0.12);
  color: #f87171;
}

/* ─── Form — category loading ─────────────────────────────────────────────── */

.wpd-cat-loading {
  margin-left: 0.25rem;
  font-size: 11px;
  color: var(--color-text-muted);
}

/* ─── Form opt label ──────────────────────────────────────────────────────── */

.wpd-form-opt {
  font-size: 11px;
  color: var(--color-text-muted);
  font-weight: 400;
  margin-left: 0.25rem;
}

/* ─── Treatment plan count button ────────────────────────────────────────── */

.wpd-tp-count-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 2px 8px;
  font-size: 12px;
  background: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.15s;
}

.wpd-tp-count-btn:not(:disabled):hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.wpd-tp-count-btn:disabled {
  opacity: 0.45;
  cursor: default;
}

/* ─── Treatment plans dialog ─────────────────────────────────────────────── */

.wpd-tp-entry-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 1rem;
}

.wpd-tp-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-bottom: 0.75rem;
}

.wpd-tp-area-label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: color-mix(in srgb, var(--color-accent) 8%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--color-accent) 20%, transparent);
  font-size: 12px;
  font-weight: 600;
  color: var(--color-accent);
}

.wpd-tp-area-label .pi {
  font-size: 12px;
}

.wpd-tp-card > :not(.wpd-tp-area-label) {
  padding-left: 1rem;
  padding-right: 1rem;
}

.wpd-tp-card-header {
  padding-top: 0.75rem;
}

.wpd-tp-card > :last-child {
  padding-bottom: 0.75rem;
}

.wpd-tp-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.wpd-tp-option {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}

.wpd-tp-status-badge {
  display: inline-block;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 500;
  border-radius: 100px;
  border: 1px solid;
  white-space: nowrap;
}

.status-planned { background: #94a3b822; color: #94a3b8; border-color: #94a3b855; }
.status-in-progress { background: #60a5fa22; color: #60a5fa; border-color: #60a5fa55; }
.status-completed { background: #4ade8022; color: #4ade80; border-color: #4ade8055; }
.status-cancelled { background: #f8717122; color: #f87171; border-color: #f8717155; }
.status-submitted-for-review { background: #fbbf2422; color: #fbbf24; border-color: #fbbf2455; }
.status-verified { background: #2dd4bf22; color: #2dd4bf; border-color: #2dd4bf55; }

.wpd-tp-desc {
  font-size: 12px;
  color: var(--color-text-muted);
  margin: 0 0 0.5rem;
}

.wpd-tp-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 0.5rem;
}

.wpd-tp-komite-badge {
  display: inline-block;
  padding: 1px 6px;
  font-size: 11px;
  background: #818cf822;
  color: #818cf8;
  border: 1px solid #818cf855;
  border-radius: 100px;
}

.wpd-tp-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

/* ─── Risk Level Badge (split score | name) ───────────────────────────────── */

.wpd-rl-badge {
  display: inline-flex;
  align-items: stretch;
  border-radius: 4px;
  overflow: hidden;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  max-width: 100%;
}

.wpd-rl-score {
  padding: 4px 8px;
  font-size: 13px;
  font-weight: 800;
  font-family: var(--font-mono);
  color: #000;
  min-width: 28px;
  text-align: center;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.wpd-rl-name {
  padding: 4px 8px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  line-height: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* legacy badge (used in expand panel) */
.wpd-risk-level-badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 3px 10px; border-radius: 100px; border: 1px solid;
  font-size: 12px; font-weight: 600; white-space: nowrap;
}
.wpd-risk-level-score {
  font-size: 14px; font-weight: 700; font-variant-numeric: tabular-nums;
}

/* ─── Detail Modal Panel ──────────────────────────────────────────────────── */

.wpd-expand-panel {
  display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1px;
  background: var(--color-border);
  border-top: 2px solid var(--color-accent);
}
.wpd-ep-section {
  background: var(--color-bg-card);
  padding: 1rem 1.25rem;
}
.wpd-ep-section-header {
  display: flex; align-items: center; gap: 0.5rem;
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.06em; color: var(--color-text-muted);
  margin-bottom: 0.75rem;
}
.wpd-ep-section-header .pi { font-size: 13px; color: var(--color-accent); }
.wpd-ep-risk-summary {
  margin-left: auto; padding: 2px 10px; border-radius: 100px;
  font-size: 12px; font-weight: 600; text-transform: none; letter-spacing: normal;
}
.wpd-ep-area-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.wpd-ep-area-table th {
  text-align: left; padding: 4px 8px; font-size: 11px; font-weight: 600;
  color: var(--color-text-muted); border-bottom: 1px solid var(--color-border);
}
.wpd-ep-area-table td { padding: 6px 8px; border-bottom: 1px solid var(--color-border); }
.wpd-ep-area-table tr:last-child td { border-bottom: none; }
.wpd-ep-level-pill {
  display: inline-flex; align-items: center; justify-content: center;
  width: 22px; height: 22px; border-radius: 50%;
  background: var(--color-bg-input); border: 1px solid var(--color-border);
  font-size: 11px; font-weight: 700; margin-right: 4px;
}
.wpd-ep-level-desc { font-size: 11px; color: var(--color-text-muted); }
.wpd-ep-score { font-size: 13px; font-weight: 700; color: var(--color-text); }
.wpd-ep-notes {
  margin-top: 0.5rem; font-size: 12px; color: var(--color-text-muted);
  display: flex; gap: 4px; align-items: flex-start;
}
.wpd-ep-count-pill {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 20px; height: 18px; padding: 0 6px; border-radius: 100px;
  background: var(--color-bg-input); border: 1px solid var(--color-border);
  font-size: 11px; font-weight: 600; color: var(--color-text-muted);
}
.wpd-ep-empty { font-size: 12px; color: var(--color-text-muted); padding: 0.25rem 0; }
.wpd-ep-controls-list { display: flex; flex-direction: column; gap: 0.375rem; }
.wpd-ep-control-item { display: flex; align-items: center; gap: 0.5rem; font-size: 12px; }
.wpd-ep-ctrl-name { flex: 1; color: var(--color-text); }
.wpd-ep-effectiveness {
  padding: 1px 8px; border-radius: 100px; font-size: 11px; font-weight: 500; border: 1px solid;
}
.eff-adequate { background: #4ade8022; color: #4ade80; border-color: #4ade8055; }
.eff-partial { background: #fbbf2422; color: #fbbf24; border-color: #fbbf2455; }
.eff-inadequate { background: #f8717122; color: #f87171; border-color: #f8717155; }
.wpd-ep-plans-summary { display: flex; flex-direction: column; gap: 0.375rem; }
.wpd-ep-plan-row { display: flex; align-items: center; gap: 0.5rem; font-size: 12px; }
.wpd-ep-plan-area { font-weight: 600; color: var(--color-accent); font-size: 11px; white-space: nowrap; }
.wpd-ep-plan-option { flex: 1; color: var(--color-text); }
.wpd-ep-view-plans-btn {
  margin-left: auto; background: none; border: none; cursor: pointer;
  color: var(--color-accent); font-size: 11px; font-weight: 600;
  display: flex; align-items: center; gap: 4px; padding: 0;
  text-transform: none; letter-spacing: normal;
}
.wpd-ep-view-plans-btn:hover { text-decoration: underline; }
.wpd-expand-loading { display: flex; justify-content: center; padding: 1.5rem; }
.wpd-expand-error { padding: 1rem; font-size: 12px; color: #f87171; }

/* ─── Penilaian Inherent Modal ────────────────────────────────────────────── */

.wpd-modal-entry-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 1rem;
  border-left: 3px solid var(--color-accent);
  padding-left: 0.625rem;
}

/* Table-based inherent modal */

.wpd-inh-tbl-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.625rem;
}

.wpd-inh-tbl-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.wpd-inh-add-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 5px 12px;
  font-size: 12px;
  background: rgba(0,229,184,0.08);
  border: 1px solid rgba(0,229,184,0.3);
  border-radius: var(--radius-sm);
  color: var(--color-accent);
  cursor: pointer;
  transition: all 0.15s;
}

.wpd-inh-add-btn:hover { background: rgba(0,229,184,0.15); }

.wpd-inh-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem 1rem;
  color: var(--color-text-muted);
  font-size: 13px;
  text-align: center;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  margin-bottom: 0.75rem;
}

.wpd-inh-empty i { font-size: 24px; opacity: 0.4; }

.wpd-inh-tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  margin-bottom: 0.75rem;
}

.wpd-inh-tbl thead th {
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0 0.5rem 0.5rem;
  border-bottom: 1px solid var(--color-border);
}

.wpd-inh-tbl tbody tr:not(:last-child) td {
  border-bottom: 1px solid var(--color-border);
}

.wpd-inh-tbl tbody td {
  padding: 0.5rem;
  vertical-align: middle;
}

.wpd-inh-td-area {
  font-weight: 500;
  color: var(--color-text);
}

.wpd-inh-td-level {
  color: var(--color-text-dim);
}

.wpd-inh-lvl-num {
  font-size: 11px;
  font-weight: 700;
  background: var(--color-accent);
  color: #000;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.3rem;
  flex-shrink: 0;
}

.wpd-inh-lvl-name {
  font-size: 12px;
  color: var(--color-text-dim);
}

.wpd-inh-td-score { text-align: center; }

.wpd-inh-td-aksi {
  text-align: right;
  white-space: nowrap;
}

.wpd-inh-score-chip {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 100px;
  border: 1px solid;
  display: inline-block;
}

.wpd-inh-row-btn {
  width: 24px;
  height: 24px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: none;
  cursor: pointer;
  color: var(--color-text-muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  transition: all 0.15s;
  margin-left: 0.25rem;
}

.wpd-inh-row-btn:hover { border-color: var(--color-accent); color: var(--color-accent); }
.wpd-inh-row-btn--danger:hover { border-color: #f87171; color: #f87171; }

.wpd-inh-preview-score {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  font-size: 13px;
  color: var(--color-text-muted);
}

.wpd-inh-preview-label { font-weight: 500; }

/* Criteria card list (sub-modal) */

.wpd-crit-placeholder {
  font-size: 12px;
  color: var(--color-text-muted);
  padding: 0.5rem 0;
  font-style: italic;
}

.wpd-crit-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 220px;
  overflow-y: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 4px;
}

.wpd-crit-item {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  padding: 0.5rem 0.625rem;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: none;
  cursor: pointer;
  text-align: left;
  transition: all 0.12s;
  width: 100%;
}

.wpd-crit-item:hover {
  background: var(--color-bg-alt);
  border-color: var(--color-border);
}

.wpd-crit-item.is-selected {
  background: rgba(0,229,184,0.08);
  border-color: rgba(0,229,184,0.4);
}

.wpd-crit-badge {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-dim);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 1px;
}

.wpd-crit-item.is-selected .wpd-crit-badge {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: #000;
}

.wpd-crit-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.wpd-crit-desc {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text);
  line-height: 1.35;
}

.wpd-crit-name {
  font-size: 11px;
  color: var(--color-text-muted);
}

/* Description column in table */

.wpd-inh-td-desc {
  font-size: 12px;
  color: var(--color-text-muted);
  max-width: 180px;
  white-space: normal;
  line-height: 1.35;
}

.wpd-inh-score-summary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  background: var(--color-bg-alt);
  border-radius: var(--radius-sm);
  margin-top: 0.75rem;
  font-size: 12px;
}

.wpd-inh-score-label {
  color: var(--color-text-muted);
  flex: 1;
}

.wpd-inh-score-value {
  font-size: 20px;
  font-weight: 700;
}

.wpd-inh-level-pill {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 100px;
  border: 1px solid;
}

/* ─── Rencana Penanganan ─────────────────────────────────────────────────── */

.wpd-tp-acceptance-note {
  margin-top: 0.375rem;
  font-size: 11px;
  color: var(--color-accent);
  display: flex;
  align-items: flex-start;
  gap: 0.3rem;
  line-height: 1.4;
}

.wpd-tp-appetite-hint {
  display: flex;
  align-items: flex-start;
  gap: 0.375rem;
  font-size: 11px;
  padding: 0.375rem 0.5rem;
  border-radius: 6px;
  margin-bottom: 0.375rem;
  line-height: 1.4;
}
.wpd-tp-appetite-hint.hint-accept {
  color: #34d399;
  background: #34d39912;
  border: 1px solid #34d39940;
}
.wpd-tp-appetite-hint.hint-reject {
  color: #f59e0b;
  background: #f59e0b12;
  border: 1px solid #f59e0b40;
}

/* ─── Rencana Penanganan Table ───────────────────────────────────────────── */

.wpd-tp-td-option {
  font-size: 12px;
  color: var(--color-text-dim);
  max-width: 150px;
  white-space: normal;
}

.wpd-tp-td-pic {
  font-size: 12px;
  color: var(--color-text-dim);
  white-space: nowrap;
}

.wpd-tp-td-date {
  font-size: 12px;
  color: var(--color-text-dim);
  white-space: nowrap;
}

/* ─── Residual Modal ─────────────────────────────────────────────────────── */

.wpd-res-status-section {
  padding: 0.75rem 0;
  margin-bottom: 0.25rem;
}

.wpd-res-status-option {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-bg-alt);
  transition: border-color 0.15s, background 0.15s;
}

.wpd-res-status-option:hover {
  border-color: #34d39966;
  background: #34d39908;
}

.wpd-res-radio {
  accent-color: #34d399;
  width: 14px;
  height: 14px;
  cursor: pointer;
}

.wpd-res-status-label {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 13px;
  color: var(--color-text-dim);
}

.wpd-res-divider {
  height: 1px;
  background: var(--color-border);
  margin: 0.75rem 0;
}

.wpd-res-inherent-ref {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-size: 12px;
}

.wpd-res-inherent-ref-label {
  color: var(--color-text-muted);
}

</style>
