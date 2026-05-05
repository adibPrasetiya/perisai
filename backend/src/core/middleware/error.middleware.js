import { BadRequestError } from "../../error/bad-request.error.js";
import { ConflictError } from "../../error/conflict.error.js";
import { ForbiddenError } from "../../error/forbidden.error.js";
import { NotFoundError } from "../../error/not-found.error.js";
import { UnauthorizedError } from "../../error/unathorized.error.js";
import { ValidationError } from "../../error/valdiation.error.js";
import { logger, buildErrorFields } from "../lib/logger.lib.js";

export const errorMiddleware = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof ValidationError) {
    logger.notice(
      `${err.name}: ${req.method} ${req.path}`,
      buildErrorFields(req, err),
    );
    return res.status(err.statusCode).json({
      errors: err.message,
      details: err.details,
    });
  }

  // warning: potensi brute force atau privilege escalation — perlu dimonitor
  if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
    logger.warning(
      `${err.name}: ${req.method} ${req.path}`,
      buildErrorFields(req, err),
    );
    return res.status(err.statusCode).json({
      errors: err.message,
    });
  }

  if (
    err instanceof BadRequestError ||
    err instanceof NotFoundError ||
    err instanceof ConflictError
  ) {
    logger.notice(
      `${err.name}: ${req.method} ${req.path}`,
      buildErrorFields(req, err),
    );
    return res.status(err.statusCode).json({
      errors: err.message,
    });
  }

  logger.error(`InternalServerError: ${req.method} ${req.path}`, {
    ...buildErrorFields(req, {
      statusCode: 500,
      name: err.name || "InternalServerError",
      message: err.message,
    }),
  });

  return res.status(500).json({
    errors: "Internal Server Error",
  });
};
