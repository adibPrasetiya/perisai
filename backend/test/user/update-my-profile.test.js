import supertest from "supertest";
import { TOTP, Secret } from "otpauth";
import { app } from "../../src/core/app/server.js";
import {
  prismaClient,
  ensureRoleUserExists,
  TEST_UPD_PROFILE_PASSWORD,
  TEST_UPD_PROFILE_USERNAME,
  TEST_UPD_PROFILE_JABATAN,
  TEST_UPD_PROFILE_NOMOR_HP,
  createUpdProfileTestUnitKerja,
  removeUpdProfileTestUnitKerja,
  createUpdProfileTestUser,
  removeUpdProfileTestUser,
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

  const loginRes = await agent
    .post("/auth/login")
    .send({ identifier: TEST_UPD_PROFILE_USERNAME, password: TEST_UPD_PROFILE_PASSWORD });
  expect(loginRes.status).toBe(200);

  const { totpToken } = loginRes.body.data;
  const code = generateTotpCode(base32Secret);

  const verifyRes = await agent.post("/auth/totp/verify").send({ totpToken, code });
  expect(verifyRes.status).toBe(200);

  return agent;
};

beforeAll(async () => {
  await ensureRoleUserExists();
  await removeUpdProfileTestUser();
  await removeUpdProfileTestUnitKerja();

  const unitKerja = await createUpdProfileTestUnitKerja();
  const result = await createUpdProfileTestUser(unitKerja.id);

  base32Secret = result.base32Secret;
  userId = result.user.id;
}, 30000);

afterAll(async () => {
  await removeUpdProfileTestUser();
  await removeUpdProfileTestUnitKerja();
  await prismaClient.$disconnect();
}, 30000);

afterEach(async () => {
  await prismaClient.session.deleteMany({ where: { userId } });
  // Reset profil ke nilai awal setelah setiap test
  await prismaClient.profile.update({
    where: { userId },
    data: { jabatan: TEST_UPD_PROFILE_JABATAN, nomorHP: TEST_UPD_PROFILE_NOMOR_HP },
  });
}, 30000);

// ─── PATCH /users/me/profile ──────────────────────────────────────────────────

describe("PATCH /users/me/profile", () => {
  // ─── Autentikasi ────────────────────────────────────────────────────────────

  describe("Autentikasi", () => {
    it("harus mengembalikan 401 jika tidak ada cookie autentikasi", async () => {
      const res = await supertest(app)
        .patch("/users/me/profile")
        .send({ jabatan: "Manager", password: TEST_UPD_PROFILE_PASSWORD });
      expect(res.status).toBe(401);
    });
  });

  // ─── Validasi Input ─────────────────────────────────────────────────────────

  describe("Validasi Input", () => {
    it("harus mengembalikan 400 jika password tidak diisi", async () => {
      const agent = await loginAndGetAgent();
      const res = await agent.patch("/users/me/profile").send({ jabatan: "Manager" });
      expect(res.status).toBe(400);
    });

    it("harus mengembalikan 400 jika tidak ada field yang diubah (jabatan/nomorHP)", async () => {
      const agent = await loginAndGetAgent();
      const res = await agent
        .patch("/users/me/profile")
        .send({ password: TEST_UPD_PROFILE_PASSWORD });
      expect(res.status).toBe(400);
    });

    it("harus mengembalikan 400 jika jabatan terlalu pendek (< 2 karakter)", async () => {
      const agent = await loginAndGetAgent();
      const res = await agent
        .patch("/users/me/profile")
        .send({ jabatan: "A", password: TEST_UPD_PROFILE_PASSWORD });
      expect(res.status).toBe(400);
    });

    it("harus mengembalikan 400 jika format nomorHP tidak valid", async () => {
      const agent = await loginAndGetAgent();
      const res = await agent
        .patch("/users/me/profile")
        .send({ nomorHP: "12345", password: TEST_UPD_PROFILE_PASSWORD });
      expect(res.status).toBe(400);
    });
  });

  // ─── Business Logic ─────────────────────────────────────────────────────────

  describe("Business Logic", () => {
    it("harus mengembalikan 400 jika password tidak valid", async () => {
      const agent = await loginAndGetAgent();
      const res = await agent
        .patch("/users/me/profile")
        .send({ jabatan: "Manager Baru", password: "PasswordSalah@999" });
      expect(res.status).toBe(400);
      expect(res.body.errors).toMatch(/Password tidak valid/);
    });
  });

  // ─── Sukses ─────────────────────────────────────────────────────────────────

  describe("Sukses", () => {
    it("harus berhasil mengubah jabatan saja", async () => {
      const agent = await loginAndGetAgent();
      const res = await agent
        .patch("/users/me/profile")
        .send({ jabatan: "Senior Analis", password: TEST_UPD_PROFILE_PASSWORD });
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Data profil berhasil diperbarui");
      expect(res.body.data.jabatan).toBe("Senior Analis");
    });

    it("harus berhasil mengubah nomor HP saja", async () => {
      const agent = await loginAndGetAgent();
      const res = await agent
        .patch("/users/me/profile")
        .send({ nomorHP: "085298765432", password: TEST_UPD_PROFILE_PASSWORD });
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Data profil berhasil diperbarui");
      expect(res.body.data.nomorHP).toBe("085298765432");
    });

    it("harus berhasil mengubah jabatan dan nomor HP sekaligus", async () => {
      const agent = await loginAndGetAgent();
      const res = await agent.patch("/users/me/profile").send({
        jabatan: "Kepala Seksi",
        nomorHP: "085211112222",
        password: TEST_UPD_PROFILE_PASSWORD,
      });
      expect(res.status).toBe(200);
      expect(res.body.data.jabatan).toBe("Kepala Seksi");
      expect(res.body.data.nomorHP).toBe("085211112222");
    });

    it("harus menyertakan data unitKerja dalam respons", async () => {
      const agent = await loginAndGetAgent();
      const res = await agent
        .patch("/users/me/profile")
        .send({ jabatan: "Kepala Bagian", password: TEST_UPD_PROFILE_PASSWORD });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("unitKerja");
    });

    it("perubahan harus tersimpan di database", async () => {
      const agent = await loginAndGetAgent();
      await agent
        .patch("/users/me/profile")
        .send({ jabatan: "Jabatan Tersimpan DB", password: TEST_UPD_PROFILE_PASSWORD });

      const profile = await prismaClient.profile.findUnique({
        where: { userId },
        select: { jabatan: true },
      });
      expect(profile.jabatan).toBe("Jabatan Tersimpan DB");
    });

    it("harus berhasil menghapus nomor HP dengan string kosong", async () => {
      const agent = await loginAndGetAgent();
      const res = await agent
        .patch("/users/me/profile")
        .send({ nomorHP: "", jabatan: "Tetap", password: TEST_UPD_PROFILE_PASSWORD });
      expect(res.status).toBe(200);
      expect(res.body.data.nomorHP).toBeNull();
    });
  });
});
