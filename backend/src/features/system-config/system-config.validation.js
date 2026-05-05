import Joi from "joi";
import { BadRequestError } from "../../error/bad-request.error.js";

const updateSystemConfigSchema = Joi.object({
  value: Joi.string().required().messages({
    "string.empty": "Nilai konfigurasi tidak boleh kosong",
    "any.required": "Nilai konfigurasi wajib diisi",
  }),
});

const systemConfigKeySchema = Joi.object({
  key: Joi.string().required().messages({
    "string.empty": "Key konfigurasi tidak boleh kosong",
    "any.required": "Key konfigurasi wajib diisi",
  }),
});

/**
 * Validates that the string value is compatible with the config's dataType.
 * Throws BadRequestError if validation fails.
 */
const validateConfigValue = (dataType, value) => {
  if (dataType === "BOOLEAN") {
    if (value !== "true" && value !== "false") {
      throw new BadRequestError(
        "Nilai untuk tipe BOOLEAN harus berupa 'true' atau 'false'.",
      );
    }
  }

  if (dataType === "INTEGER") {
    const num = Number(value);
    if (!Number.isInteger(num) || isNaN(num)) {
      throw new BadRequestError(
        "Nilai untuk tipe INTEGER harus berupa bilangan bulat.",
      );
    }
    if (num < 0) {
      throw new BadRequestError(
        "Nilai untuk tipe INTEGER tidak boleh negatif.",
      );
    }
  }
};

export { updateSystemConfigSchema, systemConfigKeySchema, validateConfigValue };
