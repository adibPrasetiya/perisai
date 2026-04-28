import Joi from "joi";
import { RISK_PROGRAM_STATUSES } from "../../core/config/enum.config.js";

const createRiskProgramSchema = Joi.object({
  name: Joi.string().min(2).max(255).required().messages({
    "string.empty": "Nama program risiko tidak boleh kosong",
    "string.min": "Nama program risiko minimal 2 karakter",
    "string.max": "Nama program risiko maksimal 255 karakter",
    "any.required": "Nama program risiko wajib diisi",
  }),

  description: Joi.string().allow("", null).messages({
    "string.base": "Deskripsi harus berupa teks",
  }),

  year: Joi.number().integer().min(2000).max(2100).required().messages({
    "number.base": "Tahun harus berupa angka",
    "number.integer": "Tahun harus berupa bilangan bulat",
    "number.min": "Tahun minimal 2000",
    "number.max": "Tahun maksimal 2100",
    "any.required": "Tahun wajib diisi",
  }),
  // status intentionally excluded — new programs always start as DRAFT
});

const updateRiskProgramSchema = Joi.object({
  name: Joi.string().min(2).max(255).messages({
    "string.empty": "Nama program risiko tidak boleh kosong",
    "string.min": "Nama program risiko minimal 2 karakter",
    "string.max": "Nama program risiko maksimal 255 karakter",
  }),

  description: Joi.string().allow("", null).messages({
    "string.base": "Deskripsi harus berupa teks",
  }),

  year: Joi.number().integer().min(2000).max(2100).messages({
    "number.base": "Tahun harus berupa angka",
    "number.integer": "Tahun harus berupa bilangan bulat",
    "number.min": "Tahun minimal 2000",
    "number.max": "Tahun maksimal 2100",
  }),
  // status intentionally excluded — use dedicated activate/deactivate/set-draft endpoints
}).min(1);

const searchRiskProgramSchema = Joi.object({
  name: Joi.string().max(255).messages({
    "string.max": "Nama maksimal 255 karakter",
  }),

  year: Joi.number().integer().min(2000).max(2100).messages({
    "number.base": "Tahun harus berupa angka",
    "number.integer": "Tahun harus berupa bilangan bulat",
  }),

  status: Joi.string()
    .valid(...Object.values(RISK_PROGRAM_STATUSES))
    .messages({
      "any.only": `Status harus salah satu dari: ${Object.values(RISK_PROGRAM_STATUSES).join(", ")}`,
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

const riskProgramIdSchema = Joi.object({
  id: Joi.string().required().messages({
    "string.empty": "ID program risiko tidak boleh kosong",
    "any.required": "ID program risiko wajib diisi",
  }),
});

export {
  createRiskProgramSchema,
  updateRiskProgramSchema,
  searchRiskProgramSchema,
  riskProgramIdSchema,
};
