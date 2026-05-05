import Joi from "joi";
import { RISK_CONTEXT_STATUSES, CONTEXT_TYPES } from "../../core/config/enum.config.js";

// =============================================================================
// CONTEXT
// =============================================================================

export const createRiskContextSchema = Joi.object({
  name: Joi.string().min(2).max(255).required().messages({
    "string.empty": "Nama konteks tidak boleh kosong",
    "string.min": "Nama konteks minimal 2 karakter",
    "string.max": "Nama konteks maksimal 255 karakter",
    "any.required": "Nama konteks wajib diisi",
  }),

  code: Joi.string().max(100).required().messages({
    "string.empty": "Kode konteks tidak boleh kosong",
    "string.max": "Kode konteks maksimal 100 karakter",
    "any.required": "Kode konteks wajib diisi",
  }),

  description: Joi.string().allow("", null),

  unitKerjaId: Joi.string().allow(null).messages({
    "string.base": "ID unit kerja tidak valid",
  }),

  contextType: Joi.string()
    .valid(...Object.values(CONTEXT_TYPES))
    .required()
    .messages({
      "any.only": `Tipe konteks harus salah satu dari: ${Object.values(CONTEXT_TYPES).join(", ")}`,
      "any.required": "Tipe konteks wajib diisi",
    }),

  periodStart: Joi.number().integer().min(2000).max(2100).required().messages({
    "number.base": "Periode awal harus berupa angka tahun",
    "number.integer": "Periode awal harus bilangan bulat",
    "number.min": "Periode awal minimal 2000",
    "number.max": "Periode awal maksimal 2100",
    "any.required": "Periode awal wajib diisi",
  }),

  periodEnd: Joi.number().integer().min(2000).max(2100).required().messages({
    "number.base": "Periode akhir harus berupa angka tahun",
    "number.integer": "Periode akhir harus bilangan bulat",
    "number.min": "Periode akhir minimal 2000",
    "number.max": "Periode akhir maksimal 2100",
    "any.required": "Periode akhir wajib diisi",
  }),

  matrixRows: Joi.number().integer().min(2).max(10).required().messages({
    "number.base": "Jumlah baris matriks harus berupa angka",
    "number.integer": "Jumlah baris matriks harus bilangan bulat",
    "number.min": "Jumlah baris matriks minimal 2",
    "number.max": "Jumlah baris matriks maksimal 10",
    "any.required": "Ukuran matriks (baris) wajib diisi",
  }),

  matrixCols: Joi.number().integer().min(2).max(10).required().messages({
    "number.base": "Jumlah kolom matriks harus berupa angka",
    "number.integer": "Jumlah kolom matriks harus bilangan bulat",
    "number.min": "Jumlah kolom matriks minimal 2",
    "number.max": "Jumlah kolom matriks maksimal 10",
    "any.required": "Ukuran matriks (kolom) wajib diisi",
  }),

  riskAppetiteLevel: Joi.string().max(100).allow("", null).messages({
    "string.max": "Level selera risiko maksimal 100 karakter",
  }),

  riskAppetiteDescription: Joi.string().allow("", null),
});

export const updateRiskContextSchema = Joi.object({
  name: Joi.string().min(2).max(255).messages({
    "string.empty": "Nama konteks tidak boleh kosong",
    "string.min": "Nama konteks minimal 2 karakter",
    "string.max": "Nama konteks maksimal 255 karakter",
  }),

  code: Joi.string().max(100).messages({
    "string.empty": "Kode konteks tidak boleh kosong",
    "string.max": "Kode konteks maksimal 100 karakter",
  }),

  description: Joi.string().allow("", null),
  unitKerjaId: Joi.string().allow(null),

  contextType: Joi.string()
    .valid(...Object.values(CONTEXT_TYPES))
    .messages({
      "any.only": `Tipe konteks harus salah satu dari: ${Object.values(CONTEXT_TYPES).join(", ")}`,
    }),

  periodStart: Joi.number().integer().min(2000).max(2100).messages({
    "number.base": "Periode awal harus berupa angka tahun",
    "number.integer": "Periode awal harus bilangan bulat",
  }),

  periodEnd: Joi.number().integer().min(2000).max(2100).messages({
    "number.base": "Periode akhir harus berupa angka tahun",
    "number.integer": "Periode akhir harus bilangan bulat",
  }),

  matrixRows: Joi.number().integer().min(2).max(10).messages({
    "number.base": "Jumlah baris matriks harus berupa angka",
    "number.min": "Jumlah baris matriks minimal 2",
    "number.max": "Jumlah baris matriks maksimal 10",
  }),

  matrixCols: Joi.number().integer().min(2).max(10).messages({
    "number.base": "Jumlah kolom matriks harus berupa angka",
    "number.min": "Jumlah kolom matriks minimal 2",
    "number.max": "Jumlah kolom matriks maksimal 10",
  }),

  riskAppetiteLevel: Joi.string().max(100).allow("", null),
  riskAppetiteDescription: Joi.string().allow("", null),
}).min(1);

export const riskContextIdSchema = Joi.object({
  id: Joi.string().required().messages({
    "string.empty": "ID konteks tidak boleh kosong",
    "any.required": "ID konteks wajib diisi",
  }),
});

// =============================================================================
// RISK CATEGORY
// =============================================================================

export const createRiskCategorySchema = Joi.object({
  name: Joi.string().min(2).max(255).required().messages({
    "string.empty": "Nama kategori tidak boleh kosong",
    "string.min": "Nama kategori minimal 2 karakter",
    "any.required": "Nama kategori wajib diisi",
  }),
  description: Joi.string().allow("", null),
  color: Joi.string()
    .pattern(/^#[0-9A-Fa-f]{6}$/)
    .allow("", null)
    .messages({
      "string.pattern.base": "Warna harus berupa kode hex valid (contoh: #FF0000)",
    }),
  code: Joi.string().max(50).allow("", null),
  order: Joi.number().integer().min(0).default(0),
});

export const updateRiskCategorySchema = Joi.object({
  name: Joi.string().min(2).max(255).messages({
    "string.empty": "Nama kategori tidak boleh kosong",
    "string.min": "Nama kategori minimal 2 karakter",
  }),
  description: Joi.string().allow("", null),
  color: Joi.string()
    .pattern(/^#[0-9A-Fa-f]{6}$/)
    .allow("", null)
    .messages({
      "string.pattern.base": "Warna harus berupa kode hex valid (contoh: #FF0000)",
    }),
  code: Joi.string().max(50).allow("", null),
  order: Joi.number().integer().min(0),
}).min(1);

// =============================================================================
// LIKELIHOOD CRITERIA
// =============================================================================

export const createLikelihoodCriteriaSchema = Joi.object({
  level: Joi.number().integer().min(1).required().messages({
    "number.base": "Level harus berupa angka",
    "number.min": "Level minimal 1",
    "any.required": "Level wajib diisi",
  }),
  name: Joi.string().min(2).max(255).required().messages({
    "string.empty": "Nama kriteria tidak boleh kosong",
    "any.required": "Nama kriteria wajib diisi",
  }),
  description: Joi.string().allow("", null),
});

export const updateLikelihoodCriteriaSchema = Joi.object({
  name: Joi.string().min(2).max(255).messages({
    "string.empty": "Nama kriteria tidak boleh kosong",
  }),
  description: Joi.string().allow("", null),
}).min(1);

// =============================================================================
// IMPACT AREA
// =============================================================================

export const createImpactAreaSchema = Joi.object({
  name: Joi.string().min(2).max(255).required().messages({
    "string.empty": "Nama area dampak tidak boleh kosong",
    "any.required": "Nama area dampak wajib diisi",
  }),
  description: Joi.string().allow("", null),
  order: Joi.number().integer().min(0).default(0),
});

export const updateImpactAreaSchema = Joi.object({
  name: Joi.string().min(2).max(255).messages({
    "string.empty": "Nama area dampak tidak boleh kosong",
  }),
  description: Joi.string().allow("", null),
  order: Joi.number().integer().min(0),
}).min(1);

// =============================================================================
// IMPACT CRITERIA
// =============================================================================

export const createImpactCriteriaSchema = Joi.object({
  level: Joi.number().integer().min(1).required().messages({
    "number.base": "Level harus berupa angka",
    "number.min": "Level minimal 1",
    "any.required": "Level wajib diisi",
  }),
  name: Joi.string().min(2).max(255).required().messages({
    "string.empty": "Nama kriteria tidak boleh kosong",
    "any.required": "Nama kriteria wajib diisi",
  }),
  description: Joi.string().allow("", null),
});

export const updateImpactCriteriaSchema = Joi.object({
  name: Joi.string().min(2).max(255).messages({
    "string.empty": "Nama kriteria tidak boleh kosong",
  }),
  description: Joi.string().allow("", null),
}).min(1);

// =============================================================================
// TREATMENT OPTION
// =============================================================================

export const createTreatmentOptionSchema = Joi.object({
  name: Joi.string().min(2).max(255).required().messages({
    "string.empty": "Nama opsi penanganan tidak boleh kosong",
    "any.required": "Nama opsi penanganan wajib diisi",
  }),
  description: Joi.string().allow("", null),
  isAcceptance: Joi.boolean().default(false),
  order: Joi.number().integer().min(0).default(0),
});

export const updateTreatmentOptionSchema = Joi.object({
  name: Joi.string().min(2).max(255).messages({
    "string.empty": "Nama opsi penanganan tidak boleh kosong",
  }),
  description: Joi.string().allow("", null),
  isAcceptance: Joi.boolean(),
  order: Joi.number().integer().min(0),
}).min(1);

// =============================================================================
// MATRIX
// =============================================================================

export const setMatrixSchema = Joi.object({
  cells: Joi.array()
    .items(
      Joi.object({
        row: Joi.number().integer().min(1).required().messages({
          "any.required": "Setiap cell harus memiliki baris (row)",
          "number.min": "Baris minimal 1",
        }),
        col: Joi.number().integer().min(1).required().messages({
          "any.required": "Setiap cell harus memiliki kolom (col)",
          "number.min": "Kolom minimal 1",
        }),
        value: Joi.number().integer().min(0).required().messages({
          "any.required": "Setiap cell harus memiliki nilai (value)",
        }),
        label: Joi.string().max(100).allow("", null),
        color: Joi.string()
          .pattern(/^#[0-9A-Fa-f]{6}$/)
          .allow("", null)
          .messages({
            "string.pattern.base": "Warna cell harus berupa kode hex valid",
          }),
      }),
    )
    .min(1)
    .required()
    .messages({
      "array.min": "Minimal satu cell harus disertakan",
      "any.required": "Data cells wajib diisi",
    }),
});

// Shared ID schema
export const idSchema = Joi.object({
  id: Joi.string().required().messages({
    "string.empty": "ID tidak boleh kosong",
    "any.required": "ID wajib diisi",
  }),
});
