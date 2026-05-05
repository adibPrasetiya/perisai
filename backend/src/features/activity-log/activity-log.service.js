import { validate } from "../../utils/validator.utils.js";
import { listActivityLogSchema } from "./activity-log.validation.js";
import { prismaClient } from "../../core/lib/database.lib.js";

const list = async (queryParams) => {
  const params = validate(listActivityLogSchema, queryParams);
  const { action, actionType, level, userId, username, startDate, endDate, page, limit } = params;

  const where = {};

  if (action) {
    where.action = { contains: action };
  }

  if (actionType) {
    where.actionType = actionType;
  }

  if (level) {
    where.level = level;
  }

  if (userId) {
    where.userId = userId;
  }

  if (username) {
    where.username = { contains: username };
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const skip = (page - 1) * limit;
  const totalItems = await prismaClient.activityLog.count({ where });

  const logs = await prismaClient.activityLog.findMany({
    where,
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      action: true,
      actionType: true,
      level: true,
      userId: true,
      username: true,
      metadata: true,
      createdAt: true,
    },
  });

  const totalPages = Math.ceil(totalItems / limit);

  return {
    message: "Log aktivitas berhasil ditemukan",
    data: logs,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

export default { list };
