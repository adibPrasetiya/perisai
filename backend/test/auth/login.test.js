import supertest from "supertest";
import { app } from "../../src/core/app/server.js";
import {
  prismaClient,
  createLoginTestUnitKerja,
  removeLoginTestUnitKerja,
  ensureRoleUserExists,
  createActiveTestUser,
  removeActiveTestUser,
  TEST_LOGIN_USERNAME,
  TEST_LOGIN_EMAIL,
  TEST_LOGIN_PASSWORD,
} from "../utils/user.utils.js";

jest.setTimeout(30000);

let testUnitKerjaId;

beforeAll(async () => {
  await ensureRoleUserExists();
  await removeActiveTestUser();
  const unitKerja = await createLoginTestUnitKerja();
  testUnitKerjaId = unitKerja.id;
  await createActiveTestUser(testUnitKerjaId);
}, 30000);

afterAll(async () => {
  await removeActiveTestUser();
  await removeLoginTestUnitKerja();
  await prismaClient.$disconnect();
}, 30000);

// Ensure user is always restored to a clean active state after each test
afterEach(async () => {
  await prismaClient.user.update({
    where: { username: TEST_LOGIN_USERNAME },
    data: { isActive: true, passwordChangedAt: new Date() },
  });
}, 30000);

describe("POST /auth/login", () => {
  describe("Sukses", () => {
    it("harus mengembalikan requireTotpSetup jika TOTP belum diaktifkan", async () => {
      const response = await supertest(app).post("/auth/login").send({
        identifier: TEST_LOGIN_USERNAME,
        password: TEST_LOGIN_PASSWORD,
      });

      expect(response.status).toBe(200);
      expect(response.body.data.requireTotpSetup).toBe(true);
      expect(response.body.data.totpToken).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.username).toBe(TEST_LOGIN_USERNAME);
    });

    it("harus bisa login menggunakan email sebagai identifier", async () => {
      const response = await supertest(app).post("/auth/login").send({
        identifier: TEST_LOGIN_EMAIL,
        password: TEST_LOGIN_PASSWORD,
      });

      expect(response.status).toBe(200);
      expect(response.body.data.requireTotpSetup).toBe(true);
      expect(response.body.data.totpToken).toBeDefined();
    });
  });

  describe("Validasi Field", () => {
    it("harus mengembalikan 400 jika identifier kosong", async () => {
      const response = await supertest(app).post("/auth/login").send({
        identifier: "",
        password: TEST_LOGIN_PASSWORD,
      });

      expect(response.status).toBe(400);
    });

    it("harus mengembalikan 400 jika password kosong", async () => {
      const response = await supertest(app).post("/auth/login").send({
        identifier: TEST_LOGIN_USERNAME,
        password: "",
      });

      expect(response.status).toBe(400);
    });

    it("harus mengembalikan 400 jika body kosong", async () => {
      const response = await supertest(app).post("/auth/login").send({});

      expect(response.status).toBe(400);
    });
  });

  describe("Kredensial Tidak Valid", () => {
    it("harus mengembalikan 400 jika password salah", async () => {
      const response = await supertest(app).post("/auth/login").send({
        identifier: TEST_LOGIN_USERNAME,
        password: "WrongPass@999",
      });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBe("Username/email atau password salah.");
    });

    it("harus mengembalikan 400 jika user tidak ditemukan", async () => {
      const response = await supertest(app).post("/auth/login").send({
        identifier: "useryangtidakada",
        password: TEST_LOGIN_PASSWORD,
      });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBe("Username/email atau password salah.");
    });

    it("harus mengembalikan 403 jika akun tidak aktif", async () => {
      await prismaClient.user.update({
        where: { username: TEST_LOGIN_USERNAME },
        data: { isActive: false },
      });

      const response = await supertest(app).post("/auth/login").send({
        identifier: TEST_LOGIN_USERNAME,
        password: TEST_LOGIN_PASSWORD,
      });

      expect(response.status).toBe(403);
      expect(response.body.errors).toContain("tidak aktif");
    });

    it("harus mengembalikan 403 jika password sudah kadaluarsa", async () => {
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 31);

      await prismaClient.user.update({
        where: { username: TEST_LOGIN_USERNAME },
        data: { passwordChangedAt: expiredDate },
      });

      const response = await supertest(app).post("/auth/login").send({
        identifier: TEST_LOGIN_USERNAME,
        password: TEST_LOGIN_PASSWORD,
      });

      expect(response.status).toBe(403);
      expect(response.body.errors).toContain("kadaluarsa");
    });
  });
});

describe("POST /auth/totp/verify", () => {
  describe("Validasi Field", () => {
    it("harus mengembalikan 400 jika totpToken tidak diisi", async () => {
      const response = await supertest(app)
        .post("/auth/totp/verify")
        .send({ code: "123456" });

      expect(response.status).toBe(400);
    });

    it("harus mengembalikan 400 jika code tidak diisi", async () => {
      const response = await supertest(app)
        .post("/auth/totp/verify")
        .send({ totpToken: "sometoken" });

      expect(response.status).toBe(400);
    });

    it("harus mengembalikan 400 jika code bukan 6 digit angka", async () => {
      const response = await supertest(app).post("/auth/totp/verify").send({
        totpToken: "sometoken",
        code: "abc",
      });

      expect(response.status).toBe(400);
    });
  });

  describe("Token Tidak Valid", () => {
    it("harus mengembalikan 401 jika totpToken tidak valid", async () => {
      const response = await supertest(app).post("/auth/totp/verify").send({
        totpToken: "ini.bukan.token.valid",
        code: "123456",
      });

      expect(response.status).toBe(401);
    });

    it("harus mengembalikan 400 jika totpToken bukan untuk totp_verify", async () => {
      const loginResponse = await supertest(app).post("/auth/login").send({
        identifier: TEST_LOGIN_USERNAME,
        password: TEST_LOGIN_PASSWORD,
      });

      expect(loginResponse.status).toBe(200);
      const setupToken = loginResponse.body.data.totpToken;

      const response = await supertest(app).post("/auth/totp/verify").send({
        totpToken: setupToken,
        code: "123456",
      });

      expect(response.status).toBe(400);
    });
  });
});
