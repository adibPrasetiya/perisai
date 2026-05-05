import { validate } from "../../utils/validator.utils.js";
import {
  createRiskLevelSchema,
  updateRiskLevelSchema,
  bulkSetRiskLevelsSchema,
  idSchema,
} from "./risk-level.validation.js";
import { prismaClient } from "../../core/lib/database.lib.js";
import { NotFoundError } from "../../error/not-found.error.js";
import { BadRequestError } from "../../error/bad-request.error.js";
import { ConflictError } from "../../error/conflict.error.js";
import { verifyContextExists } from "../../utils/context.utils.js";

const riskLevelSelect = {
  id: true,
  name: true,
  description: true,
  minScore: true,
  maxScore: true,
  color: true,
  order: true,
  createdAt: true,
  updatedAt: true,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const validateScoreRange = (minScore, maxScore) => {
  if (maxScore < minScore) {
    throw new BadRequestError("Skor maksimum tidak boleh lebih kecil dari skor minimum.");
  }
};

const validateScoreAgainstMatrix = (minScore, maxScore, context) => {
  const maxAllowed = context.matrixRows * context.matrixCols;
  if (maxScore > maxAllowed) {
    throw new BadRequestError(
      `Skor maksimum (${maxScore}) melebihi batas matriks ${context.matrixRows}×${context.matrixCols}. Nilai maksimal yang diizinkan adalah ${maxAllowed}.`,
    );
  }
  if (minScore > maxAllowed) {
    throw new BadRequestError(
      `Skor minimum (${minScore}) melebihi batas matriks ${context.matrixRows}×${context.matrixCols}. Nilai maksimal yang diizinkan adalah ${maxAllowed}.`,
    );
  }
};

const checkNameConflict = async (contextId, name, excludeId = null) => {
  const existing = await prismaClient.riskLevel.findFirst({
    where: { contextId, name, ...(excludeId ? { id: { not: excludeId } } : {}) },
  });
  if (existing) {
    throw new ConflictError(`Level risiko dengan nama "${name}" sudah ada dalam konteks ini.`);
  }
};

const checkOrderConflict = async (contextId, order, excludeId = null) => {
  const existing = await prismaClient.riskLevel.findFirst({
    where: { contextId, order, ...(excludeId ? { id: { not: excludeId } } : {}) },
  });
  if (existing) {
    throw new ConflictError(`Level risiko dengan urutan ${order} sudah ada dalam konteks ini.`);
  }
};

const verifyLevelBelongsToContext = async (levelId, contextId) => {
  const level = await prismaClient.riskLevel.findFirst({
    where: { id: levelId, contextId },
  });
  if (!level) throw new NotFoundError("Level risiko tidak ditemukan.");
  return level;
};

// =============================================================================
// CRUD
// =============================================================================

const list = async (contextId) => {
  await verifyContextExists(contextId);

  const levels = await prismaClient.riskLevel.findMany({
    where: { contextId },
    select: riskLevelSelect,
    orderBy: { order: "asc" },
  });

  return { message: "Daftar level risiko berhasil ditemukan", data: levels };
};

const create = async (contextId, reqBody) => {
  const context = await verifyContextExists(contextId);
  if (context.status === "ACTIVE") {
    throw new BadRequestError(
      "Konteks yang sedang aktif tidak dapat dimodifikasi. Nonaktifkan terlebih dahulu untuk melakukan perubahan."
    );
  }
  reqBody = validate(createRiskLevelSchema, reqBody);

  validateScoreRange(reqBody.minScore, reqBody.maxScore);
  validateScoreAgainstMatrix(reqBody.minScore, reqBody.maxScore, context);
  await checkNameConflict(contextId, reqBody.name);
  await checkOrderConflict(contextId, reqBody.order);

  const level = await prismaClient.riskLevel.create({
    data: {
      contextId,
      name: reqBody.name,
      description: reqBody.description || null,
      minScore: reqBody.minScore,
      maxScore: reqBody.maxScore,
      color: reqBody.color || null,
      order: reqBody.order,
    },
    select: riskLevelSelect,
  });

  return { message: "Level risiko berhasil ditambahkan", data: level };
};

const update = async (contextId, levelId, reqBody) => {
  const { id: validLevelId } = validate(idSchema, { id: levelId });
  const context = await verifyContextExists(contextId);
  if (context.status === "ACTIVE") {
    throw new BadRequestError(
      "Konteks yang sedang aktif tidak dapat dimodifikasi. Nonaktifkan terlebih dahulu untuk melakukan perubahan."
    );
  }
  reqBody = validate(updateRiskLevelSchema, reqBody);

  const existing = await verifyLevelBelongsToContext(validLevelId, contextId);

  const minScore = reqBody.minScore ?? existing.minScore;
  const maxScore = reqBody.maxScore ?? existing.maxScore;
  validateScoreRange(minScore, maxScore);
  validateScoreAgainstMatrix(minScore, maxScore, context);

  if (reqBody.name && reqBody.name !== existing.name) {
    await checkNameConflict(contextId, reqBody.name, validLevelId);
  }
  if (reqBody.order !== undefined && reqBody.order !== existing.order) {
    await checkOrderConflict(contextId, reqBody.order, validLevelId);
  }

  const updated = await prismaClient.riskLevel.update({
    where: { id: validLevelId },
    data: reqBody,
    select: riskLevelSelect,
  });

  return { message: "Level risiko berhasil diperbarui", data: updated };
};

const remove = async (contextId, levelId) => {
  const { id: validLevelId } = validate(idSchema, { id: levelId });
  const context = await verifyContextExists(contextId);
  if (context.status === "ACTIVE") {
    throw new BadRequestError(
      "Konteks yang sedang aktif tidak dapat dimodifikasi. Nonaktifkan terlebih dahulu untuk melakukan perubahan."
    );
  }
  await verifyLevelBelongsToContext(validLevelId, contextId);

  await prismaClient.riskLevel.delete({ where: { id: validLevelId } });
  return { message: "Level risiko berhasil dihapus" };
};

// =============================================================================
// BULK SET
// =============================================================================

const bulkSet = async (contextId, reqBody) => {
  const context = await verifyContextExists(contextId);
  if (context.status === "ACTIVE") {
    throw new BadRequestError(
      "Konteks yang sedang aktif tidak dapat dimodifikasi. Nonaktifkan terlebih dahulu untuk melakukan perubahan."
    );
  }
  reqBody = validate(bulkSetRiskLevelsSchema, reqBody);

  const { levels } = reqBody;

  // Validasi semua rentang skor dan batas matriks
  for (const level of levels) {
    validateScoreRange(level.minScore, level.maxScore);
    validateScoreAgainstMatrix(level.minScore, level.maxScore, context);
  }

  // Validasi nama unik di dalam batch
  const names = levels.map((l) => l.name);
  const uniqueNames = new Set(names);
  if (uniqueNames.size !== names.length) {
    throw new BadRequestError("Terdapat nama level yang duplikat dalam data yang dikirim.");
  }

  // Validasi order unik di dalam batch
  const orders = levels.map((l) => l.order);
  const uniqueOrders = new Set(orders);
  if (uniqueOrders.size !== orders.length) {
    throw new BadRequestError("Terdapat nilai urutan (order) yang duplikat dalam data yang dikirim.");
  }

  await prismaClient.$transaction([
    prismaClient.riskLevel.deleteMany({ where: { contextId } }),
    prismaClient.riskLevel.createMany({
      data: levels.map((l) => ({
        contextId,
        name: l.name,
        description: l.description || null,
        minScore: l.minScore,
        maxScore: l.maxScore,
        color: l.color || null,
        order: l.order,
      })),
    }),
  ]);

  const saved = await prismaClient.riskLevel.findMany({
    where: { contextId },
    select: riskLevelSelect,
    orderBy: { order: "asc" },
  });

  return { message: "Level risiko berhasil disimpan", data: saved };
};

export default { list, create, update, remove, bulkSet };
