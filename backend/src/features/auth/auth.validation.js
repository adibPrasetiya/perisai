import Joi from "joi";

const registedNewUserSchema = Joi.object({
  username: Joi.string()
    .min(3)
    .max(255)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .required()
    .messages({
      "string.empty": "Username tidak boleh kosong",
      "string.min": "Username minimal 3 karakter",
      "string.max": "Username maksimal 255 karakter",
      "string.pattern.base":
        "Username hanya boleh berisi huruf, angka, dan underscore",
      "any.required": "Username wajib diisi",
    }),

  name: Joi.string().min(2).max(255).required().messages({
    "string.empty": "Nama tidak boleh kosong",
    "string.min": "Nama minimal 2 karakter",
    "string.max": "Nama maksimal 255 karakter",
    "any.required": "Nama wajib diisi",
  }),

  email: Joi.string().email().max(255).required().messages({
    "string.empty": "Email tidak boleh kosong",
    "string.email": "Format email tidak valid",
    "string.max": "Email maksimal 255 karakter",
    "any.required": "Email wajib diisi",
  }),

  password: Joi.string().max(255).required().messages({
    "string.empty": "Password tidak boleh kosong",
    "string.max": "Password maksimal 255 karakter",
    "any.required": "Password wajib diisi",
  }),

  jabatan: Joi.string().min(2).max(255).required().messages({
    "string.empty": "Jabatan tidak boleh kosong",
    "string.min": "Jabatan minimal 2 karakter",
    "string.max": "Jabatan maksimal 255 karakter",
    "any.required": "Jabatan wajib diisi",
  }),

  unitKerjaId: Joi.string().required().messages({
    "string.empty": "Unit kerja tidak boleh kosong",
    "any.required": "Unit kerja wajib diisi",
  }),

  nomorHP: Joi.string()
    .max(20)
    .pattern(/^(\+62|62|0)[0-9]{8,12}$/)
    .optional()
    .messages({
      "string.max": "Nomor HP maksimal 20 karakter",
      "string.pattern.base":
        "Format nomor HP tidak valid (contoh: 08123456789 atau +6281234567890)",
    }),
});

const loginSchema = Joi.object({
  // User bisa login dengan username atau email
  identifier: Joi.string().required().messages({
    "string.empty": "Username atau email tidak boleh kosong",
    "any.required": "Username atau email wajib diisi",
  }),

  password: Joi.string().required().messages({
    "string.empty": "Password tidak boleh kosong",
    "any.required": "Password wajib diisi",
  }),
});

const verifyLoginTotpSchema = Joi.object({
  totpToken: Joi.string().required().messages({
    "string.empty": "Token tidak boleh kosong",
    "any.required": "Token wajib diisi",
  }),
  code: Joi.string()
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

const forgotPasswordSchema = Joi.object({
  identifier: Joi.string().required().messages({
    "string.empty": "Username atau email tidak boleh kosong",
    "any.required": "Username atau email wajib diisi",
  }),
});

const resetPasswordSchema = Joi.object({
  resetToken: Joi.string().required().messages({
    "string.empty": "Token tidak boleh kosong",
    "any.required": "Token wajib diisi",
  }),

  code: Joi.string()
    .length(6)
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      "string.empty": "Kode TOTP tidak boleh kosong",
      "string.length": "Kode TOTP harus 6 digit",
      "string.pattern.base": "Kode TOTP harus berisi 6 angka",
      "any.required": "Kode TOTP wajib diisi",
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
});

const initTotpSetupSchema = Joi.object({
  totpToken: Joi.string().required().messages({
    "string.empty": "Token tidak boleh kosong",
    "any.required": "Token wajib diisi",
  }),
});

const verifyTotpSetupSchema = Joi.object({
  totpToken: Joi.string().required().messages({
    "string.empty": "Token tidak boleh kosong",
    "any.required": "Token wajib diisi",
  }),
  code: Joi.string()
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

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .required()
    .max(2048)
    .pattern(/^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/)
    .messages({
      "string.empty": "Refresh token tidak boleh kosong",
      "any.required": "Refresh token tidak ditemukan",
      "string.max": "Refresh token tidak valid",
      "string.pattern.base": "Format refresh token tidak valid",
    }),
});

export {
  registedNewUserSchema,
  loginSchema,
  verifyLoginTotpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  initTotpSetupSchema,
  verifyTotpSetupSchema,
  refreshTokenSchema,
};
