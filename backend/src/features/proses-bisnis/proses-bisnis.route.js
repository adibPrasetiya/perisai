import { ROLES } from "../../core/config/enum.config.js";
import prosesBisnisController from "./proses-bisnis.controller.js";

export const prosesBisnisRoutes = [
  {
    method: "post",
    path: "/unit-kerja/:unitKerjaId/proses-bisnis",
    handler: prosesBisnisController.create,
    roles: [ROLES.ADMINISTRATOR, ROLES.PENGELOLA_RISIKO_UKER],
  },
  {
    method: "get",
    path: "/unit-kerja/:unitKerjaId/proses-bisnis",
    handler: prosesBisnisController.search,
    roles: [
      ROLES.ADMINISTRATOR,
      ROLES.KOMITE_PUSAT,
      ROLES.PENGELOLA_RISIKO_UKER,
    ],
  },
  {
    method: "patch",
    path: "/unit-kerja/:unitKerjaId/proses-bisnis/:id",
    handler: prosesBisnisController.update,
    roles: [ROLES.ADMINISTRATOR, ROLES.PENGELOLA_RISIKO_UKER],
  },
  {
    method: "patch",
    path: "/unit-kerja/:unitKerjaId/proses-bisnis/:id/activate",
    handler: prosesBisnisController.setActive,
    roles: [ROLES.ADMINISTRATOR, ROLES.PENGELOLA_RISIKO_UKER],
  },
  {
    method: "patch",
    path: "/unit-kerja/:unitKerjaId/proses-bisnis/:id/deactivate",
    handler: prosesBisnisController.setInactive,
    roles: [ROLES.ADMINISTRATOR, ROLES.PENGELOLA_RISIKO_UKER],
  },
  {
    method: "delete",
    path: "/unit-kerja/:unitKerjaId/proses-bisnis/:id",
    handler: prosesBisnisController.archive,
    roles: [ROLES.ADMINISTRATOR, ROLES.PENGELOLA_RISIKO_UKER],
  },
];
