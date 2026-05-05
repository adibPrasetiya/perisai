import { logger, buildRequestFields } from "../lib/logger.lib.js";

export const requestLoggerMiddleware = (req, res, next) => {
  const startTime = Date.now();

  res.on("finish", () => {
    if (res.statusCode < 400) {
      logger.info(
        `SUCCESS: ${req.method} ${req.path}`,
        buildRequestFields(req, res, Date.now() - startTime)
      );
    }
  });

  next();
};
