import supertest from "supertest";
import { TOTP, Secret } from "otpauth";
import { app } from "../../src/core/app/server.js";
import { hash } from "../../src/core/lib/password.lib.js";
import {
  prismaClient,
  ensureRoleUserExists,
  TEST_CHANGE_PWD_PASSWORD,
  TEST_CHANGE_PWD_NEW_PASSWORD,
  TEST_CHANGE_PWD_USERNAME,
  createChangePwdTestUnitKerja,
  removeChangePwdTestUnitKerja,
  createChangePwdTestUser,
  removeChangePwdTestUser,
} from "../utils/user.utils.js";

jest.setTimeout(30000);

let base32Secret;
let userId;

const generateTotpCode = (secret) => {
  const totp = new TOTP({
    issuer: "PERISAI WEB APP",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secret),
  });
  return totp.generate();
};

const loginAndGetAgent = async () => {
  const agent = supertest.agent(app);

  const loginRes = await agent.post("/auth/login").send({
    identifier: TEST_CHANGE_PWD_USERNAME,
    password: TEST_CHANGE_PWD_PASSWORD,
  });
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

  // Defensive pre-cleanup
  await removeChangePwdTestUser();
  await removeChangePwdTestUnitKerja();

  const unitKerja = await createChangePwdTestUnitKerja();
  const result = await createChangePwdTestUser(unitKerja.id);

  base32Secret = result.base32Secret;
  userId = result.user.id;
}, 30000);

afterAll(async () => {
  await removeChangePwdTestUser();
  await removeChangePwdTestUnitKerja();
  await prismaClient.$disconnect();
}, 30000);

// Setelah setiap test: hapus sesi dan reset password ke semula
// agar setiap test bisa login dengan kredensial awal
afterEach(async () => {
  await prismaClient.session.deleteMany({ where: { userId } });
  const hashedOriginal = await hash(TEST_CHANGE_PWD_PASSWORD);
  await prismaClient.user.update({
    where: { id: userId },
    data: { password: hashedOriginal, passwordChangedAt: new Date() },
  });
}, 30000);

// ─── PATCH /users/me/password ─────────────────────────────────────────────────

describe("PATCH /users/me/password", () => {
  // ─── Autentikasi ──────────────────────────────────────────────────────────

  describe("Autentikasi", () => {
    it("harus mengembalikan 401 jika tidak ada cookie autentikasi", async () => {
      const res = await supertest(app).patch("/users/me/password").send({
        currentPassword: TEST_CHANGE_PWD_PASSWORD,
        newPassword: TEST_CHANGE_PWD_NEW_PASSWORD,
        confirmPassword: TEST_CHANGE_PWD_NEW_PASSWORD,
        totpCode: "123456",
      });
      expect(res.status).toBe(401);
    });
  });

  // ─── Validasi Input ───────────────────────────────────────────────────────

  describe("Validasi Input", () => {
    it("harus mengembalikan 400 jika currentPassword tidak diisi", async () => {
      const agent = await loginAndGetAgent();
      const code = generateTotpCode(base32Secret);

      const res = await agent.patch("/users/me/password").send({
        newPassword: TEST_CHANGE_PWD_NEW_PASSWORD,
        confirmPassword: TEST_CHANGE_PWD_NEW_PASSWORD,
        totpCode: code,
      });
      expect(res.status).toBe(400);
    });

    it("harus mengembalikan 400 jika newPassword tidak diisi", async () => {
      const agent = await loginAndGetAgent();
      const code = generateTotpCode(base32Secret);

      const res = await agent.patch("/users/me/password").send({
        currentPassword: TEST_CHANGE_PWD_PASSWORD,
        confirmPassword: TEST_CHANGE_PWD_NEW_PASSWORD,
        totpCode: code,
      });
      expect(res.status).toBe(400);
    });

    it("harus mengembalikan 400 jika totpCode tidak diisi", async () => {
      const agent = await loginAndGetAgent();

      const res = await agent.patch("/users/me/password").send({
        currentPassword: TEST_CHANGE_PWD_PASSWORD,
        newPassword: TEST_CHANGE_PWD_NEW_PASSWORD,
        confirmPassword: TEST_CHANGE_PWD_NEW_PASSWORD,
      });
      expect(res.status).toBe(400);
    });

    it("harus mengembalikan 400 jika newPassword tidak memenuhi syarat kompleksitas", async () => {
      const agent = await loginAndGetAgent();
      const code = generateTotpCode(base32Secret);

      const res = await agent.patch("/users/me/password").send({
        currentPassword: TEST_CHANGE_PWD_PASSWORD,
        newPassword: "lemahbanget",
        confirmPassword: "lemahbanget",
        totpCode: code,
      });
      expect(res.status).toBe(400);
    });

    it("harus mengembalikan 400 jika confirmPassword tidak cocok dengan newPassword", async () => {
      const agent = await loginAndGetAgent();
      const code = generateTotpCode(base32Secret);

      const res = await agent.patch("/users/me/password").send({
        currentPassword: TEST_CHANGE_PWD_PASSWORD,
        newPassword: TEST_CHANGE_PWD_NEW_PASSWORD,
        confirmPassword: "BedaSekali@9999",
        totpCode: code,
      });
      expect(res.status).toBe(400);
    });

    it("harus mengembalikan 400 jika totpCode bukan 6 digit angka", async () => {
      const agent = await loginAndGetAgent();

      const res = await agent.patch("/users/me/password").send({
        currentPassword: TEST_CHANGE_PWD_PASSWORD,
        newPassword: TEST_CHANGE_PWD_NEW_PASSWORD,
        confirmPassword: TEST_CHANGE_PWD_NEW_PASSWORD,
        totpCode: "abc123",
      });
      expect(res.status).toBe(400);
    });

    it("harus mengembalikan 400 jika totpCode kurang dari 6 digit", async () => {
      const agent = await loginAndGetAgent();

      const res = await agent.patch("/users/me/password").send({
        currentPassword: TEST_CHANGE_PWD_PASSWORD,
        newPassword: TEST_CHANGE_PWD_NEW_PASSWORD,
        confirmPassword: TEST_CHANGE_PWD_NEW_PASSWORD,
        totpCode: "12345",
      });
      expect(res.status).toBe(400);
    });
  });

  // ─── Business Logic ───────────────────────────────────────────────────────

  describe("Business Logic", () => {
    it("harus mengembalikan 400 jika currentPassword salah", async () => {
      const agent = await loginAndGetAgent();
      const code = generateTotpCode(base32Secret);

      const res = await agent.patch("/users/me/password").send({
        currentPassword: "PasswordSalah@999",
        newPassword: TEST_CHANGE_PWD_NEW_PASSWORD,
        confirmPassword: TEST_CHANGE_PWD_NEW_PASSWORD,
        totpCode: code,
      });
      expect(res.status).toBe(400);
      expect(res.body.errors).toMatch(/Password saat ini tidak valid/);
    });

    it("harus mengembalikan 400 jika kode TOTP tidak valid", async () => {
      const agent = await loginAndGetAgent();

      const res = await agent.patch("/users/me/password").send({
        currentPassword: TEST_CHANGE_PWD_PASSWORD,
        newPassword: TEST_CHANGE_PWD_NEW_PASSWORD,
        confirmPassword: TEST_CHANGE_PWD_NEW_PASSWORD,
        totpCode: "000000",
      });
      expect(res.status).toBe(400);
      expect(res.body.errors).toMatch(/Kode TOTP tidak valid/);
    });

    it("harus mengembalikan 400 jika newPassword sama dengan currentPassword", async () => {
      const agent = await loginAndGetAgent();
      const code = generateTotpCode(base32Secret);

      const res = await agent.patch("/users/me/password").send({
        currentPassword: TEST_CHANGE_PWD_PASSWORD,
        newPassword: TEST_CHANGE_PWD_PASSWORD,
        confirmPassword: TEST_CHANGE_PWD_PASSWORD,
        totpCode: code,
      });
      expect(res.status).toBe(400);
      expect(res.body.errors).toMatch(
        /tidak boleh sama dengan password saat ini/,
      );
    });
  });

  // ─── Sukses ───────────────────────────────────────────────────────────────

  describe("Sukses", () => {
    it("harus mengembalikan 200 dengan pesan yang benar", async () => {
      const agent = await loginAndGetAgent();
      const code = generateTotpCode(base32Secret);

      const res = await agent.patch("/users/me/password").send({
        currentPassword: TEST_CHANGE_PWD_PASSWORD,
        newPassword: TEST_CHANGE_PWD_NEW_PASSWORD,
        confirmPassword: TEST_CHANGE_PWD_NEW_PASSWORD,
        totpCode: code,
      });
      expect(res.status).toBe(200);
      expect(res.body.message).toBe(
        "Password berhasil diubah. Silakan login kembali.",
      );
    });

    it("harus menghapus cookies accessToken dan refreshToken", async () => {
      const agent = await loginAndGetAgent();
      const code = generateTotpCode(base32Secret);

      const res = await agent.patch("/users/me/password").send({
        currentPassword: TEST_CHANGE_PWD_PASSWORD,
        newPassword: TEST_CHANGE_PWD_NEW_PASSWORD,
        confirmPassword: TEST_CHANGE_PWD_NEW_PASSWORD,
        totpCode: code,
      });
      expect(res.status).toBe(200);

      const cookies = Array.isArray(res.headers["set-cookie"])
        ? res.headers["set-cookie"].join("; ")
        : (res.headers["set-cookie"] ?? "");

      expect(cookies).toMatch(/accessToken/);
      expect(cookies).toMatch(/refreshToken/);
      expect(cookies).toMatch(/Expires=Thu, 01 Jan 1970/);
    });

    it("harus menghapus sesi pengguna dari database", async () => {
      const agent = await loginAndGetAgent();
      const code = generateTotpCode(base32Secret);

      const before = await prismaClient.session.findUnique({
        where: { userId },
      });
      expect(before).not.toBeNull();

      await agent.patch("/users/me/password").send({
        currentPassword: TEST_CHANGE_PWD_PASSWORD,
        newPassword: TEST_CHANGE_PWD_NEW_PASSWORD,
        confirmPassword: TEST_CHANGE_PWD_NEW_PASSWORD,
        totpCode: code,
      });

      const after = await prismaClient.session.findUnique({
        where: { userId },
      });
      expect(after).toBeNull();
    });

    it("harus mengembalikan 401 saat mengakses endpoint terproteksi setelah password diubah", async () => {
      const agent = await loginAndGetAgent();
      const code = generateTotpCode(base32Secret);

      await agent.patch("/users/me/password").send({
        currentPassword: TEST_CHANGE_PWD_PASSWORD,
        newPassword: TEST_CHANGE_PWD_NEW_PASSWORD,
        confirmPassword: TEST_CHANGE_PWD_NEW_PASSWORD,
        totpCode: code,
      });

      // Sesi terhapus dan cookie di-clear — request berikutnya harus 401
      const res = await agent.get("/users/me");
      expect(res.status).toBe(401);
    });

    it("password lama tidak boleh bisa digunakan untuk login setelah diubah", async () => {
      const agent = await loginAndGetAgent();
      const code = generateTotpCode(base32Secret);

      await agent.patch("/users/me/password").send({
        currentPassword: TEST_CHANGE_PWD_PASSWORD,
        newPassword: TEST_CHANGE_PWD_NEW_PASSWORD,
        confirmPassword: TEST_CHANGE_PWD_NEW_PASSWORD,
        totpCode: code,
      });

      // Coba login dengan password lama — harus gagal
      const loginRes = await supertest(app).post("/auth/login").send({
        identifier: TEST_CHANGE_PWD_USERNAME,
        password: TEST_CHANGE_PWD_PASSWORD,
      });
      expect(loginRes.status).toBe(400);
    });
  });
});
