import riskLevelController from "./risk-level.controller.js";
import { ROLES } from "../../core/config/enum.config.js";

const MANAGE_ROLES = [ROLES.ADMINISTRATOR, ROLES.KOMITE_PUSAT];

export const riskLevelRoutes = [
  {
    method: "get",
    path: "/contexts/:contextId/risk-levels",
    handler: riskLevelController.list,
  },
  {
    method: "post",
    path: "/contexts/:contextId/risk-levels",
    handler: riskLevelController.create,
    roles: MANAGE_ROLES,
  },
  {
    method: "patch",
    path: "/contexts/:contextId/risk-levels/:levelId",
    handler: riskLevelController.update,
    roles: MANAGE_ROLES,
  },
  {
    method: "delete",
    path: "/contexts/:contextId/risk-levels/:levelId",
    handler: riskLevelController.remove,
    roles: MANAGE_ROLES,
  },
  {
    method: "put",
    path: "/contexts/:contextId/risk-levels",
    handler: riskLevelController.bulkSet,
    roles: MANAGE_ROLES,
  },
];
