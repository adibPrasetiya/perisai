import riskContextController from "./risk-context.controller.js";
import { ROLES } from "../../core/config/enum.config.js";

const MANAGE_ROLES = [ROLES.ADMINISTRATOR, ROLES.KOMITE_PUSAT];
const ADMIN_ROLES = [ROLES.ADMINISTRATOR, ROLES.KOMITE_PUSAT];

export const riskContextRoutes = [
  // ─── Context ────────────────────────────────────────────────────────────────
  {
    method: "post",
    path: "/frameworks/:frameworkId/contexts/full",
    handler: riskContextController.createFull,
    roles: MANAGE_ROLES,
  },
  {
    method: "get",
    path: "/frameworks/:frameworkId/contexts",
    handler: riskContextController.listByFramework,
  },
  {
    method: "get",
    path: "/contexts/:contextId",
    handler: riskContextController.getById,
  },
  {
    method: "patch",
    path: "/contexts/:contextId",
    handler: riskContextController.update,
    roles: MANAGE_ROLES,
  },
  {
    method: "delete",
    path: "/contexts/:contextId",
    handler: riskContextController.remove,
    roles: ADMIN_ROLES,
  },
  {
    method: "patch",
    path: "/contexts/:contextId/activate",
    handler: riskContextController.activate,
    roles: ADMIN_ROLES,
  },
  {
    method: "patch",
    path: "/contexts/:contextId/deactivate",
    handler: riskContextController.deactivate,
    roles: ADMIN_ROLES,
  },

  // ─── Risk Categories ─────────────────────────────────────────────────────────
  {
    method: "post",
    path: "/contexts/:contextId/categories",
    handler: riskContextController.createCategory,
    roles: MANAGE_ROLES,
  },
  {
    method: "patch",
    path: "/contexts/:contextId/categories/:categoryId",
    handler: riskContextController.updateCategory,
    roles: MANAGE_ROLES,
  },
  {
    method: "delete",
    path: "/contexts/:contextId/categories/:categoryId",
    handler: riskContextController.removeCategory,
    roles: MANAGE_ROLES,
  },

  // ─── Impact Areas ────────────────────────────────────────────────────────────
  {
    method: "post",
    path: "/contexts/:contextId/impact-areas",
    handler: riskContextController.createImpactArea,
    roles: MANAGE_ROLES,
  },
  {
    method: "patch",
    path: "/contexts/:contextId/impact-areas/:areaId",
    handler: riskContextController.updateImpactArea,
    roles: MANAGE_ROLES,
  },
  {
    method: "delete",
    path: "/contexts/:contextId/impact-areas/:areaId",
    handler: riskContextController.removeImpactArea,
    roles: MANAGE_ROLES,
  },

  // ─── Impact Criteria (nested under area) ─────────────────────────────────────
  {
    method: "post",
    path: "/contexts/:contextId/impact-areas/:areaId/criteria",
    handler: riskContextController.createImpactCriteria,
    roles: MANAGE_ROLES,
  },
  {
    method: "patch",
    path: "/contexts/:contextId/impact-areas/:areaId/criteria/:criteriaId",
    handler: riskContextController.updateImpactCriteria,
    roles: MANAGE_ROLES,
  },
  {
    method: "delete",
    path: "/contexts/:contextId/impact-areas/:areaId/criteria/:criteriaId",
    handler: riskContextController.removeImpactCriteria,
    roles: MANAGE_ROLES,
  },

  // ─── Likelihood Criteria (nested under area) ─────────────────────────────────
  {
    method: "post",
    path: "/contexts/:contextId/impact-areas/:areaId/likelihood-criteria",
    handler: riskContextController.createLikelihoodCriteria,
    roles: MANAGE_ROLES,
  },
  {
    method: "patch",
    path: "/contexts/:contextId/impact-areas/:areaId/likelihood-criteria/:criteriaId",
    handler: riskContextController.updateLikelihoodCriteria,
    roles: MANAGE_ROLES,
  },
  {
    method: "delete",
    path: "/contexts/:contextId/impact-areas/:areaId/likelihood-criteria/:criteriaId",
    handler: riskContextController.removeLikelihoodCriteria,
    roles: MANAGE_ROLES,
  },

  // ─── Treatment Options ───────────────────────────────────────────────────────
  {
    method: "post",
    path: "/contexts/:contextId/treatment-options",
    handler: riskContextController.createTreatmentOption,
    roles: MANAGE_ROLES,
  },
  {
    method: "patch",
    path: "/contexts/:contextId/treatment-options/:optionId",
    handler: riskContextController.updateTreatmentOption,
    roles: MANAGE_ROLES,
  },
  {
    method: "delete",
    path: "/contexts/:contextId/treatment-options/:optionId",
    handler: riskContextController.removeTreatmentOption,
    roles: MANAGE_ROLES,
  },

  // ─── Matrix ──────────────────────────────────────────────────────────────────
  {
    method: "put",
    path: "/contexts/:contextId/matrix",
    handler: riskContextController.setMatrix,
    roles: MANAGE_ROLES,
  },
];
