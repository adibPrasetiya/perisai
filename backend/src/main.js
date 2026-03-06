import { app } from "./core/app/server.js";
import { APP_PORT, NODE_ENV } from "./core/config/constant.config.js";

app.listen(APP_PORT || 3000, () => {
  console.info("Server Started", {
    port: APP_PORT || 3000,
    environtment: NODE_ENV,
    pid: process.pid,
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception", {
    action: "process.uncaughtException",
    errorName: error.name,
    errorMessage: error.message,
    stackTrace: error.stack,
  });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection", {
    action: "process.unhandledRejection",
    reason: reason?.message || String(reason),
    stackTrace: reason?.stack,
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.info("SIGTERM received, shutting down gracefully", {
    action: "process.shutdown",
  });
  process.exit(0);
});

process.on("SIGINT", () => {
  console.info("SIGINT received, shutting down gracefully", {
    action: "process.shutdown",
  });
  process.exit(0);
});
