import jwt from "jsonwebtoken";
import { prismaClient } from "../lib/database.lib.js";
import { UnauthorizedError } from "../../error/unathorized.error.js";
import { verifyAccessToken } from "../../utils/token.utils.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      throw new UnauthorizedError("Access token tidak ditemukan");
    }

    const payload = verifyAccessToken(token);

    const user = await prismaClient.user.findUnique({
      where: { username: payload.sub },
      select: {
        id: true,
        username: true,
        isActive: true,
        profile: {
          select: { unitKerjaId: true },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError("Akun tidak valid atau tidak aktif.");
    }

    req.user = {
      userId: user.id,
      username: user.username,
      roles: Array.isArray(payload.role) ? payload.role : [payload.role],
      unitKerjaId: user.profile?.unitKerjaId ?? null,
    };

    next();
  } catch (error) {
    if (
      error instanceof jwt.TokenExpiredError ||
      error instanceof jwt.JsonWebTokenError
    ) {
      next(
        new UnauthorizedError("Access token tidak valid atau sudah kadaluarsa"),
      );
    } else {
      next(error);
    }
  }
};
