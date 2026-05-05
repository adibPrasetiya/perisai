import supertest from "supertest";
import { TOTP, Secret } from "otpauth";
import { app } from "../../src/core/app/server.js";
import {
  prismaClient,
  ensureRoleUserExists,
  TEST_PROFILE_PASSWORD,
  TEST_PROFILE_USERNAME,
  TEST_PROFILE_EMAIL,
  TEST_PROFILE_JABATAN,
  TEST_PROFILE_NOMOR_HP,
  TEST_PROFILE_UNIT_KERJA_CODE,
  createProfileTestUnitKerja,
  removeProfileTestUnitKerja,
  createProfileTestUser,
  removeProfileTestUser,
} from "../utils/user.utils.js";

jest.setTimeout(30000);

let myAgent;
let userId;
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

beforeAll(async () => {
  await ensureRoleUserExists();

  // Defensive pre-cleanup
  await removeProfileTestUser();
  await removeProfileTestUnitKerja();

  const unitKerja = await createProfileTestUnitKerja();
  unitKerjaId = unitKerja.id;

  const { user, base32Secret } = await createProfileTestUser(unitKerjaId);
  userId = user.id;

  // Login dan simpan sesi dalam agent
  myAgent = supertest.agent(app);

  const loginRes = await myAgent
    .post("/auth/login")
    .send({ identifier: TEST_PROFILE_USERNAME, password: TEST_PROFILE_PASSWORD });
  expect(loginRes.status).toBe(200);

  const { totpToken } = loginRes.body.data;
  const code = generateTotpCode(base32Secret);

  const verifyRes = await myAgent
    .post("/auth/totp/verify")
    .send({ totpToken, code });
  expect(verifyRes.status).toBe(200);
}, 30000);

afterAll(async () => {
  await prismaClient.session.deleteMany({ where: { userId } });
  await removeProfileTestUser();
  await removeProfileTestUnitKerja();
  await prismaClient.$disconnect();
}, 30000);

// ─── GET /users/me ────────────────────────────────────────────────────────────

describe("GET /users/me", () => {
  // ─── Autentikasi ────────────────────────────────────────────────────────────

  describe("Autentikasi", () => {
    it("harus mengembalikan 401 jika tidak ada cookie autentikasi", async () => {
      const res = await supertest(app).get("/users/me");
      expect(res.status).toBe(401);
    });
  });

  // ─── Sukses ─────────────────────────────────────────────────────────────────

  describe("Sukses", () => {
    it("harus mengembalikan 200 dengan pesan yang benar", async () => {
      const res = await myAgent.get("/users/me");

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Data profil berhasil ditemukan");
      expect(res.body.data).toBeDefined();
    });

    it("harus mengembalikan field user yang lengkap dan akurat", async () => {
      const res = await myAgent.get("/users/me");

      const { data } = res.body;
      expect(data.id).toBe(userId);
      expect(data.username).toBe(TEST_PROFILE_USERNAME);
      expect(data.name).toBe("Test User Profile");
      expect(data.email).toBe(TEST_PROFILE_EMAIL);
      expect(data.isActive).toBe(true);
      expect(data.isVerified).toBe(true);
      expect(typeof data.mustChangePassword).toBe("boolean");
      expect(data.totpEnabled).toBe(true);
      expect(data.passwordChangedAt).toBeDefined();
      expect(data.createdAt).toBeDefined();
      expect(data.updatedAt).toBeDefined();
    });

    it("harus mengembalikan array roles yang benar", async () => {
      const res = await myAgent.get("/users/me");

      const { data } = res.body;
      expect(Array.isArray(data.roles)).toBe(true);
      expect(data.roles).toContain("USER");
    });

    it("harus mengembalikan data profile dengan informasi yang benar", async () => {
      const res = await myAgent.get("/users/me");

      const { profile } = res.body.data;
      expect(profile).not.toBeNull();
      expect(profile.jabatan).toBe(TEST_PROFILE_JABATAN);
      expect(profile.nomorHP).toBe(TEST_PROFILE_NOMOR_HP);
      expect(profile.isVerified).toBe(true);
      expect(profile.verifiedAt).not.toBeNull();
    });

    it("harus mengembalikan data unitKerja di dalam profile", async () => {
      const res = await myAgent.get("/users/me");

      const { unitKerja } = res.body.data.profile;
      expect(unitKerja).not.toBeNull();
      expect(unitKerja.id).toBe(unitKerjaId);
      expect(unitKerja.name).toBe("Unit Kerja Profile Test");
      expect(unitKerja.code).toBe(TEST_PROFILE_UNIT_KERJA_CODE);
    });

    it("endpoint /users/me tidak boleh terpengaruh oleh route /users/:userId", async () => {
      // Pastikan "me" tidak diperlakukan sebagai userId (harus 200, bukan 404)
      const res = await myAgent.get("/users/me");
      expect(res.status).toBe(200);
      expect(res.body.data.username).toBe(TEST_PROFILE_USERNAME);
    });
  });
});
