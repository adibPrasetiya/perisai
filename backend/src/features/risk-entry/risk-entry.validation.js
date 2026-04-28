import Joi from "joi";
import { CONTROL_EFFECTIVENESS } from "../../core/config/enum.config.js";

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const controlSchema = Joi.object({
  name: Joi.string().max(500).required().messages({
    "string.empty": "Nama kontrol tidak boleh kosong",
    "string.max": "Nama kontrol maksimal 500 karakter",
    "any.required": "Nama kontrol wajib diisi",
  }),
  description: Joi.string().allow("", null),
  effectiveness: Joi.string()
    .valid(...Object.values(CONTROL_EFFECTIVENESS))
    .required()
    .messages({
      "any.only": `Efektivitas harus salah satu dari: ${Object.values(CONTROL_EFFECTIVENESS).join(", ")}`,
      "any.required": "Efektivitas kontrol wajib diisi",
    }),
  order: Joi.number().integer().min(0).default(0),
});

const areaScoreSchema = Joi.object({
  impactAreaId: Joi.string().required().messages({
    "string.empty": "ID area dampak tidak boleh kosong",
    "any.required": "ID area dampak wajib diisi",
  }),
  likelihoodLevel: Joi.number().integer().min(1).required().messages({
    "number.base": "Level kemungkinan harus berupa angka",
    "number.integer": "Level kemungkinan harus berupa bilangan bulat",
    "number.min": "Level kemungkinan minimal 1",
    "any.required": "Level kemungkinan wajib diisi",
  }),
  impactLevel: Joi.number().integer().min(1).required().messages({
    "number.base": "Level dampak harus berupa angka",
    "number.integer": "Level dampak harus berupa bilangan bulat",
    "number.min": "Level dampak minimal 1",
    "any.required": "Level dampak wajib diisi",
  }),
  likelihoodDescription: Joi.string().allow("", null),
  impactDescription: Joi.string().allow("", null),
});

const assessmentSchema = Joi.object({
  notes: Joi.string().allow("", null),
  areaScores: Joi.array().items(areaScoreSchema).min(1).required().messages({
    "array.min": "Minimal satu area dampak harus dinilai",
    "any.required": "Penilaian area dampak wajib diisi",
  }),
});

const treatmentPlanSchema = Joi.object({
  impactAreaId: Joi.string().required().messages({
    "string.empty": "ID area dampak tidak boleh kosong",
    "any.required": "ID area dampak wajib diisi",
  }),
  treatmentOptionId: Joi.string().allow(null),
  description: Joi.string().allow("", null),
  targetDate: Joi.string().isoDate().allow(null).messages({
    "string.isoDate": "Target tanggal harus berformat ISO (YYYY-MM-DD)",
  }),
  picUserId: Joi.string().allow(null),
  needsKomiteReview: Joi.boolean().default(false),
});

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createRiskEntrySchema = Joi.object({
  programFrameworkId: Joi.string().required().messages({
    "string.empty": "ID program framework tidak boleh kosong",
    "any.required": "ID program framework wajib diisi",
  }),

  riskContextId: Joi.string().required().messages({
    "string.empty": "ID konteks risiko tidak boleh kosong",
    "any.required": "ID konteks risiko wajib diisi",
  }),

  assetId: Joi.string().allow(null),
  businessProcessId: Joi.string().allow(null),

  name: Joi.string().max(500).required().messages({
    "string.empty": "Nama risiko tidak boleh kosong",
    "string.max": "Nama risiko maksimal 500 karakter",
    "any.required": "Nama risiko wajib diisi",
  }),

  description: Joi.string().allow("", null),
  riskCategoryId: Joi.string().allow(null),

  order: Joi.number().integer().min(0).messages({
    "number.base": "Urutan harus berupa angka",
    "number.integer": "Urutan harus berupa bilangan bulat",
    "number.min": "Urutan minimal 0",
  }),

  controls: Joi.array().items(controlSchema).default([]),

  assessment: assessmentSchema.optional(),

  treatmentPlans: Joi.array().items(treatmentPlanSchema).default([]),
});

const createInherentAssessmentSchema = Joi.object({
  notes: Joi.string().allow("", null),
  areaScores: Joi.array().items(areaScoreSchema).min(1).required().messages({
    "array.min": "Minimal satu area dampak harus dinilai",
    "any.required": "Penilaian area dampak wajib diisi",
  }),
});

const createResidualAssessmentSchema = Joi.object({
  notes: Joi.string().allow("", null),
  areaScores: Joi.array().items(areaScoreSchema).min(1).required().messages({
    "array.min": "Minimal satu area dampak harus dinilai",
    "any.required": "Penilaian area dampak wajib diisi",
  }),
});

const createTreatmentPlansSchema = Joi.object({
  plans: Joi.array().items(treatmentPlanSchema).default([]),
});

const updateRiskEntrySchema = Joi.object({
  code: Joi.string().max(50).messages({
    "string.empty": "Kode entri risiko tidak boleh kosong",
    "string.max": "Kode entri risiko maksimal 50 karakter",
  }),

  name: Joi.string().max(500).messages({
    "string.empty": "Nama risiko tidak boleh kosong",
    "string.max": "Nama risiko maksimal 500 karakter",
  }),

  description: Joi.string().allow("", null),
  riskCategoryId: Joi.string().allow(null),
  order: Joi.number().integer().min(0),
})
  .min(1)
  .messages({
    "object.min": "Minimal satu field harus diisi untuk update",
  });

const entryIdSchema = Joi.object({
  id: Joi.string().required().messages({
    "string.empty": "ID entri risiko tidak boleh kosong",
    "any.required": "ID entri risiko wajib diisi",
  }),
});

const workingPaperIdSchema = Joi.object({
  id: Joi.string().required().messages({
    "string.empty": "ID kertas kerja tidak boleh kosong",
    "any.required": "ID kertas kerja wajib diisi",
  }),
});

const planIdSchema = Joi.object({
  id: Joi.string().required().messages({
    "string.empty": "ID rencana penanganan tidak boleh kosong",
    "any.required": "ID rencana penanganan wajib diisi",
  }),
});

const completeTreatmentPlanSchema = Joi.object({
  areaScore: Joi.object({
    impactAreaId: Joi.string().required().messages({
      "string.empty": "ID area dampak tidak boleh kosong",
      "any.required": "ID area dampak wajib diisi",
    }),
    likelihoodLevel: Joi.number().integer().min(1).required().messages({
      "number.base": "Level kemungkinan harus berupa angka",
      "number.integer": "Level kemungkinan harus berupa bilangan bulat",
      "number.min": "Level kemungkinan minimal 1",
      "any.required": "Level kemungkinan wajib diisi",
    }),
    impactLevel: Joi.number().integer().min(1).required().messages({
      "number.base": "Level dampak harus berupa angka",
      "number.integer": "Level dampak harus berupa bilangan bulat",
      "number.min": "Level dampak minimal 1",
      "any.required": "Level dampak wajib diisi",
    }),
    likelihoodDescription: Joi.string().allow("", null),
    impactDescription: Joi.string().allow("", null),
  }).required(),
});

export {
  createRiskEntrySchema,
  updateRiskEntrySchema,
  entryIdSchema,
  workingPaperIdSchema,
  planIdSchema,
  createInherentAssessmentSchema,
  createResidualAssessmentSchema,
  createTreatmentPlansSchema,
  completeTreatmentPlanSchema,
};
