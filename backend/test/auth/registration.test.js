import supertest from "supertest";
import { app } from "../../src/core/app/server.js";
import {
  prismaClient,
  removeTestUser,
  createTestUnitKerja,
  removeTestUnitKerja,
  ensureRoleUserExists,
} from "../utils/user.utils.js";

jest.setTimeout(30000);

let testUnitKerjaId;

const validPayload = () => ({
  username: "testuser_reg",
  name: "Test User Registrasi",
  email: "testuser@test.com",
  password: "Test@1234",
  jabatan: "Staf TIK",
  unitKerjaId: testUnitKerjaId,
  nomorHP: "081234567890",
});

beforeAll(async () => {
  await ensureRoleUserExists();
  await removeTestUser();
  const unitKerja = await createTestUnitKerja();
  testUnitKerjaId = unitKerja.id;
}, 30000);

afterAll(async () => {
  await removeTestUser();
  await removeTestUnitKerja();
  await prismaClient.$disconnect();
}, 30000);

afterEach(async () => {
  await removeTestUser();
}, 30000);

describe("POST /users - Registrasi Pengguna", () => {
  describe("Sukses", () => {
    it("harus mengembalikan 201 dan data user + profile lengkap", async () => {
      const payload = validPayload();

      const result = await supertest(app).post("/users").send(payload);

      expect(result.status).toBe(201);
      expect(result.body.message).toBe("Registrasi user berhasil");
      expect(result.body.data).toMatchObject({
        username: payload.username,
        name: payload.name,
        email: payload.email,
        isActive: false,
        isVerified: false,
      });
      expect(result.body.data.password).toBeUndefined();
      expect(result.body.data.profile).toMatchObject({
        jabatan: payload.jabatan,
        nomorHP: payload.nomorHP,
        isVerified: false,
        unitKerja: {
          id: testUnitKerjaId,
          name: "Unit Kerja Test",
          code: "TEST-UNIT",
        },
      });
    });

    it("harus mengembalikan 201 saat nomorHP tidak diisi (field opsional)", async () => {
      const { nomorHP, ...payloadTanpaHP } = validPayload();

      const result = await supertest(app).post("/users").send(payloadTanpaHP);

      expect(result.status).toBe(201);
      expect(result.body.data.profile.nomorHP).toBeNull();
    });
  });

  describe("Validasi Field - 400 Bad Request", () => {
    it("harus menolak jika username tidak diisi", async () => {
      const { username, ...payload } = validPayload();

      const result = await supertest(app).post("/users").send(payload);

      expect(result.status).toBe(400);
      expect(result.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: "username" }),
        ]),
      );
    });

    it("harus menolak jika username kurang dari 3 karakter", async () => {
      const result = await supertest(app)
        .post("/users")
        .send({ ...validPayload(), username: "ab" });

      expect(result.status).toBe(400);
      expect(result.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: "username",
            detail: expect.stringContaining("minimal 3 karakter"),
          }),
        ]),
      );
    });

    it("harus menolak jika username mengandung karakter tidak valid", async () => {
      const result = await supertest(app)
        .post("/users")
        .send({ ...validPayload(), username: "user name!" });

      expect(result.status).toBe(400);
      expect(result.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: "username" }),
        ]),
      );
    });

    it("harus menolak jika email tidak diisi", async () => {
      const { email, ...payload } = validPayload();

      const result = await supertest(app).post("/users").send(payload);

      expect(result.status).toBe(400);
      expect(result.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: "email" }),
        ]),
      );
    });

    it("harus menolak jika format email tidak valid", async () => {
      const result = await supertest(app)
        .post("/users")
        .send({ ...validPayload(), email: "bukan-email" });

      expect(result.status).toBe(400);
      expect(result.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: "email",
            detail: expect.stringContaining("Format email tidak valid"),
          }),
        ]),
      );
    });

    it("harus menolak jika password tidak diisi", async () => {
      const { password, ...payload } = validPayload();

      const result = await supertest(app).post("/users").send(payload);

      expect(result.status).toBe(400);
      expect(result.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: "password" }),
        ]),
      );
    });

    it("harus menolak jika password kurang dari 8 karakter", async () => {
      const result = await supertest(app)
        .post("/users")
        .send({ ...validPayload(), password: "A@b1" });

      expect(result.status).toBe(400);
      expect(result.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: "password",
            detail: expect.stringContaining("minimal 8 karakter"),
          }),
        ]),
      );
    });

    it("harus menolak jika password tidak memenuhi kriteria keamanan (tidak ada huruf kapital, angka, dan simbol)", async () => {
      const result = await supertest(app)
        .post("/users")
        .send({ ...validPayload(), password: "passwordlemah" });

      expect(result.status).toBe(400);
      expect(result.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: "password" }),
        ]),
      );
    });

    it("harus menolak jika jabatan tidak diisi", async () => {
      const { jabatan, ...payload } = validPayload();

      const result = await supertest(app).post("/users").send(payload);

      expect(result.status).toBe(400);
      expect(result.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: "jabatan" }),
        ]),
      );
    });

    it("harus menolak jika unitKerjaId tidak diisi", async () => {
      const { unitKerjaId, ...payload } = validPayload();

      const result = await supertest(app).post("/users").send(payload);

      expect(result.status).toBe(400);
      expect(result.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: "unitKerjaId" }),
        ]),
      );
    });

    it("harus menolak jika format nomorHP tidak valid", async () => {
      const result = await supertest(app)
        .post("/users")
        .send({ ...validPayload(), nomorHP: "123456" });

      expect(result.status).toBe(400);
      expect(result.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: "nomorHP" }),
        ]),
      );
    });
  });

  describe("Konflik Data - 409 Conflict", () => {
    beforeEach(async () => {
      await supertest(app).post("/users").send(validPayload());
    });

    it("harus menolak jika username sudah digunakan", async () => {
      const result = await supertest(app)
        .post("/users")
        .send({ ...validPayload(), email: "lain@test.com" });

      expect(result.status).toBe(409);
      expect(result.body.errors).toContain("testuser_reg");
    });

    it("harus menolak jika email sudah digunakan", async () => {
      const result = await supertest(app)
        .post("/users")
        .send({ ...validPayload(), username: "testuser_lain" });

      expect(result.status).toBe(409);
      expect(result.body.errors).toContain("testuser@test.com");
    });
  });

  describe("Referensi Tidak Ditemukan - 404 Not Found", () => {
    it("harus menolak jika unitKerjaId tidak ada di database", async () => {
      const result = await supertest(app)
        .post("/users")
        .send({ ...validPayload(), unitKerjaId: "id-tidak-valid-000000000" });

      expect(result.status).toBe(404);
      expect(result.body.errors).toContain("Unit kerja tidak ditemukan");
    });
  });
});
