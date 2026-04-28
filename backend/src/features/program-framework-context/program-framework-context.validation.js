import Joi from "joi";

export const addContextSchema = Joi.object({
  riskContextId: Joi.string().required(),
});
