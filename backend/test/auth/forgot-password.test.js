import supertest from "supertest";
import { TOTP, Secret } from "otpauth";
import { app } from "../../src/core/app/server.js";
import { hash } from "../../src/core/lib/password.lib.js";
import {
  prismaClient,
  ensureRoleUserExists,
  createForgotTestUnitKerja,
  removeForgotTestUnitKerja,
  createUserWithTotp,
  createUserWithoutTotp,
  removeForgotTestUsers,
  TEST_FORGOT_USERNAME,
  TEST_FORGOT_EMAIL,
  TEST_FORGOT_PASSWORD,
  TEST_NO_TOTP_USERNAME,
} from "../utils/user.utils.js";

jest.setTimeout(30000);

let totpBase32Secret;

const generateCurrentTotpCode = (base32Secret) => {
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
  await removeForgotTestUsers();
  const unitKerja = await createForgotTestUnitKerja();

  const result = await createUserWithTotp(unitKerja.id);
  totpBase32Secret = result.base32Secret;

  await createUserWithoutTotp(unitKerja.id);
}, 30000);

afterAll(async () => {
  await removeForgotTestUsers();
  await removeForgotTestUnitKerja();
  await prismaClient.$disconnect();
}, 30000);

afterEach(async () => {
  const hashedPassword = await hash(TEST_FORGOT_PASSWORD);
  await prismaClient.user.update({
    where: { username: TEST_FORGOT_USERNAME },
    data: {
      isActive: true,
      passwordChangedAt: new Date(),
      password: hashedPassword,
    },
  });
}, 30000);

// ─── POST /auth/forgot-password ───────────────────────────────────────────────

describe("POST /auth/forgot-password", () => {
  describe("Sukses", () => {
    it("harus mengembalikan resetToken jika user ditemukan dan TOTP aktif", async () => {
      const response = await supertest(app)
        .post("/auth/forgot-password")
        .send({ identifier: TEST_FORGOT_USERNAME });

      expect(response.status).toBe(200);
      expect(response.body.data.resetToken).toBeDefined();
      expect(response.body.data.user.username).toBe(TEST_FORGOT_USERNAME);
    });

    it("harus bisa menggunakan email sebagai identifier", async () => {
      const response = await supertest(app)
        .post("/auth/forgot-password")
        .send({ identifier: TEST_FORGOT_EMAIL });

      expect(response.status).toBe(200);
      expect(response.body.data.resetToken).toBeDefined();
    });
  });

  describe("Validasi Field", () => {
    it("harus mengembalikan 400 jika identifier tidak diisi", async () => {
      const response = await supertest(app)
        .post("/auth/forgot-password")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: "identifier" }),
        ]),
      );
    });

    it("harus mengembalikan 400 jika identifier kosong", async () => {
      const response = await supertest(app)
        .post("/auth/forgot-password")
        .send({ identifier: "" });

      expect(response.status).toBe(400);
    });
  });

  describe("Kondisi Tidak Valid", () => {
    it("harus mengembalikan 400 jika user tidak ditemukan", async () => {
      const response = await supertest(app)
        .post("/auth/forgot-password")
        .send({ identifier: "useryangtidakada" });

      expect(response.status).toBe(400);
      expect(response.body.errors).toContain("tidak ditemukan");
    });

    it("harus mengembalikan 400 jika akun tidak aktif", async () => {
      await prismaClient.user.update({
        where: { username: TEST_FORGOT_USERNAME },
        data: { isActive: false },
      });

      const response = await supertest(app)
        .post("/auth/forgot-password")
        .send({ identifier: TEST_FORGOT_USERNAME });

      expect(response.status).toBe(400);
      expect(response.body.errors).toContain("tidak aktif");
    });

    it("harus mengembalikan 403 jika TOTP belum diaktifkan pada akun", async () => {
      const response = await supertest(app)
        .post("/auth/forgot-password")
        .send({ identifier: TEST_NO_TOTP_USERNAME });

      expect(response.status).toBe(403);
      expect(response.body.errors).toContain("TOTP");
    });
  });
});

// ─── POST /auth/forgot-password/verify ───────────────────────────────────────

describe("POST /auth/forgot-password/verify", () => {
  const getResetToken = async () => {
    const res = await supertest(app)
      .post("/auth/forgot-password")
      .send({ identifier: TEST_FORGOT_USERNAME });
    return res.body.data.resetToken;
  };

  describe("Sukses", () => {
    it("harus berhasil mengubah password dengan TOTP yang valid", async () => {
      const resetToken = await getResetToken();
      const code = generateCurrentTotpCode(totpBase32Secret);

      const response = await supertest(app)
        .post("/auth/forgot-password/verify")
        .send({
          resetToken,
          code,
          newPassword: "NewPass@5678",
          confirmPassword: "NewPass@5678",
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain("berhasil");
    });
  });

  describe("Validasi Field", () => {
    it("harus mengembalikan 400 jika resetToken tidak diisi", async () => {
      const response = await supertest(app)
        .post("/auth/forgot-password/verify")
        .send({
          code: "123456",
          newPassword: "NewPass@5678",
          confirmPassword: "NewPass@5678",
        });

      expect(response.status).toBe(400);
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: "resetToken" }),
        ]),
      );
    });

    it("harus mengembalikan 400 jika code tidak diisi", async () => {
      const resetToken = await getResetToken();

      const response = await supertest(app)
        .post("/auth/forgot-password/verify")
        .send({
          resetToken,
          newPassword: "NewPass@5678",
          confirmPassword: "NewPass@5678",
        });

      expect(response.status).toBe(400);
      expect(response.body.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ path: "code" })]),
      );
    });

    it("harus mengembalikan 400 jika code bukan 6 digit angka", async () => {
      const resetToken = await getResetToken();

      const response = await supertest(app)
        .post("/auth/forgot-password/verify")
        .send({
          resetToken,
          code: "abc",
          newPassword: "NewPass@5678",
          confirmPassword: "NewPass@5678",
        });

      expect(response.status).toBe(400);
    });

    it("harus mengembalikan 400 jika newPassword tidak diisi", async () => {
      const resetToken = await getResetToken();

      const response = await supertest(app)
        .post("/auth/forgot-password/verify")
        .send({ resetToken, code: "123456", confirmPassword: "NewPass@5678" });

      expect(response.status).toBe(400);
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: "newPassword" }),
        ]),
      );
    });

    it("harus mengembalikan 400 jika newPassword tidak memenuhi kriteria keamanan", async () => {
      const resetToken = await getResetToken();

      const response = await supertest(app)
        .post("/auth/forgot-password/verify")
        .send({
          resetToken,
          code: "123456",
          newPassword: "lemahsekali",
          confirmPassword: "lemahsekali",
        });

      expect(response.status).toBe(400);
    });

    it("harus mengembalikan 400 jika confirmPassword tidak cocok", async () => {
      const resetToken = await getResetToken();

      const response = await supertest(app)
        .post("/auth/forgot-password/verify")
        .send({
          resetToken,
          code: "123456",
          newPassword: "NewPass@5678",
          confirmPassword: "BedaPass@9999",
        });

      expect(response.status).toBe(400);
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: "confirmPassword",
            detail: expect.stringContaining("tidak cocok"),
          }),
        ]),
      );
    });
  });

  describe("Token Tidak Valid", () => {
    it("harus mengembalikan 401 jika resetToken tidak valid", async () => {
      const response = await supertest(app)
        .post("/auth/forgot-password/verify")
        .send({
          resetToken: "ini.bukan.token.valid",
          code: "123456",
          newPassword: "NewPass@5678",
          confirmPassword: "NewPass@5678",
        });

      expect(response.status).toBe(401);
    });

    it("harus mengembalikan 400 jika token bukan untuk password_reset", async () => {
      // Login with no-totp user to get a totp_setup token
      const loginResponse = await supertest(app).post("/auth/login").send({
        identifier: TEST_NO_TOTP_USERNAME,
        password: TEST_FORGOT_PASSWORD,
      });

      expect(loginResponse.status).toBe(200);
      const wrongToken = loginResponse.body.data.totpToken;

      const response = await supertest(app)
        .post("/auth/forgot-password/verify")
        .send({
          resetToken: wrongToken,
          code: "123456",
          newPassword: "NewPass@5678",
          confirmPassword: "NewPass@5678",
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toContain("tidak valid");
    });
  });

  describe("TOTP Tidak Valid", () => {
    it("harus mengembalikan 400 jika kode TOTP salah", async () => {
      const resetToken = await getResetToken();

      const response = await supertest(app)
        .post("/auth/forgot-password/verify")
        .send({
          resetToken,
          code: "000000",
          newPassword: "NewPass@5678",
          confirmPassword: "NewPass@5678",
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toContain("TOTP");
    });
  });
});
