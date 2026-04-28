import riskEntryController from "./risk-entry.controller.js";
import { ROLES } from "../../core/config/enum.config.js";

export const riskEntryRoutes = [
  {
    method: "post",
    path: "/working-papers/:workingPaperId/entries",
    handler: riskEntryController.create,
    roles: [ROLES.PENGELOLA_RISIKO_UKER],
  },
  {
    method: "get",
    path: "/working-papers/:workingPaperId/entries",
    handler: riskEntryController.listByWorkingPaper,
    roles: [ROLES.PENGELOLA_RISIKO_UKER, ROLES.ADMINISTRATOR, ROLES.KOMITE_PUSAT],
  },
  {
    method: "get",
    path: "/entries/:entryId",
    handler: riskEntryController.getById,
    roles: [ROLES.PENGELOLA_RISIKO_UKER, ROLES.ADMINISTRATOR, ROLES.KOMITE_PUSAT],
  },
  {
    method: "patch",
    path: "/entries/:entryId",
    handler: riskEntryController.update,
    roles: [ROLES.PENGELOLA_RISIKO_UKER],
  },
  {
    method: "delete",
    path: "/entries/:entryId",
    handler: riskEntryController.remove,
    roles: [ROLES.PENGELOLA_RISIKO_UKER],
  },
  {
    method: "post",
    path: "/entries/:entryId/inherent-assessment",
    handler: riskEntryController.createInherentAssessment,
    roles: [ROLES.PENGELOLA_RISIKO_UKER],
  },
  {
    method: "post",
    path: "/entries/:entryId/residual-assessment",
    handler: riskEntryController.createResidualAssessment,
    roles: [ROLES.PENGELOLA_RISIKO_UKER],
  },
  {
    method: "post",
    path: "/entries/:entryId/treatment-plans",
    handler: riskEntryController.createTreatmentPlans,
    roles: [ROLES.PENGELOLA_RISIKO_UKER],
  },
  {
    method: "patch",
    path: "/entries/:entryId/treatment-plans/:planId/submit",
    handler: riskEntryController.submitTreatmentPlan,
    roles: [ROLES.PENGELOLA_RISIKO_UKER],
  },
  {
    method: "patch",
    path: "/entries/:entryId/treatment-plans/:planId/verify",
    handler: riskEntryController.verifyTreatmentPlan,
    roles: [ROLES.KOMITE_PUSAT],
  },
  {
    method: "post",
    path: "/entries/:entryId/treatment-plans/:planId/complete",
    handler: riskEntryController.completeTreatmentPlan,
    roles: [ROLES.PENGELOLA_RISIKO_UKER],
  },
];
