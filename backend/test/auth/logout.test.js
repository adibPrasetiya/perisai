import supertest from "supertest";
import { TOTP, Secret } from "otpauth";
import { app } from "../../src/core/app/server.js";
import {
  prismaClient,
  ensureRoleUserExists,
  TEST_LOGOUT_PASSWORD,
  TEST_LOGOUT_USERNAME,
  createLogoutTestUnitKerja,
  removeLogoutTestUnitKerja,
  createLogoutTestUser,
  removeLogoutTestUser,
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

// Buat agen baru yang sudah login untuk setiap test yang membutuhkannya
const loginAndGetAgent = async () => {
  const agent = supertest.agent(app);

  const loginRes = await agent
    .post("/auth/login")
    .send({ identifier: TEST_LOGOUT_USERNAME, password: TEST_LOGOUT_PASSWORD });
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
  await removeLogoutTestUser();
  await removeLogoutTestUnitKerja();

  const unitKerja = await createLogoutTestUnitKerja();
  const result = await createLogoutTestUser(unitKerja.id);

  base32Secret = result.base32Secret;
  userId = result.user.id;
}, 30000);

afterAll(async () => {
  await removeLogoutTestUser();
  await removeLogoutTestUnitKerja();
  await prismaClient.$disconnect();
}, 30000);

// Bersihkan session setelah setiap test agar login di test berikutnya tidak bermasalah
afterEach(async () => {
  await prismaClient.session.deleteMany({ where: { userId } });
}, 30000);

// ─── POST /auth/logout ────────────────────────────────────────────────────────

describe("POST /auth/logout", () => {
  // ─── Autentikasi ──────────────────────────────────────────────────────────

  describe("Autentikasi", () => {
    it("harus mengembalikan 401 jika tidak ada cookie autentikasi", async () => {
      const res = await supertest(app).post("/auth/logout");
      expect(res.status).toBe(401);
    });
  });

  // ─── Sukses ───────────────────────────────────────────────────────────────

  describe("Sukses", () => {
    it("harus mengembalikan 200 dengan pesan logout", async () => {
      const agent = await loginAndGetAgent();
      const res = await agent.post("/auth/logout");

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Logout berhasil.");
    });

    it("harus menghapus session pengguna dari database", async () => {
      const agent = await loginAndGetAgent();

      // Session harus ada setelah login
      const before = await prismaClient.session.findUnique({ where: { userId } });
      expect(before).not.toBeNull();

      await agent.post("/auth/logout");

      // Session harus terhapus setelah logout
      const after = await prismaClient.session.findUnique({ where: { userId } });
      expect(after).toBeNull();
    });

    it("harus menghapus cookies accessToken dan refreshToken dari response", async () => {
      const agent = await loginAndGetAgent();
      const res = await agent.post("/auth/logout");

      const setCookieHeader = res.headers["set-cookie"];
      expect(setCookieHeader).toBeDefined();

      const cookies = Array.isArray(setCookieHeader)
        ? setCookieHeader.join("; ")
        : setCookieHeader;

      // clearCookie menetapkan Expires ke epoch agar browser menghapus cookie
      expect(cookies).toMatch(/accessToken/);
      expect(cookies).toMatch(/refreshToken/);
      expect(cookies).toMatch(/Expires=Thu, 01 Jan 1970/);
    });

    it("harus mengembalikan 401 pada request berikutnya setelah logout", async () => {
      const agent = await loginAndGetAgent();

      // Logout — server mengirim Set-Cookie dengan Max-Age=0
      await agent.post("/auth/logout");

      // Supertest agent menghormati Set-Cookie, sehingga cookie terhapus
      // Request berikutnya tanpa accessToken → 401
      const res = await agent.get("/users");
      expect(res.status).toBe(401);
    });
  });
});
