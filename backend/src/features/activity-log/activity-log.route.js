import activityLogController from "./activity-log.controller.js";
import { ROLES } from "../../core/config/enum.config.js";

export const activityLogRoutes = [
  {
    method: "get",
    path: "/activity-logs",
    handler: activityLogController.list,
    roles: [ROLES.ADMINISTRATOR],
  },
];
