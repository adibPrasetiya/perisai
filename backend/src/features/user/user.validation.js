import Joi from "joi";
import { ROLES } from "../../core/config/enum.config.js";

const searchUserSchema = Joi.object({
  name: Joi.string().max(255).messages({
    "string.max": "Nama maksimal 255 karakter",
  }),

  username: Joi.string().max(255).messages({
    "string.max": "Username maksimal 255 karakter",
  }),

  role: Joi.string()
    .valid(...Object.values(ROLES))
    .messages({
      "any.only": `Role harus salah satu dari: ${Object.values(ROLES).join(", ")}`,
    }),

  isActive: Joi.boolean().messages({
    "boolean.base": "isActive harus berupa boolean (true/false)",
  }),

  isVerified: Joi.boolean().messages({
    "boolean.base": "isVerified harus berupa boolean (true/false)",
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

const updatePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    "string.empty": "Password saat ini tidak boleh kosong",
    "any.required": "Password saat ini wajib diisi",
  }),

  newPassword: Joi.string().max(255).required().messages({
    "string.empty": "Password baru tidak boleh kosong",
    "string.max": "Password maksimal 255 karakter",
    "any.required": "Password baru wajib diisi",
  }),

  confirmPassword: Joi.string()
    .valid(Joi.ref("newPassword"))
    .required()
    .messages({
      "any.only": "Konfirmasi password tidak cocok dengan password baru",
      "any.required": "Konfirmasi password wajib diisi",
    }),

  totpCode: Joi.string()
    .length(6)
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      "string.empty": "Kode TOTP tidak boleh kosong",
      "string.length": "Kode TOTP harus 6 digit",
      "string.pattern.base": "Kode TOTP harus berisi 6 angka",
      "any.required": "Kode TOTP wajib diisi",
    }),
});

const updateMyAccountSchema = Joi.object({
  name: Joi.string().min(2).max(255).messages({
    "string.empty": "Nama tidak boleh kosong",
    "string.min": "Nama minimal 2 karakter",
    "string.max": "Nama maksimal 255 karakter",
  }),

  email: Joi.string().email().max(255).messages({
    "string.empty": "Email tidak boleh kosong",
    "string.email": "Format email tidak valid",
    "string.max": "Email maksimal 255 karakter",
  }),

  password: Joi.string().required().messages({
    "string.empty": "Password tidak boleh kosong",
    "any.required": "Password wajib diisi untuk konfirmasi",
  }),
}).or("name", "email").messages({
  "object.missing": "Minimal satu field (nama atau email) harus diisi",
});

const updateMyProfileSchema = Joi.object({
  jabatan: Joi.string().min(2).max(255).messages({
    "string.empty": "Jabatan tidak boleh kosong",
    "string.min": "Jabatan minimal 2 karakter",
    "string.max": "Jabatan maksimal 255 karakter",
  }),

  nomorHP: Joi.string()
    .pattern(/^(\+62|62|0)[0-9]{9,12}$/)
    .allow("")
    .messages({
      "string.pattern.base":
        "Nomor HP harus diawali +62, 62, atau 0 dan terdiri dari 10-13 digit",
    }),

  password: Joi.string().required().messages({
    "string.empty": "Password tidak boleh kosong",
    "any.required": "Password wajib diisi untuk konfirmasi",
  }),
}).or("jabatan", "nomorHP").messages({
  "object.missing": "Minimal satu field (jabatan atau nomor HP) harus diisi",
});

const resetTotpSchema = Joi.object({
  password: Joi.string().required().messages({
    "string.empty": "Password tidak boleh kosong",
    "any.required": "Password wajib diisi untuk konfirmasi",
  }),

  totpCode: Joi.string()
    .length(6)
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      "string.empty": "Kode TOTP tidak boleh kosong",
      "string.length": "Kode TOTP harus 6 digit",
      "string.pattern.base": "Kode TOTP harus berisi 6 angka",
      "any.required": "Kode TOTP wajib diisi",
    }),
});

const adminUpdateUserSchema = Joi.object({
  unitKerjaId: Joi.string().messages({
    "string.empty": "Unit kerja ID tidak boleh kosong",
  }),

  roles: Joi.array()
    .items(
      Joi.string()
        .valid(...Object.values(ROLES))
        .messages({
          "any.only": `Role harus salah satu dari: ${Object.values(ROLES).join(", ")}`,
        }),
    )
    .min(1)
    .messages({
      "array.min": "Minimal satu role harus dipilih",
      "array.base": "Roles harus berupa array",
    }),
}).or("unitKerjaId", "roles").messages({
  "object.missing": "Minimal satu field (unitKerjaId atau roles) harus diisi",
});

export { searchUserSchema, updatePasswordSchema, updateMyAccountSchema, updateMyProfileSchema, resetTotpSchema, adminUpdateUserSchema };
