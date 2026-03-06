import supertest from "supertest";
import { TOTP, Secret } from "otpauth";
import { app } from "../../src/core/app/server.js";
import {
  prismaClient,
  ensureRoleUserExists,
  ensureRoleAdminExists,
  createSearchTestUnitKerja,
  removeSearchTestUnitKerja,
  createSearchAdminUser,
  createSearchUser1,
  createSearchUser2,
  removeSearchTestUsers,
  TEST_SEARCH_ADMIN_USERNAME,
  TEST_SEARCH_USER1_USERNAME,
  TEST_SEARCH_PASSWORD,
} from "../utils/user.utils.js";

jest.setTimeout(30000);

let adminBase32Secret;
let user1Base32Secret;
let adminUserId;
let user1UserId;
let user2UserId;
let adminAgent;

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
  await removeSearchTestUsers();

  const unitKerja = await createSearchTestUnitKerja();

  const adminResult = await createSearchAdminUser(unitKerja.id);
  adminUserId = adminResult.user.id;
  adminBase32Secret = adminResult.base32Secret;

  const user1Result = await createSearchUser1(unitKerja.id);
  user1UserId = user1Result.user.id;
  user1Base32Secret = user1Result.base32Secret;

  const user2 = await createSearchUser2(unitKerja.id);
  user2UserId = user2.id;

  // Create a single authenticated admin agent for all tests
  adminAgent = await loginAndGetAgent(
    TEST_SEARCH_ADMIN_USERNAME,
    TEST_SEARCH_PASSWORD,
    adminBase32Secret
  );
}, 30000);

// Clean up any user1 sessions created during auth/otorisasi tests.
// Admin session is intentionally kept alive across all tests via adminAgent.
afterEach(async () => {
  if (user1UserId) {
    await prismaClient.session.deleteMany({ where: { userId: user1UserId } });
  }
}, 30000);

afterAll(async () => {
  await prismaClient.session.deleteMany({
    where: { userId: { in: [adminUserId, user1UserId, user2UserId] } },
  });
  await removeSearchTestUsers();
  await removeSearchTestUnitKerja();
  await prismaClient.$disconnect();
}, 30000);

// ─── GET /users ───────────────────────────────────────────────────────────────

describe("GET /users", () => {
  // ─── Autentikasi & Otorisasi ──────────────────────────────────────────────

  describe("Autentikasi & Otorisasi", () => {
    it("harus mengembalikan 401 jika tidak ada cookie autentikasi", async () => {
      const response = await supertest(app).get("/users");
      expect(response.status).toBe(401);
    });

    it("harus mengembalikan 403 jika pengguna bukan ADMINISTRATOR", async () => {
      const userAgent = await loginAndGetAgent(
        TEST_SEARCH_USER1_USERNAME,
        TEST_SEARCH_PASSWORD,
        user1Base32Secret
      );

      const response = await userAgent.get("/users");
      expect(response.status).toBe(403);
    });
  });

  // ─── Sukses ───────────────────────────────────────────────────────────────

  describe("Sukses", () => {
    it("harus mengembalikan 200 dengan daftar pengguna", async () => {
      const response = await adminAgent.get("/users");

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it("harus mengembalikan struktur data pengguna yang benar", async () => {
      const response = await adminAgent.get("/users");

      expect(response.status).toBe(200);
      const user = response.body.data[0];

      expect(user).toHaveProperty("id");
      expect(user).toHaveProperty("username");
      expect(user).toHaveProperty("name");
      expect(user).toHaveProperty("email");
      expect(user).toHaveProperty("isActive");
      expect(user).toHaveProperty("isVerified");
      expect(user).toHaveProperty("totpEnabled");
      expect(user).toHaveProperty("roles");
      expect(user.roles).toBeInstanceOf(Array);
      expect(user).toHaveProperty("profile");
      expect(user).toHaveProperty("session");
    });

    it("harus mengembalikan struktur pagination yang benar dengan nilai default", async () => {
      const response = await adminAgent.get("/users");

      const { pagination } = response.body;
      expect(pagination).toHaveProperty("page", 1);
      expect(pagination).toHaveProperty("limit", 10);
      expect(pagination).toHaveProperty("totalItems");
      expect(pagination).toHaveProperty("totalPages");
      expect(pagination).toHaveProperty("hasNextPage");
      expect(pagination).toHaveProperty("hasPrevPage");
      expect(typeof pagination.totalItems).toBe("number");
      expect(typeof pagination.totalPages).toBe("number");
    });

    it("harus menyertakan data profil dan unit kerja", async () => {
      const response = await adminAgent
        .get("/users")
        .query({ username: TEST_SEARCH_ADMIN_USERNAME });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);

      const user = response.body.data[0];
      expect(user.profile).not.toBeNull();
      expect(user.profile.unitKerja).toBeDefined();
      expect(user.profile.unitKerja.id).toBeDefined();
      expect(user.profile.unitKerja.name).toBeDefined();
      expect(user.profile.unitKerja.code).toBeDefined();
    });

    it("harus menyertakan data sesi pengguna yang sedang login", async () => {
      const response = await adminAgent
        .get("/users")
        .query({ username: TEST_SEARCH_ADMIN_USERNAME });

      expect(response.status).toBe(200);
      const user = response.body.data[0];

      // Admin just logged in, so session should exist
      expect(user.session).not.toBeNull();
      expect(user.session).toHaveProperty("isActive");
      expect(user.session).toHaveProperty("deviceId");
      expect(user.session).toHaveProperty("expiresAt");
      expect(user.session).toHaveProperty("lastSeenAt");
    });

    it("harus mengembalikan pesan sukses yang sesuai", async () => {
      const response = await adminAgent.get("/users");

      expect(response.status).toBe(200);
      expect(response.body.message).toContain("berhasil");
    });
  });

  // ─── Filter ───────────────────────────────────────────────────────────────

  describe("Filter", () => {
    it("harus bisa filter berdasarkan name (partial match)", async () => {
      const response = await adminAgent.get("/users").query({ name: "Admin Search" });

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      response.body.data.forEach((user) => {
        expect(user.name.toLowerCase()).toContain("admin search");
      });
    });

    it("harus bisa filter berdasarkan username (partial match)", async () => {
      const response = await adminAgent
        .get("/users")
        .query({ username: "search_user1" });

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      response.body.data.forEach((user) => {
        expect(user.username).toContain("search_user1");
      });
    });

    it("harus bisa filter berdasarkan role ADMINISTRATOR", async () => {
      const response = await adminAgent
        .get("/users")
        .query({ role: "ADMINISTRATOR" });

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      response.body.data.forEach((user) => {
        expect(user.roles).toContain("ADMINISTRATOR");
      });
    });

    it("harus bisa filter berdasarkan role USER", async () => {
      const response = await adminAgent.get("/users").query({ role: "USER" });

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      response.body.data.forEach((user) => {
        expect(user.roles).toContain("USER");
      });
    });

    it("harus bisa filter berdasarkan isActive=true dan hanya mengembalikan pengguna aktif", async () => {
      const response = await adminAgent
        .get("/users")
        .query({ isActive: "true" });

      expect(response.status).toBe(200);
      response.body.data.forEach((user) => {
        expect(user.isActive).toBe(true);
      });
    });

    it("harus bisa filter berdasarkan isActive=false dan hanya mengembalikan pengguna nonaktif", async () => {
      const response = await adminAgent
        .get("/users")
        .query({ isActive: "false" });

      expect(response.status).toBe(200);
      // user2 is inactive, so at least 1 result expected
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      response.body.data.forEach((user) => {
        expect(user.isActive).toBe(false);
      });
    });

    it("harus bisa filter berdasarkan isVerified=true dan hanya mengembalikan pengguna terverifikasi", async () => {
      const response = await adminAgent
        .get("/users")
        .query({ isVerified: "true" });

      expect(response.status).toBe(200);
      response.body.data.forEach((user) => {
        expect(user.isVerified).toBe(true);
      });
    });

    it("harus bisa filter berdasarkan isVerified=false dan hanya mengembalikan pengguna belum terverifikasi", async () => {
      const response = await adminAgent
        .get("/users")
        .query({ isVerified: "false" });

      expect(response.status).toBe(200);
      // user2 is unverified, so at least 1 result expected
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      response.body.data.forEach((user) => {
        expect(user.isVerified).toBe(false);
      });
    });

    it("harus mengembalikan data kosong jika tidak ada pengguna yang cocok", async () => {
      const response = await adminAgent
        .get("/users")
        .query({ name: "NamaTidakAdaSamaSekaliXXX999" });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.pagination.totalItems).toBe(0);
    });

    it("harus bisa menggabungkan beberapa filter sekaligus", async () => {
      const response = await adminAgent
        .get("/users")
        .query({ role: "USER", isActive: "true", isVerified: "true" });

      expect(response.status).toBe(200);
      response.body.data.forEach((user) => {
        expect(user.roles).toContain("USER");
        expect(user.isActive).toBe(true);
        expect(user.isVerified).toBe(true);
      });
    });
  });

  // ─── Validasi Query Parameter ─────────────────────────────────────────────

  describe("Validasi Query Parameter", () => {
    it("harus mengembalikan 400 jika nilai role tidak valid", async () => {
      const response = await adminAgent
        .get("/users")
        .query({ role: "SUPER_ADMIN" });

      expect(response.status).toBe(400);
    });

    it("harus mengembalikan 400 jika limit melebihi 100", async () => {
      const response = await adminAgent.get("/users").query({ limit: 101 });

      expect(response.status).toBe(400);
    });

    it("harus mengembalikan 400 jika page kurang dari 1", async () => {
      const response = await adminAgent.get("/users").query({ page: 0 });

      expect(response.status).toBe(400);
    });
  });

  // ─── Pagination ───────────────────────────────────────────────────────────

  describe("Pagination", () => {
    it("harus menggunakan limit yang ditentukan", async () => {
      const response = await adminAgent.get("/users").query({ limit: 2 });

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination.limit).toBe(2);
    });

    it("harus mengembalikan hasPrevPage=false untuk halaman pertama", async () => {
      const response = await adminAgent.get("/users").query({ page: 1 });

      expect(response.status).toBe(200);
      expect(response.body.pagination.hasPrevPage).toBe(false);
      expect(response.body.pagination.page).toBe(1);
    });

    it("harus menghitung totalPages dengan benar", async () => {
      const response = await adminAgent.get("/users").query({ limit: 2 });
      const { totalItems, totalPages, limit } = response.body.pagination;

      expect(totalPages).toBe(Math.ceil(totalItems / limit));
    });

    it("harus mengembalikan halaman ke-2 dengan benar jika ada cukup data", async () => {
      // Fetch all items with limit=1 to know the total
      const firstPageRes = await adminAgent
        .get("/users")
        .query({ page: 1, limit: 1 });
      const { totalItems } = firstPageRes.body.pagination;

      if (totalItems >= 2) {
        const response = await adminAgent
          .get("/users")
          .query({ page: 2, limit: 1 });

        expect(response.status).toBe(200);
        expect(response.body.pagination.page).toBe(2);
        expect(response.body.pagination.hasPrevPage).toBe(true);
        // First and second page should return different users
        expect(response.body.data[0].id).not.toBe(firstPageRes.body.data[0].id);
      }
    });

    it("harus mengembalikan hasNextPage=true jika masih ada halaman berikutnya", async () => {
      // Use limit=1 — we have at least 3 test users, so hasNextPage should be true
      const response = await adminAgent.get("/users").query({ page: 1, limit: 1 });

      expect(response.status).toBe(200);
      const { totalItems, hasNextPage } = response.body.pagination;

      if (totalItems > 1) {
        expect(hasNextPage).toBe(true);
      }
    });
  });
});
