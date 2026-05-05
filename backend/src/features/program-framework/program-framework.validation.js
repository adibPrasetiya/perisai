import Joi from "joi";
import { PROGRAM_FRAMEWORK_STATUSES } from "../../core/config/enum.config.js";

const addFrameworkSchema = Joi.object({
  frameworkId: Joi.string().required().messages({
    "string.empty": "ID framework tidak boleh kosong",
    "any.required": "ID framework wajib diisi",
  }),
});

const updateProgramFrameworkSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(PROGRAM_FRAMEWORK_STATUSES))
    .messages({
      "any.only": `Status harus salah satu dari: ${Object.values(PROGRAM_FRAMEWORK_STATUSES).join(", ")}`,
    }),
}).min(1);

const programFrameworkIdSchema = Joi.object({
  id: Joi.string().required().messages({
    "string.empty": "ID program framework tidak boleh kosong",
    "any.required": "ID program framework wajib diisi",
  }),
});

export {
  addFrameworkSchema,
  updateProgramFrameworkSchema,
  programFrameworkIdSchema,
};
