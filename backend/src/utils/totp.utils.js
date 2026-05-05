import crypto from "crypto";
import jwt from "jsonwebtoken";
import { TOTP, Secret } from "otpauth";
import {
  TOTP_ENCRYPTION_KEY,
  JWT_TOTP_SECRET,
  TOTP_TOKEN_EXPIRY,
  TOTP_ISSUER,
  TOTP_DIGITS,
  TOTP_PERIOD,
  TOTP_WINDOW,
} from "../core/config/constant.config.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const encryptionKeyBuffer = Buffer.from(TOTP_ENCRYPTION_KEY, "hex");

export const encryptTotpSecret = (secret) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, encryptionKeyBuffer, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(secret, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${encrypted}:${authTag}`;
};

export const decryptTotpSecret = (encryptedSecret) => {
  const [ivHex, ciphertextHex, authTagHex] = encryptedSecret.split(":");

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKeyBuffer, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertextHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};

export const generateTotpSecret = (username) => {
  const secret = new Secret({ size: 20 });

  const totp = new TOTP({
    issuer: TOTP_ISSUER,
    label: username,
    algorithm: "SHA1",
    digits: TOTP_DIGITS,
    period: TOTP_PERIOD,
    secret: secret,
  });

  return {
    secret: secret.base32,
    uri: totp.toString(),
    base32: secret.base32,
  };
};

export const verifyTotpCode = (code, base32Secret) => {
  const totp = new TOTP({
    issuer: TOTP_ISSUER,
    algorithm: "SHA1",
    digits: TOTP_DIGITS,
    period: TOTP_PERIOD,
    secret: Secret.fromBase32(base32Secret),
  });

  const delta = totp.validate({ token: code, window: TOTP_WINDOW });
  return delta !== null;
};

export const generateTotpToken = (payload) => {
  return jwt.sign(
    {
      userId: payload.userId,
      purpose: payload.purpose,
    },
    JWT_TOTP_SECRET,
    {
      expiresIn: TOTP_TOKEN_EXPIRY,
    },
  );
};

export const verifyTotpToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_TOTP_SECRET);
    if (!decoded.purpose || !decoded.purpose.startsWith("totp_")) {
      throw new Error("Invalid token purpose");
    }
    return decoded;
  } catch (error) {
    throw new Error("Invalid or expired TOTP token");
  }
};
