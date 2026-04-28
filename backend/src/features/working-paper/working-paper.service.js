import { validate } from "../../utils/validator.utils.js";
import {
  createWorkingPaperSchema,
  searchWorkingPaperSchema,
  workingPaperIdSchema,
  updateWorkingPaperSchema,
} from "./working-paper.validation.js";
import { prismaClient } from "../../core/lib/database.lib.js";
import { NotFoundError } from "../../error/not-found.error.js";
import { ConflictError } from "../../error/conflict.error.js";
import { BadRequestError } from "../../error/bad-request.error.js";
import { ROLES, RISK_PROGRAM_STATUSES } from "../../core/config/enum.config.js";

const workingPaperSelect = {
  id: true,
  programId: true,
  unitKerjaId: true,
  title: true,
  status: true,
  createdBy: true,
  updatedBy: true,
  createdAt: true,
  updatedAt: true,
};

const create = async (reqBody, user) => {
  reqBody = validate(createWorkingPaperSchema, reqBody);

  if (!user.unitKerjaId) {
    throw new BadRequestError(
      "Profil pengguna tidak memiliki unit kerja yang terkait.",
    );
  }

  const program = await prismaClient.riskProgram.findUnique({
    where: { id: reqBody.programId },
    select: { id: true, name: true, year: true, status: true },
  });

  if (!program) {
    throw new NotFoundError("Program risiko tidak ditemukan.");
  }

  if (program.status !== RISK_PROGRAM_STATUSES.ACTIVE) {
    throw new BadRequestError(
      "Kertas kerja hanya dapat dibuat untuk program yang berstatus ACTIVE.",
    );
  }

  let paper;
  try {
    paper = await prismaClient.$transaction(async (tx) => {
      const existingForYear = await tx.workingPaper.findFirst({
        where: {
          unitKerjaId: user.unitKerjaId,
          program: { year: program.year },
        },
        select: { id: true },
      });

      if (existingForYear) {
        throw new ConflictError(
          `Unit kerja ini sudah memiliki kertas kerja untuk tahun ${program.year}.`,
        );
      }

      const resolvedTitle =
        reqBody.title && reqBody.title.trim()
          ? reqBody.title.trim()
          : `Kertas Kerja Manajemen Risiko - ${program.name} ${program.year}`;

      return await tx.workingPaper.create({
        data: {
          programId: reqBody.programId,
          unitKerjaId: user.unitKerjaId,
          title: resolvedTitle,
          status: "DRAFT",
          createdBy: user.id || null,
          updatedBy: user.id || null,
        },
        select: {
          ...workingPaperSelect,
          program: {
            select: { id: true, name: true, year: true, status: true },
          },
          unitKerja: {
            select: { id: true, name: true, code: true },
          },
        },
      });
    });
  } catch (error) {
    if (error.code === "P2002") {
      throw new ConflictError(
        "Kertas kerja untuk program dan unit kerja ini sudah ada.",
      );
    }
    throw error;
  }

  console.log("ACTION_TYPES.WORKING_PAPER_CREATED", { workingPaperId: paper.id });

  return {
    message: "Kertas kerja berhasil dibuat",
    data: paper,
  };
};

const search = async (queryParams, user) => {
  const params = validate(searchWorkingPaperSchema, queryParams);
  const { programId, year, status, page, limit } = params;

  const where = {};

  if (programId) {
    where.programId = programId;
  }

  if (year !== undefined) {
    where.program = { year };
  }

  if (status) {
    where.status = status;
  }

  const isRestrictedUser = !user.roles.some(
    (r) => r === ROLES.ADMINISTRATOR || r === ROLES.KOMITE_PUSAT,
  );

  if (isRestrictedUser) {
    where.unitKerjaId = user.unitKerjaId;
  }

  const skip = (page - 1) * limit;
  const totalItems = await prismaClient.workingPaper.count({ where });

  const papers = await prismaClient.workingPaper.findMany({
    where,
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      ...workingPaperSelect,
      program: {
        select: { id: true, name: true, year: true, status: true },
      },
      unitKerja: {
        select: { id: true, name: true, code: true },
      },
      _count: {
        select: { riskEntries: true },
      },
    },
  });

  const totalPages = Math.ceil(totalItems / limit);

  return {
    message: "Kertas kerja berhasil ditemukan",
    data: papers,
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

const getById = async (id, user) => {
  const { id: validId } = validate(workingPaperIdSchema, { id });

  const paper = await prismaClient.workingPaper.findUnique({
    where: { id: validId },
    select: {
      ...workingPaperSelect,
      program: {
        select: { id: true, name: true, year: true, status: true },
      },
      unitKerja: {
        select: { id: true, name: true, code: true },
      },
      _count: {
        select: { riskEntries: true },
      },
    },
  });

  if (!paper) {
    throw new NotFoundError("Kertas kerja tidak ditemukan.");
  }

  const isRestrictedUser = !user.roles.some(
    (r) => r === ROLES.ADMINISTRATOR || r === ROLES.KOMITE_PUSAT,
  );

  if (isRestrictedUser && paper.unitKerjaId !== user.unitKerjaId) {
    throw new NotFoundError("Kertas kerja tidak ditemukan.");
  }

  return {
    message: "Kertas kerja berhasil ditemukan",
    data: paper,
  };
};

const update = async (id, reqBody, user) => {
  const { id: validId } = validate(workingPaperIdSchema, { id });
  reqBody = validate(updateWorkingPaperSchema, reqBody);

  const paper = await prismaClient.workingPaper.findUnique({
    where: { id: validId },
    select: { id: true, unitKerjaId: true, status: true },
  });

  if (!paper) {
    throw new NotFoundError("Kertas kerja tidak ditemukan.");
  }

  if (paper.unitKerjaId !== user.unitKerjaId) {
    throw new NotFoundError("Kertas kerja tidak ditemukan.");
  }

  if (paper.status !== "DRAFT") {
    throw new BadRequestError(
      `Kertas kerja dengan status ${paper.status} tidak dapat diedit.`,
    );
  }

  const data = { updatedBy: user.id || null };

  if (reqBody.title !== undefined && reqBody.title !== null) {
    data.title = reqBody.title.trim() || paper.title;
  }

  const updated = await prismaClient.workingPaper.update({
    where: { id: validId },
    data,
    select: {
      ...workingPaperSelect,
      program: {
        select: { id: true, name: true, year: true, status: true },
      },
      unitKerja: {
        select: { id: true, name: true, code: true },
      },
    },
  });

  return {
    message: "Kertas kerja berhasil diperbarui",
    data: updated,
  };
};

const getStats = async (workingPaperId, user) => {
  const { id: validId } = validate(workingPaperIdSchema, { id: workingPaperId });

  const paper = await prismaClient.workingPaper.findUnique({
    where: { id: validId },
    select: { id: true, unitKerjaId: true },
  });

  if (!paper) throw new NotFoundError("Kertas kerja tidak ditemukan.");

  const isRestrictedUser = !user.roles.some(
    (r) => r === ROLES.ADMINISTRATOR || r === ROLES.KOMITE_PUSAT,
  );

  if (isRestrictedUser && paper.unitKerjaId !== user.unitKerjaId) {
    throw new NotFoundError("Kertas kerja tidak ditemukan.");
  }

  const entries = await prismaClient.riskEntry.findMany({
    where: { workingPaperId: validId },
    select: {
      id: true,
      name: true,
      riskCategory: { select: { name: true, color: true } },
      inherentAssessment: {
        select: {
          finalScore: true,
          riskLevel: { select: { name: true, color: true } },
        },
      },
      residualAssessment: {
        select: {
          finalScore: true,
          riskLevel: { select: { name: true, color: true } },
        },
      },
      controls: { select: { effectiveness: true } },
      treatmentPlans: { select: { status: true, targetDate: true } },
    },
  });

  const total = entries.length;
  const withInherent = entries.filter((e) => e.inherentAssessment).length;
  const withResidual = entries.filter((e) => e.residualAssessment).length;
  const notAssessed = total - withInherent;

  // Inherent level distribution
  const inherentLevelMap = new Map();
  for (const e of entries) {
    const key = e.inherentAssessment?.riskLevel?.name ?? "__none__";
    const color = e.inherentAssessment?.riskLevel?.color ?? "#555555";
    if (!inherentLevelMap.has(key)) inherentLevelMap.set(key, { name: key === "__none__" ? "Belum dinilai" : key, color, count: 0 });
    inherentLevelMap.get(key).count++;
  }
  const inherentLevels = [...inherentLevelMap.values()];

  // Residual level distribution
  const residualLevelMap = new Map();
  for (const e of entries) {
    const key = e.residualAssessment?.riskLevel?.name ?? "__none__";
    const color = e.residualAssessment?.riskLevel?.color ?? "#555555";
    if (!residualLevelMap.has(key)) residualLevelMap.set(key, { name: key === "__none__" ? "Belum dinilai" : key, color, count: 0 });
    residualLevelMap.get(key).count++;
  }
  const residualLevels = [...residualLevelMap.values()];

  // Treatment plan status distribution
  const now = new Date();
  const DONE_STATUSES = ["COMPLETED", "CANCELLED", "VERIFIED"];
  let overduePlans = 0;
  const treatmentStatusMap = new Map();
  for (const e of entries) {
    for (const p of e.treatmentPlans) {
      if (!treatmentStatusMap.has(p.status)) treatmentStatusMap.set(p.status, { status: p.status, count: 0 });
      treatmentStatusMap.get(p.status).count++;
      if (p.targetDate && new Date(p.targetDate) < now && !DONE_STATUSES.includes(p.status)) {
        overduePlans++;
      }
    }
  }
  const treatmentStatuses = [...treatmentStatusMap.values()];

  // Total plans and completed count
  const totalPlans = entries.reduce((s, e) => s + e.treatmentPlans.length, 0);
  const completedPlans = entries.reduce(
    (s, e) => s + e.treatmentPlans.filter((p) => p.status === "COMPLETED" || p.status === "VERIFIED").length,
    0,
  );

  // Control effectiveness distribution
  const controlEffMap = new Map();
  for (const e of entries) {
    for (const c of e.controls) {
      if (!controlEffMap.has(c.effectiveness)) controlEffMap.set(c.effectiveness, { effectiveness: c.effectiveness, count: 0 });
      controlEffMap.get(c.effectiveness).count++;
    }
  }
  const controlEffectiveness = [...controlEffMap.values()];

  // Category distribution
  const categoryMap = new Map();
  for (const e of entries) {
    const key = e.riskCategory?.name ?? "__none__";
    const color = e.riskCategory?.color ?? "#888888";
    if (!categoryMap.has(key)) categoryMap.set(key, { name: key === "__none__" ? "Tanpa Kategori" : key, color, count: 0 });
    categoryMap.get(key).count++;
  }
  const categoryDistribution = [...categoryMap.values()].sort((a, b) => b.count - a.count);

  // Top 5 by inherent final score
  const top5ByInherent = entries
    .filter((e) => e.inherentAssessment?.finalScore != null)
    .sort((a, b) => b.inherentAssessment.finalScore - a.inherentAssessment.finalScore)
    .slice(0, 5)
    .map((e) => ({
      name: e.name,
      finalScore: e.inherentAssessment.finalScore,
      riskLevelName: e.inherentAssessment.riskLevel?.name ?? null,
      riskLevelColor: e.inherentAssessment.riskLevel?.color ?? "#888888",
    }));

  // Top 5 by residual final score
  const top5ByResidual = entries
    .filter((e) => e.residualAssessment?.finalScore != null)
    .sort((a, b) => b.residualAssessment.finalScore - a.residualAssessment.finalScore)
    .slice(0, 5)
    .map((e) => ({
      name: e.name,
      finalScore: e.residualAssessment.finalScore,
      riskLevelName: e.residualAssessment.riskLevel?.name ?? null,
      riskLevelColor: e.residualAssessment.riskLevel?.color ?? "#888888",
    }));

  return {
    message: "Statistik kertas kerja berhasil ditemukan",
    data: {
      summary: { total, withInherent, withResidual, notAssessed, overduePlans },
      inherentLevels,
      residualLevels,
      treatmentStatuses,
      controlEffectiveness,
      categoryDistribution,
      top5ByInherent,
      top5ByResidual,
    },
  };
};

const getReportData = async (workingPaperId, user) => {
  const { id: validId } = validate(workingPaperIdSchema, { id: workingPaperId });

  const paper = await prismaClient.workingPaper.findUnique({
    where: { id: validId },
    select: {
      ...workingPaperSelect,
      program: { select: { id: true, name: true, year: true, status: true } },
      unitKerja: { select: { id: true, name: true, code: true } },
      _count: { select: { riskEntries: true } },
    },
  });

  if (!paper) throw new NotFoundError("Kertas kerja tidak ditemukan.");

  const isRestrictedUser = !user.roles.some(
    (r) => r === ROLES.ADMINISTRATOR || r === ROLES.KOMITE_PUSAT,
  );

  if (isRestrictedUser && paper.unitKerjaId !== user.unitKerjaId) {
    throw new NotFoundError("Kertas kerja tidak ditemukan.");
  }

  const entries = await prismaClient.riskEntry.findMany({
    where: { workingPaperId: validId },
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      order: true,
      asset: { select: { id: true, name: true, code: true } },
      businessProcess: { select: { id: true, name: true, code: true } },
      riskCategory: { select: { id: true, name: true, code: true, color: true } },
      programFrameworkContext: {
        select: {
          riskContext: {
            select: {
              id: true, name: true, code: true, contextType: true,
              description: true,
              riskAppetiteLevel: true,
              riskAppetiteDescription: true,
              matrixRows: true, matrixCols: true,
              periodStart: true, periodEnd: true,
              likelihoodCriteria: {
                select: { level: true, name: true, description: true, score: true, impactAreaId: true },
                orderBy: [{ impactAreaId: "asc" }, { level: "asc" }],
              },
              impactAreas: {
                select: {
                  id: true, name: true, order: true,
                  impactCriteria: {
                    select: { level: true, name: true, description: true, score: true },
                    orderBy: { level: "asc" },
                  },
                },
                orderBy: { order: "asc" },
              },
              matrixCells: {
                select: { row: true, col: true, value: true, label: true, color: true },
                orderBy: [{ row: "asc" }, { col: "asc" }],
              },
              riskLevels: {
                select: { name: true, description: true, color: true, minScore: true, maxScore: true, order: true },
                orderBy: { order: "asc" },
              },
              riskCategories: {
                select: { name: true, description: true, color: true, code: true },
                orderBy: { order: "asc" },
              },
            },
          },
          programFramework: {
            select: { framework: { select: { id: true, name: true, code: true } } },
          },
        },
      },
      inherentAssessment: {
        select: {
          finalScore: true,
          riskLevel: { select: { name: true, color: true } },
          areaScores: {
            select: {
              impactArea: { select: { id: true, name: true } },
              likelihoodLevel: true,
              likelihoodDescription: true,
              impactLevel: true,
              impactDescription: true,
              score: true,
            },
            orderBy: { impactArea: { order: "asc" } },
          },
        },
      },
      residualAssessment: {
        select: {
          finalScore: true,
          riskLevel: { select: { name: true, color: true } },
          areaScores: {
            select: {
              impactArea: { select: { id: true, name: true } },
              likelihoodLevel: true,
              likelihoodDescription: true,
              impactLevel: true,
              impactDescription: true,
              score: true,
            },
            orderBy: { impactArea: { order: "asc" } },
          },
        },
      },
      controls: {
        select: { name: true, effectiveness: true },
        orderBy: { order: "asc" },
      },
      treatmentPlans: {
        select: {
          impactArea: { select: { id: true, name: true } },
          treatmentOption: { select: { id: true, name: true } },
          description: true,
          targetDate: true,
          picUserId: true,
          status: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: [
      { asset: { name: "asc" } },
      { businessProcess: { name: "asc" } },
      { order: "asc" },
    ],
  });

  // Resolve PIC names
  const picUserIds = [
    ...new Set(
      entries
        .flatMap((e) => e.treatmentPlans)
        .map((p) => p.picUserId)
        .filter(Boolean),
    ),
  ];

  const picUsers = new Map();
  if (picUserIds.length > 0) {
    const users = await prismaClient.user.findMany({
      where: { id: { in: picUserIds } },
      select: { id: true, name: true },
    });
    for (const u of users) picUsers.set(u.id, u.name);
  }

  return { paper, entries, picUsers };
};

export default { create, search, getById, update, getStats, getReportData };
