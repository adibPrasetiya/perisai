import { ROLES } from "../../core/config/enum.config.js";
import unitKerjaController from "./unit-kerja.controller.js";

export const unitKerjaRoutes = [
  {
    method: "get",
    path: "/unit-kerja",
    handler: unitKerjaController.search,
  },
];

export const unitKerjaProtectedRoutes = [
  {
    method: "post",
    path: "/unit-kerja",
    handler: unitKerjaController.create,
    roles: [ROLES.ADMINISTRATOR],
  },
  {
    method: "patch",
    path: "/unit-kerja/:unitKerjaId",
    handler: unitKerjaController.update,
    roles: [ROLES.ADMINISTRATOR],
  },
  {
    method: "delete",
    path: "/unit-kerja/:unitKerjaId",
    handler: unitKerjaController.remove,
    roles: [ROLES.ADMINISTRATOR],
  },
];
