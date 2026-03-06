import { PROCESS_BUSINESS_STATUSES } from "../../core/config/enum.config.js";
import { prismaClient } from "../../core/lib/database.lib.js";
import { BadRequestError } from "../../error/bad-request.error.js";
import { ConflictError } from "../../error/conflict.error.js";
import { ForbiddenError } from "../../error/forbidden.error.js";
import { NotFoundError } from "../../error/not-found.error.js";
import {
  checkUnitKerjaAccess,
  verifyUnitKerjaExists,
} from "../../utils/unit-kerja.utils.js";
import { validate } from "../../utils/validator.utils.js";
import {
  createProsesBisnisSchema,
  prosesBisnisIdSchema,
  searchProsesBisnisSchema,
  unitKerjaIdSchema,
  updateProsesBisnisSchema,
} from "./proses-bisnis.validation.js";

const prosesBisnisSelect = {
  id: true,
  name: true,
  code: true,
  description: true,
  owner: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  unitKerja: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },
};

const create = async (unitKerjaId, reqBody, user) => {
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  checkUnitKerjaAccess(user, unitKerjaId);
  await verifyUnitKerjaExists(unitKerjaId);

  reqBody = validate(createProsesBisnisSchema, reqBody);

  const existingCode = await prismaClient.businessProcess.findUnique({
    where: {
      unitKerjaId_code: {
        unitKerjaId,
        code: reqBody.code,
      },
    },
  });

  if (existingCode) {
    throw new ConflictError(
      `Kode proses bisnis "${reqBody.code}" sudah digunakan dalam unit kerja ini.`,
    );
  }

  const prosesBisnis = await prismaClient.businessProcess.create({
    data: {
      unitKerjaId,
      name: reqBody.name,
      code: reqBody.code,
      description: reqBody.description || null,
      owner: reqBody.owner || null,
      status: reqBody.status,
      createdBy: user.userId,
    },
    select: prosesBisnisSelect,
  });

  return {
    message: "Proses bisnis berhasil dibuat",
    data: prosesBisnis,
  };
};

const search = async (unitKerjaId, queryParams, user) => {
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  checkUnitKerjaAccess(user, unitKerjaId, { allowKomitePusat: true });
  await verifyUnitKerjaExists(unitKerjaId);

  const params = validate(searchProsesBisnisSchema, queryParams);
  const { name, code, status, page, limit } = params;

  const where = { unitKerjaId };

  if (name) {
    where.name = { contains: name };
  }

  if (code) {
    where.code = { contains: code };
  }

  if (status) {
    where.status = status;
  }

  const skip = (page - 1) * limit;
  const totalItems = await prismaClient.businessProcess.count({ where });

  const prosesBisnisList = await prismaClient.businessProcess.findMany({
    where,
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
    select: prosesBisnisSelect,
  });

  const totalPages = Math.ceil(totalItems / limit);

  return {
    message: "Proses bisnis berhasil ditemukan",
    data: prosesBisnisList,
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

const update = async (unitKerjaId, id, reqBody, user) => {
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  checkUnitKerjaAccess(user, unitKerjaId);

  const idParams = validate(prosesBisnisIdSchema, { id });

  reqBody = validate(updateProsesBisnisSchema, reqBody);

  const existing = await prismaClient.businessProcess.findUnique({
    where: { id: idParams.id },
  });

  if (!existing) {
    throw new NotFoundError("Proses bisnis tidak ditemukan.");
  }

  if (existing.unitKerjaId !== unitKerjaId) {
    throw new NotFoundError("Proses bisnis tidak ditemukan.");
  }

  if (existing.status === PROCESS_BUSINESS_STATUSES.ARCHIVED) {
    throw new ForbiddenError(
      "Gagal mengubah data proses bisnis. Proses bisnis sudah di arsipkan.",
    );
  }

  if (reqBody.code && reqBody.code !== existing.code) {
    const codeExists = await prismaClient.businessProcess.findUnique({
      where: {
        unitKerjaId_code: {
          unitKerjaId,
          code: reqBody.code,
        },
      },
    });

    if (codeExists) {
      throw new ConflictError(
        `Kode proses bisnis "${reqBody.code}" sudah digunakan oleh proses bisnis lain dalam unit kerja ini.`,
      );
    }
  }

  const updated = await prismaClient.businessProcess.update({
    where: { id: idParams.id },
    data: { ...reqBody, updatedBy: user.userId },
    select: prosesBisnisSelect,
  });

  return {
    message: "Proses bisnis berhasil diperbarui",
    data: updated,
  };
};

const setActive = async (unitKerjaId, id, user) => {
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  checkUnitKerjaAccess(user, unitKerjaId);

  const idParams = validate(prosesBisnisIdSchema, { id });

  const existing = await prismaClient.businessProcess.findUnique({
    where: { id: idParams.id },
  });

  if (!existing) {
    throw new NotFoundError("Proses bisnis tidak ditemukan.");
  }

  if (existing.unitKerjaId !== unitKerjaId) {
    throw new NotFoundError("Proses bisnis tidak ditemukan.");
  }

  if (existing.status === PROCESS_BUSINESS_STATUSES.ACTIVE) {
    throw new BadRequestError("Proses bisnis sudah dalam status aktif.");
  }

  if (existing.status === PROCESS_BUSINESS_STATUSES.ARCHIVED) {
    throw new BadRequestError(
      "Tidak dapat mengaktifkan proses bisnis yang sudah diarsipkan.",
    );
  }

  const updated = await prismaClient.businessProcess.update({
    where: { id: idParams.id },
    data: { status: PROCESS_BUSINESS_STATUSES.ACTIVE, updatedBy: user.userId },
    select: prosesBisnisSelect,
  });

  return { message: "Proses bisnis berhasil diaktifkan", data: updated };
};

const setInactive = async (unitKerjaId, id, user) => {
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  checkUnitKerjaAccess(user, unitKerjaId);

  const idParams = validate(prosesBisnisIdSchema, { id });

  const existing = await prismaClient.businessProcess.findUnique({
    where: { id: idParams.id },
  });

  if (!existing) {
    throw new NotFoundError("Proses bisnis tidak ditemukan.");
  }

  if (existing.unitKerjaId !== unitKerjaId) {
    throw new NotFoundError("Proses bisnis tidak ditemukan.");
  }

  if (existing.status === PROCESS_BUSINESS_STATUSES.INACTIVE) {
    throw new BadRequestError("Proses bisnis sudah dalam status tidak aktif.");
  }

  if (existing.status === PROCESS_BUSINESS_STATUSES.ARCHIVED) {
    throw new BadRequestError(
      "Tidak dapat menonaktifkan proses bisnis yang sudah diarsipkan.",
    );
  }

  const updated = await prismaClient.businessProcess.update({
    where: { id: idParams.id },
    data: {
      status: PROCESS_BUSINESS_STATUSES.INACTIVE,
      updatedBy: user.userId,
    },
    select: prosesBisnisSelect,
  });

  return { message: "Proses bisnis berhasil dinonaktifkan", data: updated };
};

const archive = async (unitKerjaId, id, user) => {
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  checkUnitKerjaAccess(user, unitKerjaId);

  const idParams = validate(prosesBisnisIdSchema, { id });

  const existing = await prismaClient.businessProcess.findUnique({
    where: { id: idParams.id },
  });

  if (!existing) {
    throw new NotFoundError("Proses bisnis tidak ditemukan.");
  }

  if (existing.unitKerjaId !== unitKerjaId) {
    throw new NotFoundError("Proses bisnis tidak ditemukan.");
  }

  if (existing.status === PROCESS_BUSINESS_STATUSES.ARCHIVED) {
    throw new BadRequestError("Proses bisnis sudah diarsipkan.");
  }

  if (existing.status === PROCESS_BUSINESS_STATUSES.ACTIVE) {
    throw new BadRequestError(
      "Tidak dapat mengarsipkan proses bisnis yang masih aktif. Nonaktifkan terlebih dahulu.",
    );
  }

  const archived = await prismaClient.businessProcess.update({
    where: { id: idParams.id },
    data: {
      status: PROCESS_BUSINESS_STATUSES.ARCHIVED,
      updatedBy: user.userId,
    },
    select: prosesBisnisSelect,
  });

  return { message: "Proses bisnis berhasil diarsipkan", data: archived };
};

export default { create, search, update, setActive, setInactive, archive };
