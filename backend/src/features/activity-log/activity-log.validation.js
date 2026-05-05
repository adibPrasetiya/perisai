import Joi from "joi";

export const listActivityLogSchema = Joi.object({
  action: Joi.string().max(100).optional(),
  actionType: Joi.string().valid("CREATE", "UPDATE", "DELETE", "AUTH").optional(),
  level: Joi.string().valid("notice", "warning", "info").optional(),
  userId: Joi.string().optional(),
  username: Joi.string().max(255).optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().min(Joi.ref("startDate")).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});
