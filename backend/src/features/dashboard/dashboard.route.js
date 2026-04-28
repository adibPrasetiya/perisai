import dashboardController from "./dashboard.controller.js";
import { ROLES } from "../../core/config/enum.config.js";

const DASHBOARD_ROLES = [ROLES.ADMINISTRATOR, ROLES.KOMITE_PUSAT];

export const dashboardRoutes = [
  {
    method: "get",
    path: "/dashboard/filters",
    handler: dashboardController.getFilters,
    roles: DASHBOARD_ROLES,
  },
  {
    method: "get",
    path: "/dashboard/overview",
    handler: dashboardController.getOverview,
    roles: DASHBOARD_ROLES,
  },
  {
    method: "get",
    path: "/dashboard/top-risks",
    handler: dashboardController.getTopRisks,
    roles: DASHBOARD_ROLES,
  },
  {
    method: "get",
    path: "/dashboard/activity",
    handler: dashboardController.getRecentActivity,
    roles: DASHBOARD_ROLES,
  },
  {
    method: "get",
    path: "/dashboard/units",
    handler: dashboardController.getUnits,
    roles: DASHBOARD_ROLES,
  },
  {
    method: "get",
    path: "/dashboard/risks",
    handler: dashboardController.getRisks,
    roles: DASHBOARD_ROLES,
  },
];
