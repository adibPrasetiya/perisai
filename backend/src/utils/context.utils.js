import { prismaClient } from "../core/lib/database.lib.js";
import { NotFoundError } from "../error/not-found.error.js";

export const verifyContextExists = async (id) => {
  const context = await prismaClient.riskContext.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      frameworkId: true,
      matrixRows: true,
      matrixCols: true,
      status: true,
    },
  });
  if (!context) throw new NotFoundError("Konteks risiko tidak ditemukan.");
  return context;
};

export const verifyFrameworkExists = async (frameworkId) => {
  const fw = await prismaClient.framework.findUnique({
    where: { id: frameworkId },
    select: { id: true, name: true, isActive: true },
  });
  if (!fw) throw new NotFoundError("Framework tidak ditemukan.");
  return fw;
};

export const verifyImpactAreaBelongsToContext = async (areaId, contextId) => {
  const area = await prismaClient.impactArea.findFirst({
    where: { id: areaId, contextId },
    select: { id: true, name: true },
  });
  if (!area) throw new NotFoundError("Area dampak tidak ditemukan dalam konteks ini.");
  return area;
};
