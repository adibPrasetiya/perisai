import { validate } from "../../utils/validator.utils.js";
import {
  createRiskContextSchema,
  updateRiskContextSchema,
  riskContextIdSchema,
  createRiskCategorySchema,
  updateRiskCategorySchema,
  createLikelihoodCriteriaSchema,
  updateLikelihoodCriteriaSchema,
  createImpactAreaSchema,
  updateImpactAreaSchema,
  createImpactCriteriaSchema,
  updateImpactCriteriaSchema,
  createTreatmentOptionSchema,
  updateTreatmentOptionSchema,
  setMatrixSchema,
  idSchema,
} from "./risk-context.validation.js";
import { prismaClient } from "../../core/lib/database.lib.js";
import { NotFoundError } from "../../error/not-found.error.js";
import { BadRequestError } from "../../error/bad-request.error.js";
import { ConflictError } from "../../error/conflict.error.js";
import {
  verifyContextExists,
  verifyFrameworkExists,
  verifyImpactAreaBelongsToContext,
} from "../../utils/context.utils.js";

// =============================================================================
// SHARED SELECT
// =============================================================================

const riskContextBaseSelect = {
  id: true,
  name: true,
  code: true,
  description: true,
  frameworkId: true,
  contextType: true,
  periodStart: true,
  periodEnd: true,
  matrixRows: true,
  matrixCols: true,
  isSystemDefault: true,
  riskAppetiteLevel: true,
  riskAppetiteDescription: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
};

// =============================================================================
// CONTEXT CRUD — ATOMIC (single transaction)
// =============================================================================

const createFull = async (frameworkId, reqBody, userId) => {
  await verifyFrameworkExists(frameworkId);

  // ── Validate context base fields ──────────────────────────────────────────
  const contextData = validate(createRiskContextSchema, {
    name: reqBody.name,
    code: reqBody.code,
    description: reqBody.description,
    contextType: reqBody.contextType,
    periodStart: reqBody.periodStart,
    periodEnd: reqBody.periodEnd,
    matrixRows: reqBody.matrixRows,
    matrixCols: reqBody.matrixCols,
    riskAppetiteLevel: reqBody.riskAppetiteLevel,
    riskAppetiteDescription: reqBody.riskAppetiteDescription,
  });

  if (contextData.periodEnd < contextData.periodStart) {
    throw new BadRequestError("Periode akhir tidak boleh sebelum periode awal.");
  }

  const existing = await prismaClient.riskContext.findUnique({
    where: {
      frameworkId_code: { frameworkId, code: contextData.code },
    },
  });
  if (existing) {
    throw new ConflictError(
      `Konteks dengan kode "${contextData.code}" sudah ada dalam framework ini.`,
    );
  }

  const maxAllowed = contextData.matrixRows * contextData.matrixCols;

  // ── Validate risk levels ───────────────────────────────────────────────────
  const riskLevels = reqBody.riskLevels ?? [];
  const levelNames = new Set();
  const levelOrders = new Set();

  for (let i = 0; i < riskLevels.length; i++) {
    const lvl = riskLevels[i];
    const pos = `Level ke-${i + 1}`;

    if (!lvl.name || !lvl.name.trim()) {
      throw new BadRequestError(`${pos}: nama level wajib diisi.`);
    }
    if (typeof lvl.minScore !== "number" || typeof lvl.maxScore !== "number") {
      throw new BadRequestError(`${pos} (${lvl.name}): skor harus berupa angka.`);
    }
    if (lvl.minScore < 0 || lvl.maxScore < 0) {
      throw new BadRequestError(`${pos} (${lvl.name}): skor tidak boleh negatif.`);
    }
    if (lvl.maxScore < lvl.minScore) {
      throw new BadRequestError(
        `${pos} (${lvl.name}): skor maksimum tidak boleh lebih kecil dari skor minimum.`,
      );
    }
    if (lvl.maxScore > maxAllowed) {
      throw new BadRequestError(
        `${pos} (${lvl.name}): skor maksimum (${lvl.maxScore}) melebihi batas matriks ` +
        `${contextData.matrixRows}×${contextData.matrixCols}. Nilai maksimal yang diizinkan adalah ${maxAllowed}.`,
      );
    }
    if (lvl.minScore > maxAllowed) {
      throw new BadRequestError(
        `${pos} (${lvl.name}): skor minimum (${lvl.minScore}) melebihi batas matriks ` +
        `${contextData.matrixRows}×${contextData.matrixCols}. Nilai maksimal yang diizinkan adalah ${maxAllowed}.`,
      );
    }
    if (levelNames.has(lvl.name.trim())) {
      throw new BadRequestError(`Level risiko dengan nama "${lvl.name}" duplikat.`);
    }
    const order = lvl.order ?? i;
    if (levelOrders.has(order)) {
      throw new BadRequestError(`Level risiko dengan urutan ${order} duplikat.`);
    }
    levelNames.add(lvl.name.trim());
    levelOrders.add(order);
  }

  // ── Validate matrix cells ──────────────────────────────────────────────────
  const matrixCells = reqBody.matrixCells ?? [];
  if (matrixCells.length > 0) {
    const expectedCount = contextData.matrixRows * contextData.matrixCols;
    if (matrixCells.length !== expectedCount) {
      throw new BadRequestError(
        `Jumlah sel matriks tidak sesuai. Dibutuhkan tepat ${expectedCount} sel ` +
        `(${contextData.matrixRows}×${contextData.matrixCols}), diterima ${matrixCells.length}.`,
      );
    }
    const seen = new Set();
    for (const cell of matrixCells) {
      if (cell.row < 1 || cell.row > contextData.matrixRows) {
        throw new BadRequestError(
          `Sel (${cell.row},${cell.col}): baris tidak valid.`,
        );
      }
      if (cell.col < 1 || cell.col > contextData.matrixCols) {
        throw new BadRequestError(
          `Sel (${cell.row},${cell.col}): kolom tidak valid.`,
        );
      }
      const key = `${cell.row}-${cell.col}`;
      if (seen.has(key)) {
        throw new BadRequestError(`Duplikat sel pada baris ${cell.row}, kolom ${cell.col}.`);
      }
      seen.add(key);
    }
  }

  // ── Validate treatment options ─────────────────────────────────────────────
  const treatmentOptions = reqBody.treatmentOptions ?? [];
  for (let i = 0; i < treatmentOptions.length; i++) {
    const opt = treatmentOptions[i];
    if (!opt.name || !opt.name.trim()) {
      throw new BadRequestError(`Opsi penanganan ke-${i + 1}: nama wajib diisi.`);
    }
  }

  // ── Single transaction ─────────────────────────────────────────────────────
  const context = await prismaClient.$transaction(async (tx) => {
    const ctx = await tx.riskContext.create({
      data: {
        frameworkId,
        name: contextData.name,
        code: contextData.code,
        description: contextData.description || null,
        contextType: contextData.contextType,
        periodStart: contextData.periodStart,
        periodEnd: contextData.periodEnd,
        matrixRows: contextData.matrixRows,
        matrixCols: contextData.matrixCols,
        riskAppetiteLevel: contextData.riskAppetiteLevel || null,
        riskAppetiteDescription: contextData.riskAppetiteDescription || null,
        createdBy: userId || null,
        updatedBy: userId || null,
      },
      select: riskContextBaseSelect,
    });

    if (riskLevels.length > 0) {
      await tx.riskLevel.createMany({
        data: riskLevels.map((l, i) => ({
          contextId: ctx.id,
          name: l.name.trim(),
          description: l.description?.trim() || null,
          minScore: l.minScore,
          maxScore: l.maxScore,
          color: l.color || null,
          order: l.order ?? i + 1,
        })),
      });
    }

    if (matrixCells.length > 0) {
      await tx.matrixCell.createMany({
        data: matrixCells.map((c) => ({
          contextId: ctx.id,
          row: c.row,
          col: c.col,
          value: c.value,
          label: c.label?.trim() || null,
          color: c.color || null,
        })),
      });
    }

    if (treatmentOptions.length > 0) {
      await tx.treatmentOption.createMany({
        data: treatmentOptions.map((o, i) => ({
          contextId: ctx.id,
          name: o.name.trim(),
          description: o.description?.trim() || null,
          order: o.order ?? i + 1,
        })),
      });
    }

    return ctx;
  });

  return { message: "Konteks risiko berhasil dibuat", data: context };
};

// =============================================================================
// CONTEXT CRUD
// =============================================================================

const listByFramework = async (frameworkId) => {
  await verifyFrameworkExists(frameworkId);

  const contexts = await prismaClient.riskContext.findMany({
    where: { frameworkId },
    select: {
      ...riskContextBaseSelect,
      _count: {
        select: {
          riskCategories: true,
          impactAreas: true,
          likelihoodCriteria: true,
          treatmentOptions: true,
          riskLevels: true,
          matrixCells: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return { message: "Daftar konteks risiko berhasil ditemukan", data: contexts };
};

const listByProgramFramework = async (programFrameworkId) => {
  const pf = await prismaClient.programFramework.findUnique({
    where: { id: programFrameworkId },
    select: { id: true },
  });
  if (!pf) throw new NotFoundError("Program framework tidak ditemukan.");

  const links = await prismaClient.programFrameworkContext.findMany({
    where: { programFrameworkId },
    select: {
      id: true,
      addedAt: true,
      riskContext: {
        select: {
          ...riskContextBaseSelect,
          _count: {
            select: {
              riskCategories: true,
              impactAreas: true,
              likelihoodCriteria: true,
              treatmentOptions: true,
              riskLevels: true,
              matrixCells: true,
            },
          },
        },
      },
    },
    orderBy: { addedAt: "asc" },
  });

  return {
    message: "Daftar konteks risiko dalam program berhasil ditemukan",
    data: links.map((l) => ({ ...l.riskContext, _linkId: l.id, addedAt: l.addedAt })),
  };
};

const getById = async (id) => {
  const { id: validId } = validate(riskContextIdSchema, { id });

  const context = await prismaClient.riskContext.findUnique({
    where: { id: validId },
    select: {
      ...riskContextBaseSelect,
      framework: {
        select: { id: true, code: true, name: true, version: true },
      },
      riskCategories: {
        select: { id: true, name: true, description: true, color: true, code: true, order: true },
        orderBy: { order: "asc" },
      },
      impactAreas: {
        select: {
          id: true,
          name: true,
          description: true,
          order: true,
          impactCriteria: {
            select: { id: true, level: true, name: true, description: true, score: true },
            orderBy: { level: "asc" },
          },
          likelihoodCriteria: {
            select: { id: true, level: true, name: true, description: true, score: true },
            orderBy: { level: "asc" },
          },
        },
        orderBy: { order: "asc" },
      },
      treatmentOptions: {
        select: { id: true, name: true, description: true, isAcceptance: true, order: true },
        orderBy: { order: "asc" },
      },
      riskLevels: {
        select: { id: true, name: true, description: true, minScore: true, maxScore: true, color: true, order: true },
        orderBy: { order: "asc" },
      },
      matrixCells: {
        select: { id: true, row: true, col: true, value: true, label: true, color: true },
        orderBy: [{ row: "asc" }, { col: "asc" }],
      },
      contextAssets: {
        select: {
          id: true,
          asset: { select: { id: true, name: true, code: true, status: true } },
        },
      },
      contextProcesses: {
        select: {
          id: true,
          process: { select: { id: true, name: true, code: true, status: true } },
        },
      },
    },
  });

  if (!context) throw new NotFoundError("Konteks risiko tidak ditemukan.");

  return { message: "Konteks risiko berhasil ditemukan", data: context };
};

const update = async (id, reqBody, userId) => {
  const { id: validId } = validate(riskContextIdSchema, { id });
  reqBody = validate(updateRiskContextSchema, reqBody);

  const existing = await verifyContextExists(validId);

  if (existing.status === "ACTIVE") {
    throw new BadRequestError(
      "Konteks risiko yang sedang aktif tidak dapat diubah. Nonaktifkan terlebih dahulu untuk melakukan perubahan."
    );
  }

  if (reqBody.periodStart !== undefined || reqBody.periodEnd !== undefined) {
    const start = reqBody.periodStart ?? existing.periodStart;
    const end = reqBody.periodEnd ?? existing.periodEnd;
    if (end < start) {
      throw new BadRequestError("Periode akhir tidak boleh sebelum periode awal.");
    }
  }

  if (reqBody.matrixRows !== undefined && reqBody.matrixRows < existing.matrixRows) {
    const exceeding = await prismaClient.likelihoodCriteria.count({
      where: { contextId: validId, level: { gt: reqBody.matrixRows } },
    });
    if (exceeding > 0) {
      throw new ConflictError(
        `Tidak dapat mengurangi baris matriks: ada ${exceeding} kriteria kemungkinan dengan level melebihi ${reqBody.matrixRows}.`,
      );
    }
  }

  if (reqBody.matrixCols !== undefined && reqBody.matrixCols < existing.matrixCols) {
    const exceeding = await prismaClient.impactCriteria.count({
      where: { impactArea: { contextId: validId }, level: { gt: reqBody.matrixCols } },
    });
    if (exceeding > 0) {
      throw new ConflictError(
        `Tidak dapat mengurangi kolom matriks: ada ${exceeding} kriteria dampak dengan level melebihi ${reqBody.matrixCols}.`,
      );
    }
  }

  if (reqBody.code && reqBody.code !== existing.code) {
    const codeConflict = await prismaClient.riskContext.findUnique({
      where: {
        frameworkId_code: {
          frameworkId: existing.frameworkId,
          code: reqBody.code,
        },
      },
    });
    if (codeConflict) {
      throw new ConflictError(
        `Kode "${reqBody.code}" sudah digunakan oleh konteks lain dalam framework ini.`,
      );
    }
  }

  const updated = await prismaClient.riskContext.update({
    where: { id: validId },
    data: { ...reqBody, updatedBy: userId || null },
    select: riskContextBaseSelect,
  });

  return { message: "Konteks risiko berhasil diperbarui", data: updated };
};

const remove = async (id) => {
  const { id: validId } = validate(riskContextIdSchema, { id });
  const context = await verifyContextExists(validId);

  if (context.status === "ACTIVE") {
    throw new BadRequestError(
      "Konteks yang sedang aktif tidak dapat dihapus. Nonaktifkan terlebih dahulu sebelum menghapus.",
    );
  }

  const usageCount = await prismaClient.programFrameworkContext.count({
    where: { riskContextId: validId },
  });
  if (usageCount > 0) {
    throw new ConflictError(
      `Konteks tidak dapat dihapus karena masih digunakan dalam ${usageCount} program risiko.`,
    );
  }

  await prismaClient.riskContext.delete({ where: { id: validId } });
  return { message: "Konteks risiko berhasil dihapus" };
};

const activate = async (id) => {
  const { id: validId } = validate(riskContextIdSchema, { id });
  const context = await verifyContextExists(validId);

  if (context.status === "ACTIVE") {
    throw new BadRequestError("Konteks risiko sudah dalam keadaan aktif.");
  }

  // ── Validasi 1: Kategori risiko ─────────────────────────────────────────
  const categoryCount = await prismaClient.riskCategory.count({
    where: { contextId: validId },
  });
  if (categoryCount === 0) {
    throw new BadRequestError(
      "Konteks belum dapat diaktifkan: minimal 1 kategori risiko harus ditambahkan."
    );
  }

  // ── Validasi 2: Area dampak & kelengkapan kriteria ──────────────────────
  const impactAreas = await prismaClient.impactArea.findMany({
    where: { contextId: validId },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          impactCriteria: true,
          likelihoodCriteria: true,
        },
      },
    },
  });

  if (impactAreas.length === 0) {
    throw new BadRequestError(
      "Konteks belum dapat diaktifkan: minimal 1 area dampak harus ditambahkan."
    );
  }

  for (const area of impactAreas) {
    if (area._count.impactCriteria < context.matrixCols) {
      throw new BadRequestError(
        `Konteks belum dapat diaktifkan: area dampak "${area.name}" belum memiliki kriteria dampak untuk semua level (${area._count.impactCriteria}/${context.matrixCols} level terisi).`
      );
    }
    if (area._count.likelihoodCriteria < context.matrixRows) {
      throw new BadRequestError(
        `Konteks belum dapat diaktifkan: area dampak "${area.name}" belum memiliki kriteria kemungkinan untuk semua level (${area._count.likelihoodCriteria}/${context.matrixRows} level terisi).`
      );
    }
  }

  // ── Validasi 3: Kelengkapan dan kebenaran matriks risiko ────────────────
  const totalRequired = context.matrixRows * context.matrixCols;
  const matrixCells = await prismaClient.matrixCell.findMany({
    where: { contextId: validId },
    select: { value: true },
  });

  if (matrixCells.length < totalRequired) {
    throw new BadRequestError(
      `Konteks belum dapat diaktifkan: matriks risiko belum lengkap (${matrixCells.length}/${totalRequired} sel terisi).`
    );
  }

  const hasZeroValue = matrixCells.some((cell) => cell.value === 0);
  if (hasZeroValue) {
    throw new BadRequestError(
      "Konteks belum dapat diaktifkan: semua sel matriks harus memiliki nilai lebih dari 0."
    );
  }

  // ── Aktifkan ────────────────────────────────────────────────────────────
  await prismaClient.riskContext.update({
    where: { id: validId },
    data: { status: "ACTIVE" },
  });

  const updated = await prismaClient.riskContext.findUnique({
    where: { id: validId },
    select: riskContextBaseSelect,
  });

  return { message: "Konteks risiko berhasil diaktifkan", data: updated };
};

const deactivate = async (id) => {
  const { id: validId } = validate(riskContextIdSchema, { id });
  const context = await verifyContextExists(validId);

  if (context.status === "INACTIVE") {
    throw new BadRequestError("Konteks risiko sudah dalam keadaan tidak aktif.");
  }

  await prismaClient.riskContext.update({
    where: { id: validId },
    data: { status: "INACTIVE" },
  });

  const updated = await prismaClient.riskContext.findUnique({
    where: { id: validId },
    select: riskContextBaseSelect,
  });

  return { message: "Konteks risiko berhasil dinonaktifkan", data: updated };
};

// =============================================================================
// RISK CATEGORIES
// =============================================================================

const createCategory = async (contextId, reqBody) => {
  const context = await verifyContextExists(contextId);
  if (context.status === "ACTIVE") {
    throw new BadRequestError(
      "Konteks yang sedang aktif tidak dapat dimodifikasi. Nonaktifkan terlebih dahulu untuk melakukan perubahan."
    );
  }
  reqBody = validate(createRiskCategorySchema, reqBody);

  const category = await prismaClient.riskCategory.create({
    data: {
      contextId,
      name: reqBody.name,
      description: reqBody.description || null,
      color: reqBody.color || null,
      code: reqBody.code || null,
      order: reqBody.order ?? 0,
    },
    select: { id: true, name: true, description: true, color: true, code: true, order: true, createdAt: true },
  });

  return { message: "Kategori risiko berhasil ditambahkan", data: category };
};

const updateCategory = async (contextId, categoryId, reqBody) => {
  const { id: validId } = validate(idSchema, { id: categoryId });
  const context = await verifyContextExists(contextId);
  if (context.status === "ACTIVE") {
    throw new BadRequestError(
      "Konteks yang sedang aktif tidak dapat dimodifikasi. Nonaktifkan terlebih dahulu untuk melakukan perubahan."
    );
  }
  reqBody = validate(updateRiskCategorySchema, reqBody);

  const existing = await prismaClient.riskCategory.findFirst({ where: { id: validId, contextId } });
  if (!existing) throw new NotFoundError("Kategori risiko tidak ditemukan.");

  const updated = await prismaClient.riskCategory.update({
    where: { id: validId },
    data: reqBody,
    select: { id: true, name: true, description: true, color: true, code: true, order: true, updatedAt: true },
  });

  return { message: "Kategori risiko berhasil diperbarui", data: updated };
};

const removeCategory = async (contextId, categoryId) => {
  const { id: validId } = validate(idSchema, { id: categoryId });
  const context = await verifyContextExists(contextId);
  if (context.status === "ACTIVE") {
    throw new BadRequestError(
      "Konteks yang sedang aktif tidak dapat dimodifikasi. Nonaktifkan terlebih dahulu untuk melakukan perubahan."
    );
  }

  const existing = await prismaClient.riskCategory.findFirst({ where: { id: validId, contextId } });
  if (!existing) throw new NotFoundError("Kategori risiko tidak ditemukan.");

  await prismaClient.riskCategory.delete({ where: { id: validId } });
  return { message: "Kategori risiko berhasil dihapus" };
};

// =============================================================================
// LIKELIHOOD CRITERIA
// =============================================================================

const createLikelihoodCriteria = async (contextId, areaId, reqBody) => {
  const { id: validAreaId } = validate(idSchema, { id: areaId });
  const context = await verifyContextExists(contextId);
  if (context.status === "ACTIVE") {
    throw new BadRequestError(
      "Konteks yang sedang aktif tidak dapat dimodifikasi. Nonaktifkan terlebih dahulu untuk melakukan perubahan."
    );
  }
  await verifyImpactAreaBelongsToContext(validAreaId, contextId);
  reqBody = validate(createLikelihoodCriteriaSchema, reqBody);

  if (reqBody.level > context.matrixRows) {
    throw new BadRequestError(
      `Level tidak valid. Matriks hanya memiliki ${context.matrixRows} baris (level 1–${context.matrixRows}).`,
    );
  }

  const existing = await prismaClient.likelihoodCriteria.findUnique({
    where: { impactAreaId_level: { impactAreaId: validAreaId, level: reqBody.level } },
  });
  if (existing) {
    throw new ConflictError(`Kriteria kemungkinan untuk level ${reqBody.level} sudah ada di area dampak ini.`);
  }

  const criteria = await prismaClient.likelihoodCriteria.create({
    data: {
      contextId,
      impactAreaId: validAreaId,
      level: reqBody.level,
      name: reqBody.name,
      description: reqBody.description || null,
      score: reqBody.level,
    },
    select: { id: true, impactAreaId: true, level: true, name: true, description: true, score: true, createdAt: true },
  });

  return { message: "Kriteria kemungkinan berhasil ditambahkan", data: criteria };
};

const updateLikelihoodCriteria = async (contextId, areaId, criteriaId, reqBody) => {
  const { id: validCriteriaId } = validate(idSchema, { id: criteriaId });
  const { id: validAreaId } = validate(idSchema, { id: areaId });
  const context = await verifyContextExists(contextId);
  if (context.status === "ACTIVE") {
    throw new BadRequestError(
      "Konteks yang sedang aktif tidak dapat dimodifikasi. Nonaktifkan terlebih dahulu untuk melakukan perubahan."
    );
  }
  await verifyImpactAreaBelongsToContext(validAreaId, contextId);
  reqBody = validate(updateLikelihoodCriteriaSchema, reqBody);

  const existing = await prismaClient.likelihoodCriteria.findFirst({
    where: { id: validCriteriaId, impactAreaId: validAreaId },
  });
  if (!existing) throw new NotFoundError("Kriteria kemungkinan tidak ditemukan.");

  if (reqBody.level !== undefined && reqBody.level > context.matrixRows) {
    throw new BadRequestError(
      `Level tidak valid. Matriks hanya memiliki ${context.matrixRows} baris (level 1–${context.matrixRows}).`,
    );
  }

  const updated = await prismaClient.likelihoodCriteria.update({
    where: { id: validCriteriaId },
    data: reqBody,
    select: { id: true, impactAreaId: true, level: true, name: true, description: true, score: true, updatedAt: true },
  });

  return { message: "Kriteria kemungkinan berhasil diperbarui", data: updated };
};

const removeLikelihoodCriteria = async (contextId, areaId, criteriaId) => {
  const { id: validCriteriaId } = validate(idSchema, { id: criteriaId });
  const { id: validAreaId } = validate(idSchema, { id: areaId });
  const context = await verifyContextExists(contextId);
  if (context.status === "ACTIVE") {
    throw new BadRequestError(
      "Konteks yang sedang aktif tidak dapat dimodifikasi. Nonaktifkan terlebih dahulu untuk melakukan perubahan."
    );
  }
  await verifyImpactAreaBelongsToContext(validAreaId, contextId);

  const existing = await prismaClient.likelihoodCriteria.findFirst({
    where: { id: validCriteriaId, impactAreaId: validAreaId },
  });
  if (!existing) throw new NotFoundError("Kriteria kemungkinan tidak ditemukan.");

  await prismaClient.likelihoodCriteria.delete({ where: { id: validCriteriaId } });
  return { message: "Kriteria kemungkinan berhasil dihapus" };
};

// =============================================================================
// IMPACT AREAS
// =============================================================================

const createImpactArea = async (contextId, reqBody) => {
  const context = await verifyContextExists(contextId);
  if (context.status === "ACTIVE") {
    throw new BadRequestError(
      "Konteks yang sedang aktif tidak dapat dimodifikasi. Nonaktifkan terlebih dahulu untuk melakukan perubahan."
    );
  }
  reqBody = validate(createImpactAreaSchema, reqBody);

  const area = await prismaClient.impactArea.create({
    data: {
      contextId,
      name: reqBody.name,
      description: reqBody.description || null,
      order: reqBody.order ?? 0,
    },
    select: { id: true, name: true, description: true, order: true, createdAt: true },
  });

  return { message: "Area dampak berhasil ditambahkan", data: area };
};

const updateImpactArea = async (contextId, areaId, reqBody) => {
  const { id: validId } = validate(idSchema, { id: areaId });
  const context = await verifyContextExists(contextId);
  if (context.status === "ACTIVE") {
    throw new BadRequestError(
      "Konteks yang sedang aktif tidak dapat dimodifikasi. Nonaktifkan terlebih dahulu untuk melakukan perubahan."
    );
  }
  reqBody = validate(updateImpactAreaSchema, reqBody);
  await verifyImpactAreaBelongsToContext(validId, contextId);

  const updated = await prismaClient.impactArea.update({
    where: { id: validId },
    data: reqBody,
    select: { id: true, name: true, description: true, order: true, updatedAt: true },
  });

  return { message: "Area dampak berhasil diperbarui", data: updated };
};

const removeImpactArea = async (contextId, areaId) => {
  const { id: validId } = validate(idSchema, { id: areaId });
  const context = await verifyContextExists(contextId);
  if (context.status === "ACTIVE") {
    throw new BadRequestError(
      "Konteks yang sedang aktif tidak dapat dimodifikasi. Nonaktifkan terlebih dahulu untuk melakukan perubahan."
    );
  }
  await verifyImpactAreaBelongsToContext(validId, contextId);
  await prismaClient.impactArea.delete({ where: { id: validId } });
  return { message: "Area dampak berhasil dihapus" };
};

// =============================================================================
// IMPACT CRITERIA
// =============================================================================

const createImpactCriteria = async (contextId, areaId, reqBody) => {
  const { id: validAreaId } = validate(idSchema, { id: areaId });
  const context = await verifyContextExists(contextId);
  if (context.status === "ACTIVE") {
    throw new BadRequestError(
      "Konteks yang sedang aktif tidak dapat dimodifikasi. Nonaktifkan terlebih dahulu untuk melakukan perubahan."
    );
  }
  await verifyImpactAreaBelongsToContext(validAreaId, contextId);
  reqBody = validate(createImpactCriteriaSchema, reqBody);

  if (reqBody.level > context.matrixCols) {
    throw new BadRequestError(
      `Level tidak valid. Matriks hanya memiliki ${context.matrixCols} kolom (level 1–${context.matrixCols}).`,
    );
  }

  const existing = await prismaClient.impactCriteria.findUnique({
    where: { impactAreaId_level: { impactAreaId: validAreaId, level: reqBody.level } },
  });
  if (existing) {
    throw new ConflictError(`Kriteria dampak untuk level ${reqBody.level} sudah ada di area ini.`);
  }

  const criteria = await prismaClient.impactCriteria.create({
    data: {
      impactAreaId: validAreaId,
      level: reqBody.level,
      name: reqBody.name,
      description: reqBody.description || null,
      score: reqBody.level,
    },
    select: { id: true, level: true, name: true, description: true, score: true, createdAt: true },
  });

  return { message: "Kriteria dampak berhasil ditambahkan", data: criteria };
};

const updateImpactCriteria = async (contextId, areaId, criteriaId, reqBody) => {
  const { id: validCriteriaId } = validate(idSchema, { id: criteriaId });
  const { id: validAreaId } = validate(idSchema, { id: areaId });
  const context = await verifyContextExists(contextId);
  if (context.status === "ACTIVE") {
    throw new BadRequestError(
      "Konteks yang sedang aktif tidak dapat dimodifikasi. Nonaktifkan terlebih dahulu untuk melakukan perubahan."
    );
  }
  await verifyImpactAreaBelongsToContext(validAreaId, contextId);
  reqBody = validate(updateImpactCriteriaSchema, reqBody);

  const existing = await prismaClient.impactCriteria.findFirst({
    where: { id: validCriteriaId, impactAreaId: validAreaId },
  });
  if (!existing) throw new NotFoundError("Kriteria dampak tidak ditemukan.");

  if (reqBody.level !== undefined && reqBody.level > context.matrixCols) {
    throw new BadRequestError(
      `Level tidak valid. Matriks hanya memiliki ${context.matrixCols} kolom (level 1–${context.matrixCols}).`,
    );
  }

  const updated = await prismaClient.impactCriteria.update({
    where: { id: validCriteriaId },
    data: reqBody,
    select: { id: true, level: true, name: true, description: true, score: true, updatedAt: true },
  });

  return { message: "Kriteria dampak berhasil diperbarui", data: updated };
};

const removeImpactCriteria = async (contextId, areaId, criteriaId) => {
  const { id: validCriteriaId } = validate(idSchema, { id: criteriaId });
  const { id: validAreaId } = validate(idSchema, { id: areaId });
  const context = await verifyContextExists(contextId);
  if (context.status === "ACTIVE") {
    throw new BadRequestError(
      "Konteks yang sedang aktif tidak dapat dimodifikasi. Nonaktifkan terlebih dahulu untuk melakukan perubahan."
    );
  }
  await verifyImpactAreaBelongsToContext(validAreaId, contextId);

  const existing = await prismaClient.impactCriteria.findFirst({
    where: { id: validCriteriaId, impactAreaId: validAreaId },
  });
  if (!existing) throw new NotFoundError("Kriteria dampak tidak ditemukan.");

  await prismaClient.impactCriteria.delete({ where: { id: validCriteriaId } });
  return { message: "Kriteria dampak berhasil dihapus" };
};

// =============================================================================
// TREATMENT OPTIONS
// =============================================================================

const createTreatmentOption = async (contextId, reqBody) => {
  const context = await verifyContextExists(contextId);
  if (context.status === "ACTIVE") {
    throw new BadRequestError(
      "Konteks yang sedang aktif tidak dapat dimodifikasi. Nonaktifkan terlebih dahulu untuk melakukan perubahan."
    );
  }
  reqBody = validate(createTreatmentOptionSchema, reqBody);

  const option = await prismaClient.treatmentOption.create({
    data: {
      contextId,
      name: reqBody.name,
      description: reqBody.description || null,
      isAcceptance: reqBody.isAcceptance ?? false,
      order: reqBody.order ?? 0,
    },
    select: { id: true, name: true, description: true, isAcceptance: true, order: true, createdAt: true },
  });

  return { message: "Opsi penanganan risiko berhasil ditambahkan", data: option };
};

const updateTreatmentOption = async (contextId, optionId, reqBody) => {
  const { id: validId } = validate(idSchema, { id: optionId });
  const context = await verifyContextExists(contextId);
  if (context.status === "ACTIVE") {
    throw new BadRequestError(
      "Konteks yang sedang aktif tidak dapat dimodifikasi. Nonaktifkan terlebih dahulu untuk melakukan perubahan."
    );
  }
  reqBody = validate(updateTreatmentOptionSchema, reqBody);

  const existing = await prismaClient.treatmentOption.findFirst({ where: { id: validId, contextId } });
  if (!existing) throw new NotFoundError("Opsi penanganan tidak ditemukan.");

  const updated = await prismaClient.treatmentOption.update({
    where: { id: validId },
    data: reqBody,
    select: { id: true, name: true, description: true, isAcceptance: true, order: true, updatedAt: true },
  });

  return { message: "Opsi penanganan risiko berhasil diperbarui", data: updated };
};

const removeTreatmentOption = async (contextId, optionId) => {
  const { id: validId } = validate(idSchema, { id: optionId });
  const context = await verifyContextExists(contextId);
  if (context.status === "ACTIVE") {
    throw new BadRequestError(
      "Konteks yang sedang aktif tidak dapat dimodifikasi. Nonaktifkan terlebih dahulu untuk melakukan perubahan."
    );
  }

  const existing = await prismaClient.treatmentOption.findFirst({ where: { id: validId, contextId } });
  if (!existing) throw new NotFoundError("Opsi penanganan tidak ditemukan.");

  await prismaClient.treatmentOption.delete({ where: { id: validId } });
  return { message: "Opsi penanganan risiko berhasil dihapus" };
};

// =============================================================================
// MATRIX
// =============================================================================

const setMatrix = async (contextId, reqBody) => {
  const context = await verifyContextExists(contextId);
  if (context.status === "ACTIVE") {
    throw new BadRequestError(
      "Konteks yang sedang aktif tidak dapat dimodifikasi. Nonaktifkan terlebih dahulu untuk melakukan perubahan."
    );
  }
  reqBody = validate(setMatrixSchema, reqBody);

  const { cells } = reqBody;
  const expectedCount = context.matrixRows * context.matrixCols;

  if (cells.length !== expectedCount) {
    throw new BadRequestError(
      `Jumlah cell tidak sesuai. Matriks ${context.matrixRows}×${context.matrixCols} membutuhkan tepat ${expectedCount} cell, diterima ${cells.length}.`,
    );
  }

  const seen = new Set();
  for (const cell of cells) {
    if (cell.row < 1 || cell.row > context.matrixRows) {
      throw new BadRequestError(
        `Baris ${cell.row} tidak valid. Baris harus antara 1 dan ${context.matrixRows}.`,
      );
    }
    if (cell.col < 1 || cell.col > context.matrixCols) {
      throw new BadRequestError(
        `Kolom ${cell.col} tidak valid. Kolom harus antara 1 dan ${context.matrixCols}.`,
      );
    }
    const key = `${cell.row}-${cell.col}`;
    if (seen.has(key)) {
      throw new BadRequestError(
        `Duplikat cell pada baris ${cell.row}, kolom ${cell.col}.`,
      );
    }
    seen.add(key);
  }

  await prismaClient.$transaction([
    prismaClient.matrixCell.deleteMany({ where: { contextId } }),
    prismaClient.matrixCell.createMany({
      data: cells.map((c) => ({
        contextId,
        row: c.row,
        col: c.col,
        value: c.value,
        label: c.label || null,
        color: c.color || null,
      })),
    }),
  ]);

  const updatedCells = await prismaClient.matrixCell.findMany({
    where: { contextId },
    select: { id: true, row: true, col: true, value: true, label: true, color: true },
    orderBy: [{ row: "asc" }, { col: "asc" }],
  });

  return { message: "Matriks risiko berhasil disimpan", data: updatedCells };
};

export default {
  createFull, listByFramework, listByProgramFramework, getById, update, remove, activate, deactivate,
  createCategory, updateCategory, removeCategory,
  createLikelihoodCriteria, updateLikelihoodCriteria, removeLikelihoodCriteria,
  createImpactArea, updateImpactArea, removeImpactArea,
  createImpactCriteria, updateImpactCriteria, removeImpactCriteria,
  createTreatmentOption, updateTreatmentOption, removeTreatmentOption,
  setMatrix,
};
