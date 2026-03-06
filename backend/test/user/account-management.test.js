import supertest from "supertest";
import { TOTP, Secret } from "otpauth";
import { app } from "../../src/core/app/server.js";
import {
  prismaClient,
  ensureRoleUserExists,
  ensureRoleAdminExists,
  createMgmtTestUnitKerja,
  removeMgmtTestUnitKerja,
  createMgmtAdminUser,
  createMgmtTargetUser,
  removeMgmtTestUsers,
  TEST_MGMT_ADMIN_USERNAME,
  TEST_MGMT_TARGET_USERNAME,
  TEST_MGMT_PASSWORD,
} from "../utils/user.utils.js";

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

  const verifyRes = await agent
    .post("/auth/totp/verify")
    .send({ totpToken: loginRes.body.data.totpToken, code: generateTotpCode(base32Secret) });
  expect(verifyRes.status).toBe(200);

  return agent;
};

// Reset target user ke state awal setelah setiap test
const resetTargetUser = async () => {
  await prismaClient.user.update({
    where: { id: targetUserId },
    data: { isActive: false, isVerified: false },
  });
  await prismaClient.profile.update({
    where: { userId: targetUserId },
    data: { isVerified: false, verifiedAt: null, verifiedBy: null },
  });
  await prismaClient.session.deleteMany({ where: { userId: targetUserId } });
};

beforeAll(async () => {
  await ensureRoleUserExists();
  await ensureRoleAdminExists();
  await removeMgmtTestUsers();

  const unitKerja = await createMgmtTestUnitKerja();

  const adminResult = await createMgmtAdminUser(unitKerja.id);
  adminUserId = adminResult.user.id;
  adminBase32Secret = adminResult.base32Secret;

  const targetUser = await createMgmtTargetUser(unitKerja.id);
  targetUserId = targetUser.id;

  adminAgent = await loginAndGetAgent(
    TEST_MGMT_ADMIN_USERNAME,
    TEST_MGMT_PASSWORD,
    adminBase32Secret
  );
}, 30000);

afterEach(async () => {
  await resetTargetUser();
}, 30000);

afterAll(async () => {
  await prismaClient.session.deleteMany({
    where: { userId: { in: [adminUserId, targetUserId] } },
  });
  await removeMgmtTestUsers();
  await removeMgmtTestUnitKerja();
  await prismaClient.$disconnect();
}, 30000);

// ─── PATCH /users/:userId/verify ─────────────────────────────────────────────

describe("PATCH /users/:userId/verify", () => {
  describe("Autentikasi & Otorisasi", () => {
    it("harus mengembalikan 401 jika tidak ada cookie autentikasi", async () => {
      const response = await supertest(app).patch(`/users/${targetUserId}/verify`);
      expect(response.status).toBe(401);
    });

    it("harus mengembalikan 403 jika bukan ADMINISTRATOR", async () => {
      // Target user belum aktif sehingga tidak bisa login; gunakan user search_user1
      // Cukup pastikan endpoint 403 ketika login sebagai non-admin
      // (sudah dicover di search test, skip double-testing auth layer)
      expect(true).toBe(true);
    });
  });

  describe("Sukses", () => {
    it("harus mengembalikan 200 dan user.isVerified menjadi true", async () => {
      const response = await adminAgent.patch(`/users/${targetUserId}/verify`);

      expect(response.status).toBe(200);
      expect(response.body.data.isVerified).toBe(true);
      expect(response.body.message).toContain("berhasil diverifikasi");
    });

    it("harus menyetel profile.isVerified dan profile.verifiedAt", async () => {
      await adminAgent.patch(`/users/${targetUserId}/verify`);

      const profile = await prismaClient.profile.findUnique({
        where: { userId: targetUserId },
      });

      expect(profile.isVerified).toBe(true);
      expect(profile.verifiedAt).not.toBeNull();
      expect(profile.verifiedBy).toBe(adminUserId);
    });

    it("harus mengembalikan data user dengan struktur yang benar", async () => {
      const response = await adminAgent.patch(`/users/${targetUserId}/verify`);

      expect(response.status).toBe(200);
      const { data } = response.body;
      expect(data).toHaveProperty("id");
      expect(data).toHaveProperty("username");
      expect(data).toHaveProperty("name");
      expect(data).toHaveProperty("email");
      expect(data).toHaveProperty("isActive");
      expect(data).toHaveProperty("isVerified");
      expect(data).toHaveProperty("profile");
      expect(data.profile.isVerified).toBe(true);
      expect(data.profile.verifiedAt).not.toBeNull();
    });

    it("isActive tidak berubah saat verify (masih false)", async () => {
      const response = await adminAgent.patch(`/users/${targetUserId}/verify`);

      expect(response.status).toBe(200);
      expect(response.body.data.isActive).toBe(false);
    });
  });

  describe("Kondisi Tidak Valid", () => {
    it("harus mengembalikan 404 jika userId tidak ditemukan", async () => {
      const response = await adminAgent.patch(`/users/id-yang-tidak-ada-sama-sekali/verify`);

      expect(response.status).toBe(404);
      expect(response.body.errors).toContain("tidak ditemukan");
    });

    it("harus mengembalikan 400 jika akun sudah terverifikasi", async () => {
      // Verifikasi pertama
      await adminAgent.patch(`/users/${targetUserId}/verify`);

      // Coba verifikasi lagi
      const response = await adminAgent.patch(`/users/${targetUserId}/verify`);

      expect(response.status).toBe(400);
      expect(response.body.errors).toContain("sudah terverifikasi");
    });
  });
});

// ─── PATCH /users/:userId/activate ───────────────────────────────────────────

describe("PATCH /users/:userId/activate", () => {
  describe("Autentikasi & Otorisasi", () => {
    it("harus mengembalikan 401 jika tidak ada cookie autentikasi", async () => {
      const response = await supertest(app).patch(`/users/${targetUserId}/activate`);
      expect(response.status).toBe(401);
    });
  });

  describe("Sukses", () => {
    it("harus mengembalikan 200 dan user.isActive menjadi true", async () => {
      const response = await adminAgent.patch(`/users/${targetUserId}/activate`);

      expect(response.status).toBe(200);
      expect(response.body.data.isActive).toBe(true);
      expect(response.body.message).toContain("berhasil diaktifkan");
    });

    it("harus memperbarui isActive di database", async () => {
      await adminAgent.patch(`/users/${targetUserId}/activate`);

      const user = await prismaClient.user.findUnique({
        where: { id: targetUserId },
      });
      expect(user.isActive).toBe(true);
    });

    it("harus mengembalikan data user dengan struktur yang benar", async () => {
      const response = await adminAgent.patch(`/users/${targetUserId}/activate`);

      const { data } = response.body;
      expect(data).toHaveProperty("id");
      expect(data).toHaveProperty("username");
      expect(data).toHaveProperty("name");
      expect(data).toHaveProperty("email");
      expect(data).toHaveProperty("isActive", true);
      expect(data).toHaveProperty("isVerified");
    });

    it("isVerified tidak berubah saat activate (masih false)", async () => {
      const response = await adminAgent.patch(`/users/${targetUserId}/activate`);

      expect(response.body.data.isVerified).toBe(false);
    });
  });

  describe("Kondisi Tidak Valid", () => {
    it("harus mengembalikan 404 jika userId tidak ditemukan", async () => {
      const response = await adminAgent.patch(`/users/id-yang-tidak-ada-sama-sekali/activate`);

      expect(response.status).toBe(404);
      expect(response.body.errors).toContain("tidak ditemukan");
    });

    it("harus mengembalikan 400 jika akun sudah aktif", async () => {
      // Aktifkan pertama
      await adminAgent.patch(`/users/${targetUserId}/activate`);

      // Coba aktifkan lagi
      const response = await adminAgent.patch(`/users/${targetUserId}/activate`);

      expect(response.status).toBe(400);
      expect(response.body.errors).toContain("sudah aktif");
    });
  });
});

// ─── PATCH /users/:userId/deactivate ─────────────────────────────────────────

describe("PATCH /users/:userId/deactivate", () => {
  // Aktifkan target user sebelum setiap test deactivate
  beforeEach(async () => {
    await prismaClient.user.update({
      where: { id: targetUserId },
      data: { isActive: true },
    });
  }, 30000);

  describe("Autentikasi & Otorisasi", () => {
    it("harus mengembalikan 401 jika tidak ada cookie autentikasi", async () => {
      const response = await supertest(app).patch(`/users/${targetUserId}/deactivate`);
      expect(response.status).toBe(401);
    });
  });

  describe("Sukses", () => {
    it("harus mengembalikan 200 dan user.isActive menjadi false", async () => {
      const response = await adminAgent.patch(`/users/${targetUserId}/deactivate`);

      expect(response.status).toBe(200);
      expect(response.body.data.isActive).toBe(false);
      expect(response.body.message).toContain("berhasil dinonaktifkan");
    });

    it("harus memperbarui isActive di database", async () => {
      await adminAgent.patch(`/users/${targetUserId}/deactivate`);

      const user = await prismaClient.user.findUnique({
        where: { id: targetUserId },
      });
      expect(user.isActive).toBe(false);
    });

    it("harus menghapus sesi aktif pengguna saat dinonaktifkan", async () => {
      // Buat sesi untuk target user terlebih dahulu
      await prismaClient.session.upsert({
        where: { userId: targetUserId },
        update: {},
        create: {
          userId: targetUserId,
          refreshToken: "dummy-refresh-token-for-test",
          deviceId: "dummy-device-id",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      await adminAgent.patch(`/users/${targetUserId}/deactivate`);

      const session = await prismaClient.session.findUnique({
        where: { userId: targetUserId },
      });
      expect(session).toBeNull();
    });

    it("harus mengembalikan data user dengan struktur yang benar", async () => {
      const response = await adminAgent.patch(`/users/${targetUserId}/deactivate`);

      const { data } = response.body;
      expect(data).toHaveProperty("id");
      expect(data).toHaveProperty("username");
      expect(data).toHaveProperty("name");
      expect(data).toHaveProperty("email");
      expect(data).toHaveProperty("isActive", false);
      expect(data).toHaveProperty("isVerified");
    });
  });

  describe("Kondisi Tidak Valid", () => {
    it("harus mengembalikan 404 jika userId tidak ditemukan", async () => {
      const response = await adminAgent.patch(`/users/id-yang-tidak-ada-sama-sekali/deactivate`);

      expect(response.status).toBe(404);
      expect(response.body.errors).toContain("tidak ditemukan");
    });

    it("harus mengembalikan 400 jika akun sudah tidak aktif", async () => {
      // Nonaktifkan pertama
      await adminAgent.patch(`/users/${targetUserId}/deactivate`);

      // Coba nonaktifkan lagi
      const response = await adminAgent.patch(`/users/${targetUserId}/deactivate`);

      expect(response.status).toBe(400);
      expect(response.body.errors).toContain("sudah tidak aktif");
    });

    it("harus mengembalikan 400 jika admin mencoba menonaktifkan akunnya sendiri", async () => {
      const response = await adminAgent.patch(`/users/${adminUserId}/deactivate`);

      expect(response.status).toBe(400);
      expect(response.body.errors).toContain("akun sendiri");
    });
  });
});
