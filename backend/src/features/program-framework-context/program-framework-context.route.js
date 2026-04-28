import programFrameworkContextController from "./program-framework-context.controller.js";
import { ROLES } from "../../core/config/enum.config.js";

const MANAGE_ROLES = [ROLES.ADMINISTRATOR, ROLES.KOMITE_PUSAT];

export const programFrameworkContextRoutes = [
  {
    method: "post",
    path: "/program-frameworks/:programFrameworkId/contexts",
    handler: programFrameworkContextController.add,
    roles: MANAGE_ROLES,
  },
  {
    method: "delete",
    path: "/program-frameworks/:programFrameworkId/contexts/:riskContextId",
    handler: programFrameworkContextController.remove,
    roles: MANAGE_ROLES,
  },
  {
    method: "get",
    path: "/program-frameworks/:programFrameworkId/contexts",
    handler: programFrameworkContextController.list,
  },
];
