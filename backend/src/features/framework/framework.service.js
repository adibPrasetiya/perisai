import { validate } from "../../utils/validator.utils.js";
import {
  createFrameworkSchema,
  updateFrameworkSchema,
  searchFrameworkSchema,
  frameworkIdSchema,
} from "./framework.validation.js";
import { prismaClient } from "../../core/lib/database.lib.js";
import { ConflictError } from "../../error/conflict.error.js";
import { NotFoundError } from "../../error/not-found.error.js";
import { BadRequestError } from "../../error/bad-request.error.js";

const frameworkSelect = {
  id: true,
  code: true,
  name: true,
  version: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

const verifyFrameworkExists = async (id) => {
  const framework = await prismaClient.framework.findUnique({
    where: { id },
    select: frameworkSelect,
  });

  if (!framework) {
    throw new NotFoundError("Framework tidak ditemukan.");
  }

  return framework;
};

const create = async (reqBody) => {
  reqBody = validate(createFrameworkSchema, reqBody);

  const existing = await prismaClient.framework.findUnique({
    where: { code: reqBody.code },
  });

  if (existing) {
    throw new ConflictError(
      `Framework dengan kode "${reqBody.code}" sudah ada.`,
    );
  }

  const framework = await prismaClient.framework.create({
    data: {
      code: reqBody.code,
      name: reqBody.name,
      version: reqBody.version || null,
      description: reqBody.description || null,
    },
    select: frameworkSelect,
  });

  console.log("ACTION_TYPES.FRAMEWORK_CREATED", { frameworkId: framework.id });

  return {
    message: "Framework berhasil dibuat",
    data: framework,
  };
};

const search = async (queryParams) => {
  const params = validate(searchFrameworkSchema, queryParams);
  const { name, code, isActive, page, limit } = params;

  const where = {};

  if (name) {
    where.name = { contains: name };
  }

  if (code) {
    where.code = { contains: code };
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  const skip = (page - 1) * limit;
  const totalItems = await prismaClient.framework.count({ where });

  const frameworks = await prismaClient.framework.findMany({
    where,
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      ...frameworkSelect,
      _count: {
        select: { riskPrograms: true },
      },
    },
  });

  const totalPages = Math.ceil(totalItems / limit);

  return {
    message: "Framework berhasil ditemukan",
    data: frameworks,
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

const update = async (id, reqBody) => {
  const { id: validId } = validate(frameworkIdSchema, { id });
  reqBody = validate(updateFrameworkSchema, reqBody);

  const existing = await verifyFrameworkExists(validId);

  if (reqBody.code && reqBody.code !== existing.code) {
    const codeConflict = await prismaClient.framework.findUnique({
      where: { code: reqBody.code },
    });

    if (codeConflict) {
      throw new ConflictError(
        `Framework dengan kode "${reqBody.code}" sudah digunakan oleh framework lain.`,
      );
    }
  }

  const updated = await prismaClient.framework.update({
    where: { id: validId },
    data: reqBody,
    select: frameworkSelect,
  });

  console.log("ACTION_TYPES.FRAMEWORK_UPDATED", {
    frameworkId: validId,
    updatedData: reqBody,
  });

  return {
    message: "Framework berhasil diperbarui",
    data: updated,
  };
};

const activate = async (id) => {
  const { id: validId } = validate(frameworkIdSchema, { id });
  const existing = await verifyFrameworkExists(validId);

  if (existing.isActive) {
    throw new BadRequestError("Framework sudah dalam keadaan aktif.");
  }

  const updated = await prismaClient.framework.update({
    where: { id: validId },
    data: { isActive: true },
    select: frameworkSelect,
  });

  return {
    message: "Framework berhasil diaktifkan",
    data: updated,
  };
};

const deactivate = async (id) => {
  const { id: validId } = validate(frameworkIdSchema, { id });
  const existing = await verifyFrameworkExists(validId);

  if (!existing.isActive) {
    throw new BadRequestError("Framework sudah dalam keadaan tidak aktif.");
  }

  const updated = await prismaClient.framework.update({
    where: { id: validId },
    data: { isActive: false },
    select: frameworkSelect,
  });

  return {
    message: "Framework berhasil dinonaktifkan",
    data: updated,
  };
};

const remove = async (id) => {
  const { id: validId } = validate(frameworkIdSchema, { id });
  await verifyFrameworkExists(validId);

  const programCount = await prismaClient.riskProgram.count({
    where: { frameworkId: validId },
  });

  if (programCount > 0) {
    throw new ConflictError(
      `Framework tidak dapat dihapus karena masih memiliki ${programCount} program risiko yang terkait.`,
    );
  }

  await prismaClient.framework.delete({ where: { id: validId } });

  console.log("ACTION_TYPES.FRAMEWORK_DELETED", { frameworkId: validId });

  return {
    message: "Framework berhasil dihapus",
  };
};

export default { create, search, update, activate, deactivate, remove };
