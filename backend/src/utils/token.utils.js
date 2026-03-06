import jwt from "jsonwebtoken";
import {
  ACCESS_TOKEN_EXPIRY,
  ACCESS_TOKEN_SECRET,
  PRE_AUTH_TOKEN_EXPIRY,
  PRE_AUTH_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRY_DAYS,
} from "../core/config/constant.config.js";
import { prismaClient } from "../core/lib/database.lib.js";
import { SYSTEM_CONFIG_DEFAULTS } from "../features/system-config/system-config.defaults.js";

const TOKEN_CONFIG_KEYS = ["ACCESS_TOKEN_EXPIRY_MINUTES", "SESSION_EXPIRY_DAYS"];

const getConfigDefault = (key) =>
  SYSTEM_CONFIG_DEFAULTS.find((d) => d.key === key)?.value;

/**
 * Reads ACCESS_TOKEN_EXPIRY_MINUTES and SESSION_EXPIRY_DAYS from DB.
 * Falls back to system-config.defaults.js, then to env/constant values.
 */
const getTokenConfig = async () => {
  let dbConfigs = [];

  try {
    dbConfigs = await prismaClient.systemConfig.findMany({
      where: { key: { in: TOKEN_CONFIG_KEYS } },
      select: { key: true, value: true },
    });
  } catch {
    // DB not available — use defaults
  }

  const map = Object.fromEntries(dbConfigs.map((c) => [c.key, c.value]));
  const get = (key) => map[key] ?? getConfigDefault(key);

  const accessTokenExpiryMinutes = parseInt(
    get("ACCESS_TOKEN_EXPIRY_MINUTES") ?? "15",
    10,
  );
  const sessionExpiryDays = parseInt(
    get("SESSION_EXPIRY_DAYS") ?? String(REFRESH_TOKEN_EXPIRY_DAYS),
    10,
  );

  return {
    accessTokenExpiry: `${accessTokenExpiryMinutes}m`,
    accessTokenExpiryMinutes,
    sessionExpiryDays,
  };
};

const generateAccessToken = (username, role, expiry = ACCESS_TOKEN_EXPIRY) =>
  jwt.sign({ sub: username, role }, ACCESS_TOKEN_SECRET, {
    expiresIn: expiry,
  });

const verifyAccessToken = (token) => jwt.verify(token, ACCESS_TOKEN_SECRET);

const generatePreAuthToken = (payload) =>
  jwt.sign(payload, PRE_AUTH_TOKEN_SECRET, {
    expiresIn: PRE_AUTH_TOKEN_EXPIRY,
  });

const verifyPreAuthToken = (token) => jwt.verify(token, PRE_AUTH_TOKEN_SECRET);

const generateRefreshToken = (userId, expiryDays = REFRESH_TOKEN_EXPIRY_DAYS) =>
  jwt.sign({ sub: userId }, REFRESH_TOKEN_SECRET, {
    expiresIn: `${expiryDays}d`,
  });

const verifyRefreshToken = (token) => jwt.verify(token, REFRESH_TOKEN_SECRET);

export {
  getTokenConfig,
  generateAccessToken,
  verifyAccessToken,
  generatePreAuthToken,
  verifyPreAuthToken,
  generateRefreshToken,
  verifyRefreshToken,
};
