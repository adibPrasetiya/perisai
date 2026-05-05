import { validate } from "../../utils/validator.utils.js";
import {
  updateSystemConfigSchema,
  systemConfigKeySchema,
  validateConfigValue,
} from "./system-config.validation.js";
import { SYSTEM_CONFIG_DEFAULTS } from "./system-config.defaults.js";
import { prismaClient } from "../../core/lib/database.lib.js";
import { NotFoundError } from "../../error/not-found.error.js";
import { ForbiddenError } from "../../error/forbidden.error.js";

const GROUP_ORDER = ["PASSWORD_POLICY", "SESSION", "SECURITY"];

const getAll = async () => {
  // Seed defaults if not yet present
  await prismaClient.systemConfig.createMany({
    data: SYSTEM_CONFIG_DEFAULTS,
    skipDuplicates: true,
  });

  const configs = await prismaClient.systemConfig.findMany({
    orderBy: { group: "asc" },
  });

  // Group and sort by GROUP_ORDER
  const grouped = {};
  for (const config of configs) {
    if (!grouped[config.group]) grouped[config.group] = [];
    grouped[config.group].push(config);
  }

  const result = GROUP_ORDER.filter((g) => grouped[g]).map((g) => ({
    group: g,
    items: grouped[g],
  }));

  // Append any unknown groups not in GROUP_ORDER
  for (const g of Object.keys(grouped)) {
    if (!GROUP_ORDER.includes(g)) {
      result.push({ group: g, items: grouped[g] });
    }
  }

  return {
    message: "Konfigurasi sistem berhasil dimuat",
    data: result,
  };
};

const updateValue = async (key, reqBody, userId) => {
  const { key: validKey } = validate(systemConfigKeySchema, { key });
  const { value } = validate(updateSystemConfigSchema, reqBody);

  const config = await prismaClient.systemConfig.findUnique({
    where: { key: validKey },
  });

  if (!config) {
    throw new NotFoundError(`Konfigurasi "${validKey}" tidak ditemukan.`);
  }

  if (!config.isEditable) {
    throw new ForbiddenError(
      `Konfigurasi "${config.label}" tidak dapat diubah karena bersifat tetap.`,
    );
  }

  validateConfigValue(config.dataType, value);

  const updated = await prismaClient.systemConfig.update({
    where: { key: validKey },
    data: { value, updatedBy: userId },
  });

  console.log("ACTION_TYPES.SYSTEM_CONFIG_UPDATED", {
    key: validKey,
    oldValue: config.value,
    newValue: value,
    updatedBy: userId,
  });

  return {
    message: `Konfigurasi "${config.label}" berhasil diperbarui`,
    data: updated,
  };
};

export default { getAll, updateValue };
