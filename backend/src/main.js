import { app } from "./core/app/server.js";
import { APP_PORT, NODE_ENV } from "./core/config/constant.config.js";
import { logger } from "./core/lib/logger.lib.js";

app.listen(APP_PORT || 3000, () => {
  logger.info("Server started", {
    port: APP_PORT || 3000,
    env: NODE_ENV,
    pid: process.pid,
  });
});

process.on("uncaughtException", (error) => {
  logger.crit("Uncaught exception", {
    action: "process.uncaughtException",
    err: error.name,
    errmsg: error.message,
    pid: process.pid,
  });
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", {
    action: "process.unhandledRejection",
    err: reason?.name || "UnhandledRejection",
    errmsg: reason?.message || String(reason),
    pid: process.pid,
  });
});

process.on("SIGTERM", () => {
  logger.notice("SIGTERM received — graceful shutdown", {
    action: "process.shutdown",
    signal: "SIGTERM",
    pid: process.pid,
  });
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.notice("SIGINT received — graceful shutdown", {
    action: "process.shutdown",
    signal: "SIGINT",
    pid: process.pid,
  });
  process.exit(0);
});
