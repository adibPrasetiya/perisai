import supertest from "supertest";
import { TOTP, Secret } from "otpauth";
import { app } from "../../src/core/app/server.js";
import {
  prismaClient,
  ensureRoleUserExists,
  ensureRoleAdminExists,
  TEST_RESET_TOTP_PASSWORD,
  TEST_RESET_TOTP_ADMIN_USERNAME,
  TEST_RESET_TOTP_TARGET_USERNAME,
  TEST_RESET_TOTP_TARGET_EMAIL,
  createResetTotpTestUnitKerja,
  removeResetTotpTestUnitKerja,
  createResetTotpAdminUser,
  createResetTotpTargetUser,
  removeResetTotpTestUsers,
} from "../utils/user.utils.js";
import { hash } from "../../src/core/lib/password.lib.js";
import {
  generateTotpSecret,
  encryptTotpSecret,
} from "../../src/utils/totp.utils.js";

jest.setTimeout(30000);

let adminBase32Secret;
let adminUserId;
let targetUserId;
let adminAgent;

const generateTotpCode = (base32Secret) => {
  const totp = new TOTP({
    issuer: "PERISAI WEB APP",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(base32Secret),
  });
  return totp.generate();
};

const loginAndGetAgent = async (username, password, base32Secret) => {
  const agent = supertest.agent(app);
  const loginRes = await agent
    .post("/auth/login")
    .send({ identifier: username, password });
  expect(loginRes.status).toBe(200);

  const verifyRes = await agent.post("/auth/totp/verify").send({
    totpToken: loginRes.body.data.totpToken,
    code: generateTotpCode(base32Secret),
  });
  expect(verifyRes.status).toBe(200);

  return agent;
};

// Kembalikan TOTP target user ke kondisi aktif setelah setiap test
const restoreTargetTotp = async () => {
  const totpData = generateTotpSecret(TEST_RESET_TOTP_TARGET_USERNAME);
  const encryptedSecret = encryptTotpSecret(totpData.base32);
  await prismaClient.user.update({
    where: { id: targetUserId },
    data: {
      totpEnabled: true,
      totpSecret: encryptedSecret,
      totpVerifiedAt: new Date(),
    },
  });
  await prismaClient.session.deleteMany({ where: { userId: targetUserId } });
};

beforeAll(async () => {
  await ensureRoleUserExists();
  await ensureRoleAdminExists();
  await removeResetTotpTestUsers();
  await removeResetTotpTestUnitKerja();

  const unitKerja = await createResetTotpTestUnitKerja();

  const adminResult = await createResetTotpAdminUser(unitKerja.id);
  adminUserId = adminResult.user.id;
  adminBase32Secret = adminResult.base32Secret;

  const targetResult = await createResetTotpTargetUser(unitKerja.id);
  targetUserId = targetResult.user.id;

  adminAgent = await loginAndGetAgent(
    TEST_RESET_TOTP_ADMIN_USERNAME,
    TEST_RESET_TOTP_PASSWORD,
    adminBase32Secret,
  );
}, 30000);

afterEach(async () => {
  await restoreTargetTotp();
}, 30000);

afterAll(async () => {
  await prismaClient.session.deleteMany({
    where: { userId: { in: [adminUserId, targetUserId] } },
  });
  await removeResetTotpTestUsers();
  await removeResetTotpTestUnitKerja();
  await prismaClient.$disconnect();
}, 30000);

// ─── PATCH /users/:userId/reset-totp ─────────────────────────────────────────

describe("PATCH /users/:userId/reset-totp", () => {
  // ─── Autentikasi & Otorisasi ─────────────────────────────────────────────────

  describe("Autentikasi & Otorisasi", () => {
    it("harus mengembalikan 401 jika tidak ada cookie autentikasi", async () => {
      const res = await supertest(app)
        .patch(`/users/${targetUserId}/reset-totp`)
        .send({ password: TEST_RESET_TOTP_PASSWORD, totpCode: "123456" });
      expect(res.status).toBe(401);
    });
  });

  // ─── Validasi Input ──────────────────────────────────────────────────────────

  describe("Validasi Input", () => {
    it("harus mengembalikan 400 jika password tidak diisi", async () => {
      const code = generateTotpCode(adminBase32Secret);
      const res = await adminAgent
        .patch(`/users/${targetUserId}/reset-totp`)
        .send({ totpCode: code });
      expect(res.status).toBe(400);
    });

    it("harus mengembalikan 400 jika totpCode tidak diisi", async () => {
      const res = await adminAgent
        .patch(`/users/${targetUserId}/reset-totp`)
        .send({ password: TEST_RESET_TOTP_PASSWORD });
      expect(res.status).toBe(400);
    });

    it("harus mengembalikan 400 jika totpCode bukan 6 digit angka", async () => {
      const res = await adminAgent
        .patch(`/users/${targetUserId}/reset-totp`)
        .send({ password: TEST_RESET_TOTP_PASSWORD, totpCode: "abc123" });
      expect(res.status).toBe(400);
    });

    it("harus mengembalikan 400 jika totpCode kurang dari 6 digit", async () => {
      const res = await adminAgent
        .patch(`/users/${targetUserId}/reset-totp`)
        .send({ password: TEST_RESET_TOTP_PASSWORD, totpCode: "12345" });
      expect(res.status).toBe(400);
    });
  });

  // ─── Business Logic ──────────────────────────────────────────────────────────

  describe("Business Logic", () => {
    it("harus mengembalikan 400 jika password admin tidak valid", async () => {
      const code = generateTotpCode(adminBase32Secret);
      const res = await adminAgent
        .patch(`/users/${targetUserId}/reset-totp`)
        .send({ password: "PasswordSalah@999", totpCode: code });
      expect(res.status).toBe(400);
      expect(res.body.errors).toMatch(/Password tidak valid/);
    });

    it("harus mengembalikan 400 jika kode TOTP admin tidak valid", async () => {
      const res = await adminAgent
        .patch(`/users/${targetUserId}/reset-totp`)
        .send({ password: TEST_RESET_TOTP_PASSWORD, totpCode: "000000" });
      expect(res.status).toBe(400);
      expect(res.body.errors).toMatch(/Kode TOTP tidak valid/);
    });

    it("harus mengembalikan 404 jika userId target tidak ditemukan", async () => {
      const code = generateTotpCode(adminBase32Secret);
      const res = await adminAgent
        .patch(`/users/id-yang-tidak-ada-sama-sekali/reset-totp`)
        .send({ password: TEST_RESET_TOTP_PASSWORD, totpCode: code });
      expect(res.status).toBe(404);
      expect(res.body.errors).toMatch(/tidak ditemukan/);
    });

    it("harus mengembalikan 400 jika admin mencoba mereset TOTP akunnya sendiri", async () => {
      const code = generateTotpCode(adminBase32Secret);
      const res = await adminAgent
        .patch(`/users/${adminUserId}/reset-totp`)
        .send({ password: TEST_RESET_TOTP_PASSWORD, totpCode: code });
      expect(res.status).toBe(400);
      expect(res.body.errors).toMatch(/akun sendiri/);
    });

    it("harus mengembalikan 400 jika TOTP target user belum aktif", async () => {
      // Nonaktifkan TOTP target user terlebih dahulu
      await prismaClient.user.update({
        where: { id: targetUserId },
        data: { totpEnabled: false, totpSecret: null, totpVerifiedAt: null },
      });

      const code = generateTotpCode(adminBase32Secret);
      const res = await adminAgent
        .patch(`/users/${targetUserId}/reset-totp`)
        .send({ password: TEST_RESET_TOTP_PASSWORD, totpCode: code });
      expect(res.status).toBe(400);
      expect(res.body.errors).toMatch(/belum diaktifkan/);
    });
  });

  // ─── Sukses ──────────────────────────────────────────────────────────────────

  describe("Sukses", () => {
    it("harus mengembalikan 200 dengan pesan yang benar", async () => {
      const code = generateTotpCode(adminBase32Secret);
      const res = await adminAgent
        .patch(`/users/${targetUserId}/reset-totp`)
        .send({ password: TEST_RESET_TOTP_PASSWORD, totpCode: code });
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/berhasil direset/);
    });

    it("harus menonaktifkan TOTP target user di database", async () => {
      const code = generateTotpCode(adminBase32Secret);
      await adminAgent
        .patch(`/users/${targetUserId}/reset-totp`)
        .send({ password: TEST_RESET_TOTP_PASSWORD, totpCode: code });

      const user = await prismaClient.user.findUnique({
        where: { id: targetUserId },
        select: { totpEnabled: true, totpSecret: true, totpVerifiedAt: true },
      });
      expect(user.totpEnabled).toBe(false);
      expect(user.totpSecret).toBeNull();
      expect(user.totpVerifiedAt).toBeNull();
    });

    it("harus menghapus sesi aktif target user", async () => {
      // Buat sesi untuk target user
      await prismaClient.session.upsert({
        where: { userId: targetUserId },
        update: {},
        create: {
          userId: targetUserId,
          refreshToken: "dummy-token-reset-totp-test",
          deviceId: "dummy-device-reset-totp",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      const code = generateTotpCode(adminBase32Secret);
      await adminAgent
        .patch(`/users/${targetUserId}/reset-totp`)
        .send({ password: TEST_RESET_TOTP_PASSWORD, totpCode: code });

      const session = await prismaClient.session.findUnique({
        where: { userId: targetUserId },
      });
      expect(session).toBeNull();
    });

    it("harus mengembalikan data target user dalam respons", async () => {
      const code = generateTotpCode(adminBase32Secret);
      const res = await adminAgent
        .patch(`/users/${targetUserId}/reset-totp`)
        .send({ password: TEST_RESET_TOTP_PASSWORD, totpCode: code });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("userId", targetUserId);
      expect(res.body.data).toHaveProperty(
        "username",
        TEST_RESET_TOTP_TARGET_USERNAME,
      );
      expect(res.body.data).toHaveProperty("name");
    });

    it("target user tidak bisa login dengan TOTP lama setelah reset", async () => {
      const code = generateTotpCode(adminBase32Secret);
      await adminAgent
        .patch(`/users/${targetUserId}/reset-totp`)
        .send({ password: TEST_RESET_TOTP_PASSWORD, totpCode: code });

      // Login dengan target user — harus minta setup TOTP ulang (requireTotpSetup: true)
      const loginRes = await supertest(app).post("/auth/login").send({
        identifier: TEST_RESET_TOTP_TARGET_USERNAME,
        password: TEST_RESET_TOTP_PASSWORD,
      });
      expect(loginRes.status).toBe(200);
      expect(loginRes.body.data.requireTotpSetup).toBe(true);
    });
  });
});
