import supertest from "supertest";
import { TOTP, Secret } from "otpauth";
import { app } from "../../src/core/app/server.js";
import {
  prismaClient,
  ensureRoleUserExists,
  TEST_REFRESH_PASSWORD,
  TEST_REFRESH_USERNAME,
  createRefreshTestUnitKerja,
  removeRefreshTestUnitKerja,
  createRefreshTestUser,
  removeRefreshTestUser,
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
    .send({ identifier: TEST_REFRESH_USERNAME, password: TEST_REFRESH_PASSWORD });
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
  await removeRefreshTestUser();
  await removeRefreshTestUnitKerja();

  const unitKerja = await createRefreshTestUnitKerja();
  const result = await createRefreshTestUser(unitKerja.id);

  base32Secret = result.base32Secret;
  userId = result.user.id;
}, 30000);

afterAll(async () => {
  await removeRefreshTestUser();
  await removeRefreshTestUnitKerja();
  await prismaClient.$disconnect();
}, 30000);

// Bersihkan sesi setelah setiap test agar login di test berikutnya bersih
afterEach(async () => {
  await prismaClient.session.deleteMany({ where: { userId } });
}, 30000);

// ─── POST /auth/refresh ───────────────────────────────────────────────────────

describe("POST /auth/refresh", () => {
  // ─── Validasi Input ───────────────────────────────────────────────────────

  describe("Validasi Input", () => {
    it("harus mengembalikan 400 jika tidak ada cookie refreshToken", async () => {
      const res = await supertest(app).post("/auth/refresh");
      expect(res.status).toBe(400);
    });

    it("harus mengembalikan 400 jika refreshToken bukan format JWT (tiga segmen)", async () => {
      const res = await supertest(app)
        .post("/auth/refresh")
        .set("Cookie", "refreshToken=bukan-jwt-valid");
      expect(res.status).toBe(400);
    });

    it("harus mengembalikan 400 jika refreshToken mengandung karakter berbahaya (XSS)", async () => {
      const res = await supertest(app)
        .post("/auth/refresh")
        .set("Cookie", "refreshToken=<script>alert(1)</script>");
      expect(res.status).toBe(400);
    });

    it("harus mengembalikan 400 jika refreshToken kosong", async () => {
      const res = await supertest(app)
        .post("/auth/refresh")
        .set("Cookie", "refreshToken=");
      expect(res.status).toBe(400);
    });

    it("harus mengembalikan 400 jika refreshToken melebihi panjang maksimal", async () => {
      const longString = "a".repeat(2049);
      // Bukan format JWT, pasti gagal validasi
      const res = await supertest(app)
        .post("/auth/refresh")
        .set("Cookie", `refreshToken=${longString}`);
      expect(res.status).toBe(400);
    });
  });

  // ─── Autentikasi ──────────────────────────────────────────────────────────

  describe("Autentikasi", () => {
    it("harus mengembalikan 401 jika refreshToken memiliki format JWT valid tetapi signature salah", async () => {
      // JWT dengan format tiga segmen base64url yang valid, tapi signature dipalsukan
      const fakeJwt =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" +
        ".eyJzdWIiOiJmYWtlLXVzZXItaWQiLCJpYXQiOjE3MDAwMDAwMDB9" +
        ".c2lnbmF0dXJfcGFsc3VfZGlzaW5p";

      const res = await supertest(app)
        .post("/auth/refresh")
        .set("Cookie", `refreshToken=${fakeJwt}`);
      expect(res.status).toBe(401);
    });

    it("harus mengembalikan 401 jika sesi tidak ditemukan di database", async () => {
      const agent = await loginAndGetAgent();

      // Hapus sesi secara manual agar tidak ditemukan saat refresh
      await prismaClient.session.deleteMany({ where: { userId } });

      const res = await agent.post("/auth/refresh");
      expect(res.status).toBe(401);
    });

    it("harus mengembalikan 401 jika sesi sudah kadaluarsa (expiresAt di masa lalu)", async () => {
      const agent = await loginAndGetAgent();

      await prismaClient.session.updateMany({
        where: { userId },
        data: { expiresAt: new Date("2000-01-01T00:00:00.000Z") },
      });

      const res = await agent.post("/auth/refresh");
      expect(res.status).toBe(401);
    });
  });

  // ─── Sukses ───────────────────────────────────────────────────────────────

  describe("Sukses", () => {
    it("harus mengembalikan 200 dengan pesan yang benar", async () => {
      const agent = await loginAndGetAgent();
      const res = await agent.post("/auth/refresh");

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Token berhasil diperbarui.");
    });

    it("harus menerbitkan accessToken baru melalui Set-Cookie header", async () => {
      const agent = await loginAndGetAgent();
      const res = await agent.post("/auth/refresh");

      const setCookieHeader = res.headers["set-cookie"];
      expect(setCookieHeader).toBeDefined();

      const cookiesStr = Array.isArray(setCookieHeader)
        ? setCookieHeader.join("; ")
        : setCookieHeader;

      expect(cookiesStr).toMatch(/accessToken=/);
      expect(cookiesStr).toMatch(/HttpOnly/i);
    });

    it("harus tidak mengubah refreshToken yang tersimpan di database", async () => {
      const agent = await loginAndGetAgent();

      const before = await prismaClient.session.findUnique({ where: { userId } });
      expect(before).not.toBeNull();

      await agent.post("/auth/refresh");

      const after = await prismaClient.session.findUnique({ where: { userId } });
      expect(after).not.toBeNull();
      // refreshToken di DB harus tetap sama — tidak dirotasi
      expect(after.refreshToken).toBe(before.refreshToken);
    });

    it("accessToken baru harus dapat digunakan untuk mengakses endpoint terproteksi", async () => {
      const agent = await loginAndGetAgent();

      // Refresh — agent menerima Set-Cookie accessToken baru
      const refreshRes = await agent.post("/auth/refresh");
      expect(refreshRes.status).toBe(200);

      // Gunakan agent (kini pakai accessToken baru) untuk akses endpoint terproteksi
      const protectedRes = await agent.get("/users/me");
      expect(protectedRes.status).toBe(200);
    });

    it("harus dapat melakukan refresh berulang selama sesi masih aktif", async () => {
      const agent = await loginAndGetAgent();

      const first = await agent.post("/auth/refresh");
      expect(first.status).toBe(200);

      const second = await agent.post("/auth/refresh");
      expect(second.status).toBe(200);
    });
  });
});
