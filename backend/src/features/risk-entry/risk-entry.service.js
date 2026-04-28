import { validate } from "../../utils/validator.utils.js";
import {
  createRiskEntrySchema,
  updateRiskEntrySchema,
  entryIdSchema,
  workingPaperIdSchema,
  planIdSchema,
  createInherentAssessmentSchema,
  createTreatmentPlansSchema,
  createResidualAssessmentSchema,
  completeTreatmentPlanSchema,
} from "./risk-entry.validation.js";
import { prismaClient } from "../../core/lib/database.lib.js";
import { NotFoundError } from "../../error/not-found.error.js";
import { ConflictError } from "../../error/conflict.error.js";
import { BadRequestError } from "../../error/bad-request.error.js";
import {
  ROLES,
  WORKING_PAPER_STATUSES,
  CONTEXT_TYPES,
  TREATMENT_STATUSES,
  CONTROL_EFFECTIVENESS,
} from "../../core/config/enum.config.js";

const EDITABLE_STATUSES = [
  WORKING_PAPER_STATUSES.DRAFT,
  WORKING_PAPER_STATUSES.REVISION,
];

const riskEntrySelect = {
  id: true,
  workingPaperId: true,
  programFrameworkContextId: true,
  assetId: true,
  businessProcessId: true,
  code: true,
  name: true,
  description: true,
  riskCategoryId: true,
  order: true,
  createdAt: true,
  updatedAt: true,
};

const riskEntryDetailSelect = {
  ...riskEntrySelect,
  workingPaper: {
    select: {
      id: true,
      title: true,
      status: true,
      unitKerjaId: true,
      programId: true,
    },
  },
  programFrameworkContext: {
    select: {
      id: true,
      riskContext: {
        select: { id: true, name: true, code: true, contextType: true },
      },
      programFramework: {
        select: {
          id: true,
          programId: true,
          framework: { select: { id: true, name: true, code: true } },
        },
      },
    },
  },
  asset: {
    select: { id: true, name: true, code: true },
  },
  businessProcess: {
    select: { id: true, name: true, code: true },
  },
  riskCategory: {
    select: { id: true, name: true, code: true, color: true },
  },
  inherentAssessment: {
    select: {
      id: true,
      type: true,
      finalScore: true,
      notes: true,
      assessedAt: true,
      riskLevelId: true,
      riskLevel: { select: { id: true, name: true, color: true } },
      areaScores: {
        select: {
          id: true,
          impactAreaId: true,
          impactArea: { select: { id: true, name: true } },
          likelihoodLevel: true,
          impactLevel: true,
          likelihoodDescription: true,
          impactDescription: true,
          score: true,
          matrixCellId: true,
        },
      },
    },
  },
  controls: {
    select: {
      id: true,
      name: true,
      description: true,
      effectiveness: true,
      order: true,
    },
    orderBy: { order: "asc" },
  },
  treatmentPlans: {
    select: {
      id: true,
      impactAreaId: true,
      impactArea: { select: { id: true, name: true } },
      treatmentOptionId: true,
      treatmentOption: { select: { id: true, name: true } },
      description: true,
      targetDate: true,
      picUserId: true,
      status: true,
      needsKomiteReview: true,
      completedAt: true,
    },
    orderBy: { createdAt: "asc" },
  },
  _count: { select: { controls: true, treatmentPlans: true } },
};

// ─── Private Helpers ──────────────────────────────────────────────────────────

const _fetchAndGuardPaper = async (workingPaperId, user) => {
  const { id: validId } = validate(workingPaperIdSchema, { id: workingPaperId });

  const paper = await prismaClient.workingPaper.findUnique({
    where: { id: validId },
    select: { id: true, unitKerjaId: true, programId: true, status: true },
  });

  if (!paper) throw new NotFoundError("Kertas kerja tidak ditemukan.");

  if (paper.unitKerjaId !== user.unitKerjaId) {
    throw new NotFoundError("Kertas kerja tidak ditemukan.");
  }

  if (!EDITABLE_STATUSES.includes(paper.status)) {
    throw new BadRequestError(
      `Kertas kerja berstatus "${paper.status}" tidak dapat diedit. Hanya status DRAFT atau REVISION yang dapat diedit.`,
    );
  }

  return { validId, paper };
};

const _resolveOrCreatePfc = async (programFrameworkId, riskContextId, programId, userId) => {
  // Validate the program framework belongs to the working paper's program
  const pf = await prismaClient.programFramework.findFirst({
    where: { id: programFrameworkId, programId },
    select: { id: true, frameworkId: true },
  });
  if (!pf) {
    throw new BadRequestError(
      "Program framework tidak ditemukan atau tidak berasal dari program yang sama dengan kertas kerja.",
    );
  }

  // Validate the risk context belongs to the framework and is active
  const riskContext = await prismaClient.riskContext.findFirst({
    where: { id: riskContextId, frameworkId: pf.frameworkId, status: "ACTIVE" },
    select: { id: true },
  });
  if (!riskContext) {
    throw new BadRequestError(
      "Konteks risiko tidak ditemukan, tidak aktif, atau tidak berasal dari framework yang sama.",
    );
  }

  // Find or create the ProgramFrameworkContext link
  const pfc = await prismaClient.programFrameworkContext.upsert({
    where: {
      programFrameworkId_riskContextId: { programFrameworkId, riskContextId },
    },
    create: { programFrameworkId, riskContextId, addedBy: userId || null },
    update: {},
    select: { id: true },
  });

  return { pfcId: pfc.id, riskContextId };
};

const _validateRiskCategory = async (riskCategoryId, riskContextId) => {
  if (!riskCategoryId) return;

  const category = await prismaClient.riskCategory.findFirst({
    where: { id: riskCategoryId, contextId: riskContextId },
    select: { id: true },
  });

  if (!category) {
    throw new BadRequestError(
      "Kategori risiko tidak ditemukan dalam konteks yang dipilih.",
    );
  }
};

// ─── create (atomic) ──────────────────────────────────────────────────────────

const create = async (workingPaperId, reqBody, user) => {
  reqBody = validate(createRiskEntrySchema, reqBody);

  const { validId, paper } = await _fetchAndGuardPaper(workingPaperId, user);

  const { pfcId, riskContextId } = await _resolveOrCreatePfc(
    reqBody.programFrameworkId,
    reqBody.riskContextId,
    paper.programId,
    user.id,
  );

  // ── Load full context for validation & score calculation ─────────────────
  const context = await prismaClient.riskContext.findUnique({
    where: { id: riskContextId },
    select: {
      id: true,
      contextType: true,
      matrixRows: true,
      matrixCols: true,
      impactAreas: {
        select: {
          id: true,
          name: true,
        },
      },
      matrixCells: {
        select: { id: true, row: true, col: true, value: true },
      },
      riskLevels: {
        select: { id: true, name: true, minScore: true, maxScore: true, order: true },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!context) {
    throw new BadRequestError("Konteks risiko tidak ditemukan.");
  }

  // ── Validate asset or business process ───────────────────────────────────
  if (reqBody.assetId) {
    if (context.contextType !== CONTEXT_TYPES.ASSET) {
      throw new BadRequestError(
        "Konteks ini bertipe Proses Bisnis, bukan Aset.",
      );
    }
    const asset = await prismaClient.asset.findFirst({
      where: { id: reqBody.assetId, unitKerjaId: paper.unitKerjaId, status: "ACTIVE" },
      select: { id: true },
    });
    if (!asset) {
      throw new BadRequestError(
        "Aset tidak ditemukan atau tidak aktif.",
      );
    }
  }

  if (reqBody.businessProcessId) {
    if (context.contextType !== CONTEXT_TYPES.PROCESS) {
      throw new BadRequestError(
        "Konteks ini bertipe Aset, bukan Proses Bisnis.",
      );
    }
    const process = await prismaClient.businessProcess.findFirst({
      where: { id: reqBody.businessProcessId, unitKerjaId: paper.unitKerjaId, status: "ACTIVE" },
      select: { id: true },
    });
    if (!process) {
      throw new BadRequestError(
        "Proses bisnis tidak ditemukan atau tidak aktif.",
      );
    }
  }

  await _validateRiskCategory(reqBody.riskCategoryId, riskContextId);

  // ── Auto-generate code ────────────────────────────────────────────────────
  const entryCount = await prismaClient.riskEntry.count({
    where: { workingPaperId: validId },
  });
  let seq = entryCount + 1;
  let entryCode = `R-${String(seq).padStart(3, "0")}`;
  while (true) {
    const taken = await prismaClient.riskEntry.findFirst({
      where: { workingPaperId: validId, code: entryCode },
      select: { id: true },
    });
    if (!taken) break;
    seq++;
    entryCode = `R-${String(seq).padStart(3, "0")}`;
  }

  // ── Auto-order ────────────────────────────────────────────────────────────
  let order = reqBody.order;
  if (order === undefined || order === null) {
    const maxEntry = await prismaClient.riskEntry.findFirst({
      where: { workingPaperId: validId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    order = maxEntry ? maxEntry.order + 1 : 1;
  }

  // ── Calculate area scores from matrix (only if assessment provided) ──────
  let areaScoreData = [];
  let finalScore = 0;
  let riskLevel = null;

  if (reqBody.assessment) {
    const impactAreaIds = new Set(context.impactAreas.map((a) => a.id));

    for (const score of reqBody.assessment.areaScores) {
      if (!impactAreaIds.has(score.impactAreaId)) {
        throw new BadRequestError(
          `Area dampak dengan ID ${score.impactAreaId} tidak ditemukan dalam konteks ini.`,
        );
      }

      if (score.likelihoodLevel < 1 || score.likelihoodLevel > context.matrixRows) {
        throw new BadRequestError(
          `Level kemungkinan harus antara 1 dan ${context.matrixRows}.`,
        );
      }

      if (score.impactLevel < 1 || score.impactLevel > context.matrixCols) {
        throw new BadRequestError(
          `Level dampak harus antara 1 dan ${context.matrixCols}.`,
        );
      }

      const cell = context.matrixCells.find(
        (c) => c.row === score.likelihoodLevel && c.col === score.impactLevel,
      );
      const cellScore = cell ? cell.value : score.likelihoodLevel * score.impactLevel;

      areaScoreData.push({
        impactAreaId: score.impactAreaId,
        likelihoodLevel: score.likelihoodLevel,
        impactLevel: score.impactLevel,
        likelihoodDescription: score.likelihoodDescription || null,
        impactDescription: score.impactDescription || null,
        matrixCellId: cell ? cell.id : null,
        score: cellScore,
      });
    }

    finalScore = Math.max(...areaScoreData.map((s) => s.score));
    riskLevel = context.riskLevels.find(
      (rl) => finalScore >= rl.minScore && finalScore <= rl.maxScore,
    );
  }

  // ── Atomic transaction ────────────────────────────────────────────────────
  const createdEntry = await prismaClient.$transaction(async (tx) => {
    const newEntry = await tx.riskEntry.create({
      data: {
        workingPaperId: validId,
        programFrameworkContextId: pfcId,
        assetId: reqBody.assetId || null,
        businessProcessId: reqBody.businessProcessId || null,
        code: entryCode,
        name: reqBody.name,
        description: reqBody.description || null,
        riskCategoryId: reqBody.riskCategoryId || null,
        order,
      },
      select: { id: true },
    });

    // Create controls
    if (reqBody.controls.length > 0) {
      await tx.riskControl.createMany({
        data: reqBody.controls.map((ctrl, i) => ({
          riskEntryId: newEntry.id,
          name: ctrl.name,
          description: ctrl.description || null,
          effectiveness: ctrl.effectiveness,
          order: ctrl.order ?? i,
        })),
      });
    }

    // Create inherent assessment + area scores (only if assessment provided)
    if (reqBody.assessment) {
      await tx.riskAssessment.create({
        data: {
          inherentEntryId: newEntry.id,
          type: "INHERENT",
          finalScore,
          riskLevelId: riskLevel ? riskLevel.id : null,
          notes: reqBody.assessment.notes || null,
          assessedAt: new Date(),
          assessedBy: user.id || null,
          areaScores: {
            create: areaScoreData,
          },
        },
        select: { id: true },
      });

      // Create treatment plans (one per assessed impact area)
      if (reqBody.treatmentPlans.length > 0) {
        await tx.riskTreatmentPlan.createMany({
          data: reqBody.treatmentPlans.map((plan) => ({
            riskEntryId: newEntry.id,
            impactAreaId: plan.impactAreaId || null,
            treatmentOptionId: plan.treatmentOptionId || null,
            description: plan.description || null,
            targetDate: plan.targetDate ? new Date(plan.targetDate) : null,
            picUserId: plan.picUserId || null,
            needsKomiteReview: plan.needsKomiteReview ?? false,
            status: "PLANNED",
          })),
        });
      }
    }

    return newEntry;
  });

  // Return full entry detail
  const fullEntry = await prismaClient.riskEntry.findUnique({
    where: { id: createdEntry.id },
    select: riskEntryDetailSelect,
  });

  console.log("ACTION_TYPES.RISK_ENTRY_CREATED", {
    entryId: createdEntry.id,
    workingPaperId: validId,
  });

  return {
    message: "Entri risiko berhasil dibuat",
    data: fullEntry,
  };
};

// ─── listByWorkingPaper ───────────────────────────────────────────────────────

const listByWorkingPaper = async (workingPaperId, user, pagination = { page: 1, limit: 10 }) => {
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

  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const [entries, total] = await Promise.all([
    prismaClient.riskEntry.findMany({
      where: { workingPaperId: validId },
      skip,
      take: limit,
      select: {
      ...riskEntrySelect,
      asset: { select: { id: true, name: true, code: true } },
      businessProcess: { select: { id: true, name: true, code: true } },
      riskCategory: {
        select: { id: true, name: true, code: true, color: true },
      },
      programFrameworkContext: {
        select: {
          id: true,
          riskContext: { select: { id: true, name: true, code: true, contextType: true } },
          programFramework: {
            select: {
              framework: { select: { id: true, name: true, code: true } },
            },
          },
        },
      },
      inherentAssessment: {
        select: {
          id: true,
          finalScore: true,
          riskLevelId: true,
          riskLevel: { select: { id: true, name: true, color: true } },
          areaScores: {
            select: {
              id: true,
              impactAreaId: true,
              impactArea: { select: { id: true, name: true } },
              likelihoodLevel: true,
              impactLevel: true,
              score: true,
            },
            orderBy: { impactArea: { order: 'asc' } },
          },
        },
      },
      residualAssessment: {
        select: {
          id: true,
          finalScore: true,
          riskLevelId: true,
          riskLevel: { select: { id: true, name: true, color: true } },
          areaScores: {
            select: {
              id: true,
              impactAreaId: true,
              impactArea: { select: { id: true, name: true } },
              likelihoodLevel: true,
              impactLevel: true,
              score: true,
            },
            orderBy: { impactArea: { order: 'asc' } },
          },
        },
      },
      controls: {
        select: { id: true, name: true, effectiveness: true },
        orderBy: { order: "asc" },
      },
      treatmentPlans: {
        select: {
          id: true,
          treatmentOptionId: true,
          treatmentOption: { select: { id: true, name: true } },
          status: true,
          impactAreaId: true,
          impactArea: { select: { id: true, name: true } },
          description: true,
          targetDate: true,
          picUserId: true,
        },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { controls: true, treatmentPlans: true } },
    },
    orderBy: [
      { asset: { name: "asc" } },
      { businessProcess: { name: "asc" } },
      { order: "asc" },
    ],
  }),
    prismaClient.riskEntry.count({ where: { workingPaperId: validId } }),
  ]);

  return {
    message: "Daftar entri risiko berhasil ditemukan",
    data: entries,
    meta: {
      page,
      limit,
      total,
      hasMore: page * limit < total,
    },
  };
};

// ─── getById ──────────────────────────────────────────────────────────────────

const getById = async (entryId, user) => {
  const { id: validId } = validate(entryIdSchema, { id: entryId });

  const entry = await prismaClient.riskEntry.findUnique({
    where: { id: validId },
    select: riskEntryDetailSelect,
  });

  if (!entry) throw new NotFoundError("Entri risiko tidak ditemukan.");

  const isRestrictedUser = !user.roles.some(
    (r) => r === ROLES.ADMINISTRATOR || r === ROLES.KOMITE_PUSAT,
  );

  if (isRestrictedUser && entry.workingPaper.unitKerjaId !== user.unitKerjaId) {
    throw new NotFoundError("Entri risiko tidak ditemukan.");
  }

  return {
    message: "Entri risiko berhasil ditemukan",
    data: entry,
  };
};

// ─── update (basic fields only) ───────────────────────────────────────────────

const update = async (entryId, reqBody, user) => {
  const { id: validId } = validate(entryIdSchema, { id: entryId });
  reqBody = validate(updateRiskEntrySchema, reqBody);

  const existing = await prismaClient.riskEntry.findUnique({
    where: { id: validId },
    select: {
      id: true,
      workingPaperId: true,
      code: true,
      workingPaper: {
        select: { id: true, unitKerjaId: true, programId: true, status: true },
      },
    },
  });

  if (!existing) throw new NotFoundError("Entri risiko tidak ditemukan.");

  if (existing.workingPaper.unitKerjaId !== user.unitKerjaId) {
    throw new NotFoundError("Entri risiko tidak ditemukan.");
  }

  if (!EDITABLE_STATUSES.includes(existing.workingPaper.status)) {
    throw new BadRequestError(
      `Kertas kerja berstatus "${existing.workingPaper.status}" tidak dapat diedit.`,
    );
  }

  if (reqBody.code && reqBody.code !== existing.code) {
    const conflict = await prismaClient.riskEntry.findFirst({
      where: {
        workingPaperId: existing.workingPaperId,
        code: reqBody.code,
        id: { not: validId },
      },
      select: { id: true },
    });

    if (conflict) {
      throw new ConflictError(
        "Kode entri risiko sudah digunakan dalam kertas kerja ini.",
      );
    }
  }

  const data = {};
  if (reqBody.code !== undefined) data.code = reqBody.code;
  if (reqBody.name !== undefined) data.name = reqBody.name;
  if ("description" in reqBody) data.description = reqBody.description || null;
  if ("riskCategoryId" in reqBody) data.riskCategoryId = reqBody.riskCategoryId || null;
  if (reqBody.order !== undefined) data.order = reqBody.order;

  const updated = await prismaClient.riskEntry.update({
    where: { id: validId },
    data,
    select: riskEntrySelect,
  });

  return {
    message: "Entri risiko berhasil diperbarui",
    data: updated,
  };
};

// ─── remove ───────────────────────────────────────────────────────────────────

const remove = async (entryId, user) => {
  const { id: validId } = validate(entryIdSchema, { id: entryId });

  const entry = await prismaClient.riskEntry.findUnique({
    where: { id: validId },
    select: {
      id: true,
      workingPaper: {
        select: { unitKerjaId: true, status: true },
      },
    },
  });

  if (!entry) throw new NotFoundError("Entri risiko tidak ditemukan.");

  if (entry.workingPaper.unitKerjaId !== user.unitKerjaId) {
    throw new NotFoundError("Entri risiko tidak ditemukan.");
  }

  if (!EDITABLE_STATUSES.includes(entry.workingPaper.status)) {
    throw new BadRequestError(
      `Kertas kerja berstatus "${entry.workingPaper.status}" tidak dapat diedit.`,
    );
  }

  await prismaClient.riskEntry.delete({ where: { id: validId } });

  console.log("ACTION_TYPES.RISK_ENTRY_DELETED", { entryId: validId });

  return {
    message: "Entri risiko berhasil dihapus",
  };
};

// ─── submitTreatmentPlan ──────────────────────────────────────────────────────

const submitTreatmentPlan = async (entryId, planId, user) => {
  const { id: validEntryId } = validate(entryIdSchema, { id: entryId });
  const { id: validPlanId } = validate(planIdSchema, { id: planId });

  const plan = await prismaClient.riskTreatmentPlan.findUnique({
    where: { id: validPlanId },
    select: {
      id: true,
      riskEntryId: true,
      status: true,
      needsKomiteReview: true,
      riskEntry: {
        select: {
          workingPaper: { select: { unitKerjaId: true, status: true } },
        },
      },
    },
  });

  if (!plan || plan.riskEntryId !== validEntryId) {
    throw new NotFoundError("Rencana penanganan tidak ditemukan.");
  }

  if (plan.riskEntry.workingPaper.unitKerjaId !== user.unitKerjaId) {
    throw new NotFoundError("Rencana penanganan tidak ditemukan.");
  }

  if (!plan.needsKomiteReview) {
    throw new BadRequestError(
      "Rencana penanganan ini tidak memerlukan review Komite Pusat.",
    );
  }

  if (plan.status !== TREATMENT_STATUSES.COMPLETED) {
    throw new BadRequestError(
      `Hanya rencana penanganan berstatus COMPLETED yang dapat diajukan. Status saat ini: ${plan.status}`,
    );
  }

  const updated = await prismaClient.riskTreatmentPlan.update({
    where: { id: validPlanId },
    data: { status: TREATMENT_STATUSES.SUBMITTED_FOR_REVIEW },
    select: {
      id: true,
      riskEntryId: true,
      status: true,
      needsKomiteReview: true,
      description: true,
      targetDate: true,
      completedAt: true,
    },
  });

  return {
    message: "Rencana penanganan berhasil diajukan ke Komite Pusat",
    data: updated,
  };
};

// ─── verifyTreatmentPlan ──────────────────────────────────────────────────────

const verifyTreatmentPlan = async (entryId, planId, user) => {
  const { id: validEntryId } = validate(entryIdSchema, { id: entryId });
  const { id: validPlanId } = validate(planIdSchema, { id: planId });

  const plan = await prismaClient.riskTreatmentPlan.findUnique({
    where: { id: validPlanId },
    select: {
      id: true,
      riskEntryId: true,
      status: true,
      needsKomiteReview: true,
      description: true,
      treatmentOption: { select: { id: true, name: true } },
    },
  });

  if (!plan || plan.riskEntryId !== validEntryId) {
    throw new NotFoundError("Rencana penanganan tidak ditemukan.");
  }

  const expectedStatus = plan.needsKomiteReview
    ? TREATMENT_STATUSES.SUBMITTED_FOR_REVIEW
    : TREATMENT_STATUSES.COMPLETED;

  if (plan.status !== expectedStatus) {
    throw new BadRequestError(
      `Rencana penanganan harus berstatus ${expectedStatus} untuk dapat diverifikasi. Status saat ini: ${plan.status}`,
    );
  }

  const controlName = plan.treatmentOption?.name || plan.description || "Kontrol Penanganan";
  const controlDescription = `Kontrol dari rencana penanganan: ${controlName}`;

  const result = await prismaClient.$transaction(async (tx) => {
    const updatedPlan = await tx.riskTreatmentPlan.update({
      where: { id: validPlanId },
      data: {
        status: TREATMENT_STATUSES.VERIFIED,
        completedAt: new Date(),
      },
      select: {
        id: true,
        riskEntryId: true,
        status: true,
        needsKomiteReview: true,
        description: true,
        completedAt: true,
      },
    });

    // Upsert RiskControl — find existing by name in same entry
    const existingControl = await tx.riskControl.findFirst({
      where: { riskEntryId: validEntryId, name: controlName },
      select: { id: true },
    });

    let autoCreatedControl;
    if (existingControl) {
      autoCreatedControl = await tx.riskControl.update({
        where: { id: existingControl.id },
        data: { effectiveness: CONTROL_EFFECTIVENESS.ADEQUATE },
        select: { id: true, name: true, effectiveness: true, order: true },
      });
    } else {
      const maxControl = await tx.riskControl.findFirst({
        where: { riskEntryId: validEntryId },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      const nextOrder = maxControl ? maxControl.order + 1 : 1;

      autoCreatedControl = await tx.riskControl.create({
        data: {
          riskEntryId: validEntryId,
          name: controlName,
          description: controlDescription,
          effectiveness: CONTROL_EFFECTIVENESS.ADEQUATE,
          order: nextOrder,
        },
        select: { id: true, name: true, effectiveness: true, order: true },
      });
    }

    return { treatmentPlan: updatedPlan, autoCreatedControl };
  });

  return {
    message: "Rencana penanganan berhasil diverifikasi dan kontrol risiko dibuat",
    data: result,
  };
};

// ─── createOrUpdateInherentAssessment ────────────────────────────────────────

const createOrUpdateInherentAssessment = async (entryId, reqBody, user) => {
  const { id: validId } = validate(entryIdSchema, { id: entryId });
  reqBody = validate(createInherentAssessmentSchema, reqBody);

  const entry = await prismaClient.riskEntry.findUnique({
    where: { id: validId },
    select: {
      id: true,
      workingPaper: {
        select: { unitKerjaId: true, status: true },
      },
      programFrameworkContext: {
        select: {
          riskContext: {
            select: {
              id: true,
              matrixRows: true,
              matrixCols: true,
              impactAreas: { select: { id: true, name: true } },
              matrixCells: { select: { id: true, row: true, col: true, value: true } },
              riskLevels: {
                select: { id: true, name: true, minScore: true, maxScore: true, order: true },
                orderBy: { order: "asc" },
              },
            },
          },
        },
      },
    },
  });

  if (!entry) throw new NotFoundError("Entri risiko tidak ditemukan.");

  if (entry.workingPaper.unitKerjaId !== user.unitKerjaId) {
    throw new NotFoundError("Entri risiko tidak ditemukan.");
  }

  if (!EDITABLE_STATUSES.includes(entry.workingPaper.status)) {
    throw new BadRequestError(
      `Kertas kerja berstatus "${entry.workingPaper.status}" tidak dapat diedit.`,
    );
  }

  const context = entry.programFrameworkContext.riskContext;
  const impactAreaIds = new Set(context.impactAreas.map((a) => a.id));
  const areaScoreData = [];

  for (const score of reqBody.areaScores) {
    if (!impactAreaIds.has(score.impactAreaId)) {
      throw new BadRequestError(
        `Area dampak dengan ID ${score.impactAreaId} tidak ditemukan dalam konteks ini.`,
      );
    }

    if (score.likelihoodLevel < 1 || score.likelihoodLevel > context.matrixRows) {
      throw new BadRequestError(
        `Level kemungkinan harus antara 1 dan ${context.matrixRows}.`,
      );
    }

    if (score.impactLevel < 1 || score.impactLevel > context.matrixCols) {
      throw new BadRequestError(
        `Level dampak harus antara 1 dan ${context.matrixCols}.`,
      );
    }

    const cell = context.matrixCells.find(
      (c) => c.row === score.likelihoodLevel && c.col === score.impactLevel,
    );
    const cellScore = cell ? cell.value : score.likelihoodLevel * score.impactLevel;

    areaScoreData.push({
      impactAreaId: score.impactAreaId,
      likelihoodLevel: score.likelihoodLevel,
      impactLevel: score.impactLevel,
      likelihoodDescription: score.likelihoodDescription || null,
      impactDescription: score.impactDescription || null,
      matrixCellId: cell ? cell.id : null,
      score: cellScore,
    });
  }

  const finalScore = Math.max(...areaScoreData.map((s) => s.score));
  const riskLevel = context.riskLevels.find(
    (rl) => finalScore >= rl.minScore && finalScore <= rl.maxScore,
  );

  const assessment = await prismaClient.$transaction(async (tx) => {
    // Delete existing inherent assessment if present (cascade deletes area scores)
    await tx.riskAssessment.deleteMany({
      where: { inherentEntryId: validId },
    });

    return tx.riskAssessment.create({
      data: {
        inherentEntryId: validId,
        type: "INHERENT",
        finalScore,
        riskLevelId: riskLevel ? riskLevel.id : null,
        notes: reqBody.notes || null,
        assessedAt: new Date(),
        assessedBy: user.id || null,
        areaScores: {
          create: areaScoreData,
        },
      },
      select: {
        id: true,
        type: true,
        finalScore: true,
        notes: true,
        assessedAt: true,
        riskLevelId: true,
        riskLevel: { select: { id: true, name: true, color: true } },
        areaScores: {
          select: {
            id: true,
            impactAreaId: true,
            impactArea: { select: { id: true, name: true } },
            likelihoodLevel: true,
            impactLevel: true,
            score: true,
          },
        },
      },
    });
  });

  return {
    message: "Penilaian risiko inheren berhasil disimpan",
    data: assessment,
  };
};

// ─── createOrUpdateResidualAssessment ────────────────────────────────────────

const createOrUpdateResidualAssessment = async (entryId, reqBody, user) => {
  const { id: validId } = validate(entryIdSchema, { id: entryId });
  reqBody = validate(createResidualAssessmentSchema, reqBody);

  const entry = await prismaClient.riskEntry.findUnique({
    where: { id: validId },
    select: {
      id: true,
      workingPaper: {
        select: { unitKerjaId: true, status: true },
      },
      programFrameworkContext: {
        select: {
          riskContext: {
            select: {
              id: true,
              matrixRows: true,
              matrixCols: true,
              impactAreas: { select: { id: true, name: true } },
              matrixCells: { select: { id: true, row: true, col: true, value: true } },
              riskLevels: {
                select: { id: true, name: true, minScore: true, maxScore: true, order: true },
                orderBy: { order: "asc" },
              },
            },
          },
        },
      },
      inherentAssessment: { select: { id: true } },
    },
  });

  if (!entry) throw new NotFoundError("Entri risiko tidak ditemukan.");

  if (entry.workingPaper.unitKerjaId !== user.unitKerjaId) {
    throw new NotFoundError("Entri risiko tidak ditemukan.");
  }

  if (!EDITABLE_STATUSES.includes(entry.workingPaper.status)) {
    throw new BadRequestError(
      `Kertas kerja berstatus "${entry.workingPaper.status}" tidak dapat diedit.`,
    );
  }

  if (!entry.inherentAssessment) {
    throw new BadRequestError(
      "Penilaian risiko inheren harus dilakukan terlebih dahulu sebelum melakukan penilaian residual.",
    );
  }

  const context = entry.programFrameworkContext.riskContext;
  const impactAreaIds = new Set(context.impactAreas.map((a) => a.id));
  const areaScoreData = [];

  for (const score of reqBody.areaScores) {
    if (!impactAreaIds.has(score.impactAreaId)) {
      throw new BadRequestError(
        `Area dampak dengan ID ${score.impactAreaId} tidak ditemukan dalam konteks ini.`,
      );
    }
    if (score.likelihoodLevel < 1 || score.likelihoodLevel > context.matrixRows) {
      throw new BadRequestError(`Level kemungkinan harus antara 1 dan ${context.matrixRows}.`);
    }
    if (score.impactLevel < 1 || score.impactLevel > context.matrixCols) {
      throw new BadRequestError(`Level dampak harus antara 1 dan ${context.matrixCols}.`);
    }
    const cell = context.matrixCells.find(
      (c) => c.row === score.likelihoodLevel && c.col === score.impactLevel,
    );
    const cellScore = cell ? cell.value : score.likelihoodLevel * score.impactLevel;
    areaScoreData.push({
      impactAreaId: score.impactAreaId,
      likelihoodLevel: score.likelihoodLevel,
      impactLevel: score.impactLevel,
      likelihoodDescription: score.likelihoodDescription || null,
      impactDescription: score.impactDescription || null,
      matrixCellId: cell ? cell.id : null,
      score: cellScore,
    });
  }

  const finalScore = Math.max(...areaScoreData.map((s) => s.score));
  const riskLevel = context.riskLevels.find(
    (rl) => finalScore >= rl.minScore && finalScore <= rl.maxScore,
  );

  const assessment = await prismaClient.$transaction(async (tx) => {
    // Delete existing residual assessment (cascade deletes area scores)
    await tx.riskAssessment.deleteMany({ where: { residualEntryId: validId } });

    // Mark all PLANNED treatment plans for this entry as COMPLETED
    await tx.riskTreatmentPlan.updateMany({
      where: { riskEntryId: validId, status: "PLANNED" },
      data: { status: "COMPLETED" },
    });

    return tx.riskAssessment.create({
      data: {
        residualEntryId: validId,
        type: "RESIDUAL",
        finalScore,
        riskLevelId: riskLevel ? riskLevel.id : null,
        notes: reqBody.notes || null,
        assessedAt: new Date(),
        assessedBy: user.id || null,
        areaScores: { create: areaScoreData },
      },
      select: {
        id: true,
        type: true,
        finalScore: true,
        notes: true,
        assessedAt: true,
        riskLevelId: true,
        riskLevel: { select: { id: true, name: true, color: true } },
        areaScores: {
          select: {
            id: true,
            impactAreaId: true,
            impactArea: { select: { id: true, name: true } },
            likelihoodLevel: true,
            impactLevel: true,
            score: true,
          },
        },
      },
    });
  });

  return {
    message: "Penilaian risiko residual berhasil disimpan",
    data: assessment,
  };
};

// ─── createOrUpdateTreatmentPlans ────────────────────────────────────────────

const createOrUpdateTreatmentPlans = async (entryId, reqBody, user) => {
  const { id: validId } = validate(entryIdSchema, { id: entryId });
  reqBody = validate(createTreatmentPlansSchema, reqBody);

  const entry = await prismaClient.riskEntry.findUnique({
    where: { id: validId },
    select: {
      id: true,
      workingPaper: {
        select: { unitKerjaId: true, status: true },
      },
      programFrameworkContext: {
        select: {
          riskContext: {
            select: {
              riskAppetiteLevel: true,
              matrixCells: { select: { id: true, row: true, col: true, value: true } },
              riskLevels: {
                select: { id: true, name: true, minScore: true, maxScore: true, order: true },
                orderBy: { order: "asc" },
              },
            },
          },
        },
      },
      inherentAssessment: {
        select: {
          id: true,
          areaScores: {
            select: {
              impactAreaId: true,
              likelihoodLevel: true,
              impactLevel: true,
              likelihoodDescription: true,
              impactDescription: true,
              matrixCellId: true,
              score: true,
            },
          },
        },
      },
    },
  });

  if (!entry) throw new NotFoundError("Entri risiko tidak ditemukan.");

  if (entry.workingPaper.unitKerjaId !== user.unitKerjaId) {
    throw new NotFoundError("Entri risiko tidak ditemukan.");
  }

  if (!EDITABLE_STATUSES.includes(entry.workingPaper.status)) {
    throw new BadRequestError(
      `Kertas kerja berstatus "${entry.workingPaper.status}" tidak dapat diedit.`,
    );
  }

  if (!entry.inherentAssessment) {
    throw new BadRequestError(
      "Penilaian risiko inheren harus dilakukan terlebih dahulu sebelum membuat rencana penanganan.",
    );
  }

  // Pre-compute shared maps (used for validation, auto-complete, and residual upsert)
  const riskContext = entry.programFrameworkContext?.riskContext;
  const inherentAreaScoreMap = new Map(
    (entry.inherentAssessment?.areaScores ?? []).map((s) => [s.impactAreaId, s]),
  );

  // Build option map (needed for validation + auto-complete detection)
  const optionMap = new Map();
  if (reqBody.plans.length > 0) {
    const optionIds = reqBody.plans.map((p) => p.treatmentOptionId).filter(Boolean);
    if (optionIds.length > 0) {
      const options = await prismaClient.treatmentOption.findMany({
        where: { id: { in: optionIds } },
        select: { id: true, isAcceptance: true },
      });
      for (const o of options) optionMap.set(o.id, o);
      for (const plan of reqBody.plans) {
        if (plan.treatmentOptionId && !optionMap.has(plan.treatmentOptionId)) {
          throw new BadRequestError("Opsi penanganan tidak ditemukan.");
        }
      }
    }
  }

  // If plans array is empty, allow — deletion of all PLANNED plans is valid.
  if (reqBody.plans.length > 0) {
    // Ensure all impactAreaIds in plans are among assessed areas
    const assessedAreaIds = new Set(inherentAreaScoreMap.keys());
    for (const plan of reqBody.plans) {
      if (plan.impactAreaId && !assessedAreaIds.has(plan.impactAreaId)) {
        throw new BadRequestError(
          "Area dampak pada rencana penanganan harus merupakan area yang sudah dinilai pada penilaian inherent."
        );
      }
    }

    // Risk appetite validation per area
    if (riskContext?.riskAppetiteLevel) {
      const appetiteLevel = riskContext.riskLevels.find(
        (l) => l.name === riskContext.riskAppetiteLevel
      );
      if (appetiteLevel) {
        for (const plan of reqBody.plans) {
          if (!plan.impactAreaId || !plan.treatmentOptionId) continue;
          const inherentScore = inherentAreaScoreMap.get(plan.impactAreaId);
          if (inherentScore == null) continue;
          const option = optionMap.get(plan.treatmentOptionId);
          if (!option) continue;

          if (inherentScore.score <= appetiteLevel.maxScore && !option.isAcceptance) {
            throw new BadRequestError(
              `Risiko pada area ini memiliki skor ${inherentScore.score} yang berada dalam selera risiko (≤ ${appetiteLevel.maxScore}). Opsi penanganan hanya boleh 'Diterima'.`
            );
          }
          if (inherentScore.score > appetiteLevel.maxScore && option.isAcceptance) {
            throw new BadRequestError(
              `Risiko pada area ini memiliki skor ${inherentScore.score} yang melebihi selera risiko (> ${appetiteLevel.maxScore}). Opsi penanganan 'Diterima' tidak dapat digunakan.`
            );
          }
        }
      }
    }
  }

  const plansData = reqBody.plans.map((plan) => {
    const option = plan.treatmentOptionId ? optionMap.get(plan.treatmentOptionId) : null;
    const isAcceptance = option?.isAcceptance ?? false;
    const hasInherentScore = plan.impactAreaId && inherentAreaScoreMap.has(plan.impactAreaId);
    const autoComplete = isAcceptance && hasInherentScore;
    return {
      riskEntryId: validId,
      impactAreaId: plan.impactAreaId || null,
      treatmentOptionId: plan.treatmentOptionId || null,
      description: plan.description || null,
      targetDate: plan.targetDate ? new Date(plan.targetDate) : null,
      picUserId: plan.picUserId || null,
      needsKomiteReview: plan.needsKomiteReview ?? false,
      status: autoComplete ? "COMPLETED" : "PLANNED",
      completedAt: autoComplete ? new Date() : null,
      _autoComplete: autoComplete,
      _impactAreaId: plan.impactAreaId,
    };
  });

  // Acceptance plans that need auto-residual upsert
  const autoCompletePlans = plansData
    .filter((p) => p._autoComplete)
    .map((p) => ({ impactAreaId: p._impactAreaId, inherentScore: inherentAreaScoreMap.get(p._impactAreaId) }))
    .filter((p) => p.inherentScore);

  const plans = await prismaClient.$transaction(async (tx) => {
    // Delete existing PLANNED treatment plans only
    await tx.riskTreatmentPlan.deleteMany({
      where: { riskEntryId: validId, status: "PLANNED" },
    });

    if (reqBody.plans.length === 0) {
      return tx.riskTreatmentPlan.findMany({
        where: { riskEntryId: validId },
        select: {
          id: true,
          impactAreaId: true,
          impactArea: { select: { id: true, name: true } },
          treatmentOptionId: true,
          treatmentOption: { select: { id: true, name: true, isAcceptance: true } },
          description: true,
          targetDate: true,
          picUserId: true,
          status: true,
          needsKomiteReview: true,
          completedAt: true,
        },
        orderBy: { createdAt: "asc" },
      });
    }

    await tx.riskTreatmentPlan.createMany({
      data: plansData.map(({ _autoComplete, _impactAreaId, ...rest }) => rest),
    });

    // Auto-upsert residual area scores for acceptance plans
    if (autoCompletePlans.length > 0) {
      // Get or create the residual assessment
      let residualAssessment = await tx.riskAssessment.findFirst({
        where: { residualEntryId: validId },
        select: { id: true },
      });

      if (!residualAssessment) {
        residualAssessment = await tx.riskAssessment.create({
          data: {
            residualEntryId: validId,
            type: "RESIDUAL",
            finalScore: 0,
            assessedAt: new Date(),
            assessedBy: user.id || null,
          },
          select: { id: true },
        });
      }

      // Upsert each acceptance area score (residual = inherent)
      for (const { inherentScore } of autoCompletePlans) {
        await tx.areaScore.upsert({
          where: {
            assessmentId_impactAreaId: {
              assessmentId: residualAssessment.id,
              impactAreaId: inherentScore.impactAreaId,
            },
          },
          update: {
            likelihoodLevel: inherentScore.likelihoodLevel,
            impactLevel: inherentScore.impactLevel,
            likelihoodDescription: inherentScore.likelihoodDescription,
            impactDescription: inherentScore.impactDescription,
            matrixCellId: inherentScore.matrixCellId,
            score: inherentScore.score,
          },
          create: {
            assessmentId: residualAssessment.id,
            impactAreaId: inherentScore.impactAreaId,
            likelihoodLevel: inherentScore.likelihoodLevel,
            impactLevel: inherentScore.impactLevel,
            likelihoodDescription: inherentScore.likelihoodDescription,
            impactDescription: inherentScore.impactDescription,
            matrixCellId: inherentScore.matrixCellId,
            score: inherentScore.score,
          },
        });
      }

      // Recalculate residual finalScore
      const allScores = await tx.areaScore.findMany({
        where: { assessmentId: residualAssessment.id },
        select: { score: true },
      });
      const finalScore = Math.max(...allScores.map((s) => s.score));
      const riskLevel = riskContext?.riskLevels?.find(
        (rl) => finalScore >= rl.minScore && finalScore <= rl.maxScore,
      );
      await tx.riskAssessment.update({
        where: { id: residualAssessment.id },
        data: {
          finalScore,
          riskLevelId: riskLevel ? riskLevel.id : null,
          assessedAt: new Date(),
        },
      });
    }

    return tx.riskTreatmentPlan.findMany({
      where: { riskEntryId: validId },
      select: {
        id: true,
        impactAreaId: true,
        impactArea: { select: { id: true, name: true } },
        treatmentOptionId: true,
        treatmentOption: { select: { id: true, name: true, isAcceptance: true } },
        description: true,
        targetDate: true,
        picUserId: true,
        status: true,
        needsKomiteReview: true,
        completedAt: true,
      },
      orderBy: { createdAt: "asc" },
    });
  });

  return {
    message: "Rencana penanganan berhasil disimpan",
    data: plans,
  };
};

// ─── completeTreatmentPlan ────────────────────────────────────────────────────

const completeTreatmentPlan = async (entryId, planId, reqBody, user) => {
  const { id: validEntryId } = validate(entryIdSchema, { id: entryId });
  const { id: validPlanId } = validate(planIdSchema, { id: planId });
  reqBody = validate(completeTreatmentPlanSchema, reqBody);

  const entry = await prismaClient.riskEntry.findUnique({
    where: { id: validEntryId },
    select: {
      id: true,
      workingPaper: { select: { unitKerjaId: true, status: true } },
      programFrameworkContext: {
        select: {
          riskContext: {
            select: {
              id: true,
              matrixRows: true,
              matrixCols: true,
              impactAreas: { select: { id: true, name: true } },
              matrixCells: { select: { id: true, row: true, col: true, value: true } },
              riskLevels: {
                select: { id: true, name: true, minScore: true, maxScore: true, order: true },
                orderBy: { order: "asc" },
              },
            },
          },
        },
      },
      inherentAssessment: { select: { id: true } },
    },
  });

  if (!entry) throw new NotFoundError("Entri risiko tidak ditemukan.");
  if (entry.workingPaper.unitKerjaId !== user.unitKerjaId) {
    throw new NotFoundError("Entri risiko tidak ditemukan.");
  }
  if (!EDITABLE_STATUSES.includes(entry.workingPaper.status)) {
    throw new BadRequestError(
      `Kertas kerja berstatus "${entry.workingPaper.status}" tidak dapat diedit.`,
    );
  }
  if (!entry.inherentAssessment) {
    throw new BadRequestError(
      "Penilaian risiko inheren harus dilakukan terlebih dahulu.",
    );
  }

  // Validate the treatment plan
  const plan = await prismaClient.riskTreatmentPlan.findFirst({
    where: { id: validPlanId, riskEntryId: validEntryId },
    select: { id: true, impactAreaId: true, status: true },
  });

  if (!plan) throw new NotFoundError("Rencana penanganan tidak ditemukan.");
  if (plan.status !== TREATMENT_STATUSES.PLANNED) {
    throw new BadRequestError(
      "Hanya rencana penanganan berstatus PLANNED yang dapat ditandai selesai.",
    );
  }
  if (!plan.impactAreaId) {
    throw new BadRequestError("Rencana penanganan tidak memiliki area dampak.");
  }

  const { areaScore } = reqBody;
  if (areaScore.impactAreaId !== plan.impactAreaId) {
    throw new BadRequestError("Area dampak tidak sesuai dengan rencana penanganan.");
  }

  const context = entry.programFrameworkContext.riskContext;
  const impactArea = context.impactAreas.find((a) => a.id === areaScore.impactAreaId);
  if (!impactArea) {
    throw new BadRequestError("Area dampak tidak ditemukan dalam konteks risiko ini.");
  }
  if (areaScore.likelihoodLevel < 1 || areaScore.likelihoodLevel > context.matrixRows) {
    throw new BadRequestError(`Level kemungkinan harus antara 1 dan ${context.matrixRows}.`);
  }
  if (areaScore.impactLevel < 1 || areaScore.impactLevel > context.matrixCols) {
    throw new BadRequestError(`Level dampak harus antara 1 dan ${context.matrixCols}.`);
  }

  const cell = context.matrixCells.find(
    (c) => c.row === areaScore.likelihoodLevel && c.col === areaScore.impactLevel,
  );
  const cellScore = cell ? cell.value : areaScore.likelihoodLevel * areaScore.impactLevel;

  const result = await prismaClient.$transaction(async (tx) => {
    // Get or create residual assessment
    let residualAssessment = await tx.riskAssessment.findFirst({
      where: { residualEntryId: validEntryId },
      select: { id: true },
    });

    if (!residualAssessment) {
      residualAssessment = await tx.riskAssessment.create({
        data: {
          residualEntryId: validEntryId,
          type: "RESIDUAL",
          finalScore: 0,
          assessedAt: new Date(),
          assessedBy: user.id || null,
        },
        select: { id: true },
      });
    }

    // Upsert area score for this impact area
    await tx.areaScore.upsert({
      where: {
        assessmentId_impactAreaId: {
          assessmentId: residualAssessment.id,
          impactAreaId: areaScore.impactAreaId,
        },
      },
      update: {
        likelihoodLevel: areaScore.likelihoodLevel,
        impactLevel: areaScore.impactLevel,
        likelihoodDescription: areaScore.likelihoodDescription || null,
        impactDescription: areaScore.impactDescription || null,
        matrixCellId: cell ? cell.id : null,
        score: cellScore,
      },
      create: {
        assessmentId: residualAssessment.id,
        impactAreaId: areaScore.impactAreaId,
        likelihoodLevel: areaScore.likelihoodLevel,
        impactLevel: areaScore.impactLevel,
        likelihoodDescription: areaScore.likelihoodDescription || null,
        impactDescription: areaScore.impactDescription || null,
        matrixCellId: cell ? cell.id : null,
        score: cellScore,
      },
    });

    // Recalculate final score from all area scores
    const allScores = await tx.areaScore.findMany({
      where: { assessmentId: residualAssessment.id },
      select: { score: true },
    });
    const finalScore = Math.max(...allScores.map((s) => s.score));
    const riskLevel = context.riskLevels.find(
      (rl) => finalScore >= rl.minScore && finalScore <= rl.maxScore,
    );

    await tx.riskAssessment.update({
      where: { id: residualAssessment.id },
      data: {
        finalScore,
        riskLevelId: riskLevel ? riskLevel.id : null,
        assessedAt: new Date(),
      },
    });

    // Mark this specific treatment plan as COMPLETED
    await tx.riskTreatmentPlan.update({
      where: { id: validPlanId },
      data: { status: "COMPLETED", completedAt: new Date() },
    });

    return tx.riskAssessment.findUnique({
      where: { id: residualAssessment.id },
      select: {
        id: true,
        type: true,
        finalScore: true,
        notes: true,
        assessedAt: true,
        riskLevelId: true,
        riskLevel: { select: { id: true, name: true, color: true } },
        areaScores: {
          select: {
            id: true,
            impactAreaId: true,
            impactArea: { select: { id: true, name: true } },
            likelihoodLevel: true,
            impactLevel: true,
            score: true,
          },
        },
      },
    });
  });

  return {
    message: "Rencana penanganan berhasil ditandai selesai dan penilaian residual disimpan.",
    data: result,
  };
};

export default { create, listByWorkingPaper, getById, update, remove, submitTreatmentPlan, verifyTreatmentPlan, createOrUpdateInherentAssessment, createOrUpdateResidualAssessment, createOrUpdateTreatmentPlans, completeTreatmentPlan };
