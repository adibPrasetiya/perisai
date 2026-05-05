import programFrameworkController from "./program-framework.controller.js";
import { ROLES } from "../../core/config/enum.config.js";

export const programFrameworkRoutes = [
  {
    method: "get",
    path: "/frameworks/:frameworkId/program-frameworks",
    handler: programFrameworkController.listByFramework,
  },
  {
    method: "post",
    path: "/risk-programs/:riskProgramId/frameworks",
    handler: programFrameworkController.addFramework,
    roles: [ROLES.ADMINISTRATOR, ROLES.KOMITE_PUSAT],
  },
  {
    method: "get",
    path: "/risk-programs/:riskProgramId/frameworks",
    handler: programFrameworkController.listByProgram,
  },
  {
    method: "get",
    path: "/risk-programs/:riskProgramId/frameworks/:programFrameworkId",
    handler: programFrameworkController.getById,
  },
  {
    method: "patch",
    path: "/risk-programs/:riskProgramId/frameworks/:programFrameworkId",
    handler: programFrameworkController.update,
    roles: [ROLES.ADMINISTRATOR, ROLES.KOMITE_PUSAT],
  },
  {
    method: "delete",
    path: "/risk-programs/:riskProgramId/frameworks/:programFrameworkId",
    handler: programFrameworkController.remove,
    roles: [ROLES.ADMINISTRATOR, ROLES.KOMITE_PUSAT],
  },
];
