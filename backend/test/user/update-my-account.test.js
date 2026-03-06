import supertest from "supertest";
import { TOTP, Secret } from "otpauth";
import { app } from "../../src/core/app/server.js";
import {
  prismaClient,
  ensureRoleUserExists,
  TEST_UPD_ACCOUNT_PASSWORD,
  TEST_UPD_ACCOUNT_USERNAME,
  TEST_UPD_ACCOUNT_EMAIL,
  createUpdAccountTestUnitKerja,
  removeUpdAccountTestUnitKerja,
  createUpdAccountTestUser,
  removeUpdAccountTestUser,
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
    .send({ identifier: TEST_UPD_ACCOUNT_USERNAME, password: TEST_UPD_ACCOUNT_PASSWORD });
  expect(loginRes.status).toBe(200);

  const { totpToken } = loginRes.body.data;
  const code = generateTotpCode(base32Secret);

  const verifyRes = await agent.post("/auth/totp/verify").send({ totpToken, code });
  expect(verifyRes.status).toBe(200);

  return agent;
};

beforeAll(async () => {
  await ensureRoleUserExists();
  await removeUpdAccountTestUser();
  await removeUpdAccountTestUnitKerja();

  const unitKerja = await createUpdAccountTestUnitKerja();
  const result = await createUpdAccountTestUser(unitKerja.id);

  base32Secret = result.base32Secret;
  userId = result.user.id;
}, 30000);

afterAll(async () => {
  await removeUpdAccountTestUser();
  await removeUpdAccountTestUnitKerja();
  await prismaClient.$disconnect();
}, 30000);

afterEach(async () => {
  await prismaClient.session.deleteMany({ where: { userId } });
  // Reset name dan email ke nilai awal setelah setiap test
  await prismaClient.user.update({
    where: { id: userId },
    data: { name: "Test User Update Account", email: TEST_UPD_ACCOUNT_EMAIL },
  });
}, 30000);

// ─── PATCH /users/me ──────────────────────────────────────────────────────────

describe("PATCH /users/me", () => {
  // ─── Autentikasi ────────────────────────────────────────────────────────────

  describe("Autentikasi", () => {
    it("harus mengembalikan 401 jika tidak ada cookie autentikasi", async () => {
      const res = await supertest(app)
        .patch("/users/me")
        .send({ name: "Nama Baru", password: TEST_UPD_ACCOUNT_PASSWORD });
      expect(res.status).toBe(401);
    });
  });

  // ─── Validasi Input ─────────────────────────────────────────────────────────

  describe("Validasi Input", () => {
    it("harus mengembalikan 400 jika password tidak diisi", async () => {
      const agent = await loginAndGetAgent();
      const res = await agent.patch("/users/me").send({ name: "Nama Baru" });
      expect(res.status).toBe(400);
    });

    it("harus mengembalikan 400 jika tidak ada field yang diubah (name/email)", async () => {
      const agent = await loginAndGetAgent();
      const res = await agent.patch("/users/me").send({ password: TEST_UPD_ACCOUNT_PASSWORD });
      expect(res.status).toBe(400);
    });

    it("harus mengembalikan 400 jika format email tidak valid", async () => {
      const agent = await loginAndGetAgent();
      const res = await agent
        .patch("/users/me")
        .send({ email: "bukan-email", password: TEST_UPD_ACCOUNT_PASSWORD });
      expect(res.status).toBe(400);
    });

    it("harus mengembalikan 400 jika nama terlalu pendek (< 2 karakter)", async () => {
      const agent = await loginAndGetAgent();
      const res = await agent
        .patch("/users/me")
        .send({ name: "A", password: TEST_UPD_ACCOUNT_PASSWORD });
      expect(res.status).toBe(400);
    });
  });

  // ─── Business Logic ─────────────────────────────────────────────────────────

  describe("Business Logic", () => {
    it("harus mengembalikan 400 jika password tidak valid", async () => {
      const agent = await loginAndGetAgent();
      const res = await agent
        .patch("/users/me")
        .send({ name: "Nama Baru", password: "PasswordSalah@999" });
      expect(res.status).toBe(400);
      expect(res.body.errors).toMatch(/Password tidak valid/);
    });

    it("harus mengembalikan 409 jika email sudah digunakan akun lain", async () => {
      const tempUsername = `testuser_email_col_${Date.now()}`;
      const tempEmail = `emailbentrok_${Date.now()}@test.com`;

      // Defensive cleanup sebelum create
      await prismaClient.user.deleteMany({
        where: { OR: [{ username: tempUsername }, { email: tempEmail }] },
      });

      const tempUser = await prismaClient.user.create({
        data: {
          username: tempUsername,
          name: "Temp User",
          email: tempEmail,
          password: "dummy",
          isActive: true,
        },
      });

      const agent = await loginAndGetAgent();
      const res = await agent
        .patch("/users/me")
        .send({ email: tempEmail, password: TEST_UPD_ACCOUNT_PASSWORD });
      expect(res.status).toBe(409);
      expect(res.body.errors).toMatch(/Email sudah digunakan/);

      await prismaClient.user.delete({ where: { id: tempUser.id } });
    });
  });

  // ─── Sukses ─────────────────────────────────────────────────────────────────

  describe("Sukses", () => {
    it("harus berhasil mengubah nama saja", async () => {
      const agent = await loginAndGetAgent();
      const res = await agent
        .patch("/users/me")
        .send({ name: "Nama Baru Test", password: TEST_UPD_ACCOUNT_PASSWORD });
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Data akun berhasil diperbarui");
      expect(res.body.data.name).toBe("Nama Baru Test");
    });

    it("harus berhasil mengubah email saja", async () => {
      const agent = await loginAndGetAgent();
      const newEmail = "newemail.test@test.com";
      const res = await agent
        .patch("/users/me")
        .send({ email: newEmail, password: TEST_UPD_ACCOUNT_PASSWORD });
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Data akun berhasil diperbarui");
      expect(res.body.data.email).toBe(newEmail);
    });

    it("harus berhasil mengubah nama dan email sekaligus", async () => {
      const agent = await loginAndGetAgent();
      const res = await agent.patch("/users/me").send({
        name: "Nama Baru Lengkap",
        email: "email.baru.lengkap@test.com",
        password: TEST_UPD_ACCOUNT_PASSWORD,
      });
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("Nama Baru Lengkap");
      expect(res.body.data.email).toBe("email.baru.lengkap@test.com");
    });

    it("harus berhasil jika email yang dikirim sama dengan email saat ini", async () => {
      const agent = await loginAndGetAgent();
      const res = await agent
        .patch("/users/me")
        .send({ email: TEST_UPD_ACCOUNT_EMAIL, password: TEST_UPD_ACCOUNT_PASSWORD });
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(TEST_UPD_ACCOUNT_EMAIL);
    });

    it("perubahan harus tersimpan di database", async () => {
      const agent = await loginAndGetAgent();
      await agent
        .patch("/users/me")
        .send({ name: "Nama Tersimpan DB", password: TEST_UPD_ACCOUNT_PASSWORD });

      const user = await prismaClient.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });
      expect(user.name).toBe("Nama Tersimpan DB");
    });
  });
});
