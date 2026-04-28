<template>
  <div class="rcc-page">

    <div v-if="fwLoading" class="rcc-centered">
      <ProgressSpinner style="width: 36px; height: 36px" />
    </div>
    <div v-else-if="fwError" class="rcc-error-banner">
      <i class="pi pi-exclamation-circle" /> {{ fwError }}
    </div>

    <template v-else>

      <!-- ─── Header ─────────────────────────────────────────────────────────── -->
      <div class="rcc-header">
        <div class="rcc-header-left">
          <button v-if="step === 1" class="rcc-back-btn" type="button" @click="goBack">
            <i class="pi pi-arrow-left" />
          </button>
          <button v-else class="rcc-back-btn" type="button" @click="step--">
            <i class="pi pi-arrow-left" />
          </button>
          <div>
            <div class="rcc-breadcrumb">
              Framework / {{ fw?.code ?? '—' }} / Konteks Risiko Baru
            </div>
            <h1 class="rcc-title">{{ STEP_TITLES[step - 1] }}</h1>
            <div class="rcc-subtitle">
              Framework: <span class="rcc-fw-name">{{ fw?.name ?? '—' }}</span>
              <span v-if="fw?.version" class="rcc-fw-version">v{{ fw.version }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ─── Step indicator ─────────────────────────────────────────────────── -->
      <div class="rcc-steps">
        <div v-for="(title, i) in STEP_TITLES" :key="i" class="rcc-step-wrap">
          <div class="rcc-step" :class="{ 'step-active': step === i + 1, 'step-done': step > i + 1 }">
            <div class="rcc-step-num">
              <i v-if="step > i + 1" class="pi pi-check" />
              <span v-else>{{ i + 1 }}</span>
            </div>
            <div class="rcc-step-info">
              <div class="rcc-step-label">{{ title }}</div>
            </div>
          </div>
          <div v-if="i < STEP_TITLES.length - 1" class="rcc-step-line" :class="{ 'line-done': step > i + 1 }" />
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════════════
           STEP 1 — INFO KONTEKS
      ═══════════════════════════════════════════════════════════════════════ -->
      <div v-if="step === 1" class="rcc-body">
        <div class="rcc-main">

          <!-- Informasi Dasar -->
          <section class="rcc-section">
            <div class="rcc-section-header">
              <div class="rcc-section-icon"><i class="pi pi-file-edit" /></div>
              <div>
                <div class="rcc-section-title">Informasi Dasar</div>
                <div class="rcc-section-desc">Identitas utama konteks risiko dalam framework ini.</div>
              </div>
            </div>
            <div class="rcc-fields">
              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label">Nama Konteks <span class="req">*</span></label>
                  <input
                    v-model="form.name"
                    class="rcc-input"
                    :class="{ 'is-error': errors.name }"
                    type="text"
                    placeholder="mis. Konteks Risiko Operasional 2026"
                    autocomplete="off"
                  />
                  <span v-if="errors.name" class="form-err">{{ errors.name }}</span>
                </div>
                <div class="form-group">
                  <label class="form-label">Kode <span class="req">*</span></label>
                  <input
                    v-model="form.code"
                    class="rcc-input"
                    :class="{ 'is-error': errors.code }"
                    type="text"
                    placeholder="mis. KRO-2026"
                    autocomplete="off"
                  />
                  <span v-if="errors.code" class="form-err">{{ errors.code }}</span>
                  <span class="form-hint">Kode unik dalam framework ini.</span>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Deskripsi <span class="form-opt">(opsional)</span></label>
                <textarea
                  v-model="form.description"
                  class="rcc-input rcc-textarea"
                  rows="2"
                  placeholder="Tuliskan deskripsi singkat tentang konteks risiko ini…"
                />
              </div>
            </div>
          </section>

          <!-- Tipe Konteks -->
          <section class="rcc-section">
            <div class="rcc-section-header">
              <div class="rcc-section-icon"><i class="pi pi-th-large" /></div>
              <div>
                <div class="rcc-section-title">Tipe Konteks</div>
                <div class="rcc-section-desc">Pilih objek yang akan dinilai risikonya.</div>
              </div>
            </div>
            <div class="rcc-fields">
              <div class="rcc-type-cards" :class="{ 'is-error': errors.contextType }">
                <label class="rcc-type-card" :class="{ selected: form.contextType === 'ASSET' }">
                  <input v-model="form.contextType" type="radio" value="ASSET" class="rcc-type-radio" />
                  <div class="rcc-type-icon"><i class="pi pi-server" /></div>
                  <div class="rcc-type-info">
                    <div class="rcc-type-name">Aset</div>
                    <div class="rcc-type-hint">Penilaian risiko berbasis aset organisasi.</div>
                  </div>
                  <div v-if="form.contextType === 'ASSET'" class="rcc-type-check"><i class="pi pi-check-circle" /></div>
                </label>
                <label class="rcc-type-card" :class="{ selected: form.contextType === 'PROCESS' }">
                  <input v-model="form.contextType" type="radio" value="PROCESS" class="rcc-type-radio" />
                  <div class="rcc-type-icon"><i class="pi pi-sitemap" /></div>
                  <div class="rcc-type-info">
                    <div class="rcc-type-name">Proses Bisnis</div>
                    <div class="rcc-type-hint">Penilaian risiko berbasis proses bisnis.</div>
                  </div>
                  <div v-if="form.contextType === 'PROCESS'" class="rcc-type-check"><i class="pi pi-check-circle" /></div>
                </label>
              </div>
              <span v-if="errors.contextType" class="form-err">{{ errors.contextType }}</span>
            </div>
          </section>

          <!-- Periode -->
          <section class="rcc-section">
            <div class="rcc-section-header">
              <div class="rcc-section-icon"><i class="pi pi-calendar" /></div>
              <div>
                <div class="rcc-section-title">Periode Penilaian</div>
                <div class="rcc-section-desc">Rentang tahun berlakunya konteks risiko ini.</div>
              </div>
            </div>
            <div class="rcc-fields">
              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label">Tahun Awal <span class="req">*</span></label>
                  <input v-model.number="form.periodStart" class="rcc-input" :class="{ 'is-error': errors.periodStart }" type="number" min="2000" max="2100" />
                  <span v-if="errors.periodStart" class="form-err">{{ errors.periodStart }}</span>
                </div>
                <div class="form-group">
                  <label class="form-label">Tahun Akhir <span class="req">*</span></label>
                  <input v-model.number="form.periodEnd" class="rcc-input" :class="{ 'is-error': errors.periodEnd }" type="number" min="2000" max="2100" />
                  <span v-if="errors.periodEnd" class="form-err">{{ errors.periodEnd }}</span>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════════════
           STEP 2 — MATRIKS & LEVEL RISIKO
      ═══════════════════════════════════════════════════════════════════════ -->
      <div v-if="step === 2" class="s2-layout">

        <!-- ── LEFT: Settings (70%) ────────────────────────────────────────── -->
        <div class="s2-settings">

          <!-- 2A: Ukuran Matriks -->
          <section class="rcc-section">
            <div class="rcc-section-header">
              <div class="rcc-section-icon"><i class="pi pi-table" /></div>
              <div>
                <div class="rcc-section-title">Ukuran Matriks Risiko</div>
                <div class="rcc-section-desc">Baris = level kemungkinan, Kolom = level dampak. Nilai 2–10.</div>
              </div>
            </div>
            <div class="rcc-fields">
              <div class="rcc-matrix-inputs">
                <div class="form-group">
                  <label class="form-label">Baris (Kemungkinan) <span class="req">*</span></label>
                  <div class="rcc-stepper">
                    <button type="button" class="rcc-step-btn" :disabled="form.matrixRows <= 2" @click="changeMatrixSize('rows', -1)"><i class="pi pi-minus" /></button>
                    <input v-model.number="form.matrixRows" class="rcc-input rcc-step-input" :class="{ 'is-error': errors.matrixRows }" type="number" min="2" max="10" @change="onMatrixSizeChange" />
                    <button type="button" class="rcc-step-btn" :disabled="form.matrixRows >= 10" @click="changeMatrixSize('rows', 1)"><i class="pi pi-plus" /></button>
                  </div>
                  <span v-if="errors.matrixRows" class="form-err">{{ errors.matrixRows }}</span>
                </div>
                <div class="form-group">
                  <label class="form-label">Kolom (Dampak) <span class="req">*</span></label>
                  <div class="rcc-stepper">
                    <button type="button" class="rcc-step-btn" :disabled="form.matrixCols <= 2" @click="changeMatrixSize('cols', -1)"><i class="pi pi-minus" /></button>
                    <input v-model.number="form.matrixCols" class="rcc-input rcc-step-input" :class="{ 'is-error': errors.matrixCols }" type="number" min="2" max="10" @change="onMatrixSizeChange" />
                    <button type="button" class="rcc-step-btn" :disabled="form.matrixCols >= 10" @click="changeMatrixSize('cols', 1)"><i class="pi pi-plus" /></button>
                  </div>
                  <span v-if="errors.matrixCols" class="form-err">{{ errors.matrixCols }}</span>
                </div>
                <div class="mx-size-info">
                  <span class="mx-size-badge">{{ form.matrixRows }}×{{ form.matrixCols }}</span>
                  <span>= {{ form.matrixRows * form.matrixCols }} sel &nbsp;·&nbsp; skor maks <strong>{{ form.matrixRows * form.matrixCols }}</strong></span>
                </div>
              </div>
            </div>
          </section>

          <!-- 2B: Level Risiko -->
          <section class="rcc-section">
            <div class="rcc-section-header">
              <div class="rcc-section-icon"><i class="pi pi-list-check" /></div>
              <div>
                <div class="rcc-section-title">Level Risiko</div>
                <div class="rcc-section-desc">
                  Tentukan kategori tingkat risiko berdasarkan rentang skor (0–{{ form.matrixRows * form.matrixCols }}).
                  Level ini akan mewarnai matriks dan menjadi pilihan selera risiko.
                </div>
              </div>
              <button type="button" class="rl-add-row-btn" @click="addLevelRow"><i class="pi pi-plus" /> Tambah Level</button>
            </div>
            <div class="rcc-fields">
              <div class="rl-table-head">
                <div class="rl-th" style="width:36px" />
                <div class="rl-th" style="width:110px">Warna</div>
                <div class="rl-th" style="flex:2">Nama Level *</div>
                <div class="rl-th" style="width:80px">Skor Min *</div>
                <div class="rl-th" style="width:80px">Skor Maks *</div>
                <div class="rl-th" style="flex:1">Deskripsi</div>
                <div class="rl-th" style="width:32px" />
              </div>
              <div class="rl-rows">
                <div
                  v-for="(row, idx) in levelRows"
                  :key="idx"
                  class="rl-row"
                  :class="{ 'rl-row-error': levelRowErrors[idx]?.name || levelRowErrors[idx]?.score }"
                >
                  <div class="rl-td" style="width:36px;align-items:center">
                    <div class="rl-order-badge" :style="{ background: row.color + '22', color: row.color, borderColor: row.color + '55' }">{{ idx + 1 }}</div>
                  </div>
                  <div class="rl-td" style="width:110px">
                    <div class="rl-color-wrap">
                      <div class="rl-color-swatch" :style="{ background: row.color }" />
                      <div class="rl-color-presets-mini">
                        <button v-for="p in COLOR_PRESETS" :key="p" type="button" class="rl-preset-dot" :style="{ background: p }" :class="{ active: row.color === p }" @click="row.color = p" />
                      </div>
                      <input v-model="row.color" type="color" class="rl-color-picker" title="Kustom" />
                    </div>
                  </div>
                  <div class="rl-td" style="flex:2">
                    <input v-model="row.name" class="rcc-input rl-input" :class="{ 'is-error': levelRowErrors[idx]?.name }" type="text" placeholder="mis. Rendah" />
                    <span v-if="levelRowErrors[idx]?.name" class="form-err">{{ levelRowErrors[idx].name }}</span>
                  </div>
                  <div class="rl-td" style="width:80px">
                    <input v-model.number="row.minScore" class="rcc-input rl-input" :class="{ 'is-error': levelRowErrors[idx]?.score }" type="number" min="0" :max="form.matrixRows * form.matrixCols" />
                  </div>
                  <div class="rl-td" style="width:80px">
                    <input v-model.number="row.maxScore" class="rcc-input rl-input" :class="{ 'is-error': levelRowErrors[idx]?.score }" type="number" min="0" :max="form.matrixRows * form.matrixCols" />
                    <span v-if="levelRowErrors[idx]?.score" class="form-err">{{ levelRowErrors[idx].score }}</span>
                  </div>
                  <div class="rl-td" style="flex:1">
                    <input v-model="row.description" class="rcc-input rl-input" type="text" placeholder="(opsional)" />
                  </div>
                  <div class="rl-td" style="width:32px">
                    <button type="button" class="rl-remove-btn" :disabled="levelRows.length <= 1" @click="removeLevelRow(idx)">
                      <i class="pi pi-trash" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- 2C: Skor Matriks -->
          <section class="rcc-section">
            <div class="rcc-section-header">
              <div class="rcc-section-icon"><i class="pi pi-table" /></div>
              <div>
                <div class="rcc-section-title">Skor Matriks</div>
                <div class="rcc-section-desc">
                  Isi nilai skor untuk setiap kombinasi kemungkinan (baris) dan dampak (kolom).
                  Warna otomatis diterapkan sesuai level risiko di atas.
                </div>
              </div>
              <button type="button" class="rl-add-row-btn" @click="autoFillMatrix">
                <i class="pi pi-magic" /> Isi Otomatis
              </button>
            </div>
            <div class="rcc-fields" style="padding: 0">
              <div class="mc-wrap">
                <table class="mc-table">
                  <thead>
                    <tr>
                      <th class="mc-corner">
                        <span class="mc-corner-row">Kemungkinan</span>
                        <div class="mc-corner-line" />
                        <span class="mc-corner-col">Dampak</span>
                      </th>
                      <th v-for="c in form.matrixCols" :key="`ch-${c}`" class="mc-col-header">
                        <div class="mc-col-level">D{{ c }}</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="r in form.matrixRows" :key="`mr-${r}`">
                      <td class="mc-row-header">
                        <div class="mc-row-level">L{{ r }}</div>
                      </td>
                      <td v-for="c in form.matrixCols" :key="`mc-${r}-${c}`" class="mc-cell-td">
                        <div
                          class="mc-cell"
                          :style="{
                            background: matrixGrid[r-1]?.[c-1]
                              ? (cellMatchingLevel(matrixGrid[r-1]![c-1]!.value)?.color || 'transparent') + (matrixGrid[r-1]![c-1]!.value ? '33' : '11')
                              : 'transparent',
                            borderColor: matrixGrid[r-1]?.[c-1]
                              ? (cellMatchingLevel(matrixGrid[r-1]![c-1]!.value)?.color || 'var(--color-border)')
                              : 'var(--color-border)',
                          }"
                        >
                          <input
                            v-if="matrixGrid[r-1]?.[c-1]"
                            v-model.number="matrixGrid[r-1]![c-1]!.value"
                            class="mc-input"
                            :style="{ color: cellMatchingLevel(matrixGrid[r-1]![c-1]!.value)?.color || 'var(--color-text-dim)' }"
                            type="number" min="0" :max="form.matrixRows * form.matrixCols"
                            @input="onCellInput(matrixGrid[r-1]![c-1]!)"
                          />
                          <div
                            v-if="matrixGrid[r-1]?.[c-1] && cellMatchingLevel(matrixGrid[r-1]![c-1]!.value)"
                            class="mc-cell-lbl"
                            :style="{ color: cellMatchingLevel(matrixGrid[r-1]![c-1]!.value)?.color }"
                          >
                            {{ cellMatchingLevel(matrixGrid[r-1]![c-1]!.value)?.name }}
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

        </div>

        <!-- ── RIGHT: Live Preview (30%) ───────────────────────────────────── -->
        <div class="s2-preview-col">
          <div class="s2-preview-panel">

            <!-- Panel header -->
            <div class="s2-prev-header">
              <div class="s2-prev-header-left">
                <i class="pi pi-eye" />
                <span>Pratinjau Matriks</span>
              </div>
              <div class="s2-prev-live-dot">
                <span class="s2-live-pulse" />
                Live
              </div>
            </div>

            <!-- Stats bar -->
            <div class="s2-prev-stats">
              <div class="s2-prev-stat">
                <div class="s2-prev-stat-val">{{ form.matrixRows }}×{{ form.matrixCols }}</div>
                <div class="s2-prev-stat-lbl">Ukuran</div>
              </div>
              <div class="s2-prev-stat-div" />
              <div class="s2-prev-stat">
                <div class="s2-prev-stat-val">{{ filledCellCount }}</div>
                <div class="s2-prev-stat-lbl">Sel terisi</div>
              </div>
              <div class="s2-prev-stat-div" />
              <div class="s2-prev-stat">
                <div class="s2-prev-stat-val">{{ levelRows.filter(l => l.name).length }}</div>
                <div class="s2-prev-stat-lbl">Level</div>
              </div>
            </div>

            <!-- Matrix visualization -->
            <div class="s2-prev-matrix-wrap" :style="{ '--s2-rows': form.matrixRows, '--s2-cols': form.matrixCols }">
              <table class="s2-prev-matrix">
                <thead>
                  <tr>
                    <th class="s2-prev-corner">
                      <span class="s2-prev-corner-row">K</span>
                      <div class="s2-prev-corner-line" />
                      <span class="s2-prev-corner-col">D</span>
                    </th>
                    <th v-for="c in form.matrixCols" :key="`pch-${c}`" class="s2-prev-col-h">D{{ c }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="r in form.matrixRows" :key="`pmr-${r}`">
                    <td class="s2-prev-row-h">L{{ r }}</td>
                    <td v-for="c in form.matrixCols" :key="`pmc-${r}-${c}`" class="s2-prev-cell-td">
                      <div
                        class="s2-prev-cell"
                        :style="{
                          background: matrixGrid[r-1]?.[c-1]?.value
                            ? (cellMatchingLevel(matrixGrid[r-1]![c-1]!.value)?.color || 'var(--color-border)') + '40'
                            : 'rgba(255,255,255,0.03)',
                          borderColor: matrixGrid[r-1]?.[c-1]?.value
                            ? (cellMatchingLevel(matrixGrid[r-1]![c-1]!.value)?.color || 'var(--color-border)')
                            : 'var(--color-border)',
                        }"
                        :title="matrixGrid[r-1]?.[c-1]?.value
                          ? `L${r}×D${c} = ${matrixGrid[r-1]![c-1]!.value} (${cellMatchingLevel(matrixGrid[r-1]![c-1]!.value)?.name || '—'})`
                          : `L${r}×D${c}`"
                      >
                        <span
                          class="s2-prev-cell-val"
                          :style="{ color: matrixGrid[r-1]?.[c-1]?.value ? (cellMatchingLevel(matrixGrid[r-1]![c-1]!.value)?.color || 'var(--color-text-muted)') : 'var(--color-text-muted)' }"
                        >
                          {{ matrixGrid[r-1]?.[c-1]?.value || '' }}
                        </span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Score distribution bar -->
            <div v-if="levelRows.some(l => l.name)" class="s2-prev-dist">
              <div class="s2-prev-dist-label">Distribusi skor</div>
              <div class="s2-prev-dist-bar">
                <div
                  v-for="(row, idx) in levelRows.filter(l => l.name)"
                  :key="idx"
                  class="s2-prev-dist-seg"
                  :style="{
                    background: row.color + '55',
                    borderColor: row.color,
                    flex: Math.max(row.maxScore - row.minScore + 1, 1),
                  }"
                  :title="`${row.name}: ${row.minScore}–${row.maxScore}`"
                />
              </div>
            </div>

            <!-- Legend -->
            <div class="s2-prev-legend">
              <div v-if="levelRows.some(l => l.name)" class="s2-prev-legend-items">
                <div v-for="(row, i) in levelRows.filter(l => l.name)" :key="i" class="s2-prev-legend-item">
                  <span class="s2-prev-legend-dot" :style="{ background: row.color }" />
                  <span class="s2-prev-legend-name">{{ row.name }}</span>
                  <span class="s2-prev-legend-range">{{ row.minScore }}–{{ row.maxScore }}</span>
                </div>
              </div>
              <div v-else class="s2-prev-legend-empty">
                <i class="pi pi-info-circle" />
                Definisikan level risiko untuk melihat warna otomatis
              </div>
            </div>

            <!-- Completion hint -->
            <div class="s2-prev-hint" :class="{ 's2-prev-hint-ok': filledCellCount === form.matrixRows * form.matrixCols }">
              <i :class="filledCellCount === form.matrixRows * form.matrixCols ? 'pi pi-check-circle' : 'pi pi-info-circle'" />
              <span v-if="filledCellCount === form.matrixRows * form.matrixCols">Semua sel terisi — matriks siap</span>
              <span v-else>{{ form.matrixRows * form.matrixCols - filledCellCount }} sel belum terisi. Gunakan "Isi Otomatis" atau isi manual.</span>
            </div>

          </div>
        </div>

      </div>

      <!-- ═══════════════════════════════════════════════════════════════════════
           STEP 3 — SELERA RISIKO
      ═══════════════════════════════════════════════════════════════════════ -->
      <div v-if="step === 3" class="rcc-body">
        <div class="rcc-main">

          <!-- Matrix visualization (read-only) -->
          <section class="rcc-section">
            <div class="rcc-section-header">
              <div class="rcc-section-icon"><i class="pi pi-table" /></div>
              <div>
                <div class="rcc-section-title">Visualisasi Matriks Risiko</div>
                <div class="rcc-section-desc">Hasil konfigurasi matriks {{ form.matrixRows }}×{{ form.matrixCols }} dari langkah sebelumnya.</div>
              </div>
            </div>
            <div class="rcc-fields" style="padding: 0">
              <div class="mc-wrap">
                <table class="mc-table">
                  <thead>
                    <tr>
                      <th class="mc-corner">
                        <span class="mc-corner-row">Kemungkinan</span>
                        <div class="mc-corner-line" />
                        <span class="mc-corner-col">Dampak</span>
                      </th>
                      <th v-for="c in form.matrixCols" :key="`ch3-${c}`" class="mc-col-header">
                        <div class="mc-col-level">D{{ c }}</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="r in form.matrixRows" :key="`mr3-${r}`">
                      <td class="mc-row-header">
                        <div class="mc-row-level">L{{ r }}</div>
                      </td>
                      <td
                        v-for="c in form.matrixCols"
                        :key="`mc3-${r}-${c}`"
                        class="mc-cell-td"
                      >
                        <div
                          class="mc-cell mc-cell-readonly"
                          :class="{ 'mc-cell-appetite': appetiteMatchesCell(r, c) }"
                          :style="{
                            background: matrixGrid[r-1]?.[c-1]
                              ? (cellMatchingLevel(matrixGrid[r-1]![c-1]!.value)?.color || 'transparent') + (matrixGrid[r-1]![c-1]!.value ? '33' : '11')
                              : 'transparent',
                            borderColor: matrixGrid[r-1]?.[c-1]
                              ? (cellMatchingLevel(matrixGrid[r-1]![c-1]!.value)?.color || 'var(--color-border)')
                              : 'var(--color-border)',
                          }"
                        >
                          <div
                            class="mc-cell-val-ro"
                            :style="{ color: matrixGrid[r-1]?.[c-1] ? (cellMatchingLevel(matrixGrid[r-1]![c-1]!.value)?.color || 'var(--color-text-muted)') : 'var(--color-text-muted)' }"
                          >
                            {{ matrixGrid[r-1]?.[c-1]?.value || 0 }}
                          </div>
                          <div
                            v-if="matrixGrid[r-1]?.[c-1] && cellMatchingLevel(matrixGrid[r-1]![c-1]!.value)"
                            class="mc-cell-lbl"
                            :style="{ color: cellMatchingLevel(matrixGrid[r-1]![c-1]!.value)?.color }"
                          >
                            {{ cellMatchingLevel(matrixGrid[r-1]![c-1]!.value)?.name }}
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="mc-legend">
                <span class="mc-legend-title">Level Risiko:</span>
                <span v-for="(row, i) in levelRows.filter(l => l.name)" :key="i" class="mc-legend-item">
                  <span class="mc-legend-dot" :style="{ background: row.color }" />
                  {{ row.name }}
                  <span class="mc-legend-score">({{ row.minScore }}–{{ row.maxScore }})</span>
                </span>
              </div>
            </div>
          </section>

          <!-- Selera Risiko -->
          <section class="rcc-section">
            <div class="rcc-section-header">
              <div class="rcc-section-icon"><i class="pi pi-gauge" /></div>
              <div>
                <div class="rcc-section-title">Selera Risiko <span class="form-opt">(opsional)</span></div>
                <div class="rcc-section-desc">
                  Tentukan level risiko maksimum yang dapat diterima organisasi. Sel matriks yang
                  berada pada atau di bawah level ini akan disorot sebagai zona "aman".
                </div>
              </div>
            </div>
            <div class="rcc-fields">
              <div class="form-group">
                <label class="form-label">Level Selera Risiko</label>
                <div class="rl-select-wrap">
                  <select v-model="riskAppetiteLevel" class="rcc-input rcc-select">
                    <option value="">— Tidak ditentukan —</option>
                    <option v-for="lvl in levelRows.filter(l => l.name)" :key="lvl.name" :value="lvl.name">
                      {{ lvl.name }} (skor {{ lvl.minScore }}–{{ lvl.maxScore }})
                    </option>
                  </select>
                  <!-- Color indicator -->
                  <div
                    v-if="riskAppetiteLevel && selectedAppetiteLevel"
                    class="rl-select-indicator"
                    :style="{ background: selectedAppetiteLevel.color, boxShadow: '0 0 0 3px ' + selectedAppetiteLevel.color + '44' }"
                  />
                </div>
                <!-- Preview badge -->
                <div v-if="selectedAppetiteLevel" class="rl-appetite-preview" :style="{ background: selectedAppetiteLevel.color + '15', borderColor: selectedAppetiteLevel.color + '44' }">
                  <div class="rl-ap-badge" :style="{ background: selectedAppetiteLevel.color + '22', color: selectedAppetiteLevel.color, borderColor: selectedAppetiteLevel.color + '55' }">
                    <i class="pi pi-circle-fill" style="font-size:8px" />
                    {{ selectedAppetiteLevel.name }}
                  </div>
                  <div class="rl-ap-info" :style="{ color: selectedAppetiteLevel.color }">
                    Organisasi dapat menerima risiko hingga skor
                    <strong>{{ selectedAppetiteLevel.maxScore }}</strong>.
                    Risiko di atas level ini memerlukan penanganan segera.
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Deskripsi Selera Risiko <span class="form-opt">(opsional)</span></label>
                <textarea
                  v-model="riskAppetiteDescription"
                  class="rcc-input rcc-textarea"
                  rows="3"
                  placeholder="Jelaskan kebijakan selera risiko organisasi untuk konteks ini…"
                />
              </div>
            </div>
          </section>

          <!-- Opsi Penanganan Risiko -->
          <section class="rcc-section">
            <div class="rcc-section-header">
              <div class="rcc-section-icon"><i class="pi pi-wrench" /></div>
              <div>
                <div class="rcc-section-title">Opsi Penanganan Risiko <span class="form-opt">(opsional)</span></div>
                <div class="rcc-section-desc">
                  Pilih strategi penanganan yang berlaku pada konteks ini. Opsi yang dipilih akan menjadi
                  referensi dalam proses identifikasi dan evaluasi risiko.
                </div>
              </div>
            </div>
            <div class="rcc-fields">

              <!-- Preset strategy cards -->
              <div class="to-preset-grid">
                <div
                  v-for="t in treatmentRows.filter(r => r.preset)"
                  :key="t.id"
                  class="to-preset-card"
                  :class="{ 'to-card-selected': t.selected }"
                  :style="t.selected ? { borderColor: t.color + '66', background: t.color + '0d' } : {}"
                  @click="t.selected = !t.selected"
                >
                  <div class="to-card-top">
                    <div class="to-card-icon" :style="{ background: t.color + '22', color: t.color }">
                      <i :class="t.icon" />
                    </div>
                    <div class="to-card-toggle">
                      <div class="to-card-checkbox" :class="{ checked: t.selected }" :style="t.selected ? { background: t.color, borderColor: t.color } : {}">
                        <i v-if="t.selected" class="pi pi-check" />
                      </div>
                    </div>
                  </div>
                  <div class="to-card-name" :style="t.selected ? { color: t.color } : {}">{{ t.name }}</div>
                  <div class="to-card-hint">{{ t.hint }}</div>
                  <textarea
                    v-if="t.selected"
                    v-model="t.description"
                    class="rcc-input rcc-textarea to-card-desc"
                    rows="2"
                    placeholder="Deskripsi penerapan strategi ini… (opsional)"
                    @click.stop
                  />
                </div>
              </div>

              <!-- Custom treatment options -->
              <div v-if="treatmentRows.some(r => !r.preset)" class="to-custom-section">
                <div class="to-custom-label">Opsi Kustom</div>
                <div class="to-custom-rows">
                  <div v-for="t in treatmentRows.filter(r => !r.preset)" :key="t.id" class="to-custom-row">
                    <input
                      v-model="t.name"
                      class="rcc-input rl-input"
                      type="text"
                      placeholder="Nama opsi penanganan…"
                    />
                    <input
                      v-model="t.description"
                      class="rcc-input rl-input"
                      type="text"
                      placeholder="Deskripsi (opsional)"
                    />
                    <button type="button" class="rl-remove-btn" @click="removeCustomTreatment(t.id)">
                      <i class="pi pi-trash" />
                    </button>
                  </div>
                </div>
              </div>

              <button type="button" class="to-add-custom-btn" @click="addCustomTreatment">
                <i class="pi pi-plus" /> Tambah Opsi Kustom
              </button>

            </div>
          </section>

          <!-- API Error -->
          <div v-if="apiError" class="rcc-alert-error">
            <i class="pi pi-exclamation-triangle" /> {{ apiError }}
          </div>

        </div>
      </div>

      <!-- ─── Sticky Action Bar ───────────────────────────────────────────────── -->
      <div class="rcc-action-bar">
        <div class="rcc-action-inner">
          <div class="rcc-action-info">
            <template v-if="step === 1">
              <span v-if="form.name" class="rcc-preview-name">{{ form.name }}</span>
              <span v-if="form.code" class="rcc-preview-code">{{ form.code }}</span>
              <span v-if="!form.name" class="rcc-preview-placeholder">Isi informasi konteks di atas</span>
            </template>
            <template v-else-if="step === 2">
              <span class="rcc-preview-code">{{ form.matrixRows }}×{{ form.matrixCols }}</span>
              <span class="rcc-preview-name">{{ levelRows.filter(l => l.name).length }} level risiko</span>
              <span class="rcc-preview-placeholder">· {{ filledCellCount }}/{{ form.matrixRows * form.matrixCols }} sel terisi</span>
            </template>
            <template v-else>
              <span class="rcc-preview-name">{{ form.name }}</span>
              <span v-if="riskAppetiteLevel" class="rcc-preview-code">Selera: {{ riskAppetiteLevel }}</span>
              <span v-if="treatmentRows.filter(t => t.selected && t.name.trim()).length" class="rcc-preview-code">
                {{ treatmentRows.filter(t => t.selected && t.name.trim()).length }} penanganan
              </span>
              <span v-if="!riskAppetiteLevel" class="rcc-preview-placeholder">Selera risiko belum ditentukan</span>
            </template>
          </div>
          <div class="rcc-action-btns">
            <button v-if="step === 1" type="button" class="rcc-btn-cancel" @click="goBack">Batal</button>
            <button v-else type="button" class="rcc-btn-cancel" :disabled="submitting" @click="step--">
              <i class="pi pi-arrow-left" /> Kembali
            </button>
            <button v-if="step < 3" type="button" class="rcc-btn-submit" @click="nextStep">
              Lanjut <i class="pi pi-arrow-right" />
            </button>
            <button v-else type="button" class="rcc-btn-submit" :disabled="submitting" @click="submitAll">
              <i v-if="submitting" class="pi pi-spin pi-spinner" />
              <i v-else class="pi pi-check" />
              {{ submitting ? 'Menyimpan…' : 'Selesai & Simpan' }}
            </button>
          </div>
        </div>
      </div>

    </template>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'
import { riskContextApi } from '@/api/riskContext'
import { frameworkApi, type Framework } from '@/api/framework'
import { extractApiError } from '@/utils/apiError'

const router = useRouter()
const route = useRoute()
const toast = useToast()

const frameworkId = route.params.frameworkId as string

const STEP_TITLES = ['Info Konteks', 'Matriks & Level Risiko', 'Selera Risiko']
const COLOR_PRESETS = ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444', '#9333ea']

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

// ─── Step ─────────────────────────────────────────────────────────────────────

const step = ref(1)

// ─── Step 1: Form ─────────────────────────────────────────────────────────────

const form = reactive({
  name: '',
  code: '',
  contextType: '' as '' | 'ASSET' | 'PROCESS',
  periodStart: new Date().getFullYear(),
  periodEnd: new Date().getFullYear(),
  matrixRows: 5,
  matrixCols: 5,
  description: '',
})

const errors = reactive({
  name: '', code: '', contextType: '',
  periodStart: '', periodEnd: '',
  matrixRows: '', matrixCols: '',
})

function validateStep1(): boolean {
  let ok = true
  errors.name = ''; errors.code = ''; errors.contextType = ''
  errors.periodStart = ''; errors.periodEnd = ''
  errors.matrixRows = ''; errors.matrixCols = ''

  if (!form.name.trim()) { errors.name = 'Nama wajib diisi'; ok = false }
  if (!form.code.trim()) { errors.code = 'Kode wajib diisi'; ok = false }
  if (!form.contextType) { errors.contextType = 'Tipe konteks wajib dipilih'; ok = false }
  if (!form.periodStart || form.periodStart < 2000 || form.periodStart > 2100) { errors.periodStart = 'Tahun tidak valid (2000–2100)'; ok = false }
  if (!form.periodEnd || form.periodEnd < 2000 || form.periodEnd > 2100) { errors.periodEnd = 'Tahun tidak valid (2000–2100)'; ok = false }
  if (form.periodStart && form.periodEnd && form.periodEnd < form.periodStart) { errors.periodEnd = 'Tahun akhir tidak boleh sebelum tahun awal'; ok = false }
  return ok
}

// ─── Step 2: Level Risiko ─────────────────────────────────────────────────────

interface LevelRow { name: string; description: string; minScore: number; maxScore: number; color: string }

const levelRows = ref<LevelRow[]>([
  { name: 'Sangat Rendah', description: '', minScore: 0,  maxScore: 4,  color: '#22c55e' },
  { name: 'Rendah',        description: '', minScore: 5,  maxScore: 9,  color: '#84cc16' },
  { name: 'Sedang',        description: '', minScore: 10, maxScore: 14, color: '#eab308' },
  { name: 'Tinggi',        description: '', minScore: 15, maxScore: 19, color: '#f97316' },
  { name: 'Sangat Tinggi', description: '', minScore: 20, maxScore: 25, color: '#ef4444' },
])
const levelRowErrors = ref<{ name?: string; score?: string }[]>([])

function addLevelRow() {
  const last = levelRows.value[levelRows.value.length - 1]
  levelRows.value.push({
    name: '',
    description: '',
    minScore: last ? last.maxScore + 1 : 0,
    maxScore: last ? last.maxScore + 5 : 5,
    color: COLOR_PRESETS[levelRows.value.length % COLOR_PRESETS.length] ?? '#22c55e',
  })
}

function removeLevelRow(idx: number) {
  levelRows.value.splice(idx, 1)
}

function validateStep2(): boolean {
  levelRowErrors.value = levelRows.value.map((row) => {
    const e: { name?: string; score?: string } = {}
    if (!row.name.trim()) e.name = 'Nama wajib diisi'
    if (row.maxScore < row.minScore) e.score = 'Maks ≥ min'
    return e
  })
  if (!errors.matrixRows && (form.matrixRows < 2 || form.matrixRows > 10)) {
    errors.matrixRows = 'Nilai 2–10'
    return false
  }
  if (!errors.matrixCols && (form.matrixCols < 2 || form.matrixCols > 10)) {
    errors.matrixCols = 'Nilai 2–10'
    return false
  }
  return levelRowErrors.value.every((e) => !e.name && !e.score)
}

// ─── Step 2: Matrix ───────────────────────────────────────────────────────────

interface MatrixCell { row: number; col: number; value: number; label: string; color: string }

const matrixGrid = ref<MatrixCell[][]>([])

function buildMatrix() {
  const rows = form.matrixRows
  const cols = form.matrixCols
  const grid: MatrixCell[][] = []
  for (let r = 1; r <= rows; r++) {
    const row: MatrixCell[] = []
    for (let c = 1; c <= cols; c++) {
      const existing = matrixGrid.value[r - 1]?.[c - 1]
      row.push({ row: r, col: c, value: existing?.value ?? 0, label: existing?.label ?? '', color: existing?.color ?? '' })
    }
    grid.push(row)
  }
  matrixGrid.value = grid
}

function changeMatrixSize(axis: 'rows' | 'cols', delta: number) {
  if (axis === 'rows') form.matrixRows = Math.min(10, Math.max(2, form.matrixRows + delta))
  else form.matrixCols = Math.min(10, Math.max(2, form.matrixCols + delta))
  buildMatrix()
}

function onMatrixSizeChange() {
  buildMatrix()
}

function cellMatchingLevel(value: number): LevelRow | undefined {
  if (!value) return undefined
  return levelRows.value.find((l) => l.name && value >= l.minScore && value <= l.maxScore)
}

function onCellInput(cell: MatrixCell) {
  const lvl = cellMatchingLevel(cell.value)
  if (lvl) {
    cell.label = lvl.name
    cell.color = lvl.color
  } else {
    cell.label = ''
    cell.color = ''
  }
}

// Re-apply colors when level definitions change
watch(levelRows, () => {
  for (const row of matrixGrid.value) {
    for (const cell of row) {
      if (cell.value > 0) onCellInput(cell)
    }
  }
}, { deep: true })

// Auto-fill matrix with multiplied scores (row × col)
function autoFillMatrix() {
  for (const row of matrixGrid.value) {
    for (const cell of row) {
      cell.value = cell.row * cell.col
      onCellInput(cell)
    }
  }
}

const filledCellCount = computed(() =>
  matrixGrid.value.flat().filter((c) => c.value > 0).length,
)

// ─── Step 3: Selera Risiko ────────────────────────────────────────────────────

const riskAppetiteLevel = ref('')
const riskAppetiteDescription = ref('')

// ─── Step 3: Opsi Penanganan Risiko ──────────────────────────────────────────

interface TreatmentRow {
  id: string
  name: string
  description: string
  selected: boolean
  preset: boolean
  icon: string
  color: string
  hint: string
}

const treatmentRows = ref<TreatmentRow[]>([
  {
    id: 'MITIGATE', preset: true, selected: false,
    name: 'Mitigasi', description: '',
    icon: 'pi pi-shield', color: '#3b82f6',
    hint: 'Kurangi kemungkinan atau dampak risiko dengan kontrol tambahan.',
  },
  {
    id: 'ACCEPT', preset: true, selected: false,
    name: 'Terima', description: '',
    icon: 'pi pi-check-circle', color: '#22c55e',
    hint: 'Terima risiko sebagaimana adanya tanpa tindakan tambahan.',
  },
  {
    id: 'AVOID', preset: true, selected: false,
    name: 'Hindari', description: '',
    icon: 'pi pi-ban', color: '#f97316',
    hint: 'Hentikan atau ubah aktivitas yang menjadi sumber risiko.',
  },
  {
    id: 'TRANSFER', preset: true, selected: false,
    name: 'Transfer', description: '',
    icon: 'pi pi-send', color: '#a855f7',
    hint: 'Alihkan risiko ke pihak ketiga (asuransi, kontrak, dll).',
  },
])

let treatmentCustomCounter = 0

function addCustomTreatment() {
  treatmentCustomCounter++
  treatmentRows.value.push({
    id: `custom-${treatmentCustomCounter}`,
    preset: false, selected: true,
    name: '', description: '',
    icon: '', color: '', hint: '',
  })
}

function removeCustomTreatment(id: string) {
  const idx = treatmentRows.value.findIndex((t) => t.id === id)
  if (idx !== -1) treatmentRows.value.splice(idx, 1)
}

const selectedAppetiteLevel = computed(() =>
  levelRows.value.find((l) => l.name === riskAppetiteLevel.value),
)

function appetiteMatchesCell(r: number, c: number): boolean {
  if (!selectedAppetiteLevel.value) return false
  const cell = matrixGrid.value[r - 1]?.[c - 1]
  if (!cell) return false
  const lvl = cellMatchingLevel(cell.value)
  return !!lvl && lvl.name === riskAppetiteLevel.value
}

// ─── Navigation ───────────────────────────────────────────────────────────────

function nextStep() {
  if (step.value === 1) {
    if (!validateStep1()) return
    buildMatrix()
  } else if (step.value === 2) {
    if (!validateStep2()) return
  }
  step.value++
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// ─── Submit ───────────────────────────────────────────────────────────────────

const submitting = ref(false)
const apiError = ref('')

async function submitAll() {
  submitting.value = true
  apiError.value = ''

  try {
    const namedLevels = levelRows.value.filter((l) => l.name.trim())
    const allCells = matrixGrid.value.flat()
    const selectedTreatments = treatmentRows.value.filter((t) => t.selected && t.name.trim())

    const res = await riskContextApi.createFull(frameworkId, {
      name: form.name.trim(),
      code: form.code.trim(),
      contextType: form.contextType,
      periodStart: form.periodStart,
      periodEnd: form.periodEnd,
      matrixRows: form.matrixRows,
      matrixCols: form.matrixCols,
      description: form.description.trim() || undefined,
      riskAppetiteLevel: riskAppetiteLevel.value || undefined,
      riskAppetiteDescription: riskAppetiteDescription.value.trim() || undefined,
      riskLevels: namedLevels.map((l, i) => ({
        name: l.name.trim(),
        description: l.description.trim() || undefined,
        minScore: l.minScore,
        maxScore: l.maxScore,
        color: l.color || undefined,
        order: i + 1,
      })),
      matrixCells: allCells.map((c) => ({
        row: c.row,
        col: c.col,
        value: c.value,
        label: c.label.trim() || undefined,
        color: c.color || undefined,
      })),
      treatmentOptions: selectedTreatments.map((t, i) => ({
        name: t.name.trim(),
        description: t.description.trim() || undefined,
        order: i + 1,
      })),
    })

    const contextId = res.data.data.id
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Konteks risiko berhasil dibuat', life: 3000 })
    router.push({ name: 'risk-context-detail', params: { contextId } })

  } catch (err: any) {
    apiError.value = extractApiError(err, 'Gagal membuat konteks risiko.')
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
  } finally {
    submitting.value = false
  }
}

function goBack() {
  router.push({ name: 'framework-contexts', params: { frameworkId } })
}

// ─── Init ─────────────────────────────────────────────────────────────────────

onMounted(() => {
  loadFramework()
  buildMatrix()
})
</script>

<style scoped>
.rcc-page {
  padding: 2rem;
  max-width: 980px;
  margin: 0 auto;
  padding-bottom: 6rem;
}

/* ─── Header ──────────────────────────────────────────────────────────────── */

.rcc-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.rcc-header-left { display: flex; align-items: flex-start; gap: 1rem; }

.rcc-back-btn {
  width: 34px; height: 34px;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-dim);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px;
  transition: all 0.15s;
  margin-top: 4px; flex-shrink: 0;
}
.rcc-back-btn:hover { border-color: var(--color-accent); color: var(--color-accent); }

.rcc-breadcrumb { font-size: 11px; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
.rcc-title { font-family: var(--font-display); font-size: 1.35rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: var(--color-text); margin: 0 0 0.25rem; }
.rcc-subtitle { font-size: 12px; color: var(--color-text-dim); display: flex; align-items: center; gap: 0.4rem; }
.rcc-fw-name { color: var(--color-text); font-weight: 500; }
.rcc-fw-version { font-size: 11px; color: var(--color-text-muted); }

/* ─── Step indicator ──────────────────────────────────────────────────────── */

.rcc-steps {
  display: flex;
  align-items: center;
  margin-bottom: 1.75rem;
}

.rcc-step-wrap {
  display: flex;
  align-items: center;
  flex: 1;
}

.rcc-step-wrap:last-child { flex: 0 0 auto; }

.rcc-step {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.rcc-step-num {
  width: 28px; height: 28px;
  border-radius: 50%;
  border: 1.5px solid var(--color-border);
  background: var(--color-bg-input);
  color: var(--color-text-muted);
  font-size: 12px; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}

.rcc-step-label { font-size: 12px; color: var(--color-text-muted); font-weight: 500; white-space: nowrap; }

.step-active .rcc-step-num { background: rgba(0,229,184,0.15); border-color: var(--color-accent); color: var(--color-accent); }
.step-active .rcc-step-label { color: var(--color-text); }
.step-done .rcc-step-num { background: var(--color-accent); border-color: var(--color-accent); color: #0a0f0e; }

.rcc-step-line {
  flex: 1;
  height: 1.5px;
  background: var(--color-border);
  margin: 0 0.6rem;
  transition: background 0.2s;
}

.line-done { background: var(--color-accent); }

/* ─── Body & Sections ────────────────────────────────────────────────────── */

.rcc-body { display: flex; flex-direction: column; gap: 1.25rem; }
.rcc-main { display: flex; flex-direction: column; gap: 1.25rem; }

/* ─── Step 2: Two-column layout ──────────────────────────────────────────── */

.s2-layout {
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
}

.s2-settings {
  flex: 0 0 70%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.s2-preview-col {
  flex: 0 0 calc(30% - 1.25rem);
  position: sticky;
  top: 1.5rem;
}

.s2-preview-panel {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

/* Panel header */
.s2-prev-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.65rem 1rem;
  border-bottom: 1px solid var(--color-border);
  background: rgba(0,229,184,0.04);
}

.s2-prev-header-left {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text);
}

.s2-prev-header-left .pi { color: var(--color-accent); font-size: 12px; }

.s2-prev-live-dot {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  color: var(--color-accent);
  font-weight: 600;
  letter-spacing: 0.04em;
}

.s2-live-pulse {
  display: inline-block;
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--color-accent);
  animation: pulse-dot 1.4s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.7); }
}

/* Stats bar */
.s2-prev-stats {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 0.6rem 1rem;
  border-bottom: 1px solid var(--color-border);
}

.s2-prev-stat { flex: 1; text-align: center; }
.s2-prev-stat-val { font-family: var(--font-mono); font-size: 15px; font-weight: 700; color: var(--color-text); }
.s2-prev-stat-lbl { font-size: 9px; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-top: 1px; }
.s2-prev-stat-div { width: 1px; height: 28px; background: var(--color-border); }

/* Matrix visualization */
.s2-prev-matrix-wrap {
  padding: 0.75rem;
  overflow-x: auto;
  display: flex;
  justify-content: center;
}

.s2-prev-matrix {
  border-collapse: separate;
  border-spacing: 3px;
}

.s2-prev-corner {
  width: 28px; min-width: 28px;
  position: relative;
  padding: 4px;
  vertical-align: middle;
  background: transparent;
}

.s2-prev-corner-row {
  position: absolute; bottom: 4px; left: 4px;
  font-size: 7px; color: var(--color-text-muted); font-weight: 600;
}

.s2-prev-corner-col {
  position: absolute; top: 4px; right: 4px;
  font-size: 7px; color: var(--color-text-muted); font-weight: 600;
}

.s2-prev-corner-line {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(to bottom right, transparent calc(50% - 0.5px), var(--color-border) calc(50% - 0.5px), var(--color-border) calc(50% + 0.5px), transparent calc(50% + 0.5px));
}

.s2-prev-col-h {
  text-align: center;
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  color: var(--color-accent);
  padding: 2px 2px 4px;
}

.s2-prev-row-h {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  color: var(--color-accent);
  padding: 0 5px 0 0;
  vertical-align: middle;
  white-space: nowrap;
}

.s2-prev-cell-td { padding: 0; }

.s2-prev-cell {
  border: 1px solid;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, border-color 0.2s;
  /* Adaptive sizing based on matrix cols */
  width: clamp(24px, calc(140px / var(--s2-cols, 5)), 40px);
  height: clamp(22px, calc(120px / var(--s2-rows, 5)), 36px);
}

.s2-prev-cell-val {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
}

/* Score distribution bar */
.s2-prev-dist {
  padding: 0.5rem 0.75rem;
  border-top: 1px solid var(--color-border);
}

.s2-prev-dist-label {
  font-size: 9px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 5px;
}

.s2-prev-dist-bar {
  display: flex;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  gap: 1px;
}

.s2-prev-dist-seg {
  border-radius: 2px;
  border: 1px solid;
  min-width: 4px;
  transition: flex 0.3s;
}

/* Legend */
.s2-prev-legend {
  padding: 0.5rem 0.75rem;
  border-top: 1px solid var(--color-border);
}

.s2-prev-legend-items {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.s2-prev-legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--color-text-dim);
}

.s2-prev-legend-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.s2-prev-legend-name { flex: 1; }

.s2-prev-legend-range {
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--color-text-muted);
  background: rgba(255,255,255,0.04);
  padding: 1px 5px;
  border-radius: 3px;
}

.s2-prev-legend-empty {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--color-text-muted);
  font-style: italic;
}

/* Completion hint */
.s2-prev-hint {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 0.6rem 0.75rem;
  border-top: 1px solid var(--color-border);
  font-size: 11px;
  color: var(--color-text-muted);
  background: rgba(255,255,255,0.01);
  line-height: 1.4;
}

.s2-prev-hint.s2-prev-hint-ok {
  color: var(--color-accent);
  background: rgba(0,229,184,0.05);
}

.s2-prev-hint .pi { font-size: 12px; flex-shrink: 0; margin-top: 1px; }

.rcc-section {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.rcc-section-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  background: rgba(255,255,255,0.02);
}

.rcc-section-icon {
  width: 32px; height: 32px;
  background: rgba(0,229,184,0.08);
  border: 1px solid rgba(0,229,184,0.15);
  border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  color: var(--color-accent); font-size: 13px; flex-shrink: 0;
}

.rcc-section-title { font-size: 13px; font-weight: 600; color: var(--color-text); margin-bottom: 2px; }
.rcc-section-desc { font-size: 11px; color: var(--color-text-muted); line-height: 1.5; }

.rcc-fields { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 0; }

/* ─── Form elements ───────────────────────────────────────────────────────── */

.form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 4px; margin-bottom: 1rem; }
.form-group:last-child { margin-bottom: 0; }

.form-label { font-size: 11px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: var(--color-text-dim); }
.req { color: var(--color-danger); }
.form-opt { font-size: 10px; color: var(--color-text-muted); font-weight: 400; letter-spacing: 0; text-transform: none; }
.form-err { font-size: 11px; color: #ff8fa3; }
.form-hint { font-size: 11px; color: var(--color-text-muted); line-height: 1.5; }

.rcc-input {
  padding: 9px 12px;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  width: 100%;
  box-sizing: border-box;
}

.rcc-input:focus { border-color: var(--color-accent); box-shadow: 0 0 0 2px var(--color-accent-glow); }
.rcc-input.is-error { border-color: var(--color-danger); }
.rcc-textarea { resize: vertical; min-height: 72px; line-height: 1.6; }
.rcc-select { cursor: pointer; }

/* ─── Type cards ──────────────────────────────────────────────────────────── */

.rcc-type-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
.rcc-type-cards.is-error .rcc-type-card { border-color: var(--color-danger); }

.rcc-type-card {
  display: flex; align-items: flex-start; gap: 0.75rem;
  padding: 1rem 1.1rem;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s;
  position: relative; user-select: none;
}

.rcc-type-card:hover { border-color: rgba(0,229,184,0.3); }
.rcc-type-card.selected { border-color: rgba(0,229,184,0.5); background: rgba(0,229,184,0.06); }
.rcc-type-radio { position: absolute; opacity: 0; width: 0; height: 0; }

.rcc-type-icon {
  width: 36px; height: 36px;
  background: var(--color-bg-card); border: 1px solid var(--color-border);
  border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center;
  color: var(--color-text-dim); font-size: 16px; flex-shrink: 0; transition: all 0.15s;
}
.selected .rcc-type-icon { background: rgba(0,229,184,0.1); border-color: rgba(0,229,184,0.25); color: var(--color-accent); }
.rcc-type-info { flex: 1; min-width: 0; }
.rcc-type-name { font-size: 13px; font-weight: 600; color: var(--color-text); margin-bottom: 3px; }
.rcc-type-hint { font-size: 11px; color: var(--color-text-muted); line-height: 1.5; }
.rcc-type-check { color: var(--color-accent); font-size: 16px; flex-shrink: 0; align-self: center; }

/* ─── Matrix size section ─────────────────────────────────────────────────── */

.rcc-matrix-inputs { display: flex; flex-direction: column; gap: 0; }

.rcc-stepper { display: flex; align-items: center; border: 1px solid var(--color-border); border-radius: var(--radius-sm); overflow: hidden; }

.rcc-step-btn {
  width: 36px; height: 38px;
  background: var(--color-bg-input); border: none;
  color: var(--color-text-dim); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; transition: all 0.15s; flex-shrink: 0;
}
.rcc-step-btn:hover:not(:disabled) { background: rgba(0,229,184,0.1); color: var(--color-accent); }
.rcc-step-btn:disabled { opacity: 0.4; cursor: default; }

.rcc-step-input { border: none; border-left: 1px solid var(--color-border); border-right: 1px solid var(--color-border); border-radius: 0; text-align: center; width: 60px; flex-shrink: 0; }
.rcc-step-input:focus { box-shadow: none; border-color: var(--color-border); }

.mx-size-info { display: flex; align-items: center; gap: 0.5rem; font-size: 11px; color: var(--color-text-muted); margin-top: 0.25rem; }
.mx-size-badge { font-family: var(--font-mono); font-size: 14px; font-weight: 700; color: var(--color-accent); }

/* ─── Risk Level table ────────────────────────────────────────────────────── */

.rl-table-head {
  display: flex;
  gap: 6px;
  padding: 0 4px 6px;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 4px;
}

.rl-th { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; color: var(--color-text-muted); }

.rl-rows { display: flex; flex-direction: column; gap: 4px; }

.rl-row {
  display: flex; gap: 6px; align-items: start;
  padding: 6px 4px;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  transition: border-color 0.15s;
}
.rl-row:hover { border-color: var(--color-border); }
.rl-row-error { border-color: rgba(255,77,109,0.3) !important; background: rgba(255,77,109,0.03); }

.rl-td { display: flex; flex-direction: column; gap: 2px; }

.rl-order-badge {
  width: 26px; height: 26px;
  border-radius: 50%; border: 1px solid;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-mono); font-size: 11px; font-weight: 700;
}

.rl-color-wrap { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.rl-color-swatch { width: 20px; height: 20px; border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.1); flex-shrink: 0; }
.rl-color-presets-mini { display: flex; gap: 3px; flex-wrap: wrap; }

.rl-preset-dot {
  width: 13px; height: 13px;
  border-radius: 50%; border: 1.5px solid transparent;
  cursor: pointer; padding: 0; transition: transform 0.1s;
}
.rl-preset-dot:hover { transform: scale(1.2); }
.rl-preset-dot.active { border-color: white; transform: scale(1.15); }

.rl-color-picker { width: 22px; height: 22px; padding: 0; border: 1px solid var(--color-border); border-radius: var(--radius-sm); cursor: pointer; background: none; }

.rl-input { font-size: 12px; padding: 6px 8px; }

.rl-add-row-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 5px 12px;
  background: rgba(0,229,184,0.08); border: 1px solid rgba(0,229,184,0.2);
  border-radius: var(--radius-sm);
  color: var(--color-accent); font-family: var(--font-body); font-size: 11px;
  cursor: pointer; white-space: nowrap; transition: background 0.15s; margin-left: auto;
}
.rl-add-row-btn:hover { background: rgba(0,229,184,0.15); }

.rl-remove-btn {
  width: 28px; height: 28px;
  background: transparent; border: 1px solid transparent; border-radius: var(--radius-sm);
  color: var(--color-text-muted); cursor: pointer;
  display: flex; align-items: center; justify-content: center; font-size: 11px; transition: all 0.15s;
}
.rl-remove-btn:hover:not(:disabled) { background: var(--color-danger-dim); border-color: rgba(255,77,109,0.3); color: var(--color-danger); }
.rl-remove-btn:disabled { opacity: 0.3; cursor: default; }

/* ─── Matrix cell editor ──────────────────────────────────────────────────── */

.mc-wrap { overflow-x: auto; padding: 1rem 1.5rem; }

.mc-table { border-collapse: separate; border-spacing: 4px; min-width: max-content; }

.mc-corner {
  width: 60px; min-width: 60px;
  position: relative; padding: 6px; vertical-align: middle;
  background: transparent;
}
.mc-corner-row { position: absolute; bottom: 8px; left: 8px; font-size: 8px; color: var(--color-text-muted); text-transform: uppercase; }
.mc-corner-col { position: absolute; top: 8px; right: 8px; font-size: 8px; color: var(--color-text-muted); text-transform: uppercase; }
.mc-corner-line {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(to bottom right, transparent calc(50% - 0.5px), var(--color-border) calc(50% - 0.5px), var(--color-border) calc(50% + 0.5px), transparent calc(50% + 0.5px));
}

.mc-col-header { text-align: center; padding: 4px 4px 8px; min-width: 64px; background: transparent; }
.mc-col-level { font-family: var(--font-mono); font-size: 11px; font-weight: 700; color: var(--color-accent); }

.mc-row-header { padding: 0 10px 0 0; vertical-align: middle; }
.mc-row-level { font-family: var(--font-mono); font-size: 11px; font-weight: 700; color: var(--color-accent); }

.mc-cell-td { padding: 0; }

.mc-cell {
  width: 64px; height: 52px;
  border: 1px solid;
  border-radius: var(--radius-sm);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 2px;
  transition: all 0.15s;
  cursor: default;
  overflow: hidden;
}

.mc-cell-readonly { cursor: default; }

.mc-cell-appetite {
  outline: 2px solid white;
  outline-offset: 1px;
}

.mc-input {
  width: 52px; background: transparent; border: none;
  color: inherit; font-family: var(--font-mono);
  font-size: 17px; font-weight: 700; text-align: center;
  outline: none; padding: 0;
  -moz-appearance: textfield;
}
.mc-input::-webkit-outer-spin-button,
.mc-input::-webkit-inner-spin-button { -webkit-appearance: none; }

.mc-cell-val-ro {
  font-family: var(--font-mono);
  font-size: 17px; font-weight: 700;
}

.mc-cell-lbl {
  font-size: 7px; text-transform: uppercase; letter-spacing: 0.04em; opacity: 0.85;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 60px; text-align: center;
}

.mc-legend {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.6rem 1.5rem;
  border-top: 1px solid var(--color-border);
  background: rgba(255,255,255,0.01);
  flex-wrap: wrap;
}

.mc-legend-title { font-size: 10px; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.07em; font-weight: 500; }
.mc-legend-item { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--color-text-dim); }
.mc-legend-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
.mc-legend-score { font-family: var(--font-mono); font-size: 9px; color: var(--color-text-muted); }
.mc-legend-hint { font-size: 10px; color: var(--color-text-muted); }

/* ─── Treatment Options ───────────────────────────────────────────────────── */

.to-preset-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.to-preset-card {
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1rem;
  cursor: pointer;
  user-select: none;
  transition: border-color 0.2s, background 0.2s;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.to-preset-card:hover { border-color: rgba(255,255,255,0.2); }

.to-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.to-card-icon {
  width: 34px; height: 34px;
  border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  font-size: 15px;
  flex-shrink: 0;
}

.to-card-checkbox {
  width: 18px; height: 18px;
  border: 1.5px solid var(--color-border);
  border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; color: #0a0f0e;
  transition: all 0.15s;
  flex-shrink: 0;
}

.to-card-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  transition: color 0.2s;
}

.to-card-hint {
  font-size: 11px;
  color: var(--color-text-muted);
  line-height: 1.5;
}

.to-card-desc {
  margin-top: 4px;
  font-size: 12px;
  cursor: auto;
}

/* Custom options */
.to-custom-section {
  border-top: 1px solid var(--color-border);
  padding-top: 1rem;
  margin-bottom: 0.75rem;
}

.to-custom-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  margin-bottom: 0.5rem;
}

.to-custom-rows {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.to-custom-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.to-custom-row .rl-input { flex: 1; }

.to-add-custom-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  background: rgba(255,255,255,0.04);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  font-family: var(--font-body);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
}

.to-add-custom-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

/* ─── Selera Risiko ───────────────────────────────────────────────────────── */

.rl-select-wrap { display: flex; align-items: center; gap: 0.75rem; }

.rl-select-indicator {
  width: 16px; height: 16px;
  border-radius: 50%; flex-shrink: 0;
  transition: all 0.2s;
}

.rl-appetite-preview {
  display: flex; align-items: flex-start; gap: 0.75rem;
  padding: 10px 14px;
  border: 1px solid;
  border-radius: var(--radius-sm);
  margin-top: 8px;
}

.rl-ap-badge {
  display: flex; align-items: center; gap: 5px;
  padding: 3px 10px;
  border: 1px solid; border-radius: 100px;
  font-size: 12px; font-weight: 600;
  white-space: nowrap; flex-shrink: 0;
}

.rl-ap-info {
  font-size: 12px;
  line-height: 1.55;
}

/* ─── Action bar ──────────────────────────────────────────────────────────── */

.rcc-action-bar {
  position: fixed; bottom: 0; left: 0; right: 0;
  background: var(--color-bg-card);
  border-top: 1px solid var(--color-border);
  z-index: 100; padding: 0.85rem 2rem;
}

.rcc-action-inner {
  max-width: 980px; margin: 0 auto;
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
}

.rcc-action-info { display: flex; align-items: center; gap: 0.6rem; min-width: 0; }

.rcc-preview-name {
  font-size: 13px; font-weight: 600; color: var(--color-text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 280px;
}

.rcc-preview-code {
  font-family: var(--font-mono); font-size: 11px; color: var(--color-accent);
  background: rgba(0,229,184,0.1); border: 1px solid rgba(0,229,184,0.2);
  padding: 1px 8px; border-radius: var(--radius-sm); white-space: nowrap;
}

.rcc-preview-placeholder { font-size: 12px; color: var(--color-text-muted); }

.rcc-action-btns { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }

.rcc-btn-cancel {
  display: flex; align-items: center; gap: 5px;
  padding: 8px 16px;
  background: transparent; border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-dim); font-family: var(--font-body); font-size: 12px;
  cursor: pointer; transition: all 0.15s;
}
.rcc-btn-cancel:hover:not(:disabled) { border-color: var(--color-accent); color: var(--color-accent); }
.rcc-btn-cancel:disabled { opacity: 0.5; cursor: default; }

.rcc-btn-submit {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 18px;
  background: var(--color-accent); border: none;
  border-radius: var(--radius-sm);
  color: #0a0f0e; font-family: var(--font-body); font-size: 12px; font-weight: 600;
  cursor: pointer; transition: all 0.15s;
}
.rcc-btn-submit:hover:not(:disabled) { background: #00c9a0; }
.rcc-btn-submit:disabled { opacity: 0.6; cursor: default; }

/* ─── Error & States ──────────────────────────────────────────────────────── */

.rcc-alert-error {
  display: flex; align-items: flex-start; gap: 0.5rem;
  padding: 0.75rem 1rem; font-size: 12px; color: #ff8fa3;
  background: var(--color-danger-dim); border: 1px solid rgba(255,77,109,0.3);
  border-radius: var(--radius-sm); white-space: pre-line;
}

.rcc-centered { display: flex; justify-content: center; align-items: center; padding: 4rem; }

.rcc-error-banner {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 1rem 1.25rem; font-size: 13px; color: #ff8fa3;
  background: var(--color-danger-dim); border-radius: var(--radius-md);
}
</style>
