import { validate } from "../../utils/validator.utils.js";
import {
  createRiskProgramSchema,
  updateRiskProgramSchema,
  searchRiskProgramSchema,
  riskProgramIdSchema,
} from "./risk-program.validation.js";
import { prismaClient } from "../../core/lib/database.lib.js";
import { NotFoundError } from "../../error/not-found.error.js";
import { ConflictError } from "../../error/conflict.error.js";
import { BadRequestError } from "../../error/bad-request.error.js";
import { RISK_PROGRAM_STATUSES } from "../../core/config/enum.config.js";

const riskProgramSelect = {
  id: true,
  name: true,
  description: true,
  year: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
};

const verifyRiskProgramExists = async (id) => {
  const program = await prismaClient.riskProgram.findUnique({
    where: { id },
    select: riskProgramSelect,
  });

  if (!program) {
    throw new NotFoundError("Program risiko tidak ditemukan.");
  }

  return program;
};

const create = async (reqBody, userId) => {
  reqBody = validate(createRiskProgramSchema, reqBody);

  const program = await prismaClient.riskProgram.create({
    data: {
      name: reqBody.name,
      description: reqBody.description || null,
      year: reqBody.year,
      status: RISK_PROGRAM_STATUSES.DRAFT,
      createdBy: userId || null,
      updatedBy: userId || null,
    },
    select: riskProgramSelect,
  });

  console.log("ACTION_TYPES.RISK_PROGRAM_CREATED", { riskProgramId: program.id });

  return {
    message: "Program risiko berhasil dibuat",
    data: program,
  };
};

const search = async (queryParams) => {
  const params = validate(searchRiskProgramSchema, queryParams);
  const { name, year, status, page, limit } = params;

  const where = {};

  if (name) {
    where.name = { contains: name };
  }

  if (year !== undefined) {
    where.year = year;
  }

  if (status) {
    where.status = status;
  }

  const skip = (page - 1) * limit;
  const totalItems = await prismaClient.riskProgram.count({ where });

  const programs = await prismaClient.riskProgram.findMany({
    where,
    skip,
    take: limit,
    orderBy: [{ year: "desc" }, { createdAt: "desc" }],
    select: {
      ...riskProgramSelect,
      _count: {
        select: { programFrameworks: true },
      },
    },
  });

  const totalPages = Math.ceil(totalItems / limit);

  return {
    message: "Program risiko berhasil ditemukan",
    data: programs,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

const getById = async (id) => {
  const { id: validId } = validate(riskProgramIdSchema, { id });

  const program = await prismaClient.riskProgram.findUnique({
    where: { id: validId },
    select: {
      ...riskProgramSelect,
      programFrameworks: {
        select: {
          id: true,
          frameworkId: true,
          status: true,
          framework: {
            select: {
              id: true,
              code: true,
              name: true,
              version: true,
            },
          },
          _count: {
            select: { programFrameworkContexts: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!program) {
    throw new NotFoundError("Program risiko tidak ditemukan.");
  }

  return {
    message: "Program risiko berhasil ditemukan",
    data: program,
  };
};

const update = async (id, reqBody, userId) => {
  const { id: validId } = validate(riskProgramIdSchema, { id });
  reqBody = validate(updateRiskProgramSchema, reqBody);

  await verifyRiskProgramExists(validId);

  const updated = await prismaClient.riskProgram.update({
    where: { id: validId },
    data: {
      ...reqBody,
      updatedBy: userId || null,
    },
    select: riskProgramSelect,
  });

  console.log("ACTION_TYPES.RISK_PROGRAM_UPDATED", {
    riskProgramId: validId,
    updatedData: reqBody,
  });

  return {
    message: "Program risiko berhasil diperbarui",
    data: updated,
  };
};

const remove = async (id) => {
  const { id: validId } = validate(riskProgramIdSchema, { id });
  await verifyRiskProgramExists(validId);

  const frameworkCount = await prismaClient.programFramework.count({
    where: { programId: validId },
  });

  if (frameworkCount > 0) {
    throw new ConflictError(
      `Program risiko tidak dapat dihapus karena masih memiliki ${frameworkCount} framework yang terdaftar.`,
    );
  }

  await prismaClient.riskProgram.delete({ where: { id: validId } });

  console.log("ACTION_TYPES.RISK_PROGRAM_DELETED", { riskProgramId: validId });

  return {
    message: "Program risiko berhasil dihapus",
  };
};

const activate = async (id, userId) => {
  const { id: validId } = validate(riskProgramIdSchema, { id });
  const program = await verifyRiskProgramExists(validId);

  if (program.status === RISK_PROGRAM_STATUSES.ACTIVE) {
    throw new BadRequestError("Program risiko sudah dalam status Aktif.");
  }

  const frameworkCount = await prismaClient.programFramework.count({
    where: { programId: validId },
  });

  if (frameworkCount === 0) {
    throw new BadRequestError(
      "Program risiko tidak dapat diaktifkan. Tambahkan minimal satu framework terlebih dahulu.",
    );
  }

  const updated = await prismaClient.riskProgram.update({
    where: { id: validId },
    data: {
      status: RISK_PROGRAM_STATUSES.ACTIVE,
      updatedBy: userId || null,
    },
    select: riskProgramSelect,
  });

  console.log("ACTION_TYPES.RISK_PROGRAM_ACTIVATED", { riskProgramId: validId });

  return {
    message: "Program risiko berhasil diaktifkan",
    data: updated,
  };
};

const deactivate = async (id, userId) => {
  const { id: validId } = validate(riskProgramIdSchema, { id });
  const program = await verifyRiskProgramExists(validId);

  if (program.status !== RISK_PROGRAM_STATUSES.ACTIVE) {
    throw new BadRequestError("Hanya program risiko dengan status Aktif yang dapat dinonaktifkan.");
  }

  const updated = await prismaClient.riskProgram.update({
    where: { id: validId },
    data: {
      status: RISK_PROGRAM_STATUSES.CLOSED,
      updatedBy: userId || null,
    },
    select: riskProgramSelect,
  });

  console.log("ACTION_TYPES.RISK_PROGRAM_DEACTIVATED", { riskProgramId: validId });

  return {
    message: "Program risiko berhasil dinonaktifkan",
    data: updated,
  };
};

const setDraft = async (id, userId) => {
  const { id: validId } = validate(riskProgramIdSchema, { id });
  const program = await verifyRiskProgramExists(validId);

  if (program.status === RISK_PROGRAM_STATUSES.DRAFT) {
    throw new BadRequestError("Program risiko sudah dalam status Draft.");
  }

  const updated = await prismaClient.riskProgram.update({
    where: { id: validId },
    data: {
      status: RISK_PROGRAM_STATUSES.DRAFT,
      updatedBy: userId || null,
    },
    select: riskProgramSelect,
  });

  console.log("ACTION_TYPES.RISK_PROGRAM_SET_DRAFT", { riskProgramId: validId });

  return {
    message: "Program risiko berhasil dikembalikan ke status Draft",
    data: updated,
  };
};

export default { create, search, getById, update, remove, activate, deactivate, setDraft };
