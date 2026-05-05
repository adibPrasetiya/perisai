import winston from "winston";
import os from "os";
import { NODE_ENV } from "../config/constant.config.js";

const SYSLOG_SEVERITY = {
  emerg: 0,
  alert: 1,
  crit: 2,
  error: 3,
  warning: 4,
  notice: 5,
  info: 6,
  debug: 7,
};

// facility 16 = local0, konvensional untuk aplikasi user-space
const FACILITY = 16;
const HOSTNAME = os.hostname();
const APP_NAME = "perisai";

const formatKV = (key, value) => {
  if (value === undefined || value === null || value === "") return null;
  const str = String(value);
  return /\s/.test(str) ? `${key}="${str}"` : `${key}=${str}`;
};

const syslogFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    const severity = SYSLOG_SEVERITY[level] ?? 7;
    const priority = `<${FACILITY * 8 + severity}>`;
    const header = `${priority}${timestamp} ${HOSTNAME} ${APP_NAME}[${process.pid}]: ${level}:`;

    const fields = Object.entries(meta)
      .map(([k, v]) => formatKV(k, v))
      .filter(Boolean)
      .join(" ");

    return fields ? `${header} ${message} ${fields}` : `${header} ${message}`;
  })
);

export const logger = winston.createLogger({
  levels: winston.config.syslog.levels,
  level: NODE_ENV === "production" ? "notice" : "debug",
  format: syslogFormat,
  transports: [
    new winston.transports.Console({
      stderrLevels: ["emerg", "alert", "crit", "error", "warning"],
    }),
  ],
  exitOnError: false,
});

winston.addColors(winston.config.syslog.colors);

export const buildRequestFields = (req, res, durationMs) => ({
  method: req.method,
  path: req.path,
  status: res.statusCode,
  ip:
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    "-",
  user: req.user?.username ?? "-",
  reqid:
    req.headers["x-request-id"] || req.headers["x-correlation-id"] || "-",
  duration: `${durationMs}ms`,
});

export const buildErrorFields = (req, err) => ({
  method: req.method,
  path: req.path,
  status: err.statusCode ?? 500,
  ip:
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    "-",
  user: req.user?.username ?? "-",
  reqid:
    req.headers["x-request-id"] || req.headers["x-correlation-id"] || "-",
  err: err.name ?? "Error",
  errmsg: err.message ?? "-",
});
