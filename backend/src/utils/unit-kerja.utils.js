import { ROLES } from "../core/config/enum.config.js";
import { prismaClient } from "../core/lib/database.lib.js";
import { ForbiddenError } from "../error/forbidden.error.js";
import { NotFoundError } from "../error/not-found.error.js";

/**
 * Check if user has access to the specified unit kerja
 * ADMINISTRATOR and KOMITE_PUSAT can access any unit kerja
 * PENGELOLA_RISIKO_UKER can only access their own unit kerja
 */
export const checkUnitKerjaAccess = (user, unitKerjaId, options = {}) => {
  const { allowKomitePusat = false } = options;
  const isAdmin = user.roles.includes(ROLES.ADMINISTRATOR);
  const isKomitePusat = user.roles.includes(ROLES.KOMITE_PUSAT);

  // ADMINISTRATOR can always access any unit kerja
  if (isAdmin) {
    return;
  }

  // KOMITE_PUSAT can access any unit kerja if allowed
  if (allowKomitePusat && isKomitePusat) {
    return;
  }

  if (user.unitKerjaId !== unitKerjaId) {
    throw new ForbiddenError(
      "Akses ditolak. Anda tidak memiliki akses ke unit kerja ini.",
    );
  }
};

/**
 * Verify that the unit kerja exists
 */
export const verifyUnitKerjaExists = async (unitKerjaId) => {
  const unitKerja = await prismaClient.unitKerja.findUnique({
    where: { id: unitKerjaId },
  });

  if (!unitKerja) {
    throw new NotFoundError("Unit kerja tidak ditemukan.");
  }

  return unitKerja;
};
