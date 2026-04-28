import Joi from "joi";

export const createRiskLevelSchema = Joi.object({
  name: Joi.string().max(100).required().messages({
    "string.empty": "Nama level tidak boleh kosong",
    "string.max": "Nama level maksimal 100 karakter",
    "any.required": "Nama level wajib diisi",
  }),

  description: Joi.string().allow("", null),

  minScore: Joi.number().integer().min(0).required().messages({
    "number.base": "Skor minimum harus berupa angka",
    "number.min": "Skor minimum tidak boleh negatif",
    "any.required": "Skor minimum wajib diisi",
  }),

  maxScore: Joi.number().integer().min(0).required().messages({
    "number.base": "Skor maksimum harus berupa angka",
    "number.min": "Skor maksimum tidak boleh negatif",
    "any.required": "Skor maksimum wajib diisi",
  }),

  color: Joi.string()
    .pattern(/^#[0-9A-Fa-f]{6}$/)
    .allow("", null)
    .messages({
      "string.pattern.base": "Warna harus berupa kode hex valid (contoh: #FF0000)",
    }),

  order: Joi.number().integer().min(0).default(0),
});

export const updateRiskLevelSchema = Joi.object({
  name: Joi.string().max(100).messages({
    "string.empty": "Nama level tidak boleh kosong",
    "string.max": "Nama level maksimal 100 karakter",
  }),

  description: Joi.string().allow("", null),

  minScore: Joi.number().integer().min(0).messages({
    "number.base": "Skor minimum harus berupa angka",
    "number.min": "Skor minimum tidak boleh negatif",
  }),

  maxScore: Joi.number().integer().min(0).messages({
    "number.base": "Skor maksimum harus berupa angka",
    "number.min": "Skor maksimum tidak boleh negatif",
  }),

  color: Joi.string()
    .pattern(/^#[0-9A-Fa-f]{6}$/)
    .allow("", null)
    .messages({
      "string.pattern.base": "Warna harus berupa kode hex valid (contoh: #FF0000)",
    }),

  order: Joi.number().integer().min(0),
}).min(1);

export const bulkSetRiskLevelsSchema = Joi.object({
  levels: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().max(100).required().messages({
          "any.required": "Setiap level harus memiliki nama",
        }),
        description: Joi.string().allow("", null),
        minScore: Joi.number().integer().min(0).required().messages({
          "any.required": "Setiap level harus memiliki skor minimum",
        }),
        maxScore: Joi.number().integer().min(0).required().messages({
          "any.required": "Setiap level harus memiliki skor maksimum",
        }),
        color: Joi.string()
          .pattern(/^#[0-9A-Fa-f]{6}$/)
          .allow("", null),
        order: Joi.number().integer().min(0).default(0),
      }),
    )
    .min(1)
    .required()
    .messages({
      "array.min": "Minimal satu level harus disertakan",
      "any.required": "Data levels wajib diisi",
    }),
});

export const idSchema = Joi.object({
  id: Joi.string().required().messages({
    "string.empty": "ID tidak boleh kosong",
    "any.required": "ID wajib diisi",
  }),
});
