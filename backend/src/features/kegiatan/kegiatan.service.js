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
  createKegiatanSchema,
  KegiatanIdSchema,
  searchKegiatanSchema,
  unitKerjaIdSchema,
  updateKegiatanSchema,
} from "./kegiatan.validation.js";

const KegiatanSelect = {
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

  reqBody = validate(createKegiatanSchema, reqBody);

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
      `Kode Kegiatan "${reqBody.code}" sudah digunakan dalam unit kerja ini.`,
    );
  }

  const Kegiatan = await prismaClient.businessProcess.create({
    data: {
      unitKerjaId,
      name: reqBody.name,
      code: reqBody.code,
      description: reqBody.description || null,
      owner: reqBody.owner || null,
      status: reqBody.status,
      createdBy: user.userId,
    },
    select: KegiatanSelect,
  });

  return {
    message: "Kegiatan berhasil dibuat",
    data: Kegiatan,
  };
};

const search = async (unitKerjaId, queryParams, user) => {
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  checkUnitKerjaAccess(user, unitKerjaId, { allowKomitePusat: true });
  await verifyUnitKerjaExists(unitKerjaId);

  const params = validate(searchKegiatanSchema, queryParams);
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

  const KegiatanList = await prismaClient.businessProcess.findMany({
    where,
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
    select: KegiatanSelect,
  });

  const totalPages = Math.ceil(totalItems / limit);

  return {
    message: "Kegiatan berhasil ditemukan",
    data: KegiatanList,
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

  const idParams = validate(KegiatanIdSchema, { id });

  reqBody = validate(updateKegiatanSchema, reqBody);

  const existing = await prismaClient.businessProcess.findUnique({
    where: { id: idParams.id },
  });

  if (!existing) {
    throw new NotFoundError("Kegiatan tidak ditemukan.");
  }

  if (existing.unitKerjaId !== unitKerjaId) {
    throw new NotFoundError("Kegiatan tidak ditemukan.");
  }

  if (existing.status === PROCESS_BUSINESS_STATUSES.ARCHIVED) {
    throw new ForbiddenError(
      "Gagal mengubah data Kegiatan. Kegiatan sudah di arsipkan.",
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
        `Kode Kegiatan "${reqBody.code}" sudah digunakan oleh Kegiatan lain dalam unit kerja ini.`,
      );
    }
  }

  const updated = await prismaClient.businessProcess.update({
    where: { id: idParams.id },
    data: { ...reqBody, updatedBy: user.userId },
    select: KegiatanSelect,
  });

  return {
    message: "Kegiatan berhasil diperbarui",
    data: updated,
  };
};

const setActive = async (unitKerjaId, id, user) => {
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  checkUnitKerjaAccess(user, unitKerjaId);

  const idParams = validate(KegiatanIdSchema, { id });

  const existing = await prismaClient.businessProcess.findUnique({
    where: { id: idParams.id },
  });

  if (!existing) {
    throw new NotFoundError("Kegiatan tidak ditemukan.");
  }

  if (existing.unitKerjaId !== unitKerjaId) {
    throw new NotFoundError("Kegiatan tidak ditemukan.");
  }

  if (existing.status === PROCESS_BUSINESS_STATUSES.ACTIVE) {
    throw new BadRequestError("Kegiatan sudah dalam status aktif.");
  }

  if (existing.status === PROCESS_BUSINESS_STATUSES.ARCHIVED) {
    throw new BadRequestError(
      "Tidak dapat mengaktifkan Kegiatan yang sudah diarsipkan.",
    );
  }

  const updated = await prismaClient.businessProcess.update({
    where: { id: idParams.id },
    data: { status: PROCESS_BUSINESS_STATUSES.ACTIVE, updatedBy: user.userId },
    select: KegiatanSelect,
  });

  return { message: "Kegiatan berhasil diaktifkan", data: updated };
};

const setInactive = async (unitKerjaId, id, user) => {
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  checkUnitKerjaAccess(user, unitKerjaId);

  const idParams = validate(KegiatanIdSchema, { id });

  const existing = await prismaClient.businessProcess.findUnique({
    where: { id: idParams.id },
  });

  if (!existing) {
    throw new NotFoundError("Kegiatan tidak ditemukan.");
  }

  if (existing.unitKerjaId !== unitKerjaId) {
    throw new NotFoundError("Kegiatan tidak ditemukan.");
  }

  if (existing.status === PROCESS_BUSINESS_STATUSES.INACTIVE) {
    throw new BadRequestError("Kegiatan sudah dalam status tidak aktif.");
  }

  if (existing.status === PROCESS_BUSINESS_STATUSES.ARCHIVED) {
    throw new BadRequestError(
      "Tidak dapat menonaktifkan Kegiatan yang sudah diarsipkan.",
    );
  }

  const updated = await prismaClient.businessProcess.update({
    where: { id: idParams.id },
    data: {
      status: PROCESS_BUSINESS_STATUSES.INACTIVE,
      updatedBy: user.userId,
    },
    select: KegiatanSelect,
  });

  return { message: "Kegiatan berhasil dinonaktifkan", data: updated };
};

const archive = async (unitKerjaId, id, user) => {
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  checkUnitKerjaAccess(user, unitKerjaId);

  const idParams = validate(KegiatanIdSchema, { id });

  const existing = await prismaClient.businessProcess.findUnique({
    where: { id: idParams.id },
  });

  if (!existing) {
    throw new NotFoundError("Kegiatan tidak ditemukan.");
  }

  if (existing.unitKerjaId !== unitKerjaId) {
    throw new NotFoundError("Kegiatan tidak ditemukan.");
  }

  if (existing.status === PROCESS_BUSINESS_STATUSES.ARCHIVED) {
    throw new BadRequestError("Kegiatan sudah diarsipkan.");
  }

  if (existing.status === PROCESS_BUSINESS_STATUSES.ACTIVE) {
    throw new BadRequestError(
      "Tidak dapat mengarsipkan Kegiatan yang masih aktif. Nonaktifkan terlebih dahulu.",
    );
  }

  const archived = await prismaClient.businessProcess.update({
    where: { id: idParams.id },
    data: {
      status: PROCESS_BUSINESS_STATUSES.ARCHIVED,
      updatedBy: user.userId,
    },
    select: KegiatanSelect,
  });

  return { message: "Kegiatan berhasil diarsipkan", data: archived };
};

export default { create, search, update, setActive, setInactive, archive };


