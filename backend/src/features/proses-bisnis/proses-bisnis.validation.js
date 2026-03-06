import Joi from "joi";
import { PROCESS_BUSINESS_STATUSES } from "../../core/config/enum.config.js";

const createProsesBisnisSchema = Joi.object({
  name: Joi.string().min(2).max(255).required().messages({
    "string.empty": "Nama proses bisnis tidak boleh kosong",
    "string.min": "Nama proses bisnis minimal 2 karakter",
    "string.max": "Nama proses bisnis maksimal 255 karakter",
    "any.required": "Nama proses bisnis wajib diisi",
  }),

  code: Joi.string()
    .min(2)
    .max(100)
    .pattern(/^[A-Z0-9_-]+$/)
    .required()
    .messages({
      "string.empty": "Kode proses bisnis tidak boleh kosong",
      "string.min": "Kode proses bisnis minimal 2 karakter",
      "string.max": "Kode proses bisnis maksimal 100 karakter",
      "string.pattern.base":
        "Kode proses bisnis hanya boleh berisi huruf kapital, angka, underscore, dan dash",
      "any.required": "Kode proses bisnis wajib diisi",
    }),

  description: Joi.string().allow("", null).messages({
    "string.base": "Deskripsi harus berupa teks",
  }),

  owner: Joi.string().max(255).allow("", null).messages({
    "string.max": "Owner maksimal 255 karakter",
  }),

  status: Joi.string()
    .valid(...Object.values(PROCESS_BUSINESS_STATUSES))
    .default(PROCESS_BUSINESS_STATUSES.ACTIVE)
    .messages({
      "any.only": `Status harus salah satu dari: ${Object.values(PROCESS_BUSINESS_STATUSES).join(", ")}`,
    }),
});

const updateProsesBisnisSchema = Joi.object({
  name: Joi.string().min(2).max(255).messages({
    "string.empty": "Nama proses bisnis tidak boleh kosong",
    "string.min": "Nama proses bisnis minimal 2 karakter",
    "string.max": "Nama proses bisnis maksimal 255 karakter",
  }),

  code: Joi.string()
    .min(2)
    .max(100)
    .pattern(/^[A-Z0-9_-]+$/)
    .messages({
      "string.empty": "Kode proses bisnis tidak boleh kosong",
      "string.min": "Kode proses bisnis minimal 2 karakter",
      "string.max": "Kode proses bisnis maksimal 100 karakter",
      "string.pattern.base":
        "Kode proses bisnis hanya boleh berisi huruf kapital, angka, underscore, dan dash",
    }),

  description: Joi.string().allow("", null).messages({
    "string.base": "Deskripsi harus berupa teks",
  }),

  owner: Joi.string().max(255).allow("", null).messages({
    "string.max": "Owner maksimal 255 karakter",
  }),
}).min(1);

const searchProsesBisnisSchema = Joi.object({
  name: Joi.string().max(255).messages({
    "string.max": "Nama maksimal 255 karakter",
  }),

  code: Joi.string().max(100).messages({
    "string.max": "Kode maksimal 100 karakter",
  }),

  status: Joi.string()
    .valid(...Object.values(PROCESS_BUSINESS_STATUSES))
    .messages({
      "any.only": `Status harus salah satu dari: ${Object.values(PROCESS_BUSINESS_STATUSES).join(", ")}`,
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

const unitKerjaIdSchema = Joi.object({
  unitKerjaId: Joi.string().required().messages({
    "string.empty": "ID unit kerja tidak boleh kosong",
    "any.required": "ID unit kerja wajib diisi",
  }),
});

const prosesBisnisIdSchema = Joi.object({
  id: Joi.string().required().messages({
    "string.empty": "ID proses bisnis tidak boleh kosong",
    "any.required": "ID proses bisnis wajib diisi",
  }),
});

export {
  createProsesBisnisSchema,
  updateProsesBisnisSchema,
  searchProsesBisnisSchema,
  unitKerjaIdSchema,
  prosesBisnisIdSchema,
};
