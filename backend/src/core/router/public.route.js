import { Router } from "express";
import { authRoutes, unitKerjaRoutes } from "../../features/index.js";

export const publicRoute = Router();

const routes = [...authRoutes, ...unitKerjaRoutes];

routes.forEach(({ method, path, handler, middleware = [] }) => {
  publicRoute[method](path, ...middleware, handler);
});
