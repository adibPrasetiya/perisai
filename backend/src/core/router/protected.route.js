import { Router } from "express";
import { authorize } from "../middleware/authorization.middleware.js";
import {
  authProtectedRoutes,
  userRoutes,
  unitKerjaProtectedRoutes,
  assetCategoryRoutes,
  assetRoutes,
  kegiatanRoutes,
  frameworkRoutes,
  riskProgramRoutes,
  programFrameworkRoutes,
  riskContextRoutes,
  programFrameworkContextRoutes,
  riskLevelRoutes,
  workingPaperRoutes,
  riskEntryRoutes,
  systemConfigRoutes,
  dashboardRoutes,
} from "../../features/index.js";

export const protectedRoute = Router();

const routes = [
  ...authProtectedRoutes,
  ...userRoutes,
  ...unitKerjaProtectedRoutes,
  ...assetCategoryRoutes,
  ...assetRoutes,
  ...kegiatanRoutes,
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

