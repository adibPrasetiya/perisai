import { validate } from "../../utils/validator.utils.js";
import { addContextSchema } from "./program-framework-context.validation.js";
import { prismaClient } from "../../core/lib/database.lib.js";
import { NotFoundError } from "../../error/not-found.error.js";
import { ConflictError } from "../../error/conflict.error.js";
import { BadRequestError } from "../../error/bad-request.error.js";

const add = async (programFrameworkId, reqBody, userId) => {
  const pf = await prismaClient.programFramework.findUnique({
    where: { id: programFrameworkId },
    select: { id: true, frameworkId: true },
  });
  if (!pf) throw new NotFoundError("Program framework tidak ditemukan.");

  const body = validate(addContextSchema, reqBody);

  const context = await prismaClient.riskContext.findUnique({
    where: { id: body.riskContextId },
    select: { id: true, name: true, frameworkId: true, status: true },
  });
  if (!context) throw new BadRequestError("Konteks risiko tidak ditemukan.");
  if (context.frameworkId !== pf.frameworkId) {
    throw new BadRequestError("Konteks ini tidak berasal dari framework yang sama dengan program ini.");
  }

  const existing = await prismaClient.programFrameworkContext.findUnique({
    where: {
      programFrameworkId_riskContextId: { programFrameworkId, riskContextId: body.riskContextId },
    },
  });
  if (existing) throw new ConflictError(`Konteks "${context.name}" sudah ditambahkan ke program framework ini.`);

  const link = await prismaClient.programFrameworkContext.create({
    data: { programFrameworkId, riskContextId: body.riskContextId, addedBy: userId || null },
    select: { id: true, programFrameworkId: true, riskContextId: true, addedAt: true },
  });

  return { message: "Konteks berhasil ditambahkan ke program", data: link };
};

const remove = async (programFrameworkId, riskContextId) => {
  const link = await prismaClient.programFrameworkContext.findUnique({
    where: {
      programFrameworkId_riskContextId: { programFrameworkId, riskContextId },
    },
  });
  if (!link) throw new NotFoundError("Konteks tidak ditemukan dalam program framework ini.");
  await prismaClient.programFrameworkContext.delete({ where: { id: link.id } });
  return { message: "Konteks berhasil dihapus dari program" };
};

const list = async (programFrameworkId) => {
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
      addedBy: true,
      riskContext: {
        select: {
          id: true,
          name: true,
          code: true,
          frameworkId: true,
          contextType: true,
          periodStart: true,
          periodEnd: true,
          matrixRows: true,
          matrixCols: true,
          status: true,
          riskAppetiteLevel: true,
          riskAppetiteDescription: true,
          _count: {
            select: {
              riskCategories: true,
              impactAreas: true,
              likelihoodCriteria: true,
              treatmentOptions: true,
            },
          },
        },
      },
    },
    orderBy: { addedAt: "asc" },
  });

  return {
    message: "Daftar konteks dalam program berhasil ditemukan",
    data: links.map((l) => ({ ...l.riskContext, _linkId: l.id, addedAt: l.addedAt })),
  };
};

export default { add, remove, list };
