import { prismaClient } from "../../core/lib/database.lib.js";
import { validate } from "../../utils/validator.utils.js";
import {
  validatePasswordPolicy,
  getPasswordMaxAgeDays,
  computePasswordExpiresAt,
} from "../../utils/password-policy.utils.js";
import {
  searchUserSchema,
  updatePasswordSchema,
  updateMyAccountSchema,
  updateMyProfileSchema,
  resetTotpSchema,
  adminUpdateUserSchema,
} from "./user.validation.js";
import { NotFoundError } from "../../error/not-found.error.js";
import { BadRequestError } from "../../error/bad-request.error.js";
import { ConflictError } from "../../error/conflict.error.js";
import { hash, compare } from "../../core/lib/password.lib.js";
import { verifyTotpCode, decryptTotpSecret } from "../../utils/totp.utils.js";
import { verifyUnitKerjaExists } from "../../utils/unit-kerja.utils.js";

const search = async (queryParams) => {
  const params = validate(searchUserSchema, queryParams);

  const { name, username, role, isActive, isVerified, page, limit } = params;

  const where = {};

  if (name) {
    where.name = { contains: name };
  }

  if (username) {
    where.username = { contains: username };
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  if (isVerified !== undefined) {
    where.isVerified = isVerified;
  }

  if (role) {
    where.userRoles = {
      some: {
        role: { name: role },
      },
    };
  }

  const skip = (page - 1) * limit;

  const [totalItems, users] = await Promise.all([
    prismaClient.user.count({ where }),
    prismaClient.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        isActive: true,
        isVerified: true,
        mustChangePassword: true,
        totpEnabled: true,
        passwordChangedAt: true,
        createdAt: true,
        updatedAt: true,
        userRoles: {
          select: {
            role: {
              select: { name: true },
            },
          },
        },
        profile: {
          select: {
            jabatan: true,
            nomorHP: true,
            isVerified: true,
            verifiedAt: true,
            unitKerja: {
              select: { id: true, name: true, code: true },
            },
          },
        },
        session: {
          select: {
            refreshToken: true,
            deviceId: true,
            deviceName: true,
            ipAddress: true,
            expiresAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    }),
  ]);

  const now = new Date();

  const formattedUsers = users.map((user) => ({
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    isActive: user.isActive,
    isVerified: user.isVerified,
    mustChangePassword: user.mustChangePassword,
    totpEnabled: user.totpEnabled,
    passwordChangedAt: user.passwordChangedAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    roles: user.userRoles.map((ur) => ur.role.name),
    profile: user.profile
      ? {
          jabatan: user.profile.jabatan,
          nomorHP: user.profile.nomorHP,
          isVerified: user.profile.isVerified,
          verifiedAt: user.profile.verifiedAt,
          unitKerja: user.profile.unitKerja,
        }
      : null,
    session: user.session
      ? {
          isActive: user.session.expiresAt > now,
          refreshToken: user.session.refreshToken,
          deviceId: user.session.deviceId,
          deviceName: user.session.deviceName,
          ipAddress: user.session.ipAddress,
          expiresAt: user.session.expiresAt,
          lastSeenAt: user.session.updatedAt,
        }
      : null,
  }));

  const totalPages = Math.ceil(totalItems / limit);

  return {
    message: "Data pengguna berhasil ditemukan",
    data: formattedUsers,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

// ─── Verifikasi Akun ──────────────────────────────────────────────────────────

const verify = async (userId, adminUsername) => {
  const [targetUser, admin] = await Promise.all([
    prismaClient.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        name: true,
        isActive: true,
        isVerified: true,
      },
    }),
    prismaClient.user.findUnique({
      where: { username: adminUsername },
      select: { id: true },
    }),
  ]);

  if (!targetUser) {
    throw new NotFoundError("Pengguna tidak ditemukan");
  }

  if (targetUser.isVerified) {
    throw new BadRequestError(
      `Akun ${targetUser.username} sudah terverifikasi`,
    );
  }

  await prismaClient.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { isVerified: true },
    });

    await tx.profile.update({
      where: { userId },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
        verifiedBy: admin?.id ?? null,
      },
    });
  });

  const updatedUser = await prismaClient.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      isActive: true,
      isVerified: true,
      profile: {
        select: { isVerified: true, verifiedAt: true },
      },
    },
  });

  return {
    message: `Akun ${updatedUser.username} berhasil diverifikasi`,
    data: updatedUser,
  };
};

// ─── Aktivasi Akun ────────────────────────────────────────────────────────────

const activate = async (userId) => {
  const user = await prismaClient.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      name: true,
      isActive: true,
      isVerified: true,
    },
  });

  if (!user) {
    throw new NotFoundError("Pengguna tidak ditemukan");
  }

  if (user.isActive) {
    throw new BadRequestError(`Akun ${user.username} sudah aktif`);
  }

  const updatedUser = await prismaClient.user.update({
    where: { id: userId },
    data: { isActive: true },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      isActive: true,
      isVerified: true,
    },
  });

  return {
    message: `Akun ${updatedUser.username} berhasil diaktifkan`,
    data: updatedUser,
  };
};

// ─── Nonaktifkan Akun ─────────────────────────────────────────────────────────

const deactivate = async (userId, adminUsername) => {
  const user = await prismaClient.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      name: true,
      isActive: true,
      isVerified: true,
    },
  });

  if (!user) {
    throw new NotFoundError("Pengguna tidak ditemukan");
  }

  if (user.username === adminUsername) {
    throw new BadRequestError("Tidak dapat menonaktifkan akun sendiri");
  }

  if (!user.isActive) {
    throw new BadRequestError(`Akun ${user.username} sudah tidak aktif`);
  }

  await prismaClient.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
    await tx.session.deleteMany({ where: { userId } });
  });

  const updatedUser = await prismaClient.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      isActive: true,
      isVerified: true,
    },
  });

  return {
    message: `Akun ${updatedUser.username} berhasil dinonaktifkan`,
    data: updatedUser,
  };
};

// ─── Get User By ID ───────────────────────────────────────────────────────────

const getById = async (userId) => {
  const user = await prismaClient.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      isActive: true,
      isVerified: true,
      mustChangePassword: true,
      totpEnabled: true,
      passwordChangedAt: true,
      createdAt: true,
      updatedAt: true,
      userRoles: {
        select: {
          role: { select: { name: true } },
        },
      },
      profile: {
        select: {
          jabatan: true,
          nomorHP: true,
          isVerified: true,
          verifiedAt: true,
          unitKerja: {
            select: { id: true, name: true, code: true },
          },
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundError("Pengguna tidak ditemukan");
  }

  return {
    message: "Data pengguna berhasil ditemukan",
    data: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      isActive: user.isActive,
      isVerified: user.isVerified,
      mustChangePassword: user.mustChangePassword,
      totpEnabled: user.totpEnabled,
      passwordChangedAt: user.passwordChangedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: user.userRoles.map((ur) => ur.role.name),
      profile: user.profile
        ? {
            jabatan: user.profile.jabatan,
            nomorHP: user.profile.nomorHP,
            isVerified: user.profile.isVerified,
            verifiedAt: user.profile.verifiedAt,
            unitKerja: user.profile.unitKerja,
          }
        : null,
    },
  };
};

// ─── Get My Profile ───────────────────────────────────────────────────────────

const getMyProfile = async (username) => {
  const user = await prismaClient.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      isActive: true,
      isVerified: true,
      mustChangePassword: true,
      totpEnabled: true,
      passwordChangedAt: true,
      createdAt: true,
      updatedAt: true,
      userRoles: {
        select: { role: { select: { name: true } } },
      },
      profile: {
        select: {
          jabatan: true,
          nomorHP: true,
          isVerified: true,
          verifiedAt: true,
          unitKerja: {
            select: { id: true, name: true, code: true },
          },
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundError("Pengguna tidak ditemukan");
  }

  const passwordMaxAgeDays = await getPasswordMaxAgeDays();
  const passwordExpiresAt = computePasswordExpiresAt(
    user.passwordChangedAt,
    passwordMaxAgeDays,
  );

  return {
    message: "Data profil berhasil ditemukan",
    data: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      isActive: user.isActive,
      isVerified: user.isVerified,
      mustChangePassword: user.mustChangePassword,
      totpEnabled: user.totpEnabled,
      passwordChangedAt: user.passwordChangedAt,
      passwordExpiresAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: user.userRoles.map((ur) => ur.role.name),
      profile: user.profile
        ? {
            jabatan: user.profile.jabatan,
            nomorHP: user.profile.nomorHP,
            isVerified: user.profile.isVerified,
            verifiedAt: user.profile.verifiedAt,
            unitKerja: user.profile.unitKerja,
          }
        : null,
    },
  };
};

// ─── Ubah Password Sendiri ────────────────────────────────────────────────────

const updateMyPassword = async (username, reqBody) => {
  const { currentPassword, newPassword, totpCode } = validate(
    updatePasswordSchema,
    reqBody,
  );

  await validatePasswordPolicy(newPassword, "newPassword");

  const user = await prismaClient.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      password: true,
      totpEnabled: true,
      totpSecret: true,
    },
  });

  if (!user) {
    throw new NotFoundError("Pengguna tidak ditemukan");
  }

  // 1. Verifikasi password saat ini
  const isCurrentPasswordValid = await compare(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    throw new BadRequestError("Password saat ini tidak valid.");
  }

  // 2. Verifikasi kode TOTP
  if (!user.totpEnabled || !user.totpSecret) {
    throw new BadRequestError("TOTP belum diaktifkan pada akun ini.");
  }

  const decryptedSecret = decryptTotpSecret(user.totpSecret);
  if (!verifyTotpCode(totpCode, decryptedSecret)) {
    throw new BadRequestError("Kode TOTP tidak valid.");
  }

  // 3. Pastikan password baru berbeda dari password lama
  const isSameAsOld = await compare(newPassword, user.password);
  if (isSameAsOld) {
    throw new BadRequestError(
      "Password baru tidak boleh sama dengan password saat ini.",
    );
  }

  // 4. Simpan password baru dan hapus semua sesi
  const hashedPassword = await hash(newPassword);

  await prismaClient.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
        mustChangePassword: false,
      },
    });
    await tx.session.deleteMany({ where: { userId: user.id } });
  });

  return { message: "Password berhasil diubah. Silakan login kembali." };
};

// ─── Ubah Data Akun Sendiri ───────────────────────────────────────────────────

const updateMyAccount = async (username, reqBody) => {
  const { name, email, password } = validate(updateMyAccountSchema, reqBody);

  const user = await prismaClient.user.findUnique({
    where: { username },
    select: { id: true, email: true, password: true },
  });

  if (!user) {
    throw new NotFoundError("Pengguna tidak ditemukan");
  }

  const isPasswordValid = await compare(password, user.password);
  if (!isPasswordValid) {
    throw new BadRequestError("Password tidak valid.");
  }

  const updateData = {};

  if (name !== undefined) {
    updateData.name = name;
  }

  if (email !== undefined) {
    if (email !== user.email) {
      const existing = await prismaClient.user.findUnique({ where: { email } });
      if (existing) {
        throw new ConflictError("Email sudah digunakan oleh akun lain");
      }
    }
    updateData.email = email;
  }

  const updatedUser = await prismaClient.user.update({
    where: { id: user.id },
    data: updateData,
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      updatedAt: true,
    },
  });

  return {
    message: "Data akun berhasil diperbarui",
    data: updatedUser,
  };
};

// ─── Ubah Data Profil Sendiri ─────────────────────────────────────────────────

const updateMyProfile = async (username, reqBody) => {
  const { jabatan, nomorHP, password } = validate(
    updateMyProfileSchema,
    reqBody,
  );

  const user = await prismaClient.user.findUnique({
    where: { username },
    select: { id: true, password: true },
  });

  if (!user) {
    throw new NotFoundError("Pengguna tidak ditemukan");
  }

  const isPasswordValid = await compare(password, user.password);
  if (!isPasswordValid) {
    throw new BadRequestError("Password tidak valid.");
  }

  const updateData = {};

  if (jabatan !== undefined) {
    updateData.jabatan = jabatan;
  }

  if (nomorHP !== undefined) {
    updateData.nomorHP = nomorHP === "" ? null : nomorHP;
  }

  const updatedProfile = await prismaClient.profile.update({
    where: { userId: user.id },
    data: updateData,
    select: {
      jabatan: true,
      nomorHP: true,
      unitKerja: {
        select: { id: true, name: true, code: true },
      },
    },
  });

  return {
    message: "Data profil berhasil diperbarui",
    data: updatedProfile,
  };
};

// ─── Reset TOTP Pengguna (oleh Admin) ────────────────────────────────────────

const resetTotp = async (userId, adminUsername, reqBody) => {
  const { password, totpCode } = validate(resetTotpSchema, reqBody);

  // 1. Ambil data admin beserta credential-nya
  const admin = await prismaClient.user.findUnique({
    where: { username: adminUsername },
    select: {
      id: true,
      password: true,
      totpEnabled: true,
      totpSecret: true,
    },
  });

  if (!admin) {
    throw new NotFoundError("Akun admin tidak ditemukan");
  }

  // 2. Verifikasi password admin
  const isPasswordValid = await compare(password, admin.password);
  if (!isPasswordValid) {
    throw new BadRequestError("Password tidak valid.");
  }

  // 3. Verifikasi kode TOTP admin
  if (!admin.totpEnabled || !admin.totpSecret) {
    throw new BadRequestError("TOTP belum diaktifkan pada akun admin ini.");
  }

  const decryptedSecret = decryptTotpSecret(admin.totpSecret);
  if (!verifyTotpCode(totpCode, decryptedSecret)) {
    throw new BadRequestError("Kode TOTP tidak valid.");
  }

  // 4. Ambil data target user
  const targetUser = await prismaClient.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      name: true,
      totpEnabled: true,
    },
  });

  if (!targetUser) {
    throw new NotFoundError("Pengguna tidak ditemukan");
  }

  // 5. Cegah admin mereset TOTP akunnya sendiri
  if (targetUser.username === adminUsername) {
    throw new BadRequestError("Tidak dapat mereset TOTP akun sendiri.");
  }

  // 6. Pastikan target user memang sudah aktif TOTP-nya
  if (!targetUser.totpEnabled) {
    throw new BadRequestError(
      `TOTP akun ${targetUser.username} belum diaktifkan.`,
    );
  }

  // 7. Reset TOTP dan hapus sesi target user dalam satu transaksi
  await prismaClient.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        totpEnabled: false,
        totpSecret: null,
        totpVerifiedAt: null,
      },
    });
    await tx.session.deleteMany({ where: { userId } });
  });

  return {
    message: `TOTP akun ${targetUser.username} berhasil direset. Pengguna perlu mengaktifkan ulang TOTP saat login berikutnya.`,
    data: { userId, username: targetUser.username, name: targetUser.name },
  };
};

// ─── Update User oleh Admin (unit kerja & role) ───────────────────────────────

const adminUpdateUser = async (userId, reqBody, adminUsername) => {
  const { unitKerjaId, roles } = validate(adminUpdateUserSchema, reqBody);

  const targetUser = await prismaClient.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      name: true,
    },
  });

  if (!targetUser) {
    throw new NotFoundError("Pengguna tidak ditemukan");
  }

  if (targetUser.username === adminUsername) {
    throw new BadRequestError("Tidak dapat mengubah data akun sendiri");
  }

  if (unitKerjaId) {
    await verifyUnitKerjaExists(unitKerjaId);
  }

  await prismaClient.$transaction(async (tx) => {
    if (unitKerjaId) {
      await tx.profile.update({
        where: { userId },
        data: { unitKerjaId },
      });
    }

    if (roles) {
      const roleRecords = await tx.role.findMany({
        where: { name: { in: roles } },
        select: { id: true, name: true },
      });

      if (roleRecords.length !== roles.length) {
        const foundNames = roleRecords.map((r) => r.name);
        const missing = roles.filter((r) => !foundNames.includes(r));
        throw new BadRequestError(
          `Role tidak ditemukan: ${missing.join(", ")}`,
        );
      }

      await tx.userRole.deleteMany({ where: { userId } });
      await tx.userRole.createMany({
        data: roleRecords.map((r) => ({ userId, roleId: r.id })),
      });
    }
  });

  const updated = await prismaClient.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      isActive: true,
      isVerified: true,
      userRoles: {
        select: { role: { select: { name: true } } },
      },
      profile: {
        select: {
          jabatan: true,
          unitKerja: { select: { id: true, name: true, code: true } },
        },
      },
    },
  });

  return {
    message: `Data pengguna ${updated.username} berhasil diperbarui`,
    data: {
      id: updated.id,
      username: updated.username,
      name: updated.name,
      email: updated.email,
      isActive: updated.isActive,
      isVerified: updated.isVerified,
      roles: updated.userRoles.map((ur) => ur.role.name),
      profile: updated.profile,
    },
  };
};

export default {
  search,
  getById,
  verify,
  activate,
  deactivate,
  getMyProfile,
  updateMyPassword,
  updateMyAccount,
  updateMyProfile,
  resetTotp,
  adminUpdateUser,
};
