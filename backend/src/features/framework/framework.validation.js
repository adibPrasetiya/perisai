import Joi from "joi";

const createFrameworkSchema = Joi.object({
  code: Joi.string()
    .pattern(/^[A-Z0-9_-]+$/)
    .min(2)
    .max(100)
    .required()
    .messages({
      "string.empty": "Kode framework tidak boleh kosong",
      "string.pattern.base":
        "Kode framework hanya boleh mengandung huruf kapital, angka, underscore, dan dash",
      "string.min": "Kode framework minimal 2 karakter",
      "string.max": "Kode framework maksimal 100 karakter",
      "any.required": "Kode framework wajib diisi",
    }),

  name: Joi.string().min(2).max(255).required().messages({
    "string.empty": "Nama framework tidak boleh kosong",
    "string.min": "Nama framework minimal 2 karakter",
    "string.max": "Nama framework maksimal 255 karakter",
    "any.required": "Nama framework wajib diisi",
  }),

  version: Joi.string().max(50).allow("", null).messages({
    "string.max": "Versi framework maksimal 50 karakter",
  }),

  description: Joi.string().allow("", null).messages({
    "string.base": "Deskripsi harus berupa teks",
  }),
});

const updateFrameworkSchema = Joi.object({
  code: Joi.string()
    .pattern(/^[A-Z0-9_-]+$/)
    .min(2)
    .max(100)
    .messages({
      "string.empty": "Kode framework tidak boleh kosong",
      "string.pattern.base":
        "Kode framework hanya boleh mengandung huruf kapital, angka, underscore, dan dash",
      "string.min": "Kode framework minimal 2 karakter",
      "string.max": "Kode framework maksimal 100 karakter",
    }),

  name: Joi.string().min(2).max(255).messages({
    "string.empty": "Nama framework tidak boleh kosong",
    "string.min": "Nama framework minimal 2 karakter",
    "string.max": "Nama framework maksimal 255 karakter",
  }),

  version: Joi.string().max(50).allow("", null).messages({
    "string.max": "Versi framework maksimal 50 karakter",
  }),

  description: Joi.string().allow("", null).messages({
    "string.base": "Deskripsi harus berupa teks",
  }),
}).min(1);

const searchFrameworkSchema = Joi.object({
  name: Joi.string().max(255).messages({
    "string.max": "Nama maksimal 255 karakter",
  }),

  code: Joi.string().max(100).messages({
    "string.max": "Kode maksimal 100 karakter",
  }),

  isActive: Joi.boolean().messages({
    "boolean.base": "Status aktif harus berupa boolean",
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

const frameworkIdSchema = Joi.object({
  id: Joi.string().required().messages({
    "string.empty": "ID framework tidak boleh kosong",
    "any.required": "ID framework wajib diisi",
  }),
});

export {
  createFrameworkSchema,
  updateFrameworkSchema,
  searchFrameworkSchema,
  frameworkIdSchema,
};
