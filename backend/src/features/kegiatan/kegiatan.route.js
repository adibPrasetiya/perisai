import { ROLES } from "../../core/config/enum.config.js";
import KegiatanController from "./kegiatan.controller.js";

export const kegiatanRoutes = [
  {
    method: "post",
    path: "/unit-kerja/:unitKerjaId/kegiatan",
    handler: KegiatanController.create,
    roles: [ROLES.ADMINISTRATOR, ROLES.PENGELOLA_RISIKO_UKER],
  },
  {
    method: "get",
    path: "/unit-kerja/:unitKerjaId/kegiatan",
    handler: KegiatanController.search,
    roles: [
      ROLES.ADMINISTRATOR,
      ROLES.KOMITE_PUSAT,
      ROLES.PENGELOLA_RISIKO_UKER,
    ],
  },
  {
    method: "patch",
    path: "/unit-kerja/:unitKerjaId/kegiatan/:id",
    handler: KegiatanController.update,
    roles: [ROLES.ADMINISTRATOR, ROLES.PENGELOLA_RISIKO_UKER],
  },
  {
    method: "patch",
    path: "/unit-kerja/:unitKerjaId/kegiatan/:id/activate",
    handler: KegiatanController.setActive,
    roles: [ROLES.ADMINISTRATOR, ROLES.PENGELOLA_RISIKO_UKER],
  },
  {
    method: "patch",
    path: "/unit-kerja/:unitKerjaId/kegiatan/:id/deactivate",
    handler: KegiatanController.setInactive,
    roles: [ROLES.ADMINISTRATOR, ROLES.PENGELOLA_RISIKO_UKER],
  },
  {
    method: "delete",
    path: "/unit-kerja/:unitKerjaId/kegiatan/:id",
    handler: KegiatanController.archive,
    roles: [ROLES.ADMINISTRATOR, ROLES.PENGELOLA_RISIKO_UKER],
  },
];

