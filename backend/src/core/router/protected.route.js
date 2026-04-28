import { Router } from "express";
import { authorize } from "../middleware/authorization.middleware.js";
import { authProtectedRoutes } from "../../features/auth/auth.route.js";
import { userRoutes } from "../../features/user/user.route.js";
import { unitKerjaProtectedRoutes } from "../../features/unit-kerja/unit-kerja.route.js";
import { assetCategoryRoutes } from "../../features/asset-category/asset-category.route.js";
import { assetRoutes } from "../../features/asset/asset.route.js";
import { prosesBisnisRoutes } from "../../features/proses-bisnis/proses-bisnis.route.js";
import { frameworkRoutes } from "../../features/framework/framework.route.js";
import { riskProgramRoutes } from "../../features/risk-program/risk-program.route.js";
import { programFrameworkRoutes } from "../../features/program-framework/program-framework.route.js";
import { riskContextRoutes } from "../../features/risk-context/risk-context.route.js";
import { programFrameworkContextRoutes } from "../../features/program-framework-context/program-framework-context.route.js";
import { riskLevelRoutes } from "../../features/risk-level/risk-level.route.js";
import { workingPaperRoutes } from "../../features/working-paper/working-paper.route.js";
import { riskEntryRoutes } from "../../features/risk-entry/risk-entry.route.js";
import { systemConfigRoutes } from "../../features/system-config/system-config.route.js";
import { dashboardRoutes } from "../../features/dashboard/dashboard.route.js";

export const protectedRoute = Router();

const routes = [
  ...authProtectedRoutes,
  ...userRoutes,
  ...unitKerjaProtectedRoutes,
  ...assetCategoryRoutes,
  ...assetRoutes,
  ...prosesBisnisRoutes,
  ...frameworkRoutes,
  ...riskProgramRoutes,
  ...programFrameworkRoutes,
  ...riskContextRoutes,
  ...programFrameworkContextRoutes,
  ...riskLevelRoutes,
  ...workingPaperRoutes,
  ...riskEntryRoutes,
  ...systemConfigRoutes,
  ...dashboardRoutes,
];

routes.forEach(({ method, path, handler, roles }) => {
  const middleware = [];

  if (roles) {
    middleware.push(authorize(roles));
  }

  middleware.push(handler);

  protectedRoute[method](path, ...middleware);
});
