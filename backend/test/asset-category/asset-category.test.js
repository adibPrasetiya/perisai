import supertest from "supertest";
import { TOTP, Secret } from "otpauth";
import { app } from "../../src/core/app/server.js";
import { prismaClient } from "../utils/user.utils.js";
import { hash } from "../../src/core/lib/password.lib.js";
import {
  generateTotpSecret,
  encryptTotpSecret,
} from "../../src/utils/totp.utils.js";

jest.setTimeout(30000);

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ADMIN_PASSWORD = "Test@1234";
const ADMIN_USERNAME = "testac_admin";
const ADMIN_EMAIL = "testac.admin@test.com";
const CAT_NAME_PREFIX = "TestKategoriAset";

let adminAgent;
let adminUserId;
let adminUnitKerjaId;
let createdCategoryIds = [];

const generateTotpCode = (base32Secret) =>
  new TOTP({
    issuer: "PERISAI WEB APP",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(base32Secret),
  }).generate();

const ensureRoles = async () => {
  for (const name of ["USER", "ADMINISTRATOR"]) {
    await prismaClient.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
};

const setup = async () => {
  await ensureRoles();
  await prismaClient.user.deleteMany({
    where: { OR: [{ username: ADMIN_USERNAME }, { email: ADMIN_EMAIL }] },
  });

  // Pastikan ada unit kerja untuk profil admin
  let unitKerja = await prismaClient.unitKerja.findFirst();
  if (!unitKerja) {
    unitKerja = await prismaClient.unitKerja.create({
      data: {
        name: "UK Default AC Test",
        code: "TEST-AC-DEFAULT-UK",
        email: "ac@test.com",
      },
    });
  }
  adminUnitKerjaId = unitKerja.id;

  const hashedPwd = await hash(ADMIN_PASSWORD);
  const role = await prismaClient.role.findUnique({
    where: { name: "ADMINISTRATOR" },
  });
  const totpData = generateTotpSecret(ADMIN_USERNAME);
  const encSecret = encryptTotpSecret(totpData.base32);

  const user = await prismaClient.user.create({
    data: {
      username: ADMIN_USERNAME,
      name: "Admin Asset Category Test",
      email: ADMIN_EMAIL,
      password: hashedPwd,
      isActive: true,
      isVerified: true,
      passwordChangedAt: new Date(),
      totpEnabled: true,
      totpSecret: encSecret,
      totpVerifiedAt: new Date(),
    },
  });
  await prismaClient.userRole.create({
    data: { userId: user.id, roleId: role.id },
  });
  await prismaClient.profile.create({
    data: {
      userId: user.id,
      jabatan: "Administrator",
      unitKerjaId: adminUnitKerjaId,
    },
  });

  const agent = supertest.agent(app);
  const loginRes = await agent
    .post("/auth/login")
    .send({ identifier: ADMIN_USERNAME, password: ADMIN_PASSWORD });
  const verifyRes = await agent.post("/auth/totp/verify").send({
    totpToken: loginRes.body.data.totpToken,
    code: generateTotpCode(totpData.base32),
  });
  expect(verifyRes.status).toBe(200);

  return { agent, userId: user.id };
};

beforeAll(async () => {
  const result = await setup();
  adminAgent = result.agent;
  adminUserId = result.userId;
}, 30000);

afterAll(async () => {
  await prismaClient.assetCategory.deleteMany({
    where: { id: { in: createdCategoryIds } },
  });
  await prismaClient.assetCategory.deleteMany({
    where: { name: { startsWith: CAT_NAME_PREFIX } },
  });
  await prismaClient.session.deleteMany({ where: { userId: adminUserId } });
  await prismaClient.user.deleteMany({
    where: { OR: [{ username: ADMIN_USERNAME }, { email: ADMIN_EMAIL }] },
  });
  await prismaClient.$disconnect();
}, 30000);

const trackCreate = async (body) => {
  const res = await adminAgent.post("/asset-category").send(body);
  if (res.status === 201 && res.body.data?.id) {
    createdCategoryIds.push(res.body.data.id);
  }
  return res;
};

// ─── POST /asset-category ─────────────────────────────────────────────────────

describe("POST /asset-category", () => {
  describe("Autentikasi & Otorisasi", () => {
    it("harus mengembalikan 401 tanpa cookie autentikasi", async () => {
      const res = await supertest(app)
        .post("/asset-category")
        .send({ name: "Kategori Tanpa Auth" });
      expect(res.status).toBe(401);
    });
  });

  describe("Validasi Input", () => {
    it("harus mengembalikan 400 jika name tidak diisi", async () => {
      const res = await adminAgent.post("/asset-category").send({});
      expect(res.status).toBe(400);
    });

    it("harus mengembalikan 400 jika name kurang dari 2 karakter", async () => {
      const res = await adminAgent.post("/asset-category").send({ name: "A" });
      expect(res.status).toBe(400);
    });

    it("harus mengembalikan 400 jika name lebih dari 100 karakter", async () => {
      const res = await adminAgent
        .post("/asset-category")
        .send({ name: "A".repeat(101) });
      expect(res.status).toBe(400);
    });
  });

  describe("Business Logic", () => {
    it("harus mengembalikan 409 jika nama kategori sudah digunakan", async () => {
      const res1 = await trackCreate({ name: `${CAT_NAME_PREFIX} Duplikat` });
      expect(res1.status).toBe(201);

      const res2 = await adminAgent
        .post("/asset-category")
        .send({ name: `${CAT_NAME_PREFIX} Duplikat` });
      expect(res2.status).toBe(409);
      expect(res2.body.errors).toMatch(/sudah digunakan/);
    });
  });

  describe("Sukses", () => {
    it("harus mengembalikan 201 dan data kategori yang dibuat", async () => {
      const res = await trackCreate({
        name: `${CAT_NAME_PREFIX} Perangkat Keras`,
        description: "Kategori untuk aset perangkat keras",
      });
      expect(res.status).toBe(201);
      expect(res.body.message).toMatch(/berhasil dibuat/);
      expect(res.body.data).toMatchObject({
        name: `${CAT_NAME_PREFIX} Perangkat Keras`,
        description: "Kategori untuk aset perangkat keras",
      });
      expect(res.body.data).toHaveProperty("id");
    });

    it("harus berhasil dibuat tanpa description (opsional)", async () => {
      const res = await trackCreate({
        name: `${CAT_NAME_PREFIX} Tanpa Deskripsi`,
      });
      expect(res.status).toBe(201);
      expect(res.body.data.description).toBeNull();
    });

    it("harus tersimpan di database", async () => {
      const res = await trackCreate({ name: `${CAT_NAME_PREFIX} DB Check` });
      expect(res.status).toBe(201);
      const cat = await prismaClient.assetCategory.findUnique({
        where: { id: res.body.data.id },
      });
      expect(cat).not.toBeNull();
    });
  });
});

// ─── GET /asset-category ─────────────────────────────────────────────────────

describe("GET /asset-category", () => {
  describe("Autentikasi & Otorisasi", () => {
    it("harus mengembalikan 401 tanpa cookie autentikasi", async () => {
      const res = await supertest(app).get("/asset-category");
      expect(res.status).toBe(401);
    });
  });

  describe("Sukses", () => {
    it("harus mengembalikan 200 dengan data dan pagination", async () => {
      const res = await adminAgent.get("/asset-category");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("data");
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty("pagination");
    });

    it("harus mengembalikan data dengan field _count.assets", async () => {
      const res = await adminAgent.get("/asset-category");
      expect(res.status).toBe(200);
      if (res.body.data.length > 0) {
        expect(res.body.data[0]).toHaveProperty("_count");
        expect(res.body.data[0]._count).toHaveProperty("assets");
      }
    });

    it("harus mengembalikan 200 dengan filter nama", async () => {
      const res = await adminAgent
        .get("/asset-category")
        .query({ name: "zzz-tidak-ada-sama-sekali" });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });

    it("harus mengembalikan 200 dengan parameter pagination", async () => {
      const res = await adminAgent
        .get("/asset-category")
        .query({ page: 1, limit: 5 });
      expect(res.status).toBe(200);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(5);
    });
  });
});

// ─── PATCH /asset-category/:assetCategoryId ──────────────────────────────────

describe("PATCH /asset-category/:assetCategoryId", () => {
  let categoryId;

  beforeAll(async () => {
    const cat = await prismaClient.assetCategory.create({
      data: { name: `${CAT_NAME_PREFIX} Untuk Update` },
    });
    categoryId = cat.id;
    createdCategoryIds.push(categoryId);
  }, 30000);

  describe("Autentikasi", () => {
    it("harus mengembalikan 401 tanpa cookie autentikasi", async () => {
      const res = await supertest(app)
        .patch(`/asset-category/${categoryId}`)
        .send({ name: "Nama Baru" });
      expect(res.status).toBe(401);
    });
  });

  describe("Validasi Input", () => {
    it("harus mengembalikan 400 jika tidak ada field yang dikirim", async () => {
      const res = await adminAgent
        .patch(`/asset-category/${categoryId}`)
        .send({});
      expect(res.status).toBe(400);
    });

    it("harus mengembalikan 400 jika name kurang dari 2 karakter", async () => {
      const res = await adminAgent
        .patch(`/asset-category/${categoryId}`)
        .send({ name: "A" });
      expect(res.status).toBe(400);
    });
  });

  describe("Business Logic", () => {
    it("harus mengembalikan 404 jika ID tidak ditemukan", async () => {
      const res = await adminAgent
        .patch(`/asset-category/id-tidak-ada`)
        .send({ name: "Nama Baru" });
      expect(res.status).toBe(404);
      expect(res.body.errors).toMatch(/tidak ditemukan/);
    });

    it("harus mengembalikan 409 jika nama baru sudah digunakan kategori lain", async () => {
      const other = await prismaClient.assetCategory.create({
        data: { name: `${CAT_NAME_PREFIX} Existing Name` },
      });
      createdCategoryIds.push(other.id);

      const res = await adminAgent
        .patch(`/asset-category/${categoryId}`)
        .send({ name: `${CAT_NAME_PREFIX} Existing Name` });
      expect(res.status).toBe(409);
      expect(res.body.errors).toMatch(/sudah digunakan/);
    });
  });

  describe("Sukses", () => {
    it("harus mengembalikan 200 dan memperbarui nama", async () => {
      const res = await adminAgent
        .patch(`/asset-category/${categoryId}`)
        .send({ name: `${CAT_NAME_PREFIX} Nama Baru` });
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/berhasil diperbarui/);
      expect(res.body.data.name).toBe(`${CAT_NAME_PREFIX} Nama Baru`);
    });

    it("harus memperbarui description saja", async () => {
      const res = await adminAgent
        .patch(`/asset-category/${categoryId}`)
        .send({ description: "Deskripsi baru" });
      expect(res.status).toBe(200);
      expect(res.body.data.description).toBe("Deskripsi baru");
    });

    it("harus tersimpan di database", async () => {
      await adminAgent
        .patch(`/asset-category/${categoryId}`)
        .send({ name: `${CAT_NAME_PREFIX} DB Updated` });
      const cat = await prismaClient.assetCategory.findUnique({
        where: { id: categoryId },
      });
      expect(cat.name).toBe(`${CAT_NAME_PREFIX} DB Updated`);
    });
  });
});

// ─── DELETE /asset-category/:assetCategoryId ─────────────────────────────────

describe("DELETE /asset-category/:assetCategoryId", () => {
  let deleteCategoryId;

  beforeEach(async () => {
    const cat = await prismaClient.assetCategory.create({
      data: { name: `${CAT_NAME_PREFIX} Hapus ${Date.now()}` },
    });
    deleteCategoryId = cat.id;
  }, 30000);

  afterEach(async () => {
    await prismaClient.assetCategory.deleteMany({
      where: { id: deleteCategoryId },
    });
  }, 30000);

  describe("Autentikasi", () => {
    it("harus mengembalikan 401 tanpa cookie autentikasi", async () => {
      const res = await supertest(app).delete(
        `/asset-category/${deleteCategoryId}`,
      );
      expect(res.status).toBe(401);
    });
  });

  describe("Business Logic", () => {
    it("harus mengembalikan 404 jika ID tidak ditemukan", async () => {
      const res = await adminAgent.delete(`/asset-category/id-tidak-ada`);
      expect(res.status).toBe(404);
      expect(res.body.errors).toMatch(/tidak ditemukan/);
    });

    it("harus mengembalikan 409 jika kategori masih memiliki aset", async () => {
      // Buat unit kerja dan aset yang menggunakan kategori ini
      const uk = await prismaClient.unitKerja.create({
        data: {
          name: "UK For AC Delete",
          code: `TEST-AC-DEL-${Date.now()}`,
          email: "acdel@test.com",
        },
      });
      await prismaClient.asset.create({
        data: {
          name: "Aset Test Hapus Kategori",
          code: `ASSET-ACCHK-${Date.now()}`,
          unitKerjaId: uk.id,
          categoryId: deleteCategoryId,
          status: "ACTIVE",
        },
      });

      const res = await adminAgent.delete(
        `/asset-category/${deleteCategoryId}`,
      );
      expect(res.status).toBe(409);
      expect(res.body.errors).toMatch(/aset/);

      // Cleanup
      await prismaClient.asset.deleteMany({
        where: { categoryId: deleteCategoryId },
      });
      await prismaClient.unitKerja.delete({ where: { id: uk.id } });
    });
  });

  describe("Sukses", () => {
    it("harus mengembalikan 200 dan menghapus kategori", async () => {
      const res = await adminAgent.delete(
        `/asset-category/${deleteCategoryId}`,
      );
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/berhasil dihapus/);
    });

    it("harus benar-benar menghapus dari database", async () => {
      await adminAgent.delete(`/asset-category/${deleteCategoryId}`);
      const cat = await prismaClient.assetCategory.findUnique({
        where: { id: deleteCategoryId },
      });
      expect(cat).toBeNull();
    });
  });
});
