import workingPaperController from "./working-paper.controller.js";
import { ROLES } from "../../core/config/enum.config.js";

export const workingPaperRoutes = [
  {
    method: "post",
    path: "/working-papers",
    handler: workingPaperController.create,
    roles: [ROLES.PENGELOLA_RISIKO_UKER],
  },
  {
    method: "get",
    path: "/working-papers",
    handler: workingPaperController.search,
    roles: [ROLES.PENGELOLA_RISIKO_UKER, ROLES.ADMINISTRATOR, ROLES.KOMITE_PUSAT],
  },
  {
    method: "get",
    path: "/working-papers/:workingPaperId/report/pdf",
    handler: workingPaperController.generateReport,
    roles: [ROLES.PENGELOLA_RISIKO_UKER, ROLES.ADMINISTRATOR, ROLES.KOMITE_PUSAT],
  },
  {
    method: "get",
    path: "/working-papers/:workingPaperId/stats",
    handler: workingPaperController.getStats,
    roles: [ROLES.PENGELOLA_RISIKO_UKER, ROLES.ADMINISTRATOR, ROLES.KOMITE_PUSAT],
  },
  {
    method: "get",
    path: "/working-papers/:workingPaperId",
    handler: workingPaperController.getById,
    roles: [ROLES.PENGELOLA_RISIKO_UKER, ROLES.ADMINISTRATOR, ROLES.KOMITE_PUSAT],
  },
  {
    method: "patch",
    path: "/working-papers/:workingPaperId",
    handler: workingPaperController.update,
    roles: [ROLES.PENGELOLA_RISIKO_UKER],
  },
];
