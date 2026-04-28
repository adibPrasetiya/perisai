import Joi from "joi";

export const overviewQuerySchema = Joi.object({
  programId: Joi.string().optional(),
  riskContextId: Joi.string().optional(),
});

export const topRisksQuerySchema = Joi.object({
  programId: Joi.string().optional(),
  riskContextId: Joi.string().optional(),
  limit: Joi.number().integer().min(5).max(20).default(10),
});

export const activityQuerySchema = Joi.object({
  programId: Joi.string().optional(),
  riskContextId: Joi.string().optional(),
});

export const unitsQuerySchema = Joi.object({
  programId: Joi.string().optional(),
  riskContextId: Joi.string().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(15),
});

export const risksQuerySchema = Joi.object({
  programId: Joi.string().optional(),
  riskContextId: Joi.string().optional(),
  unitKerjaId: Joi.string().optional(),
  riskLevelName: Joi.string().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});
