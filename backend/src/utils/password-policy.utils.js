import { prismaClient } from "../core/lib/database.lib.js";
import { SYSTEM_CONFIG_DEFAULTS } from "../features/system-config/system-config.defaults.js";
import { ValidationError } from "../error/valdiation.error.js";

const POLICY_KEYS = [
  "PASSWORD_MIN_LENGTH",
  "PASSWORD_REQUIRE_UPPERCASE",
  "PASSWORD_REQUIRE_NUMBER",
  "PASSWORD_REQUIRE_SPECIAL_CHAR",
];

const MAX_AGE_KEY = "PASSWORD_MAX_AGE_DAYS";

const getDefault = (key) =>
  SYSTEM_CONFIG_DEFAULTS.find((d) => d.key === key)?.value;

/**
 * Reads PASSWORD_MAX_AGE_DAYS from DB. Falls back to defaults if not found.
 * Returns 0 if no expiry is configured.
 */
export const getPasswordMaxAgeDays = async () => {
  let dbConfig = null;

  try {
    dbConfig = await prismaClient.systemConfig.findUnique({
      where: { key: MAX_AGE_KEY },
      select: { value: true },
    });
  } catch {
    // DB not available — use defaults
  }

  const value = dbConfig?.value ?? getDefault(MAX_AGE_KEY) ?? "0";
  return parseInt(value, 10);
};

/**
 * Computes the password expiry date given the last change date and max age.
 * Returns null if maxAgeDays is 0 (no expiry) or if passwordChangedAt is null.
 *
 * @param {Date|null} passwordChangedAt
 * @param {number} maxAgeDays
 * @returns {Date|null}
 */
export const computePasswordExpiresAt = (passwordChangedAt, maxAgeDays) => {
  if (!maxAgeDays || maxAgeDays <= 0 || !passwordChangedAt) return null;
  const expiresAt = new Date(passwordChangedAt);
  expiresAt.setDate(expiresAt.getDate() + maxAgeDays);
  return expiresAt;
};

/**
 * Reads password policy from DB. Falls back to defaults if key not found.
 */
export const getPasswordPolicy = async () => {
  let dbConfigs = [];

  try {
    dbConfigs = await prismaClient.systemConfig.findMany({
      where: { key: { in: POLICY_KEYS } },
      select: { key: true, value: true },
    });
  } catch {
    // DB not available — use defaults entirely
  }

  const map = Object.fromEntries(dbConfigs.map((c) => [c.key, c.value]));

  const get = (key) => map[key] ?? getDefault(key);

  return {
    minLength: parseInt(get("PASSWORD_MIN_LENGTH") ?? "8", 10),
    requireUppercase: (get("PASSWORD_REQUIRE_UPPERCASE") ?? "true") === "true",
    requireNumber: (get("PASSWORD_REQUIRE_NUMBER") ?? "true") === "true",
    requireSpecialChar:
      (get("PASSWORD_REQUIRE_SPECIAL_CHAR") ?? "true") === "true",
  };
};

/**
 * Validates a password against the current system policy.
 * Throws ValidationError with the given fieldName if validation fails.
 *
 * @param {string} password - The plaintext password to check.
 * @param {string} [fieldName="password"] - The field path used in the error response.
 */
export const validatePasswordPolicy = async (
  password,
  fieldName = "password",
) => {
  const policy = await getPasswordPolicy();
  const errors = [];

  if (password.length < policy.minLength) {
    errors.push({
      path: fieldName,
      detail: `Password minimal ${policy.minLength} karakter`,
    });
  }

  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push({
      path: fieldName,
      detail: "Password harus mengandung minimal 1 huruf kapital (A-Z)",
    });
  }

  if (policy.requireNumber && !/\d/.test(password)) {
    errors.push({
      path: fieldName,
      detail: "Password harus mengandung minimal 1 angka (0-9)",
    });
  }

  if (
    policy.requireSpecialChar &&
    !/[@$!%*?&#^()_\-+=]/.test(password)
  ) {
    errors.push({
      path: fieldName,
      detail:
        "Password harus mengandung minimal 1 karakter spesial (@$!%*?&#^()_-+=)",
    });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
};
