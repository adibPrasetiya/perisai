import crypto from "crypto";
import QRCode from "qrcode";
import { validate } from "../../utils/validator.utils.js";
import {
  validatePasswordPolicy,
  getPasswordMaxAgeDays,
  computePasswordExpiresAt,
} from "../../utils/password-policy.utils.js";
import {
  registedNewUserSchema,
  loginSchema,
  verifyLoginTotpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  initTotpSetupSchema,
  verifyTotpSetupSchema,
  refreshTokenSchema,
} from "./auth.validation.js";
import { ConflictError } from "../../error/conflict.error.js";
import { NotFoundError } from "../../error/not-found.error.js";
import { UnauthorizedError } from "../../error/unathorized.error.js";
import { hash, compare } from "../../core/lib/password.lib.js";
import { prismaClient } from "../../core/lib/database.lib.js";
import { BadRequestError } from "../../error/bad-request.error.js";
import { ForbiddenError } from "../../error/forbidden.error.js";
import {
  generateTotpToken,
  verifyTotpToken,
  verifyTotpCode,
  decryptTotpSecret,
  generateTotpSecret,
  encryptTotpSecret,
} from "../../utils/totp.utils.js";
import {
  getTokenConfig,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/token.utils.js";
import { generateDeviceId, parseDeviceName } from "../../utils/device.utils.js";

const registration = async (reqBody) => {
  reqBody = validate(registedNewUserSchema, reqBody);

  await validatePasswordPolicy(reqBody.password, "password");

  const existingUsername = await prismaClient.user.findUnique({
    where: {
      username: reqBody.username,
    },
  });

  if (existingUsername) {
    throw new ConflictError(`Username ${reqBody.username} sudah digunakan`);
  }

  const existingEmail = await prismaClient.user.findUnique({
    where: {
      email: reqBody.email,
    },
  });

  if (existingEmail) {
    throw new ConflictError(`Email ${reqBody.email} sudah digunakan.`);
  }

  const unitKerja = await prismaClient.unitKerja.findUnique({
    where: {
      id: reqBody.unitKerjaId,
    },
  });

  if (!unitKerja) {
    throw new NotFoundError("Unit kerja tidak ditemukan");
  }

  const hashedPassword = await hash(reqBody.password);

  const userRole = await prismaClient.role.findUnique({
    where: {
      name: "USER",
    },
  });

  if (!userRole) {
    throw new Error(
      "Role default USER tidak ditemukan. Silakan seed database terlebih dahulu.",
    );
  }

  const result = await prismaClient.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        username: reqBody.username,
        name: reqBody.name,
        email: reqBody.email,
        password: hashedPassword,
        passwordChangedAt: new Date(),
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await tx.userRole.create({
      data: {
        userId: newUser.id,
        roleId: userRole.id,
      },
    });

    const newProfile = await tx.profile.create({
      data: {
        userId: newUser.id,
        jabatan: reqBody.jabatan,
        unitKerjaId: reqBody.unitKerjaId,
        nomorHP: reqBody.nomorHP ?? null,
      },
      select: {
        id: true,
        jabatan: true,
        nomorHP: true,
        isVerified: true,
        unitKerja: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return { user: newUser, profile: newProfile };
  });

  console.log("ACTION_TYPES.USER_CREATED", {
    userId: result.user.id,
    username: result.user.username,
    email: result.user.email,
  });

  return {
    message: "Registrasi user berhasil",
    data: {
      ...result.user,
      profile: result.profile,
    },
  };
};

const login = async (reqBody, userAgent, ipAddress) => {
  reqBody = validate(loginSchema, reqBody);

  const { identifier, password: passwordInput } = reqBody;
  const loginContext = { identifier, ipAddress, userAgent };

  const user = await prismaClient.user.findFirst({
    where: {
      OR: [{ username: identifier }, { email: identifier }],
    },
    include: {
      userRoles: {
        include: {
          role: true,
        },
      },
      profile: true,
    },
  });

  if (!user) {
    console.error("ACTION_TYPES.LOGIN_FAILURE", {
      ...loginContext,
      reason: "User not found",
    });
    throw new BadRequestError("Username/email atau password salah.");
  }

  if (!user.isActive) {
    console.error("ACTION_TYPES.LOGIN_FAILURE", {
      ...loginContext,
      userId: user.id,
      username: user.username,
      reason: "Inactive account",
    });
    throw new ForbiddenError(
      "Akun Anda tidak aktif. Silakan hubungi administrator.",
    );
  }

  const isPasswordValid = await compare(passwordInput, user.password);

  if (!isPasswordValid) {
    console.error("ACTION_TYPES.LOGIN_FAILURE", {
      ...loginContext,
      userId: user.id,
      username: user.username,
      reason: "Invalid password",
    });
    throw new BadRequestError("Username/email atau password salah.");
  }

  // Check password expiration — skipped if PASSWORD_MAX_AGE_DAYS = 0 (no limit)
  const passwordMaxAgeDays = await getPasswordMaxAgeDays();
  if (passwordMaxAgeDays > 0) {
    const passwordExpiresAt = computePasswordExpiresAt(
      user.passwordChangedAt,
      passwordMaxAgeDays,
    );

    if (!passwordExpiresAt || new Date() > passwordExpiresAt) {
      throw new ForbiddenError(
        "Password Anda telah kadaluarsa. Silakan hubungi administrator untuk reset password.",
      );
    }
  }

  if (!user.totpEnabled) {
    const totpToken = generateTotpToken({
      userId: user.id,
      purpose: "totp_setup",
    });

    console.log("ACTION_TYPES.TOTP_SETUP_REQUIRED", {
      userId: user.id,
      username: user.username,
      ipAddress,
    });

    return {
      message: "TOTP belum diaktifkan. Silakan setup TOTP terlebih dahulu.",
      data: {
        requireTotpSetup: true,
        totpToken: totpToken,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
        },
      },
    };
  } else {
    const totpToken = generateTotpToken({
      userId: user.id,
      purpose: "totp_verify",
    });

    console.error("ACTION_TYPES.TOTP_VERIFY_REQUIRED", {
      userId: user.id,
      username: user.username,
      ipAddress,
    });

    return {
      message: "Silakan masukkan kode TOTP dari aplikasi authenticator Anda.",
      data: {
        requireTotp: true,
        totpToken: totpToken,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
        },
      },
    };
  }
};

const verifyLoginTotp = async (reqBody, userAgent, ipAddress) => {
  const { totpToken, code } = validate(verifyLoginTotpSchema, reqBody);

  let decoded;
  try {
    decoded = verifyTotpToken(totpToken);
  } catch {
    throw new UnauthorizedError("Token tidak valid atau sudah kadaluarsa.");
  }

  if (decoded.purpose !== "totp_verify") {
    throw new BadRequestError("Token tidak valid untuk operasi ini.");
  }

  const user = await prismaClient.user.findUnique({
    where: { id: decoded.userId },
    include: {
      userRoles: { include: { role: true } },
    },
  });

  if (!user || !user.isActive) {
    throw new ForbiddenError("Akun tidak valid atau tidak aktif.");
  }

  if (!user.totpEnabled || !user.totpSecret) {
    throw new BadRequestError("TOTP belum diaktifkan pada akun ini.");
  }

  const decryptedSecret = decryptTotpSecret(user.totpSecret);
  const isValidTotp = verifyTotpCode(code, decryptedSecret);

  if (!isValidTotp) {
    throw new BadRequestError("Kode TOTP tidak valid.");
  }

  const roles = user.userRoles.map((ur) => ur.role.name);
  const tokenConfig = await getTokenConfig();
  const accessToken = generateAccessToken(user.username, roles, tokenConfig.accessTokenExpiry);
  const refreshToken = generateRefreshToken(user.id, tokenConfig.sessionExpiryDays);

  const hashedRefreshToken = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  const deviceId = generateDeviceId(userAgent, ipAddress);
  const deviceName = parseDeviceName(userAgent);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + tokenConfig.sessionExpiryDays);

  await prismaClient.session.upsert({
    where: { userId: user.id },
    update: {
      refreshToken: hashedRefreshToken,
      deviceId,
      deviceName,
      userAgent,
      ipAddress,
      expiresAt,
    },
    create: {
      userId: user.id,
      refreshToken: hashedRefreshToken,
      deviceId,
      deviceName,
      userAgent,
      ipAddress,
      expiresAt,
    },
  });

  console.log("ACTION_TYPES.LOGIN_SUCCESS", {
    userId: user.id,
    username: user.username,
    ipAddress,
  });

  return {
    message: "Login berhasil.",
    tokenConfig,
    data: {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        roles,
      },
    },
  };
};

const forgotPassword = async (reqBody) => {
  const { identifier } = validate(forgotPasswordSchema, reqBody);

  const user = await prismaClient.user.findFirst({
    where: {
      OR: [{ username: identifier }, { email: identifier }],
    },
  });

  if (!user || !user.isActive) {
    throw new BadRequestError("Akun tidak ditemukan atau tidak aktif.");
  }

  if (!user.totpEnabled) {
    throw new ForbiddenError(
      "Fitur lupa password memerlukan TOTP yang telah diaktifkan. Silakan hubungi administrator.",
    );
  }

  const resetToken = generateTotpToken({
    userId: user.id,
    purpose: "totp_password_reset",
  });

  return {
    message:
      "Silakan verifikasi identitas Anda menggunakan kode TOTP dari aplikasi authenticator.",
    data: {
      resetToken,
      user: {
        id: user.id,
        username: user.username,
      },
    },
  };
};

const resetPasswordWithTotp = async (reqBody) => {
  const { resetToken, code, newPassword } = validate(
    resetPasswordSchema,
    reqBody,
  );

  await validatePasswordPolicy(newPassword, "newPassword");

  let decoded;
  try {
    decoded = verifyTotpToken(resetToken);
  } catch {
    throw new UnauthorizedError("Token tidak valid atau sudah kadaluarsa.");
  }

  if (decoded.purpose !== "totp_password_reset") {
    throw new BadRequestError("Token tidak valid untuk operasi ini.");
  }

  const user = await prismaClient.user.findUnique({
    where: { id: decoded.userId },
  });

  if (!user || !user.isActive) {
    throw new ForbiddenError("Akun tidak valid atau tidak aktif.");
  }

  if (!user.totpEnabled || !user.totpSecret) {
    throw new BadRequestError("TOTP belum diaktifkan pada akun ini.");
  }

  const decryptedSecret = decryptTotpSecret(user.totpSecret);
  const isValidTotp = verifyTotpCode(code, decryptedSecret);

  if (!isValidTotp) {
    throw new BadRequestError("Kode TOTP tidak valid.");
  }

  const hashedPassword = await hash(newPassword);

  await prismaClient.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
      },
    });

    await tx.session.deleteMany({
      where: { userId: user.id },
    });
  });

  console.log("ACTION_TYPES.PASSWORD_RESET", {
    userId: user.id,
    username: user.username,
  });

  return {
    message: "Password berhasil diubah. Silakan login dengan password baru.",
  };
};

const initTotpSetup = async (reqBody) => {
  const { totpToken } = validate(initTotpSetupSchema, reqBody);

  let decoded;
  try {
    decoded = verifyTotpToken(totpToken);
  } catch {
    throw new UnauthorizedError("Token tidak valid atau sudah kadaluarsa.");
  }

  if (decoded.purpose !== "totp_setup") {
    throw new BadRequestError("Token tidak valid untuk operasi ini.");
  }

  const user = await prismaClient.user.findUnique({
    where: { id: decoded.userId },
  });

  if (!user || !user.isActive) {
    throw new ForbiddenError("Akun tidak valid atau tidak aktif.");
  }

  if (user.totpEnabled) {
    throw new BadRequestError("TOTP sudah aktif pada akun ini.");
  }

  const totpData = generateTotpSecret(user.username);
  const encryptedSecret = encryptTotpSecret(totpData.base32);

  await prismaClient.user.update({
    where: { id: user.id },
    data: { totpSecret: encryptedSecret },
  });

  const qrCodeDataUrl = await QRCode.toDataURL(totpData.uri);

  return {
    message:
      "Scan QR code dengan aplikasi authenticator Anda, lalu masukkan kode 6 digit untuk verifikasi.",
    data: {
      qrCodeDataUrl,
      secret: totpData.base32,
    },
  };
};

const verifyTotpSetup = async (reqBody, userAgent, ipAddress) => {
  const { totpToken, code } = validate(verifyTotpSetupSchema, reqBody);

  let decoded;
  try {
    decoded = verifyTotpToken(totpToken);
  } catch {
    throw new UnauthorizedError("Token tidak valid atau sudah kadaluarsa.");
  }

  if (decoded.purpose !== "totp_setup") {
    throw new BadRequestError("Token tidak valid untuk operasi ini.");
  }

  const user = await prismaClient.user.findUnique({
    where: { id: decoded.userId },
    include: {
      userRoles: { include: { role: true } },
    },
  });

  if (!user || !user.isActive) {
    throw new ForbiddenError("Akun tidak valid atau tidak aktif.");
  }

  if (user.totpEnabled) {
    throw new BadRequestError("TOTP sudah aktif pada akun ini.");
  }

  if (!user.totpSecret) {
    throw new BadRequestError(
      "Silakan inisiasi setup TOTP terlebih dahulu melalui endpoint /auth/totp/setup/init.",
    );
  }

  const decryptedSecret = decryptTotpSecret(user.totpSecret);
  const isValidTotp = verifyTotpCode(code, decryptedSecret);

  if (!isValidTotp) {
    throw new BadRequestError(
      "Kode TOTP tidak valid. Pastikan waktu perangkat Anda sudah benar.",
    );
  }

  await prismaClient.user.update({
    where: { id: user.id },
    data: {
      totpEnabled: true,
      totpVerifiedAt: new Date(),
    },
  });

  const roles = user.userRoles.map((ur) => ur.role.name);
  const tokenConfig = await getTokenConfig();
  const accessToken = generateAccessToken(user.username, roles, tokenConfig.accessTokenExpiry);
  const refreshToken = generateRefreshToken(user.id, tokenConfig.sessionExpiryDays);

  const hashedRefreshToken = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  const deviceId = generateDeviceId(userAgent, ipAddress);
  const deviceName = parseDeviceName(userAgent);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + tokenConfig.sessionExpiryDays);

  await prismaClient.session.upsert({
    where: { userId: user.id },
    update: {
      refreshToken: hashedRefreshToken,
      deviceId,
      deviceName,
      userAgent,
      ipAddress,
      expiresAt,
    },
    create: {
      userId: user.id,
      refreshToken: hashedRefreshToken,
      deviceId,
      deviceName,
      userAgent,
      ipAddress,
      expiresAt,
    },
  });

  console.log("ACTION_TYPES.TOTP_SETUP_COMPLETE", {
    userId: user.id,
    username: user.username,
    ipAddress,
  });

  return {
    message: "TOTP berhasil diaktifkan. Selamat datang!",
    tokenConfig,
    data: {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        roles,
      },
    },
  };
};

// ─── Refresh ──────────────────────────────────────────────────────────────────

const refresh = async (rawRefreshToken) => {
  // Validasi format input sebelum diproses lebih lanjut
  const { refreshToken } = validate(refreshTokenSchema, {
    refreshToken: rawRefreshToken,
  });

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new UnauthorizedError(
      "Refresh token tidak valid atau sudah kadaluarsa.",
    );
  }

  const userId = decoded.sub;

  const session = await prismaClient.session.findUnique({
    where: { userId },
    include: {
      user: {
        include: { userRoles: { include: { role: true } } },
      },
    },
  });

  if (!session) {
    throw new UnauthorizedError("Sesi tidak ditemukan. Silakan login kembali.");
  }

  if (new Date() > session.expiresAt) {
    await prismaClient.session.delete({ where: { userId } });
    throw new UnauthorizedError(
      "Sesi sudah kadaluarsa. Silakan login kembali.",
    );
  }

  const hashedIncoming = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  if (hashedIncoming !== session.refreshToken) {
    throw new UnauthorizedError("Refresh token tidak valid.");
  }

  const user = session.user;
  if (!user || !user.isActive) {
    throw new UnauthorizedError("Akun tidak valid atau tidak aktif.");
  }

  const roles = user.userRoles.map((ur) => ur.role.name);
  const tokenConfig = await getTokenConfig();
  const newAccessToken = generateAccessToken(user.username, roles, tokenConfig.accessTokenExpiry);

  return {
    message: "Token berhasil diperbarui.",
    tokenConfig,
    data: { accessToken: newAccessToken },
  };
};

// ─── Logout ───────────────────────────────────────────────────────────────────

const logout = async (username) => {
  const user = await prismaClient.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (user) {
    await prismaClient.session.deleteMany({ where: { userId: user.id } });
  }

  return { message: "Logout berhasil." };
};

export default {
  registration,
  login,
  verifyLoginTotp,
  forgotPassword,
  resetPasswordWithTotp,
  initTotpSetup,
  verifyTotpSetup,
  refresh,
  logout,
};
