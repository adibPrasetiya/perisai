import { validate } from "../../utils/validator.utils.js";
import {
  createRiskProgramSchema,
  updateRiskProgramSchema,
  searchRiskProgramSchema,
  riskProgramIdSchema,
} from "./risk-program.validation.js";
import { prismaClient } from "../../core/lib/database.lib.js";
import { NotFoundError } from "../../error/not-found.error.js";
import { BadRequestError } from "../../error/bad-request.error.js";
import { ConflictError } from "../../error/conflict.error.js";

const riskProgramSelect = {
  id: true,
  name: true,
  description: true,
  year: true,
  frameworkId: true,
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

  const framework = await prismaClient.framework.findUnique({
    where: { id: reqBody.frameworkId },
  });

  if (!framework) {
    throw new BadRequestError("Framework tidak ditemukan.");
  }

  const program = await prismaClient.riskProgram.create({
    data: {
      name: reqBody.name,
      description: reqBody.description || null,
      year: reqBody.year,
      frameworkId: reqBody.frameworkId,
      status: reqBody.status,
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
  const { name, year, frameworkId, status, page, limit } = params;

  const where = {};

  if (name) {
    where.name = { contains: name };
  }

  if (year !== undefined) {
    where.year = year;
  }

  if (frameworkId) {
    where.frameworkId = frameworkId;
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
      framework: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
      _count: {
        select: { contexts: true },
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
      framework: {
        select: {
          id: true,
          code: true,
          name: true,
          version: true,
        },
      },
      contexts: {
        select: {
          id: true,
          name: true,
          code: true,
          contextType: true,
          periodStart: true,
          periodEnd: true,
          status: true,
          unitKerjaId: true,
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

  if (reqBody.frameworkId) {
    const framework = await prismaClient.framework.findUnique({
      where: { id: reqBody.frameworkId },
    });

    if (!framework) {
      throw new BadRequestError("Framework tidak ditemukan.");
    }
  }

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

  const contextCount = await prismaClient.riskContext.count({
    where: { riskProgramId: validId },
  });

  if (contextCount > 0) {
    throw new ConflictError(
      `Program risiko tidak dapat dihapus karena masih memiliki ${contextCount} konteks risiko yang terkait.`,
    );
  }

  await prismaClient.riskProgram.delete({ where: { id: validId } });

  console.log("ACTION_TYPES.RISK_PROGRAM_DELETED", { riskProgramId: validId });

  return {
    message: "Program risiko berhasil dihapus",
  };
};

export default { create, search, getById, update, remove };
