import { validate } from "../../utils/validator.utils.js";
import {
  overviewQuerySchema,
  topRisksQuerySchema,
  activityQuerySchema,
  unitsQuerySchema,
  risksQuerySchema,
} from "./dashboard.validation.js";
import { prismaClient } from "../../core/lib/database.lib.js";

const DONE_STATUSES = ["COMPLETED", "CANCELLED", "VERIFIED"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildEntryWhere(programId, riskContextId) {
  const entryWhere = {};
  const wpCondition = {};
  if (programId) wpCondition.programId = programId;
  if (Object.keys(wpCondition).length) entryWhere.workingPaper = wpCondition;
  if (riskContextId) entryWhere.programFrameworkContext = { riskContextId };
  return entryWhere;
}

function buildWpWhere(programId, riskContextId) {
  const wpWhere = {};
  if (programId) wpWhere.programId = programId;
  if (riskContextId) {
    wpWhere.riskEntries = {
      some: { programFrameworkContext: { riskContextId } },
    };
  }
  return wpWhere;
}

function aggregateLevelDist(entries, assessmentKey) {
  const map = new Map();
  for (const e of entries) {
    const assessment = e[assessmentKey];
    const key = assessment?.riskLevel?.name ?? "__none__";
    const color = assessment?.riskLevel?.color ?? "#777";
    const order = assessment?.riskLevel?.order ?? 99;
    if (!map.has(key)) {
      map.set(key, { name: key === "__none__" ? "Belum dinilai" : key, color, order, count: 0 });
    }
    map.get(key).count++;
  }
  return [...map.values()].sort((a, b) => a.order - b.order);
}

// ─── getFilters ───────────────────────────────────────────────────────────────

const getFilters = async () => {
  const [programs, contexts] = await Promise.all([
    prismaClient.riskProgram.findMany({
      where: { status: { in: ["ACTIVE", "CLOSED"] } },
      select: { id: true, name: true, year: true, status: true },
      orderBy: [{ year: "desc" }, { createdAt: "desc" }],
    }),
    prismaClient.riskContext.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, code: true, contextType: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return { message: "Filter options berhasil dimuat", data: { programs, contexts } };
};

// ─── getOverview ──────────────────────────────────────────────────────────────

const getOverview = async (queryParams) => {
  const { programId, riskContextId } = validate(overviewQuerySchema, queryParams);
  const entryWhere = buildEntryWhere(programId, riskContextId);
  const wpWhere = buildWpWhere(programId, riskContextId);

  // Single large query for all entries + assessments + treatments
  const [entries, wpStatusGroups, treatmentGroups] = await Promise.all([
    prismaClient.riskEntry.findMany({
      where: entryWhere,
      select: {
        riskCategory: { select: { name: true, color: true } },
        asset: { select: { category: { select: { name: true } } } },
        inherentAssessment: {
          select: {
            riskLevel: { select: { name: true, color: true, order: true } },
            areaScores: {
              select: {
                score: true,
                impactArea: { select: { name: true } },
              },
            },
          },
        },
        residualAssessment: {
          select: {
            riskLevel: { select: { name: true, color: true, order: true } },
            areaScores: {
              select: {
                score: true,
                impactArea: { select: { name: true } },
              },
            },
          },
        },
        treatmentPlans: { select: { status: true, targetDate: true } },
      },
    }),
    prismaClient.workingPaper.groupBy({
      by: ["status"],
      where: wpWhere,
      _count: { id: true },
    }),
    prismaClient.riskTreatmentPlan.groupBy({
      by: ["status"],
      where: entryWhere.workingPaper
        ? { riskEntry: { workingPaper: entryWhere.workingPaper } }
        : entryWhere.programFrameworkContext
          ? { riskEntry: { programFrameworkContext: entryWhere.programFrameworkContext } }
          : {},
      _count: { id: true },
    }),
  ]);

  const totalRisks = entries.length;
  const inherentAssessedCount = entries.filter((e) => e.inherentAssessment).length;
  const residualAssessedCount = entries.filter((e) => e.residualAssessment).length;

  const now = new Date();
  let treatmentTotal = 0;
  let treatmentCompleted = 0;
  let overdueCount = 0;

  for (const e of entries) {
    for (const p of e.treatmentPlans) {
      treatmentTotal++;
      if (["COMPLETED", "VERIFIED"].includes(p.status)) treatmentCompleted++;
      if (p.targetDate && new Date(p.targetDate) < now && !DONE_STATUSES.includes(p.status)) {
        overdueCount++;
      }
    }
  }

  // Level distributions
  const inherentLevelDist = aggregateLevelDist(entries, "inherentAssessment");
  const residualLevelDist = aggregateLevelDist(entries, "residualAssessment");

  // Risk category distribution (top 8)
  const categoryMap = new Map();
  for (const e of entries) {
    const key = e.riskCategory?.name ?? "__none__";
    const color = e.riskCategory?.color ?? "#777";
    if (!categoryMap.has(key)) {
      categoryMap.set(key, { name: key === "__none__" ? "Tanpa Kategori" : key, color, count: 0 });
    }
    categoryMap.get(key).count++;
  }
  const categoryDist = [...categoryMap.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Impact area distribution — prefer residual, fallback inherent
  const areaMap = new Map();
  for (const e of entries) {
    const assessment = e.residualAssessment ?? e.inherentAssessment;
    if (!assessment) continue;
    for (const as of assessment.areaScores) {
      const name = as.impactArea.name;
      if (!areaMap.has(name)) {
        areaMap.set(name, { name, totalScore: 0, count: 0, maxScore: 0 });
      }
      const area = areaMap.get(name);
      area.totalScore += as.score;
      area.count++;
      if (as.score > area.maxScore) area.maxScore = as.score;
    }
  }
  const impactAreaDist = [...areaMap.values()]
    .map(({ name, totalScore, count, maxScore }) => ({
      name,
      avgScore: count > 0 ? Math.round(totalScore / count) : 0,
      maxScore,
      count,
    }))
    .sort((a, b) => b.avgScore - a.avgScore);

  // Asset category distribution — only entries with an asset
  const assetCatMap = new Map();
  for (const e of entries) {
    if (!e.asset?.category) continue;
    const name = e.asset.category.name;
    assetCatMap.set(name, (assetCatMap.get(name) ?? 0) + 1);
  }
  const assetCategoryDist = [...assetCatMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // WP & treatment status counts
  const wpStatusCounts = wpStatusGroups.reduce((acc, g) => {
    acc[g.status] = g._count.id;
    return acc;
  }, {});
  const treatmentStatusCounts = treatmentGroups.reduce((acc, g) => {
    acc[g.status] = g._count.id;
    return acc;
  }, {});

  const totalUnitsWithPapers = await prismaClient.workingPaper
    .groupBy({ by: ["unitKerjaId"], where: wpWhere, _count: { id: true } })
    .then((r) => r.length);

  return {
    message: "Overview berhasil dimuat",
    data: {
      summary: {
        totalRisks,
        inherentAssessedCount,
        residualAssessedCount,
        residualAssessedPct:
          totalRisks > 0 ? Math.round((residualAssessedCount / totalRisks) * 100) : 0,
        treatmentTotal,
        treatmentCompleted,
        treatmentCompletedPct:
          treatmentTotal > 0 ? Math.round((treatmentCompleted / treatmentTotal) * 100) : 0,
        overdueCount,
        totalUnitsWithPapers,
        approvedPapersCount: wpStatusCounts["APPROVED"] ?? 0,
      },
      inherentLevelDist,
      residualLevelDist,
      categoryDist,
      impactAreaDist,
      assetCategoryDist,
      wpStatusCounts,
      treatmentStatusCounts,
    },
  };
};

// ─── getTopRisks ──────────────────────────────────────────────────────────────

const getTopRisks = async (queryParams) => {
  const { programId, riskContextId, limit } = validate(topRisksQuerySchema, queryParams);
  const entryWhere = buildEntryWhere(programId, riskContextId);

  // Fetch all assessed entries — sort by effective score in memory
  const entries = await prismaClient.riskEntry.findMany({
    where: {
      ...entryWhere,
      OR: [
        { inherentAssessment: { isNot: null } },
        { residualAssessment: { isNot: null } },
      ],
    },
    select: {
      id: true,
      code: true,
      name: true,
      workingPaper: {
        select: {
          id: true,
          unitKerja: { select: { id: true, name: true, code: true } },
        },
      },
      riskCategory: { select: { name: true, color: true } },
      programFrameworkContext: {
        select: {
          riskContext: { select: { name: true, code: true } },
        },
      },
      inherentAssessment: {
        select: {
          finalScore: true,
          riskLevel: { select: { name: true, color: true, order: true } },
        },
      },
      residualAssessment: {
        select: {
          finalScore: true,
          riskLevel: { select: { name: true, color: true, order: true } },
        },
      },
      treatmentPlans: { select: { status: true, targetDate: true } },
    },
  });

  const now = new Date();

  // Sort by effective score desc (residual preferred over inherent)
  const scored = entries
    .map((e) => {
      const effective = e.residualAssessment ?? e.inherentAssessment;
      const effectiveScore = effective?.finalScore ?? -1;
      return { e, effectiveScore };
    })
    .sort((a, b) => b.effectiveScore - a.effectiveScore)
    .slice(0, limit);

  const data = scored.map(({ e, effectiveScore }, idx) => {
    const effective = e.residualAssessment ?? e.inherentAssessment;
    const assessmentType = e.residualAssessment ? "RESIDUAL" : "INHERENT";

    let treatmentTotal = 0;
    let treatmentCompleted = 0;
    let treatmentOverdue = 0;
    for (const p of e.treatmentPlans) {
      treatmentTotal++;
      if (["COMPLETED", "VERIFIED"].includes(p.status)) treatmentCompleted++;
      if (p.targetDate && new Date(p.targetDate) < now && !DONE_STATUSES.includes(p.status)) {
        treatmentOverdue++;
      }
    }

    return {
      rank: idx + 1,
      id: e.id,
      code: e.code,
      name: e.name,
      unitKerja: e.workingPaper.unitKerja,
      workingPaperId: e.workingPaper.id,
      riskCategory: e.riskCategory,
      contextName: e.programFrameworkContext?.riskContext?.name ?? null,
      inherentLevel: e.inherentAssessment?.riskLevel
        ? {
            name: e.inherentAssessment.riskLevel.name,
            color: e.inherentAssessment.riskLevel.color,
            score: e.inherentAssessment.finalScore,
          }
        : null,
      residualLevel: e.residualAssessment?.riskLevel
        ? {
            name: e.residualAssessment.riskLevel.name,
            color: e.residualAssessment.riskLevel.color,
            score: e.residualAssessment.finalScore,
          }
        : null,
      effectiveLevel: effective?.riskLevel
        ? {
            name: effective.riskLevel.name,
            color: effective.riskLevel.color,
            score: effectiveScore,
          }
        : null,
      assessmentType,
      treatmentSummary: { total: treatmentTotal, completed: treatmentCompleted, overdue: treatmentOverdue },
    };
  });

  return { message: "Top risiko berhasil dimuat", data };
};

// ─── getRecentActivity ────────────────────────────────────────────────────────

const getRecentActivity = async (queryParams) => {
  const { programId, riskContextId } = validate(activityQuerySchema, queryParams);
  const entryWhere = buildEntryWhere(programId, riskContextId);
  const wpWhere = buildWpWhere(programId, riskContextId);
  const planEntryWhere = entryWhere.workingPaper || entryWhere.programFrameworkContext
    ? { riskEntry: entryWhere }
    : {};

  const [recentEntries, recentSubmissions, recentApprovals, recentTreatments] =
    await Promise.all([
      // Risiko baru diidentifikasi
      prismaClient.riskEntry.findMany({
        where: entryWhere,
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          code: true,
          name: true,
          createdAt: true,
          workingPaper: {
            select: {
              id: true,
              unitKerja: { select: { name: true, code: true } },
              program: { select: { name: true } },
            },
          },
        },
      }),

      // Kertas kerja diajukan
      prismaClient.workingPaper.findMany({
        where: { ...wpWhere, submittedAt: { not: null } },
        orderBy: { submittedAt: "desc" },
        take: 8,
        select: {
          id: true,
          title: true,
          status: true,
          submittedAt: true,
          submittedBy: true,
          unitKerja: { select: { name: true, code: true } },
          program: { select: { name: true } },
        },
      }),

      // Kertas kerja disetujui
      prismaClient.workingPaper.findMany({
        where: { ...wpWhere, approvedAt: { not: null } },
        orderBy: { approvedAt: "desc" },
        take: 8,
        select: {
          id: true,
          title: true,
          approvedAt: true,
          approvedBy: true,
          unitKerja: { select: { name: true, code: true } },
          program: { select: { name: true } },
        },
      }),

      // Rencana treatment diselesaikan / diverifikasi
      prismaClient.riskTreatmentPlan.findMany({
        where: {
          ...planEntryWhere,
          status: { in: ["COMPLETED", "VERIFIED"] },
          completedAt: { not: null },
        },
        orderBy: { completedAt: "desc" },
        take: 8,
        select: {
          id: true,
          status: true,
          completedAt: true,
          riskEntry: {
            select: {
              name: true,
              workingPaper: {
                select: {
                  id: true,
                  unitKerja: { select: { name: true, code: true } },
                },
              },
            },
          },
        },
      }),
    ]);

  const events = [];

  for (const e of recentEntries) {
    events.push({
      type: "RISK_IDENTIFIED",
      timestamp: e.createdAt,
      title: `Risiko baru diidentifikasi: ${e.code}`,
      detail: e.name,
      unitKerja: e.workingPaper.unitKerja,
      workingPaperId: e.workingPaper.id,
      actor: null,
      meta: { programName: e.workingPaper.program?.name },
    });
  }

  for (const wp of recentSubmissions) {
    events.push({
      type: "WP_SUBMITTED",
      timestamp: wp.submittedAt,
      title: "Kertas kerja diajukan",
      detail: wp.title,
      unitKerja: wp.unitKerja,
      workingPaperId: wp.id,
      actor: wp.submittedBy,
      meta: { programName: wp.program?.name },
    });
  }

  for (const wp of recentApprovals) {
    events.push({
      type: "WP_APPROVED",
      timestamp: wp.approvedAt,
      title: "Kertas kerja disetujui",
      detail: wp.title,
      unitKerja: wp.unitKerja,
      workingPaperId: wp.id,
      actor: wp.approvedBy,
      meta: { programName: wp.program?.name },
    });
  }

  for (const plan of recentTreatments) {
    events.push({
      type: plan.status === "VERIFIED" ? "TREATMENT_VERIFIED" : "TREATMENT_COMPLETED",
      timestamp: plan.completedAt,
      title:
        plan.status === "VERIFIED"
          ? "Rencana treatment diverifikasi"
          : "Rencana treatment diselesaikan",
      detail: plan.riskEntry.name,
      unitKerja: plan.riskEntry.workingPaper.unitKerja,
      workingPaperId: plan.riskEntry.workingPaper.id,
      actor: null,
      meta: {},
    });
  }

  // Sort by timestamp desc, take 20
  events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const data = events.slice(0, 20);

  return { message: "Aktivitas terbaru berhasil dimuat", data };
};

// ─── getUnits (existing, unchanged) ──────────────────────────────────────────

const getUnits = async (queryParams) => {
  const { programId, riskContextId, page, limit } = validate(unitsQuerySchema, queryParams);
  const wpWhere = buildWpWhere(programId, riskContextId);
  const skip = (page - 1) * limit;

  const [totalItems, papers] = await Promise.all([
    prismaClient.workingPaper.count({ where: wpWhere }),
    prismaClient.workingPaper.findMany({
      where: wpWhere,
      skip,
      take: limit,
      orderBy: [{ unitKerja: { name: "asc" } }],
      select: {
        id: true,
        status: true,
        unitKerja: { select: { id: true, name: true, code: true } },
        riskEntries: {
          where: riskContextId
            ? { programFrameworkContext: { riskContextId } }
            : undefined,
          select: {
            inherentAssessment: {
              select: { riskLevel: { select: { name: true, color: true } } },
            },
            residualAssessment: {
              select: { riskLevel: { select: { name: true, color: true } } },
            },
            treatmentPlans: { select: { status: true } },
          },
        },
      },
    }),
  ]);

  const units = papers.map((paper) => {
    const levelMap = new Map();
    let totalPlans = 0;
    let completedPlans = 0;
    for (const e of paper.riskEntries) {
      const assessment = e.residualAssessment ?? e.inherentAssessment;
      const key = assessment?.riskLevel?.name ?? "__none__";
      const color = assessment?.riskLevel?.color ?? "#777";
      if (!levelMap.has(key))
        levelMap.set(key, { name: key === "__none__" ? "Belum dinilai" : key, color, count: 0 });
      levelMap.get(key).count++;
      for (const p of e.treatmentPlans) {
        totalPlans++;
        if (DONE_STATUSES.includes(p.status)) completedPlans++;
      }
    }
    return {
      unitKerja: paper.unitKerja,
      workingPaperId: paper.id,
      workingPaperStatus: paper.status,
      riskCount: paper.riskEntries.length,
      riskLevelBreakdown: [...levelMap.values()],
      treatmentCompletionPct:
        totalPlans > 0 ? Math.round((completedPlans / totalPlans) * 100) : null,
    };
  });

  const totalPages = Math.ceil(totalItems / limit);
  return {
    message: "Data unit kerja berhasil dimuat",
    data: units,
    pagination: { page, limit, totalItems, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
  };
};

// ─── getRisks (existing, unchanged) ──────────────────────────────────────────

const getRisks = async (queryParams) => {
  const { programId, riskContextId, unitKerjaId, riskLevelName, page, limit } =
    validate(risksQuerySchema, queryParams);

  const entryWhere = buildEntryWhere(programId, riskContextId);
  if (unitKerjaId) {
    entryWhere.workingPaper = { ...(entryWhere.workingPaper ?? {}), unitKerjaId };
  }
  if (riskLevelName) {
    entryWhere.OR = [
      { residualAssessment: { riskLevel: { name: riskLevelName } } },
      { residualAssessment: null, inherentAssessment: { riskLevel: { name: riskLevelName } } },
    ];
  }

  const skip = (page - 1) * limit;
  const [totalItems, entries] = await Promise.all([
    prismaClient.riskEntry.count({ where: entryWhere }),
    prismaClient.riskEntry.findMany({
      where: entryWhere,
      skip,
      take: limit,
      orderBy: [{ workingPaper: { unitKerja: { name: "asc" } } }, { code: "asc" }],
      select: {
        id: true, code: true, name: true,
        workingPaper: {
          select: { id: true, status: true, unitKerja: { select: { id: true, name: true, code: true } } },
        },
        programFrameworkContext: {
          select: { riskContext: { select: { id: true, name: true, code: true, contextType: true } } },
        },
        inherentAssessment: {
          select: { finalScore: true, riskLevel: { select: { name: true, color: true } } },
        },
        residualAssessment: {
          select: { finalScore: true, riskLevel: { select: { name: true, color: true } } },
        },
        treatmentPlans: { select: { status: true } },
      },
    }),
  ]);

  const data = entries.map((e) => {
    const effectiveAssessment = e.residualAssessment ?? e.inherentAssessment;
    return {
      id: e.id, code: e.code, name: e.name,
      unitKerja: e.workingPaper.unitKerja,
      workingPaperId: e.workingPaper.id,
      workingPaperStatus: e.workingPaper.status,
      contextName: e.programFrameworkContext?.riskContext?.name ?? null,
      contextType: e.programFrameworkContext?.riskContext?.contextType ?? null,
      effectiveRiskLevelName: effectiveAssessment?.riskLevel?.name ?? null,
      effectiveRiskLevelColor: effectiveAssessment?.riskLevel?.color ?? null,
      effectiveFinalScore: effectiveAssessment?.finalScore ?? null,
      assessmentType: e.residualAssessment ? "RESIDUAL" : e.inherentAssessment ? "INHERENT" : null,
      treatmentSummary: {
        total: e.treatmentPlans.length,
        completed: e.treatmentPlans.filter((p) => DONE_STATUSES.includes(p.status)).length,
      },
    };
  });

  const totalPages = Math.ceil(totalItems / limit);
  return {
    message: "Daftar risiko berhasil dimuat",
    data,
    pagination: { page, limit, totalItems, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
  };
};

export default { getFilters, getOverview, getTopRisks, getRecentActivity, getUnits, getRisks };
