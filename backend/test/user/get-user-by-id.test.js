import supertest from "supertest";
import { TOTP, Secret } from "otpauth";
import { app } from "../../src/core/app/server.js";
import {
  prismaClient,
  ensureRoleUserExists,
  ensureRoleAdminExists,
  TEST_GET_PASSWORD,
  TEST_GET_ADMIN_USERNAME,
  TEST_GET_USER1_USERNAME,
  TEST_GET_TARGET_USERNAME,
  TEST_GET_TARGET_EMAIL,
  TEST_GET_UNIT_KERJA_CODE,
  createGetTestUnitKerja,
  removeGetTestUnitKerja,
  createGetAdminUser,
  createGetUser1,
  createGetTargetUser,
  removeGetTestUsers,
} from "../utils/user.utils.js";

jest.setTimeout(30000);

let adminAgent;
let user1UserId;
let user1Base32Secret;
let targetUserId;
let unitKerjaId;

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

  const { totpToken } = loginRes.body.data;
  const code = generateTotpCode(base32Secret);

  const verifyRes = await agent
    .post("/auth/totp/verify")
    .send({ totpToken, code });
  expect(verifyRes.status).toBe(200);

  return agent;
};

beforeAll(async () => {
  await ensureRoleUserExists();
  await ensureRoleAdminExists();

  // Defensive pre-cleanup
  await removeGetTestUsers();
  await removeGetTestUnitKerja();

  const unitKerja = await createGetTestUnitKerja();
  unitKerjaId = unitKerja.id;

  const adminResult = await createGetAdminUser(unitKerjaId);
  const user1Result = await createGetUser1(unitKerjaId);
  const targetUser = await createGetTargetUser(unitKerjaId);

  user1UserId = user1Result.user.id;
  user1Base32Secret = user1Result.base32Secret;
  targetUserId = targetUser.id;

  adminAgent = await loginAndGetAgent(
    TEST_GET_ADMIN_USERNAME,
    TEST_GET_PASSWORD,
    adminResult.base32Secret
  );
}, 30000);

afterEach(async () => {
  if (user1UserId) {
    await prismaClient.session.deleteMany({ where: { userId: user1UserId } });
  }
}, 30000);

afterAll(async () => {
  await removeGetTestUsers();
  await removeGetTestUnitKerja();
  await prismaClient.$disconnect();
}, 30000);

// ─── GET /users/:userId ────────────────────────────────────────────────────────

describe("GET /users/:userId", () => {
  // ─── Autentikasi & Otorisasi ────────────────────────────────────────────────

  describe("Autentikasi & Otorisasi", () => {
    it("harus mengembalikan 401 jika tidak ada cookie autentikasi", async () => {
      const res = await supertest(app).get(`/users/${targetUserId}`);
      expect(res.status).toBe(401);
    });

    it("harus mengembalikan 403 jika pengguna bukan ADMINISTRATOR", async () => {
      const userAgent = await loginAndGetAgent(
        TEST_GET_USER1_USERNAME,
        TEST_GET_PASSWORD,
        user1Base32Secret
      );

      const res = await userAgent.get(`/users/${targetUserId}`);
      expect(res.status).toBe(403);
    });
  });

  // ─── Sukses ─────────────────────────────────────────────────────────────────

  describe("Sukses", () => {
    it("harus mengembalikan 200 dengan pesan yang benar", async () => {
      const res = await adminAgent.get(`/users/${targetUserId}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Data pengguna berhasil ditemukan");
      expect(res.body.data).toBeDefined();
    });

    it("harus mengembalikan field user yang lengkap dan akurat", async () => {
      const res = await adminAgent.get(`/users/${targetUserId}`);

      const { data } = res.body;
      expect(data.id).toBe(targetUserId);
      expect(data.username).toBe(TEST_GET_TARGET_USERNAME);
      expect(data.name).toBe("Target User Get Test");
      expect(data.email).toBe(TEST_GET_TARGET_EMAIL);
      expect(data.isActive).toBe(false);
      expect(data.isVerified).toBe(false);
      expect(typeof data.mustChangePassword).toBe("boolean");
      expect(typeof data.totpEnabled).toBe("boolean");
      expect(data.passwordChangedAt).toBeDefined();
      expect(data.createdAt).toBeDefined();
      expect(data.updatedAt).toBeDefined();
    });

    it("harus mengembalikan array roles yang benar", async () => {
      const res = await adminAgent.get(`/users/${targetUserId}`);

      const { data } = res.body;
      expect(Array.isArray(data.roles)).toBe(true);
      expect(data.roles).toContain("USER");
    });

    it("harus mengembalikan data profile dengan informasi yang benar", async () => {
      const res = await adminAgent.get(`/users/${targetUserId}`);

      const { profile } = res.body.data;
      expect(profile).not.toBeNull();
      expect(profile.jabatan).toBe("Staf TIK");
      expect(profile.nomorHP).toBe("081234567890");
      expect(profile.isVerified).toBe(false);
      expect(profile.verifiedAt).toBeNull();
    });

    it("harus mengembalikan data unitKerja di dalam profile", async () => {
      const res = await adminAgent.get(`/users/${targetUserId}`);

      const { unitKerja } = res.body.data.profile;
      expect(unitKerja).not.toBeNull();
      expect(unitKerja.id).toBe(unitKerjaId);
      expect(unitKerja.name).toBe("Unit Kerja Get Test");
      expect(unitKerja.code).toBe(TEST_GET_UNIT_KERJA_CODE);
    });

    it("harus bisa mengambil data pengguna dengan role ADMINISTRATOR dan profile terverifikasi", async () => {
      const adminUser = await prismaClient.user.findUnique({
        where: { username: TEST_GET_ADMIN_USERNAME },
        select: { id: true },
      });

      const res = await adminAgent.get(`/users/${adminUser.id}`);

      expect(res.status).toBe(200);
      expect(res.body.data.username).toBe(TEST_GET_ADMIN_USERNAME);
      expect(res.body.data.roles).toContain("ADMINISTRATOR");
      expect(res.body.data.isActive).toBe(true);
      expect(res.body.data.isVerified).toBe(true);
      expect(res.body.data.profile.isVerified).toBe(true);
      expect(res.body.data.profile.verifiedAt).not.toBeNull();
    });
  });

  // ─── Error Cases ────────────────────────────────────────────────────────────

  describe("Error Cases", () => {
    it("harus mengembalikan 404 jika userId tidak ditemukan", async () => {
      const nonExistentId = "00000000-0000-0000-0000-000000000000";
      const res = await adminAgent.get(`/users/${nonExistentId}`);

      expect(res.status).toBe(404);
      expect(res.body.errors).toBeDefined();
    });
  });
});
