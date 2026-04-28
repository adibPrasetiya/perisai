import Joi from "joi";
import { WORKING_PAPER_STATUSES } from "../../core/config/enum.config.js";

const createWorkingPaperSchema = Joi.object({
  programId: Joi.string().required().messages({
    "string.empty": "ID program tidak boleh kosong",
    "any.required": "ID program wajib diisi",
  }),

  title: Joi.string().max(255).allow("", null).messages({
    "string.max": "Judul maksimal 255 karakter",
  }),
});

const searchWorkingPaperSchema = Joi.object({
  programId: Joi.string().messages({
    "string.base": "ID program harus berupa teks",
  }),

  year: Joi.number().integer().min(2000).max(2100).messages({
    "number.base": "Tahun harus berupa angka",
    "number.integer": "Tahun harus berupa bilangan bulat",
    "number.min": "Tahun minimal 2000",
    "number.max": "Tahun maksimal 2100",
  }),

  status: Joi.string()
    .valid(...Object.values(WORKING_PAPER_STATUSES))
    .messages({
      "any.only": `Status harus salah satu dari: ${Object.values(WORKING_PAPER_STATUSES).join(", ")}`,
    }),

  page: Joi.number().integer().min(1).default(1).messages({
    "number.base": "Page harus berupa angka",
    "number.integer": "Page harus berupa bilangan bulat",
    "number.min": "Page minimal 1",
  }),

  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    "number.base": "Limit harus berupa angka",
    "number.integer": "Limit harus berupa bilangan bulat",
    "number.min": "Limit minimal 1",
    "number.max": "Limit maksimal 100",
  }),
});

const workingPaperIdSchema = Joi.object({
  id: Joi.string().required().messages({
    "string.empty": "ID kertas kerja tidak boleh kosong",
    "any.required": "ID kertas kerja wajib diisi",
  }),
});

const updateWorkingPaperSchema = Joi.object({
  title: Joi.string().max(255).allow("", null).messages({
    "string.max": "Judul maksimal 255 karakter",
  }),
}).min(1).messages({
  "object.min": "Minimal satu field harus diisi untuk update",
});

const requestRevisionSchema = Joi.object({
  reviewNote: Joi.string().trim().min(1).required().messages({
    "string.empty": "Catatan revisi tidak boleh kosong",
    "string.min": "Catatan revisi tidak boleh kosong",
    "any.required": "Catatan revisi wajib diisi",
  }),
});

export {
  createWorkingPaperSchema,
  searchWorkingPaperSchema,
  workingPaperIdSchema,
  updateWorkingPaperSchema,
  requestRevisionSchema,
};
