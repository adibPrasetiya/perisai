import { validate } from "../../utils/validator.utils.js";
import {
  addFrameworkSchema,
  updateProgramFrameworkSchema,
  programFrameworkIdSchema,
} from "./program-framework.validation.js";
import { prismaClient } from "../../core/lib/database.lib.js";
import { NotFoundError } from "../../error/not-found.error.js";
import { BadRequestError } from "../../error/bad-request.error.js";
import { ConflictError } from "../../error/conflict.error.js";

const programFrameworkSelect = {
  id: true,
  programId: true,
  frameworkId: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
};

const verifyProgramExists = async (programId) => {
  const program = await prismaClient.riskProgram.findUnique({
    where: { id: programId },
    select: { id: true, name: true, status: true },
  });

  if (!program) {
    throw new NotFoundError("Program risiko tidak ditemukan.");
  }

  return program;
};

const verifyProgramFrameworkExists = async (id, programId) => {
  const pf = await prismaClient.programFramework.findFirst({
    where: { id, programId },
    select: programFrameworkSelect,
  });

  if (!pf) {
    throw new NotFoundError("Framework tidak ditemukan dalam program ini.");
  }

  return pf;
};

const addFramework = async (programId, reqBody, userId) => {
  await verifyProgramExists(programId);
  reqBody = validate(addFrameworkSchema, reqBody);

  const framework = await prismaClient.framework.findUnique({
    where: { id: reqBody.frameworkId },
    select: { id: true, name: true, isActive: true },
  });

  if (!framework) {
    throw new BadRequestError("Framework tidak ditemukan.");
  }

  if (!framework.isActive) {
    throw new BadRequestError(
      "Framework tidak aktif dan tidak dapat ditambahkan ke program.",
    );
  }

  const activeContextCount = await prismaClient.riskContext.count({
    where: { frameworkId: reqBody.frameworkId, status: "ACTIVE" },
  });

  if (activeContextCount === 0) {
    throw new BadRequestError(
      `Framework "${framework.name}" tidak memiliki konteks risiko yang aktif. Aktifkan setidaknya satu konteks risiko pada framework ini sebelum menambahkannya ke program.`,
    );
  }

  const existing = await prismaClient.programFramework.findUnique({
    where: {
      programId_frameworkId: {
        programId,
        frameworkId: reqBody.frameworkId,
      },
    },
  });

  if (existing) {
    throw new ConflictError(
      `Framework "${framework.name}" sudah terdaftar dalam program ini.`,
    );
  }

  const programFramework = await prismaClient.programFramework.create({
    data: {
      programId,
      frameworkId: reqBody.frameworkId,
      createdBy: userId || null,
      updatedBy: userId || null,
    },
    select: {
      ...programFrameworkSelect,
      framework: {
        select: { id: true, code: true, name: true, version: true },
      },
    },
  });

  console.log("ACTION_TYPES.PROGRAM_FRAMEWORK_ADDED", {
    programId,
    frameworkId: reqBody.frameworkId,
    programFrameworkId: programFramework.id,
  });

  return {
    message: `Framework berhasil ditambahkan ke program`,
    data: programFramework,
  };
};

const listByProgram = async (programId) => {
  await verifyProgramExists(programId);

  const programFrameworks = await prismaClient.programFramework.findMany({
    where: { programId },
    select: {
      ...programFrameworkSelect,
      framework: {
        select: { id: true, code: true, name: true, version: true },
      },
      _count: {
        select: { programFrameworkContexts: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return {
    message: "Framework dalam program berhasil ditemukan",
    data: programFrameworks,
  };
};

const getById = async (programId, id) => {
  await verifyProgramExists(programId);
  const { id: validId } = validate(programFrameworkIdSchema, { id });

  const pf = await prismaClient.programFramework.findFirst({
    where: { id: validId, programId },
    select: {
      ...programFrameworkSelect,
      framework: {
        select: { id: true, code: true, name: true, version: true, description: true },
      },
    },
  });

  if (!pf) {
    throw new NotFoundError("Framework tidak ditemukan dalam program ini.");
  }

  return {
    message: "Detail program framework berhasil ditemukan",
    data: pf,
  };
};

const update = async (programId, id, reqBody, userId) => {
  const { id: validId } = validate(programFrameworkIdSchema, { id });
  reqBody = validate(updateProgramFrameworkSchema, reqBody);

  await verifyProgramExists(programId);
  await verifyProgramFrameworkExists(validId, programId);

  const updated = await prismaClient.programFramework.update({
    where: { id: validId },
    data: {
      ...reqBody,
      updatedBy: userId || null,
    },
    select: {
      ...programFrameworkSelect,
      framework: {
        select: { id: true, code: true, name: true, version: true },
      },
    },
  });

  console.log("ACTION_TYPES.PROGRAM_FRAMEWORK_UPDATED", {
    programFrameworkId: validId,
    updatedData: reqBody,
  });

  return {
    message: "Program framework berhasil diperbarui",
    data: updated,
  };
};

const remove = async (programId, id) => {
  const { id: validId } = validate(programFrameworkIdSchema, { id });

  await verifyProgramExists(programId);
  await verifyProgramFrameworkExists(validId, programId);

  const contextCount = await prismaClient.programFrameworkContext.count({
    where: { programFrameworkId: validId },
  });

  if (contextCount > 0) {
    throw new ConflictError(
      `Framework tidak dapat dihapus dari program karena masih memiliki ${contextCount} konteks risiko yang terkait.`,
    );
  }

  await prismaClient.programFramework.delete({ where: { id: validId } });

  console.log("ACTION_TYPES.PROGRAM_FRAMEWORK_REMOVED", {
    programId,
    programFrameworkId: validId,
  });

  return {
    message: "Framework berhasil dihapus dari program",
  };
};

const listByFramework = async (frameworkId) => {
  const framework = await prismaClient.framework.findUnique({
    where: { id: frameworkId },
    select: { id: true },
  });

  if (!framework) {
    throw new NotFoundError("Framework tidak ditemukan.");
  }

  const programFrameworks = await prismaClient.programFramework.findMany({
    where: { frameworkId },
    select: {
      id: true,
      status: true,
      createdAt: true,
      program: {
        select: { id: true, name: true, year: true, status: true },
      },
      _count: {
        select: { programFrameworkContexts: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return {
    message: "Program yang menggunakan framework berhasil ditemukan",
    data: programFrameworks,
  };
};

export default { addFramework, listByProgram, listByFramework, getById, update, remove };
