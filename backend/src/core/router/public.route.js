import { Router } from "express";
import { authRoutes } from "../../features/auth/auth.route.js";
import { unitKerjaRoutes } from "../../features/unit-kerja/unit-kerja.route.js";

export const publicRoute = Router();

const routes = [...authRoutes, ...unitKerjaRoutes];

routes.forEach(({ method, path, handler, middleware = [] }) => {
  publicRoute[method](path, ...middleware, handler);
});
