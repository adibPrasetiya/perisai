import systemConfigController from "./system-config.controller.js";
import { ROLES } from "../../core/config/enum.config.js";

export const systemConfigRoutes = [
  {
    method: "get",
    path: "/system-config",
    handler: systemConfigController.getAll,
    roles: [ROLES.ADMINISTRATOR],
  },
  {
    method: "patch",
    path: "/system-config/:key",
    handler: systemConfigController.updateValue,
    roles: [ROLES.ADMINISTRATOR],
  },
];
