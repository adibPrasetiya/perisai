import frameworkController from "./framework.controller.js";
import { ROLES } from "../../core/config/enum.config.js";

export const frameworkRoutes = [
  {
    method: "post",
    path: "/frameworks",
    handler: frameworkController.create,
    roles: [ROLES.ADMINISTRATOR],
  },
  {
    method: "get",
    path: "/frameworks",
    handler: frameworkController.search,
  },
  {
    method: "patch",
    path: "/frameworks/:frameworkId",
    handler: frameworkController.update,
    roles: [ROLES.ADMINISTRATOR],
  },
  {
    method: "patch",
    path: "/frameworks/:frameworkId/activate",
    handler: frameworkController.activate,
    roles: [ROLES.ADMINISTRATOR],
  },
  {
    method: "patch",
    path: "/frameworks/:frameworkId/deactivate",
    handler: frameworkController.deactivate,
    roles: [ROLES.ADMINISTRATOR],
  },
  {
    method: "delete",
    path: "/frameworks/:frameworkId",
    handler: frameworkController.remove,
    roles: [ROLES.ADMINISTRATOR],
  },
];
