import PDFDocument from "pdfkit";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_W = 841.89;  // A4 landscape width
const PAGE_H = 595.28;  // A4 landscape height
const MARGIN = 40;
const CONTENT_W = PAGE_W - MARGIN * 2;  // 761.89

const FOOTER_RESERVE = 30;  // reserve space at bottom for footer band

// Colors
const C = {
  white:           "#ffffff",
  black:           "#000000",
  docHeaderBg:     "#1a3558",  // deep navy
  docHeaderText:   "#ffffff",
  goldAccent:      "#c9a84c",  // gold accent
  kopDivider:      "#2e5f96",  // mid-blue rule
  groupHeader:     "#1a3558",  // same navy for visual unity
  entryHeaderBg:   "#eef2f8",  // cool light blue-gray
  entryHeaderText: "#1a3558",
  tableHeader:     "#d6dff0",
  rowAlt:          "#f5f7fa",  // alternating even-row tint
  rowNormal:       "#ffffff",
  borderOuter:     "#8a9bba",  // outer border
  borderInner:     "#c8d0de",  // inner separators
  text:            "#111827",
  subtext:         "#374151",
  muted:           "#6b7280",
  sectionTitle:    "#1a3558",
  footerBg:        "#eef2f8",
  confidential:    "#7f1d1d",
  confidentialBg:  "#fee2e2",
};

// ─── Label Maps ───────────────────────────────────────────────────────────────

const STATUS_LABELS = {
  DRAFT: "Draft",
  SUBMITTED: "Diajukan",
  REVISION: "Revisi",
  APPROVED: "Disetujui",
  LOCKED: "Dikunci",
};

const EFFECTIVENESS_LABELS = {
  ADEQUATE: "Memadai",
  PARTIAL: "Sebagian",
  INADEQUATE: "Tidak Memadai",
};

const TREATMENT_STATUS_LABELS = {
  PLANNED: "Direncanakan",
  IN_PROGRESS: "Berjalan",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
  SUBMITTED_FOR_REVIEW: "Diajukan ke Komite",
  VERIFIED: "Terverifikasi",
};

const CONTEXT_TYPE_LABELS = {
  ASSET: "Aset",
  PROCESS: "Proses Bisnis",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function hexToRgb(hex) {
  const h = (hex || "#888888").replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return [r, g, b];
}

function getLevelForScore(score, riskLevels) {
  if (!riskLevels || score == null) return null;
  return riskLevels.find((l) => score >= l.minScore && score <= l.maxScore) ?? null;
}

// Look up likelihood description from riskContext criteria
function getLikelihoodDesc(riskContext, level, areaId) {
  const criteria = riskContext?.likelihoodCriteria ?? [];
  // Prefer area-specific criterion, fall back to any with matching level
  const hit = criteria.find((c) => c.level === level && c.impactAreaId === areaId)
           ?? criteria.find((c) => c.level === level);
  return hit?.description ?? hit?.name ?? "—";
}

// Look up impact description from riskContext impact areas
function getImpactDesc(riskContext, level, areaId) {
  const area = (riskContext?.impactAreas ?? []).find((a) => a.id === areaId);
  const hit = (area?.impactCriteria ?? []).find((ic) => ic.level === level);
  return hit?.description ?? hit?.name ?? "—";
}

// ─── Ensure Space (page break if needed) ──────────────────────────────────────

function ensureSpace(doc, needed) {
  if (doc.y + needed > PAGE_H - MARGIN - FOOTER_RESERVE) {
    doc.addPage();
    doc.y = MARGIN;
  }
}

// ─── Document Header (drawn on first page only) ───────────────────────────────

function drawDocumentHeader(doc, paper) {
  const x = MARGIN;

  // a) Double top rule
  doc.rect(x, 40, CONTENT_W, 3).fill(C.docHeaderBg);
  doc.rect(x, 45, CONTENT_W, 1).fill(C.docHeaderBg);

  // b) Gold accent strip
  doc.rect(x, 46, CONTENT_W, 4).fill(C.goldAccent);

  // c) Kop Surat letterhead block (y=50, h=72)
  const kopY = 50;
  doc
    .fillColor(C.muted)
    .fontSize(8)
    .font("Helvetica")
    .text("PEMERINTAH REPUBLIK INDONESIA", x, kopY + 8, { width: CONTENT_W, align: "center" });

  doc
    .fillColor(C.docHeaderBg)
    .fontSize(13)
    .font("Helvetica-Bold")
    .text(paper.unitKerja.name, x, kopY + 22, { width: CONTENT_W, align: "center" });

  doc
    .fillColor(C.muted)
    .fontSize(8)
    .font("Helvetica")
    .text(`${paper.unitKerja.code} · Sistem Manajemen Risiko`, x, kopY + 42, { width: CONTENT_W, align: "center" });

  doc
    .moveTo(x, kopY + 56)
    .lineTo(x + CONTENT_W, kopY + 56)
    .strokeColor(C.kopDivider)
    .lineWidth(0.75)
    .stroke();

  // d) Document title bar (y=122, h=30)
  const titleBarY = 122;
  doc.rect(x, titleBarY, CONTENT_W, 30).fill(C.docHeaderBg);

  doc
    .fillColor(C.white)
    .fontSize(11)
    .font("Helvetica-Bold")
    .text("REGISTER RISIKO MANAJEMEN RISIKO", x, titleBarY + 6, { width: CONTENT_W, align: "center" });

  doc
    .fillColor("#a8c4e0")
    .fontSize(8.5)
    .font("Helvetica")
    .text(paper.title, x, titleBarY + 19, { width: CONTENT_W, align: "center" });

  // e) Metadata formal grid (y=152, 4 rows × 18pt = 72pt)
  const gridY = 152;
  const rowH = 18;
  const halfW = CONTENT_W / 2;   // 380.945
  const labelW = 130;
  const valueW = halfW - labelW;  // 250.945
  const pad = 5;

  const metaRows = [
    [
      "Unit Kerja",
      `${paper.unitKerja.name} (${paper.unitKerja.code})`,
      "Program",
      paper.program.name,
    ],
    [
      "Tahun Anggaran",
      String(paper.program.year),
      "Status Dokumen",
      STATUS_LABELS[paper.status] ?? paper.status,
    ],
    [
      "Total Entri Risiko",
      String(paper._count?.riskEntries ?? "—"),
      "Dicetak Pada",
      new Date().toLocaleDateString("id-ID", {
        day: "2-digit", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      }),
    ],
  ];

  for (let i = 0; i < metaRows.length; i++) {
    const ry = gridY + i * rowH;
    const [lLabel, lValue, rLabel, rValue] = metaRows[i];
    const bg = i % 2 === 0 ? C.rowNormal : C.rowAlt;
    doc.rect(x, ry, CONTENT_W, rowH).fill(bg);

    doc.fillColor(C.muted).fontSize(7.5).font("Helvetica-Bold")
      .text(lLabel, x + pad, ry + 5, { width: labelW - pad, lineBreak: false });
    doc.fillColor(C.text).fontSize(8).font("Helvetica")
      .text(lValue, x + labelW + pad, ry + 5, { width: valueW - pad * 2, lineBreak: false });
    doc.fillColor(C.muted).fontSize(7.5).font("Helvetica-Bold")
      .text(rLabel, x + halfW + pad, ry + 5, { width: labelW - pad, lineBreak: false });
    doc.fillColor(C.text).fontSize(8).font("Helvetica")
      .text(rValue, x + halfW + labelW + pad, ry + 5, { width: valueW - pad * 2, lineBreak: false });
  }

  // Row 4: full-width Nomor Dokumen
  const row4Y = gridY + 3 * rowH;
  doc.rect(x, row4Y, CONTENT_W, rowH).fill(C.rowAlt);
  const docNum = `${paper.unitKerja.code}/${paper.program.year}/REGISTER-RISIKO`;
  doc.fillColor(C.muted).fontSize(7.5).font("Helvetica-Bold")
    .text("Nomor Dokumen", x + pad, row4Y + 5, { width: labelW - pad, lineBreak: false });
  doc.fillColor(C.text).fontSize(8).font("Helvetica")
    .text(docNum, x + labelW + pad, row4Y + 5, { width: CONTENT_W - labelW - pad * 2, lineBreak: false });

  // Outer border for entire grid
  doc.rect(x, gridY, CONTENT_W, rowH * 4)
    .strokeColor(C.borderOuter).lineWidth(0.75).stroke();

  // Horizontal separators between rows
  for (let i = 1; i < 4; i++) {
    const sy = gridY + i * rowH;
    doc.moveTo(x, sy).lineTo(x + CONTENT_W, sy)
      .strokeColor(C.borderInner).lineWidth(0.4).stroke();
  }

  // Vertical center divider (rows 0–2 only)
  doc.moveTo(x + halfW, gridY).lineTo(x + halfW, gridY + 3 * rowH)
    .strokeColor(C.borderInner).lineWidth(0.4).stroke();

  // Label/value column dividers
  doc.moveTo(x + labelW, gridY).lineTo(x + labelW, gridY + 4 * rowH)
    .strokeColor(C.borderInner).lineWidth(0.4).stroke();
  doc.moveTo(x + halfW + labelW, gridY).lineTo(x + halfW + labelW, gridY + 3 * rowH)
    .strokeColor(C.borderInner).lineWidth(0.4).stroke();

  // f) Gold terminator line
  const termY = gridY + 4 * rowH;  // 224
  doc.moveTo(x, termY).lineTo(x + CONTENT_W, termY)
    .strokeColor(C.goldAccent).lineWidth(1.5).stroke();

  doc.y = termY + 10;  // 234
}

// ─── Page Footer (called in two-pass after full render) ───────────────────────

function drawPageFooter(doc, pageNum, totalPages, paper) {
  const bandY = PAGE_H - MARGIN + 2;  // 557.28
  const bandH = 16;
  const x = MARGIN;

  doc.rect(x, bandY, CONTENT_W, bandH).fill(C.footerBg);

  doc.moveTo(x, bandY).lineTo(x + CONTENT_W, bandY)
    .strokeColor(C.borderInner).lineWidth(0.5).stroke();

  const zoneW = CONTENT_W / 3;

  // Left: document reference
  doc.fillColor(C.muted).fontSize(7.5).font("Helvetica")
    .text(`${paper.unitKerja.code} · ${paper.program.year}`, x, bandY + 4,
      { width: zoneW, align: "left", lineBreak: false });

  // Center: TERBATAS badge
  const badgeW = 60;
  const badgeH = 11;
  const badgeX = x + zoneW + (zoneW - badgeW) / 2;
  const badgeY = bandY + (bandH - badgeH) / 2;
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 2).fill(C.confidentialBg);
  doc.fillColor(C.confidential).fontSize(7).font("Helvetica-Bold")
    .text("TERBATAS", badgeX, badgeY + 2, { width: badgeW, align: "center", lineBreak: false });

  // Right: page number
  doc.fillColor(C.muted).fontSize(7.5).font("Helvetica")
    .text(`Halaman ${pageNum} dari ${totalPages}`, x + zoneW * 2, bandY + 4,
      { width: zoneW, align: "right", lineBreak: false });
}

// ─── Group Header ─────────────────────────────────────────────────────────────

function drawGroupHeader(doc, typeLabel, subjectName) {
  ensureSpace(doc, 26);
  const x = MARGIN;
  const y = doc.y;
  const h = 20;

  doc.rect(x, y, 4, h).fill(C.goldAccent);
  doc.rect(x + 4, y, CONTENT_W - 4, h).fill(C.groupHeader);
  doc
    .fillColor(C.white)
    .fontSize(9)
    .font("Helvetica-Bold")
    .text(`${typeLabel.toUpperCase()}: ${subjectName}`, x + 14, y + 5,
      { width: CONTENT_W - 20, lineBreak: false });

  doc.y = y + h + 4;
}

// ─── Table Drawing ────────────────────────────────────────────────────────────

/**
 * columns: [{ header, width, align? }]
 * rows: Array of string[] or { cells: string[], bg?: string, cellColors?: Record<number, string> }
 */
function drawTable(doc, columns, rows, headerBg = C.tableHeader) {
  const x = MARGIN;
  const totalW = columns.reduce((s, c) => s + c.width, 0);
  const rowH = 15;
  const headerH = 18;
  const pad = 4;
  const fontSize = 8;

  // Header
  ensureSpace(doc, headerH + rowH);
  let y = doc.y;

  doc.rect(x, y, totalW, headerH).fill(headerBg);
  doc.rect(x, y, totalW, headerH).strokeColor(C.borderOuter).lineWidth(0.75).stroke();

  let cx = x;
  for (const col of columns) {
    doc
      .fillColor(C.text)
      .fontSize(fontSize)
      .font("Helvetica-Bold")
      .text(col.header, cx + pad, y + (headerH - fontSize) / 2, {
        width: col.width - pad * 2,
        align: col.align ?? "left",
        lineBreak: false,
      });
    cx += col.width;
  }

  // Column separators in header
  cx = x;
  for (const col of columns) {
    cx += col.width;
    if (cx < x + totalW) {
      doc.moveTo(cx, y).lineTo(cx, y + headerH)
        .strokeColor(C.borderInner).lineWidth(0.5).stroke();
    }
  }

  y += headerH;

  // Rows
  let rowIndex = 0;
  for (const rowData of rows) {
    const cells = Array.isArray(rowData) ? rowData : rowData.cells;
    const cellColors = !Array.isArray(rowData) ? (rowData.cellColors ?? {}) : {};
    const cellBgs = !Array.isArray(rowData) ? (rowData.cellBgs ?? {}) : {};
    const customBg = !Array.isArray(rowData) ? rowData.bg : undefined;

    // Estimate row height from content
    const lines = cells.map((cell, i) => {
      const charsPerLine = Math.max(1, Math.floor((columns[i].width - pad * 2) / (fontSize * 0.55)));
      return Math.ceil((cell || "").length / charsPerLine);
    });
    const maxLines = Math.max(1, ...lines);
    const cellH = Math.max(rowH, maxLines * (fontSize + 3) + pad * 2);

    ensureSpace(doc, cellH + 2);
    y = doc.y;

    const rowBg = customBg ?? (rowIndex % 2 === 0 ? C.rowNormal : C.rowAlt);
    doc.rect(x, y, totalW, cellH).fill(rowBg);
    doc.rect(x, y, totalW, cellH).strokeColor(C.borderOuter).lineWidth(0.75).stroke();

    cx = x;
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      const cell = cells[i] ?? "—";
      const textColor = cellColors[i] ?? C.subtext;
      if (cellBgs[i]) {
        doc.rect(cx, y, col.width, cellH).fill(cellBgs[i]);
      }
      doc
        .fillColor(textColor)
        .fontSize(fontSize)
        .font("Helvetica")
        .text(cell, cx + pad, y + pad, {
          width: col.width - pad * 2,
          align: col.align ?? "left",
          lineBreak: true,
          height: cellH - pad * 2,
        });
      cx += col.width;
    }

    // Column separators
    cx = x;
    for (const col of columns) {
      cx += col.width;
      if (cx < x + totalW) {
        doc.moveTo(cx, y).lineTo(cx, y + cellH)
          .strokeColor(C.borderInner).lineWidth(0.5).stroke();
      }
    }

    y += cellH;
    doc.y = y;
    rowIndex++;
  }

  doc.y += 4;
}

// ─── Risk Context Summary Section ─────────────────────────────────────────────

/** Deduplicate likelihood criteria by level (pick first occurrence per level). */
function getLikelihoodByLevel(ctx) {
  const seen = new Map();
  for (const lc of (ctx.likelihoodCriteria ?? [])) {
    if (!seen.has(lc.level)) seen.set(lc.level, lc);
  }
  return [...seen.values()].sort((a, b) => a.level - b.level);
}

/**
 * Draw the coloured risk matrix grid.
 * Uses explicit (x, y) coordinates throughout — does NOT set doc.y.
 * Returns the Y position after the last row.
 */
function drawMatrixGrid(doc, ctx, x, startY, matrixW) {
  const rows = ctx.matrixRows ?? 5;
  const cols = ctx.matrixCols ?? 5;

  const cellMap = new Map();
  for (const c of (ctx.matrixCells ?? [])) cellMap.set(`${c.row},${c.col}`, c);

  const likelihoodNames = new Map();
  for (const lc of (ctx.likelihoodCriteria ?? [])) {
    if (!likelihoodNames.has(lc.level)) likelihoodNames.set(lc.level, lc.name);
  }

  const firstArea = (ctx.impactAreas ?? [])[0];
  const impactNames = new Map();
  for (const ic of (firstArea?.impactCriteria ?? [])) impactNames.set(ic.level, ic.name);

  const yAxisW = 112;
  const cellW  = Math.max(36, Math.floor((matrixW - yAxisW) / cols));
  const cellH  = 22;
  const axisLabelH = 12;
  const colHeaderH = 28;

  let y = startY;

  // Axis direction labels
  doc.fillColor(C.muted).fontSize(6.5).font("Helvetica")
    .text("↑  KEMUNGKINAN", x, y, { width: yAxisW, align: "center", lineBreak: false });
  doc.fillColor(C.muted).fontSize(6.5).font("Helvetica")
    .text("DAMPAK  →", x + yAxisW, y, { width: cellW * cols, align: "center", lineBreak: false });
  y += axisLabelH;

  // Column headers (impact level number + truncated name)
  let cx = x + yAxisW;
  for (let col = 1; col <= cols; col++) {
    doc.rect(cx, y, cellW, colHeaderH).fill(C.tableHeader);
    doc.rect(cx, y, cellW, colHeaderH).strokeColor(C.borderInner).lineWidth(0.3).stroke();
    doc.fillColor(C.text).fontSize(7.5).font("Helvetica-Bold")
      .text(String(col), cx, y + 3, { width: cellW, align: "center", lineBreak: false });
    const impName = impactNames.get(col);
    if (impName) {
      doc.fillColor(C.muted).fontSize(6).font("Helvetica")
        .text(impName.length > 10 ? impName.substring(0, 9) + "…" : impName,
          cx, y + 14, { width: cellW, align: "center", lineBreak: false });
    }
    cx += cellW;
  }
  y += colHeaderH;

  // Matrix rows — from highest likelihood (matrixRows) to lowest (1)
  for (let row = rows; row >= 1; row--) {
    const rowName = likelihoodNames.get(row) ?? "";
    // Y-axis label cell
    doc.rect(x, y, yAxisW, cellH).fill(C.rowAlt);
    doc.rect(x, y, yAxisW, cellH).strokeColor(C.borderInner).lineWidth(0.3).stroke();
    doc.fillColor(C.muted).fontSize(7.5).font("Helvetica-Bold")
      .text(String(row), x + 3, y + (cellH - 7.5) / 2, { width: 14, align: "center", lineBreak: false });
    doc.fillColor(C.text).fontSize(6.5).font("Helvetica")
      .text(rowName, x + 20, y + (cellH - 6.5) / 2, { width: yAxisW - 24, lineBreak: false });

    // Matrix cells
    cx = x + yAxisW;
    for (let col = 1; col <= cols; col++) {
      const cell = cellMap.get(`${row},${col}`);
      const bg   = cell?.color ?? "#cccccc";
      doc.rect(cx, y, cellW, cellH).fill(bg);
      doc.rect(cx, y, cellW, cellH).strokeColor(C.white).lineWidth(0.5).stroke();
      if (cell?.value != null) {
        doc.fillColor(C.white).fontSize(8).font("Helvetica-Bold")
          .text(String(cell.value), cx, y + (cellH - 8) / 2, { width: cellW, align: "center", lineBreak: false });
      }
      cx += cellW;
    }
    y += cellH;
  }

  // Outer border around entire grid
  doc.rect(x + yAxisW, startY + axisLabelH + colHeaderH,
    cellW * cols, cellH * rows)
    .strokeColor(C.borderOuter).lineWidth(0.75).stroke();

  return y + 4;
}

/**
 * Draw the risk-level legend panel.
 * Uses explicit (x, y) coordinates — does NOT set doc.y.
 * Returns the Y position after the last row.
 */
function drawRiskLevelsPanel(doc, ctx, x, startY, panelW) {
  const levels = [...(ctx.riskLevels ?? [])].sort((a, b) => (b.order ?? 0) - (a.order ?? 0));

  let y = startY;

  // Sub-header
  doc.fillColor(C.sectionTitle).fontSize(8).font("Helvetica-Bold")
    .text("LEVEL RISIKO", x, y, { width: panelW, lineBreak: false });
  y += 13;

  const swatchW = 14;
  const nameW   = Math.round(panelW * 0.28);
  const rangeW  = Math.round(panelW * 0.22);
  const descW   = panelW - swatchW - nameW - rangeW;
  const rowH    = 16;
  const headerH = 16;

  // Header row
  doc.rect(x, y, panelW, headerH).fill(C.tableHeader);
  doc.rect(x, y, panelW, headerH).strokeColor(C.borderOuter).lineWidth(0.75).stroke();
  doc.fillColor(C.text).fontSize(7).font("Helvetica-Bold")
    .text("Level", x + swatchW + 3, y + 4, { width: nameW - 3, lineBreak: false });
  doc.fillColor(C.text).fontSize(7).font("Helvetica-Bold")
    .text("Skor", x + swatchW + nameW, y + 4, { width: rangeW, align: "center", lineBreak: false });
  doc.fillColor(C.text).fontSize(7).font("Helvetica-Bold")
    .text("Keterangan", x + swatchW + nameW + rangeW + 2, y + 4, { width: descW - 4, lineBreak: false });
  y += headerH;

  for (let i = 0; i < levels.length; i++) {
    const lv  = levels[i];
    const bg  = i % 2 === 0 ? C.rowNormal : C.rowAlt;
    doc.rect(x, y, panelW, rowH).fill(bg);
    doc.rect(x, y, panelW, rowH).strokeColor(C.borderOuter).lineWidth(0.75).stroke();

    // Colour swatch
    const [lr, lg, lb] = hexToRgb(lv.color ?? "#888888");
    doc.rect(x + 2, y + 3, swatchW - 4, rowH - 6).fill(`rgb(${lr},${lg},${lb})`);

    // Level name
    doc.fillColor(C.text).fontSize(7.5).font("Helvetica-Bold")
      .text(lv.name, x + swatchW + 3, y + 4, { width: nameW - 3, lineBreak: false });

    // Score range
    doc.fillColor(C.muted).fontSize(7).font("Helvetica")
      .text(`${lv.minScore} – ${lv.maxScore}`,
        x + swatchW + nameW, y + 4, { width: rangeW, align: "center", lineBreak: false });

    // Description
    doc.fillColor(C.subtext).fontSize(7).font("Helvetica")
      .text(lv.description ?? "—",
        x + swatchW + nameW + rangeW + 2, y + 4, { width: descW - 4, lineBreak: false });

    y += rowH;
  }

  // Column separators
  doc.moveTo(x + swatchW, startY + 13 + headerH)
    .lineTo(x + swatchW, y)
    .strokeColor(C.borderInner).lineWidth(0.5).stroke();
  doc.moveTo(x + swatchW + nameW, startY + 13 + headerH)
    .lineTo(x + swatchW + nameW, y)
    .strokeColor(C.borderInner).lineWidth(0.5).stroke();
  doc.moveTo(x + swatchW + nameW + rangeW, startY + 13 + headerH)
    .lineTo(x + swatchW + nameW + rangeW, y)
    .strokeColor(C.borderInner).lineWidth(0.5).stroke();

  return y + 4;
}

/** Draw a full info block for one risk context (including matrix). */
function drawContextBlock(doc, ctx, framework) {
  const x = MARGIN;
  const typeLabel      = CONTEXT_TYPE_LABELS[ctx.contextType] ?? ctx.contextType ?? "—";
  const frameworkLabel = framework ? `${framework.name} (${framework.code})` : "—";
  const periodLabel    = (ctx.periodStart != null && ctx.periodEnd != null)
    ? `${ctx.periodStart} – ${ctx.periodEnd}` : "—";
  const matrixLabel    = `${ctx.matrixRows ?? "—"} × ${ctx.matrixCols ?? "—"}`;

  // ── Sub-header bar ──
  ensureSpace(doc, 24);
  doc.rect(x, doc.y, CONTENT_W, 22).fill("#2c4a6e");
  doc.fillColor(C.white).fontSize(9).font("Helvetica-Bold")
    .text(`${ctx.name}  (${ctx.code})`, x + 10, doc.y + 4,
      { width: CONTENT_W * 0.55, lineBreak: false, continued: true });
  doc.fillColor("#a8c4e0").fontSize(7.5).font("Helvetica")
    .text(`  —  ${frameworkLabel}  |  Jenis: ${typeLabel}`, { lineBreak: false });
  doc.y += 26;

  // ── Metadata row ──
  ensureSpace(doc, 22);
  const metaH = 20;
  doc.rect(x, doc.y, CONTENT_W, metaH).fill(C.rowAlt);
  doc.rect(x, doc.y, CONTENT_W, metaH).strokeColor(C.borderInner).lineWidth(0.4).stroke();
  const metaCols = [
    ["Periode Penilaian", periodLabel],
    ["Ukuran Matriks", matrixLabel],
    ["Jumlah Area Dampak", String((ctx.impactAreas ?? []).length)],
    ["Jumlah Kategori Risiko", String((ctx.riskCategories ?? []).length)],
  ];
  const metaColW = CONTENT_W / metaCols.length;
  metaCols.forEach(([label, value], i) => {
    const mx = x + 6 + i * metaColW;
    doc.fillColor(C.muted).fontSize(7).font("Helvetica-Bold")
      .text(`${label}: `, mx, doc.y + 6, { continued: true, lineBreak: false });
    doc.fillColor(C.text).font("Helvetica").fontSize(7.5).text(value, { lineBreak: false });
  });
  doc.y += metaH + 4;

  // ── Description ──
  if (ctx.description) {
    ensureSpace(doc, 18);
    doc.fillColor(C.muted).fontSize(7.5).font("Helvetica-Bold")
      .text("Deskripsi: ", x, doc.y, { continued: true, lineBreak: false });
    doc.fillColor(C.subtext).font("Helvetica")
      .text(ctx.description, { width: CONTENT_W - 65 });
    doc.y += 4;
  }

  // ── Risk appetite ──
  if (ctx.riskAppetiteLevel || ctx.riskAppetiteDescription) {
    ensureSpace(doc, 18);
    const apText = [ctx.riskAppetiteLevel, ctx.riskAppetiteDescription]
      .filter(Boolean).join("  —  ");
    doc.fillColor(C.muted).fontSize(7.5).font("Helvetica-Bold")
      .text("Selera Risiko: ", x, doc.y, { continued: true, lineBreak: false });
    doc.fillColor(C.subtext).font("Helvetica").text(apText, { width: CONTENT_W - 85 });
    doc.y += 4;
  }

  doc.y += 4;

  // ── Matrix + Risk Levels (side by side) ──
  const matrixW = 440;
  const legendW = CONTENT_W - matrixW;  // 321.89

  const rows = ctx.matrixRows ?? 5;
  const cols = ctx.matrixCols ?? 5;
  const matrixEstH  = 12 + 28 + rows * 22 + 4;
  const levelsEstH  = 13 + 16 + (ctx.riskLevels ?? []).length * 16 + 4;
  const sideH       = Math.max(matrixEstH, levelsEstH);

  ensureSpace(doc, sideH + 20);

  // Section label
  doc.fillColor(C.sectionTitle).fontSize(8).font("Helvetica-Bold")
    .text("MATRIKS RISIKO", x, doc.y, { width: matrixW, lineBreak: false });
  doc.fillColor(C.sectionTitle).fontSize(8).font("Helvetica-Bold")
    .text("LEVEL RISIKO", x + matrixW, doc.y, { width: legendW, lineBreak: false });
  doc.y += 13;

  const sectionStartY = doc.y;
  const matrixEndY    = drawMatrixGrid(doc, ctx, x, sectionStartY, matrixW);
  doc.y = sectionStartY;
  const legendEndY    = drawRiskLevelsPanel(doc, ctx, x + matrixW, sectionStartY, legendW);
  doc.y = Math.max(matrixEndY, legendEndY) + 6;

  // ── Likelihood Criteria Table ──
  const likelihoods = getLikelihoodByLevel(ctx);
  if (likelihoods.length > 0) {
    ensureSpace(doc, 30);
    doc.fillColor(C.sectionTitle).fontSize(8).font("Helvetica-Bold")
      .text("KRITERIA KEMUNGKINAN", x, doc.y, { width: CONTENT_W });
    doc.y += 3;
    drawTable(doc, [
      { header: "Tingkat", width: 55, align: "center" },
      { header: "Nama Kriteria", width: 200 },
      { header: "Deskripsi", width: 506.89 },
    ], likelihoods.map((lc) => [String(lc.level), lc.name, lc.description ?? "—"]));
  }

  // ── Impact Area Criteria — one table per area ──
  const impactAreas = ctx.impactAreas ?? [];
  for (const area of impactAreas) {
    const criteria = area.impactCriteria ?? [];
    if (criteria.length === 0) continue;
    ensureSpace(doc, 30);
    doc.fillColor(C.sectionTitle).fontSize(8).font("Helvetica-Bold")
      .text(`KRITERIA DAMPAK: ${area.name}`, x, doc.y, { width: CONTENT_W });
    doc.y += 3;
    drawTable(doc, [
      { header: "Tingkat", width: 55, align: "center" },
      { header: "Nama Kriteria", width: 220 },
      { header: "Deskripsi", width: 486.89 },
    ], criteria.map((ic) => [String(ic.level), ic.name, ic.description ?? "—"]));
  }

  // ── Risk Categories Table ──
  const categories = ctx.riskCategories ?? [];
  if (categories.length > 0) {
    ensureSpace(doc, 30);
    doc.fillColor(C.sectionTitle).fontSize(8).font("Helvetica-Bold")
      .text("KATEGORI RISIKO", x, doc.y, { width: CONTENT_W });
    doc.y += 3;
    const catRows = categories.map((cat) => {
      const [r, g, b] = hexToRgb(cat.color ?? "#888888");
      return {
        cells: [cat.code ?? "—", cat.name, cat.description ?? "—"],
        cellColors: { 1: `rgb(${r},${g},${b})` },
      };
    });
    drawTable(doc, [
      { header: "Kode", width: 70, align: "center" },
      { header: "Kategori", width: 180 },
      { header: "Deskripsi", width: 511.89 },
    ], catRows);
  }

  // ── Context separator ──
  ensureSpace(doc, 12);
  doc.moveTo(x, doc.y).lineTo(x + CONTENT_W, doc.y)
    .strokeColor(C.goldAccent).lineWidth(1).stroke();
  doc.y += 10;
}

function drawRiskContextSection(doc, entries) {
  // Collect unique contexts
  const contextMap = new Map();
  for (const entry of entries) {
    const pfc = entry.programFrameworkContext;
    if (!pfc) continue;
    const ctx = pfc.riskContext;
    if (!ctx || contextMap.has(ctx.id)) continue;
    contextMap.set(ctx.id, { ctx, framework: pfc.programFramework?.framework });
  }
  if (contextMap.size === 0) return;

  // Main section header bar
  ensureSpace(doc, 30);
  const x = MARGIN;
  doc.rect(x, doc.y, 4, 22).fill(C.goldAccent);
  doc.rect(x + 4, doc.y, CONTENT_W - 4, 22).fill(C.docHeaderBg);
  doc.fillColor(C.white).fontSize(10).font("Helvetica-Bold")
    .text("KONTEKS RISIKO YANG DIGUNAKAN", x + 14, doc.y + 5,
      { width: CONTENT_W - 20, lineBreak: false });
  doc.y += 28;

  for (const { ctx, framework } of contextMap.values()) {
    drawContextBlock(doc, ctx, framework);
  }
}

// ─── Entry Section ────────────────────────────────────────────────────────────

function drawEntrySection(doc, entry, globalIdx, picUsers) {
  ensureSpace(doc, 40);
  const x = MARGIN;
  let y = doc.y;

  // Entry header bar
  const entryHeaderH = 22;
  doc.rect(x, y, CONTENT_W, entryHeaderH).fill(C.entryHeaderBg);

  const nameText = `${globalIdx}. ${entry.code}  ·  ${entry.name}`;
  doc
    .fillColor(C.entryHeaderText)
    .fontSize(9.5)
    .font("Helvetica-Bold")
    .text(nameText, x + 8, y + 5, { width: CONTENT_W - 205, lineBreak: false });

  if (entry.riskCategory) {
    const [r, g, b] = hexToRgb(entry.riskCategory.color);
    doc
      .fontSize(8)
      .fillColor(`rgb(${r},${g},${b})`)
      .font("Helvetica-Bold")
      .text(entry.riskCategory.name, x + CONTENT_W - 195, y + 6,
        { width: 185, align: "right", lineBreak: false });
  }

  y += entryHeaderH + 2;
  doc.y = y;

  // Kerawanan (vulnerability description)
  if (entry.description) {
    ensureSpace(doc, 22);
    doc
      .fillColor(C.sectionTitle)
      .fontSize(8.5)
      .font("Helvetica-Bold")
      .text("KERAWANAN", x, doc.y, { width: CONTENT_W });
    doc.y += 2;
    doc
      .fillColor(C.subtext)
      .fontSize(8)
      .font("Helvetica")
      .text(entry.description, x + 8, doc.y, { width: CONTENT_W - 16 });
    doc.y += 4;
  }

  // ── Inherent Assessment ──
  if (entry.inherentAssessment) {
    ensureSpace(doc, 22);
    doc
      .fillColor(C.sectionTitle)
      .fontSize(8.5)
      .font("Helvetica-Bold")
      .text("PENILAIAN RISIKO INHEREN", x, doc.y, { width: CONTENT_W });
    doc.y += 3;

    const inh = entry.inherentAssessment;
    const inhRiskCtx = entry.programFrameworkContext?.riskContext;
    const inhRiskLevels = inhRiskCtx?.riskLevels ?? [];

    const inhAreaRows = inh.areaScores.map((s) => {
      const likDesc = getLikelihoodDesc(inhRiskCtx, s.likelihoodLevel, s.impactArea.id);
      const impDesc = getImpactDesc(inhRiskCtx, s.impactLevel, s.impactArea.id);
      const areaLvl = getLevelForScore(s.score, inhRiskLevels);
      const cellColors = {};
      if (areaLvl?.color) cellColors[6] = areaLvl.color;
      return {
        cells: [
          s.impactArea.name,
          likDesc,
          String(s.likelihoodLevel),
          impDesc,
          String(s.impactLevel),
          String(s.score),
          areaLvl?.name ?? "—",
        ],
        cellColors,
      };
    });

    if (inhAreaRows.length > 0) {
      drawTable(doc, [
        { header: "Area Dampak",          width: 160 },
        { header: "Deskripsi Kemungkinan", width: 150 },
        { header: "Lvl Kem.",             width: 40, align: "center" },
        { header: "Deskripsi Dampak",     width: 200 },
        { header: "Lvl Damp.",            width: 40, align: "center" },
        { header: "Nilai",                width: 55, align: "center" },
        { header: "Level Risiko",         width: 116.89, align: "center" },
      ], inhAreaRows);
    }
  }

  // ── Controls ──
  if (entry.controls && entry.controls.length > 0) {
    ensureSpace(doc, 22);
    doc
      .fillColor(C.sectionTitle)
      .fontSize(8.5)
      .font("Helvetica-Bold")
      .text("KONTROL BAWAAN", x, doc.y, { width: CONTENT_W });
    doc.y += 3;

    const controls = entry.controls;

    if (controls.length >= 3) {
      // Two-column layout
      const colW = (CONTENT_W - 12) / 2;
      const lineH = 14;
      const totalH = Math.ceil(controls.length / 2) * lineH;
      ensureSpace(doc, totalH);
      const startY = doc.y;

      controls.forEach((ctrl, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const cx = x + 6 + col * (colW + 12);
        const cy = startY + row * lineH;
        const effLabel = EFFECTIVENESS_LABELS[ctrl.effectiveness] ?? ctrl.effectiveness;
        doc
          .fillColor(C.subtext)
          .fontSize(8)
          .font("Helvetica")
          .text(`• ${ctrl.name}`, cx, cy, { continued: true, width: colW - 10, lineBreak: false });
        doc.fillColor(C.muted).font("Helvetica-Oblique").text(`  (${effLabel})`, { lineBreak: false });
      });

      doc.y = startY + totalH + 4;
    } else {
      // Single-column layout
      for (const ctrl of controls) {
        ensureSpace(doc, 12);
        const effLabel = EFFECTIVENESS_LABELS[ctrl.effectiveness] ?? ctrl.effectiveness;
        doc
          .fillColor(C.subtext)
          .fontSize(8)
          .font("Helvetica")
          .text(`• ${ctrl.name}`, x + 8, doc.y, { continued: true, width: CONTENT_W - 80 });
        doc.fillColor(C.muted).font("Helvetica-Oblique").text(`  (${effLabel})`);
        doc.y += 1;
      }
      doc.y += 3;
    }
  }

  // ── Treatment Plans ──
  if (entry.treatmentPlans && entry.treatmentPlans.length > 0) {
    ensureSpace(doc, 22);
    doc
      .fillColor(C.sectionTitle)
      .fontSize(8.5)
      .font("Helvetica-Bold")
      .text("RENCANA PENANGANAN", x, doc.y, { width: CONTENT_W });
    doc.y += 3;

    const planRows = entry.treatmentPlans.map((p) => [
      p.impactArea?.name ?? "—",
      p.treatmentOption?.name ?? "—",
      p.description ?? "—",
      formatDate(p.targetDate),
      p.picUserId ? (picUsers.get(p.picUserId) ?? p.picUserId.substring(0, 8) + "…") : "—",
      TREATMENT_STATUS_LABELS[p.status] ?? p.status,
    ]);

    drawTable(doc, [
      { header: "Area Dampak", width: 110 },
      { header: "Keputusan Penanganan", width: 90 },
      { header: "Uraian Rencana", width: 220.89 },
      { header: "Target Selesai", width: 65, align: "center" },
      { header: "Penanggung Jawab", width: 130 },
      { header: "Status", width: 146, align: "center" },
    ], planRows);
  }

  // ── Residual Assessment ──
  if (entry.residualAssessment) {
    ensureSpace(doc, 22);
    doc
      .fillColor(C.sectionTitle)
      .fontSize(8.5)
      .font("Helvetica-Bold")
      .text("PENILAIAN RISIKO RESIDUAL", x, doc.y, { width: CONTENT_W });
    doc.y += 3;

    const res = entry.residualAssessment;
    const resRiskCtx = entry.programFrameworkContext?.riskContext;
    const resRiskLevels = resRiskCtx?.riskLevels ?? [];

    const resAreaRows = res.areaScores.map((s) => {
      const likDesc = getLikelihoodDesc(resRiskCtx, s.likelihoodLevel, s.impactArea.id);
      const impDesc = getImpactDesc(resRiskCtx, s.impactLevel, s.impactArea.id);
      const areaLvl = getLevelForScore(s.score, resRiskLevels);
      const cellColors = {};
      if (areaLvl?.color) cellColors[6] = areaLvl.color;
      return {
        cells: [
          s.impactArea.name,
          likDesc,
          String(s.likelihoodLevel),
          impDesc,
          String(s.impactLevel),
          String(s.score),
          areaLvl?.name ?? "—",
        ],
        cellColors,
      };
    });

    if (resAreaRows.length > 0) {
      drawTable(doc, [
        { header: "Area Dampak",          width: 160 },
        { header: "Deskripsi Kemungkinan", width: 150 },
        { header: "Lvl Kem.",             width: 40, align: "center" },
        { header: "Deskripsi Dampak",     width: 200 },
        { header: "Lvl Damp.",            width: 40, align: "center" },
        { header: "Nilai",                width: 55, align: "center" },
        { header: "Level Risiko",         width: 116.89, align: "center" },
      ], resAreaRows);
    }
  }

  // Dashed separator
  ensureSpace(doc, 10);
  doc
    .moveTo(MARGIN, doc.y)
    .lineTo(MARGIN + CONTENT_W, doc.y)
    .strokeColor(C.borderInner)
    .lineWidth(0.5)
    .dash(3, { space: 3 })
    .stroke()
    .undash();
  doc.y += 10;
}

// ─── Summary Table (rowspan simulation: left 3 cols span all area rows) ───────

// Left columns — rendered once, spanning the full height of all area rows
const SMRY_L = [
  { header: "Kode Risiko",      width: 65 },
  { header: "Nama Risiko",      width: 125 },
  { header: "Kategori Risiko",  width: 95 },
];
// Right columns — one row per area dampak
const SMRY_R = [
  { header: "Area Dampak",        width: 100 },
  { header: "Risiko Bawaan",      width: 105 },
  { header: "Opsi Penanganan",    width: 75 },
  { header: "Target Pelaksanaan", width: 62,  align: "center" },
  { header: "Status Penanganan",  width: 80,  align: "center" },
  { header: "Risiko Residual",    width: 54.89 },
];
// 65+125+95 + 100+105+75+62+80+54.89 = 761.89
const SMRY_DONE = ["COMPLETED", "CANCELLED", "VERIFIED"];

// Helper: compute row height for a set of cells against given column widths
function smryRowH(cells, cols) {
  const fontSize = 8, pad = 4, minH = 16;
  const lines = cells.map((cell, i) => {
    const charsPerLine = Math.max(1, Math.floor((cols[i].width - pad * 2) / (fontSize * 0.55)));
    return Math.ceil(String(cell || "").length / charsPerLine);
  });
  return Math.max(minH, Math.max(1, ...lines) * (fontSize + 3) + pad * 2);
}

function drawSmryHeaders(doc) {
  const allCols = [...SMRY_L, ...SMRY_R];
  const x = MARGIN, totalW = CONTENT_W;
  const pad = 4, fontSize = 8, lineH = fontSize + 3;

  // Compute the header height dynamically so no header text is clipped
  const maxLines = Math.max(...allCols.map((col) => {
    const charsPerLine = Math.max(1, Math.floor((col.width - pad * 2) / (fontSize * 0.55)));
    return Math.ceil(col.header.length / charsPerLine);
  }));
  const headerH = Math.max(22, maxLines * lineH + pad * 2);

  ensureSpace(doc, headerH + 16);
  const y = doc.y;
  doc.rect(x, y, totalW, headerH).fill(C.tableHeader);
  doc.rect(x, y, totalW, headerH).strokeColor(C.borderOuter).lineWidth(0.75).stroke();

  let cx = x;
  for (const col of allCols) {
    doc.fillColor(C.text).fontSize(fontSize).font("Helvetica-Bold")
      .text(col.header, cx + pad, y + pad, {
        width: col.width - pad * 2,
        align: col.align ?? "left",
        lineBreak: true,
        height: headerH - pad * 2,
      });
    cx += col.width;
  }
  cx = x;
  for (const col of allCols) {
    cx += col.width;
    if (cx < x + totalW)
      doc.moveTo(cx, y).lineTo(cx, y + headerH).strokeColor(C.borderInner).lineWidth(0.5).stroke();
  }
  doc.y = y + headerH;
}

function drawSummaryTable(doc, entries) {
  const x = MARGIN, totalW = CONTENT_W;
  const leftW = SMRY_L.reduce((s, c) => s + c.width, 0); // 285pt
  const pad = 4, fontSize = 8, minRowH = 16;
  const now = new Date();

  drawSmryHeaders(doc);

  for (let ei = 0; ei < entries.length; ei++) {
    const entry = entries[ei];
    const inh = entry.inherentAssessment;
    const res = entry.residualAssessment;
    const plans = entry.treatmentPlans ?? [];
    const riskLevels = entry.programFrameworkContext?.riskContext?.riskLevels ?? [];
    const areas = inh?.areaScores ?? [];
    const maxScore = Math.max(...riskLevels.map((l) => l.maxScore), 0);

    // ── Pre-compute each area row's data and height ───────────────────────────
    const areaRows = areas.map((aScore) => {
      const areaId = aScore.impactArea.id;
      const areaPlans = plans.filter((p) => p.impactArea?.id === areaId);
      const resArea = res?.areaScores?.find((s) => s.impactArea.id === areaId);
      const inhLvl = getLevelForScore(aScore.score, riskLevels);
      const resLvl = resArea ? getLevelForScore(resArea.score, riskLevels) : null;

      const opts = [...new Set(areaPlans.map((p) => p.treatmentOption?.name).filter(Boolean))];
      const targets = areaPlans.map((p) => p.targetDate).filter(Boolean).sort();
      const hasOverdue = areaPlans.some(
        (p) => p.targetDate && new Date(p.targetDate) < now && !SMRY_DONE.includes(p.status),
      );
      const allDone = areaPlans.length > 0 && areaPlans.every((p) => SMRY_DONE.includes(p.status));
      const statuses = [...new Set(areaPlans.map((p) => TREATMENT_STATUS_LABELS[p.status] ?? p.status))];

      const inhText = inhLvl ? `${inhLvl.name} (${aScore.score})` : String(aScore.score);
      const resText = resArea
        ? (resLvl ? `${resLvl.name} (${resArea.score})` : String(resArea.score))
        : "—";

      // Row is "high residual" if residual score >= 60 % of the maximum possible score
      const isHighResidual = resArea && maxScore > 0 && resArea.score >= maxScore * 0.6;

      const rightCells = [
        aScore.impactArea.name,
        inhText,
        opts.length > 0 ? opts.join(", ") : "—",
        targets.length > 0 ? formatDate(targets[0]) : "—",
        statuses.length > 0 ? statuses.join(", ") : "—",
        resText,
      ];
      return { rightCells, rowH: smryRowH(rightCells, SMRY_R), inhLvl, resLvl,
               hasOverdue, allDone, areaPlans, isHighResidual };
    });

    const totalAreaH = areaRows.length > 0
      ? areaRows.reduce((s, r) => s + r.rowH, 0)
      : minRowH;

    // Also estimate left cell height (name might wrap) — use max of left vs areas
    const leftCells = [entry.code, entry.name, entry.riskCategory?.name ?? "—"];
    const leftH = smryRowH(leftCells, SMRY_L);
    const entryH = Math.max(totalAreaH, leftH);

    // ── Page break if entry doesn't fit ──────────────────────────────────────
    if (doc.y + entryH > PAGE_H - MARGIN - FOOTER_RESERVE) {
      doc.addPage();
      doc.y = MARGIN;
      drawSmryHeaders(doc);
    }

    const startY = doc.y;
    const entryBg = ei % 2 === 0 ? C.rowNormal : C.rowAlt;

    // ── Draw left spanning cells (Kode, Nama, Kategori) ──────────────────────
    let cx = x;
    for (let li = 0; li < SMRY_L.length; li++) {
      const col = SMRY_L[li];
      doc.rect(cx, startY, col.width, entryH).fill(entryBg);
      doc.rect(cx, startY, col.width, entryH).strokeColor(C.borderOuter).lineWidth(0.75).stroke();
      doc.fillColor(C.subtext).fontSize(fontSize).font("Helvetica")
        .text(leftCells[li], cx + pad, startY + pad, {
          width: col.width - pad * 2,
          lineBreak: true,
          height: entryH - pad * 2,
        });
      cx += col.width;
    }
    // Vertical separator after last left col (reinforcement line)
    doc.moveTo(cx, startY).lineTo(cx, startY + entryH)
      .strokeColor(C.borderInner).lineWidth(0.5).stroke();

    // ── Draw right area rows ──────────────────────────────────────────────────
    const rightX = x + leftW;
    if (areaRows.length === 0) {
      // No assessment placeholder
      doc.rect(rightX, startY, totalW - leftW, minRowH).fill(C.rowAlt);
      doc.rect(rightX, startY, totalW - leftW, minRowH).strokeColor(C.borderOuter).lineWidth(0.75).stroke();
      doc.fillColor(C.muted).fontSize(fontSize).font("Helvetica-Oblique")
        .text("Belum ada penilaian inheren", rightX + pad, startY + pad, {
          width: totalW - leftW - pad * 2, lineBreak: false,
        });
    } else {
      let currentY = startY;
      for (let ai = 0; ai < areaRows.length; ai++) {
        const { rightCells, rowH, inhLvl, resLvl, hasOverdue, allDone, areaPlans, isHighResidual } = areaRows[ai];

        // Row background: pink tint for high residual, else normal alternating
        const rowBg = isHighResidual ? "#fff1f2" : (ai % 2 === 0 ? C.rowNormal : C.rowAlt);
        doc.rect(rightX, currentY, totalW - leftW, rowH).fill(rowBg);
        doc.rect(rightX, currentY, totalW - leftW, rowH).strokeColor(C.borderOuter).lineWidth(0.75).stroke();

        let rcx = rightX;
        for (let ri = 0; ri < SMRY_R.length; ri++) {
          const col = SMRY_R[ri];
          let textColor = C.subtext;
          let cellBg = null;

          // Risiko Bawaan (col 1): colored text
          if (ri === 1 && inhLvl?.color) textColor = inhLvl.color;
          // Status Penanganan (col 4): colored text + bg
          if (ri === 4) {
            if (hasOverdue)              { textColor = "#b91c1c"; cellBg = "#fee2e2"; }
            else if (allDone)            { textColor = "#166534"; cellBg = "#dcfce7"; }
            else if (areaPlans.length > 0) { textColor = "#92400e"; cellBg = "#fef3c7"; }
          }
          // Risiko Residual (col 5): colored text
          if (ri === 5 && resLvl?.color) textColor = resLvl.color;

          if (cellBg) doc.rect(rcx, currentY, col.width, rowH).fill(cellBg);
          doc.fillColor(textColor).fontSize(fontSize).font("Helvetica")
            .text(rightCells[ri], rcx + pad, currentY + pad, {
              width: col.width - pad * 2,
              align: col.align ?? "left",
              lineBreak: true,
              height: rowH - pad * 2,
            });
          rcx += col.width;
        }

        // Column separators (right section)
        rcx = rightX;
        for (const col of SMRY_R) {
          rcx += col.width;
          if (rcx < x + totalW)
            doc.moveTo(rcx, currentY).lineTo(rcx, currentY + rowH)
              .strokeColor(C.borderInner).lineWidth(0.5).stroke();
        }

        currentY += rowH;
      }
    }

    doc.y = startY + entryH + 2;
  }
}

// ─── Summary Section ─────────────────────────────────────────────────────────

function drawSummarySection(doc, entries) {
  const x = MARGIN;

  // Compute statistics inline
  const total        = entries.length;
  const withInherent = entries.filter((e) => e.inherentAssessment).length;
  const withResidual = entries.filter((e) => e.residualAssessment).length;
  const notAssessed  = total - withInherent;
  const totalPlans   = entries.reduce((s, e) => s + (e.treatmentPlans?.length ?? 0), 0);
  const now          = new Date();
  const DONE_ST      = ["COMPLETED", "CANCELLED", "VERIFIED"];
  const overdue      = entries.reduce(
    (s, e) => s + (e.treatmentPlans ?? []).filter(
      (p) => p.targetDate && new Date(p.targetDate) < now && !DONE_ST.includes(p.status)
    ).length, 0,
  );

  // ── Statistics header bar ──
  ensureSpace(doc, 30);
  doc.rect(x, doc.y, 4, 22).fill(C.goldAccent);
  doc.rect(x + 4, doc.y, CONTENT_W - 4, 22).fill(C.docHeaderBg);
  doc.fillColor(C.white).fontSize(9).font("Helvetica-Bold")
    .text("RINGKASAN STATISTIK REGISTER RISIKO", x + 14, doc.y + 6,
      { width: CONTENT_W - 20, lineBreak: false });
  doc.y += 28;

  // ── Statistics cards ──
  ensureSpace(doc, 54);
  const statsData = [
    { label: "Total Entri Risiko",        value: total,        accent: C.docHeaderBg },
    { label: "Sudah Dinilai Inheren",      value: withInherent, accent: "#1e6b3c" },
    { label: "Sudah Dinilai Residual",     value: withResidual, accent: "#1e6b3c" },
    { label: "Belum Dinilai",              value: notAssessed,  accent: notAssessed > 0 ? "#7f1d1d" : "#1e6b3c" },
    { label: "Total Rencana Penanganan",   value: totalPlans,   accent: "#5b3a8c" },
    { label: "Rencana Terlambat",          value: overdue,      accent: overdue > 0 ? "#b45309" : "#1e6b3c" },
  ];
  const cardW  = CONTENT_W / statsData.length;
  const cardH  = 48;
  const cardY  = doc.y;
  statsData.forEach(({ label, value, accent }, i) => {
    const cx = x + i * cardW;
    doc.rect(cx, cardY, cardW, cardH).fill(C.rowAlt);
    doc.rect(cx, cardY, cardW, cardH).strokeColor(C.borderInner).lineWidth(0.5).stroke();
    doc.fillColor(accent).fontSize(20).font("Helvetica-Bold")
      .text(String(value), cx, cardY + 6, { width: cardW, align: "center", lineBreak: false });
    doc.fillColor(C.muted).fontSize(6.5).font("Helvetica")
      .text(label, cx + 4, cardY + 32, { width: cardW - 8, align: "center", lineBreak: false });
  });
  doc.y = cardY + cardH + 12;

  // ── Summary table header bar ──
  ensureSpace(doc, 30);
  doc.rect(x, doc.y, 4, 22).fill(C.goldAccent);
  doc.rect(x + 4, doc.y, CONTENT_W - 4, 22).fill(C.docHeaderBg);
  doc.fillColor(C.white).fontSize(9).font("Helvetica-Bold")
    .text("RANGKUMAN REGISTER RISIKO", x + 14, doc.y + 6,
      { width: CONTENT_W - 20, lineBreak: false });
  doc.y += 28;

  // ── Per-area split table ──
  drawSummaryTable(doc, entries);
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export function generateRiskRegisterPdf(paper, entries, picUsers) {
  const doc = new PDFDocument({
    size: "A4",
    layout: "landscape",
    margin: MARGIN,
    bufferPages: true,
    autoFirstPage: true,
    info: {
      Title: `Register Risiko - ${paper.title}`,
      Author: "Perisai Risk Management System",
      CreationDate: new Date(),
    },
  });

  // First page header
  drawDocumentHeader(doc, paper);

  if (entries.length === 0) {
    doc
      .fillColor(C.muted)
      .fontSize(10)
      .font("Helvetica-Oblique")
      .text("Belum ada entri risiko dalam kertas kerja ini.", MARGIN, doc.y, {
        width: CONTENT_W,
        align: "center",
      });
  } else {
    // Group entries by subject (asset → process → uncategorized)
    const groups = new Map();
    for (const entry of entries) {
      let key, typeLabel, subjectName;
      if (entry.asset) {
        key = `asset-${entry.asset.id}`;
        typeLabel = "Aset";
        subjectName = entry.asset.name;
      } else if (entry.businessProcess) {
        key = `process-${entry.businessProcess.id}`;
        typeLabel = "Proses Bisnis";
        subjectName = entry.businessProcess.name;
      } else {
        key = "__uncategorized__";
        typeLabel = "Lainnya";
        subjectName = "Tidak Dikategorikan";
      }
      if (!groups.has(key)) groups.set(key, { typeLabel, subjectName, entries: [] });
      groups.get(key).entries.push(entry);
    }

    // Page break: title/header page → context section
    doc.addPage();
    doc.y = MARGIN;
    drawRiskContextSection(doc, entries);

    // Page break: context section → summary
    doc.addPage();
    doc.y = MARGIN;
    drawSummarySection(doc, entries);

    // Page break: summary → detailed risk register
    doc.addPage();
    doc.y = MARGIN;
    let globalIdx = 1;
    for (const { typeLabel, subjectName, entries: groupEntries } of groups.values()) {
      drawGroupHeader(doc, typeLabel, subjectName);
      for (const entry of groupEntries) {
        drawEntrySection(doc, entry, globalIdx++, picUsers);
      }
    }
  }

  // Two-pass footer: all pages are buffered, now we know total page count
  const { start, count: totalPages } = doc.bufferedPageRange();
  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(start + i);
    drawPageFooter(doc, i + 1, totalPages, paper);
  }
  doc.flushPages();

  return doc;
}
