import { config } from "dotenv";

config();

//APP CONFIG
export const APP_PORT = process.env.APP_PORT;
export const NODE_ENV = process.env.NODE_ENV;

// DATABASE CONFIG
export const DATABASE_HOST = process.env.DATABASE_HOST;
export const DATABASE_PORT = parseInt(process.env.DATABASE_PORT) || 3306;
export const DATABASE_USER = process.env.DATABASE_USER;
export const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD;
export const DATABASE_NAME = process.env.DATABASE_NAME;

//PASSWORD CONFIG
export const SALT_LENGTH = parseInt(process.env.SALT_LENGTH) || 32;
export const PASSWORD_ITERATIONS =
  parseInt(process.env.PASSWORD_ITERATIONS) || 100000;
export const KEY_LENGTH = parseInt(process.env.KEY_LENGTH) || 64;
export const PASSWORD_EXPIRY_DAYS =
  parseInt(process.env.PASSWORD_EXPIRY_DAYS) || 30;

// TOKEN CONFIG
export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
export const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "15m";
export const REFRESH_TOKEN_EXPIRY_DAYS =
  parseInt(process.env.REFRESH_TOKEN_EXPIRY_DAYS) || 7;
export const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET;
export const PRE_AUTH_TOKEN_SECRET =
  process.env.PRE_AUTH_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET;
export const PRE_AUTH_TOKEN_EXPIRY = process.env.PRE_AUTH_TOKEN_EXPIRY || "5m";

//CORS CONFIG
export const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS;

// TOTP Configuration
export const TOTP_ENCRYPTION_KEY = process.env.TOTP_ENCRYPTION_KEY;
export const JWT_TOTP_SECRET = process.env.JWT_TOTP_SECRET;
export const TOTP_TOKEN_EXPIRY = "5m";
export const TOTP_ISSUER = "PERISAI WEB APP";
export const TOTP_DIGITS = 6;
export const TOTP_PERIOD = 30;
export const TOTP_WINDOW = 1;
