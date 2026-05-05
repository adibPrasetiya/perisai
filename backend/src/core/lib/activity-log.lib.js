import { prismaClient } from "./database.lib.js";

const save = async (level, action, fields = {}) => {
  const { userId, username, actionType, ...metadata } = fields;
  try {
    await prismaClient.activityLog.create({
      data: {
        action,
        actionType,
        level,
        userId: userId ?? null,
        username: username ?? null,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      },
    });
  } catch {
    // Logging failure tidak boleh memutus operasi utama
  }
};

export const activityLog = {
  notice: (action, fields) => save("notice", action, fields),
  warning: (action, fields) => save("warning", action, fields),
  info: (action, fields) => save("info", action, fields),
};
