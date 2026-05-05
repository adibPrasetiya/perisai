import riskProgramController from "./risk-program.controller.js";
import { ROLES } from "../../core/config/enum.config.js";

export const riskProgramRoutes = [
  {
    method: "post",
    path: "/risk-programs",
    handler: riskProgramController.create,
    roles: [ROLES.ADMINISTRATOR, ROLES.KOMITE_PUSAT],
  },
  {
    method: "get",
    path: "/risk-programs",
    handler: riskProgramController.search,
  },
  {
    method: "get",
    path: "/risk-programs/:riskProgramId",
    handler: riskProgramController.getById,
  },
  {
    method: "patch",
    path: "/risk-programs/:riskProgramId",
    handler: riskProgramController.update,
    roles: [ROLES.ADMINISTRATOR, ROLES.KOMITE_PUSAT],
  },
  {
    method: "delete",
    path: "/risk-programs/:riskProgramId",
    handler: riskProgramController.remove,
    roles: [ROLES.ADMINISTRATOR],
  },
  {
    method: "post",
    path: "/risk-programs/:riskProgramId/activate",
    handler: riskProgramController.activate,
    roles: [ROLES.ADMINISTRATOR, ROLES.KOMITE_PUSAT],
  },
  {
    method: "post",
    path: "/risk-programs/:riskProgramId/deactivate",
    handler: riskProgramController.deactivate,
    roles: [ROLES.ADMINISTRATOR, ROLES.KOMITE_PUSAT],
  },
  {
    method: "post",
    path: "/risk-programs/:riskProgramId/set-draft",
    handler: riskProgramController.setDraft,
    roles: [ROLES.ADMINISTRATOR, ROLES.KOMITE_PUSAT],
  },
];
