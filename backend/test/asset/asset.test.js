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
const ADMIN_USERNAME = "testasset_admin";
const ADMIN_EMAIL = "testasset.admin@test.com";

let adminAgent;
let adminUserId;
let testUnitKerjaId;
let testCategoryId;
let createdAssetIds = [];

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

  // Unit kerja untuk test
  const uk = await prismaClient.unitKerja.upsert({
    where: { code: "TEST-ASSET-UK" },
    update: {},
    create: {
      name: "Unit Kerja Asset Test",
      code: "TEST-ASSET-UK",
      email: "assetuk@test.com",
    },
  });
  testUnitKerjaId = uk.id;

  // Kategori untuk test
  const cat = await prismaClient.assetCategory.upsert({
    where: { name: "Kategori Asset Test" },
    update: {},
    create: {
      name: "Kategori Asset Test",
      description: "Untuk keperluan test",
    },
  });
  testCategoryId = cat.id;

  // Admin user
  const hashedPwd = await hash(ADMIN_PASSWORD);
  const role = await prismaClient.role.findUnique({
    where: { name: "ADMINISTRATOR" },
  });
  const totpData = generateTotpSecret(ADMIN_USERNAME);
  const encSecret = encryptTotpSecret(totpData.base32);

  const user = await prismaClient.user.create({
    data: {
      username: ADMIN_USERNAME,
      name: "Admin Asset Test",
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
      unitKerjaId: testUnitKerjaId,
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
  await prismaClient.asset.deleteMany({
    where: { id: { in: createdAssetIds } },
  });
  await prismaClient.asset.deleteMany({
    where: { unitKerjaId: testUnitKerjaId },
  });
  await prismaClient.assetCategory.deleteMany({
    where: { id: testCategoryId },
  });
  await prismaClient.session.deleteMany({ where: { userId: adminUserId } });
  await prismaClient.user.deleteMany({
    where: { OR: [{ username: ADMIN_USERNAME }, { email: ADMIN_EMAIL }] },
  });
  await prismaClient.unitKerja.deleteMany({ where: { code: "TEST-ASSET-UK" } });
  await prismaClient.$disconnect();
}, 30000);

const baseUrl = () => `/unit-kerja/${testUnitKerjaId}/assets`;

const trackCreate = async (body) => {
  const res = await adminAgent.post(baseUrl()).send(body);
  if (res.status === 201 && res.body.data?.id) {
    createdAssetIds.push(res.body.data.id);
  }
  return res;
};

const defaultAssetBody = (suffix = Date.now()) => ({
  name: `Aset Test ${suffix}`,
  code: `ASSET-T-${String(suffix)
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "-")}`,
  categoryId: testCategoryId,
});

// ─── POST /unit-kerja/:unitKerjaId/assets ─────────────────────────────────────

describe("POST /unit-kerja/:unitKerjaId/assets", () => {
  describe("Autentikasi", () => {
    it("harus mengembalikan 401 tanpa cookie autentikasi", async () => {
      const res = await supertest(app).post(baseUrl()).send(defaultAssetBody());
      expect(res.status).toBe(401);
    });
  });

  describe("Validasi Input", () => {
    it("harus mengembalikan 400 jika name tidak diisi", async () => {
      const res = await adminAgent.post(baseUrl()).send({
        code: "ASSET-NONAME",
        categoryId: testCategoryId,
      });
      expect(res.status).toBe(400);
    });

    it("harus mengembalikan 400 jika code tidak diisi", async () => {
      const res = await adminAgent.post(baseUrl()).send({
        name: "Aset Tanpa Kode",
        categoryId: testCategoryId,
      });
      expect(res.status).toBe(400);
    });

    it("harus mengembalikan 400 jika categoryId tidak diisi", async () => {
      const res = await adminAgent.post(baseUrl()).send({
        name: "Aset Tanpa Kategori",
        code: "ASSET-NOCAT",
      });
      expect(res.status).toBe(400);
    });

    it("harus mengembalikan 400 jika code mengandung huruf kecil", async () => {
      const res = await adminAgent.post(baseUrl()).send({
        name: "Aset Kode Kecil",
        code: "asset-lowercase",
        categoryId: testCategoryId,
      });
      expect(res.status).toBe(400);
    });

    it("harus mengembalikan 400 jika name kurang dari 2 karakter", async () => {
      const res = await adminAgent.post(baseUrl()).send({
        name: "A",
        code: "ASSET-SHORTNAME",
        categoryId: testCategoryId,
      });
      expect(res.status).toBe(400);
    });
  });

  describe("Business Logic", () => {
    it("harus mengembalikan 404 jika unit kerja tidak ditemukan", async () => {
      const res = await adminAgent
        .post(`/unit-kerja/uk-tidak-ada/assets`)
        .send(defaultAssetBody());
      expect(res.status).toBe(404);
      expect(res.body.errors).toMatch(/tidak ditemukan/);
    });

    it("harus mengembalikan 404 jika categoryId tidak ditemukan", async () => {
      const res = await adminAgent.post(baseUrl()).send({
        name: "Aset Kategori Salah",
        code: "ASSET-BADCAT",
        categoryId: "category-id-tidak-ada",
      });
      expect(res.status).toBe(404);
      expect(res.body.errors).toMatch(/tidak ditemukan/);
    });

    it("harus mengembalikan 409 jika code sudah digunakan dalam unit kerja yang sama", async () => {
      const res1 = await trackCreate({
        name: "Aset Duplikat Pertama",
        code: "ASSET-DUP-CODE",
        categoryId: testCategoryId,
      });
      expect(res1.status).toBe(201);

      const res2 = await adminAgent.post(baseUrl()).send({
        name: "Aset Duplikat Kedua",
        code: "ASSET-DUP-CODE",
        categoryId: testCategoryId,
      });
      expect(res2.status).toBe(409);
      expect(res2.body.errors).toMatch(/sudah digunakan/);
    });
  });

  describe("Sukses", () => {
    it("harus mengembalikan 201 dan data aset yang dibuat", async () => {
      const res = await trackCreate({
        name: "Laptop Dell Inspiron",
        code: "ASSET-LAPTOP-01",
        categoryId: testCategoryId,
        description: "Laptop untuk operasional",
        owner: "Budi Santoso",
      });
      expect(res.status).toBe(201);
      expect(res.body.message).toMatch(/berhasil dibuat/);
      expect(res.body.data).toMatchObject({
        name: "Laptop Dell Inspiron",
        code: "ASSET-LAPTOP-01",
        status: "ACTIVE",
      });
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data).toHaveProperty("unitKerja");
      expect(res.body.data).toHaveProperty("category");
    });

    it("harus berhasil dibuat dengan status default ACTIVE", async () => {
      const res = await trackCreate(defaultAssetBody("defaultstatus"));
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe("ACTIVE");
    });

    it("harus tersimpan di database", async () => {
      const res = await trackCreate({
        name: "Aset DB Check",
        code: "ASSET-DBCHK-01",
        categoryId: testCategoryId,
      });
      expect(res.status).toBe(201);
      const asset = await prismaClient.asset.findUnique({
        where: { id: res.body.data.id },
      });
      expect(asset).not.toBeNull();
      expect(asset.code).toBe("ASSET-DBCHK-01");
    });
  });
});

// ─── GET /unit-kerja/:unitKerjaId/assets ─────────────────────────────────────

describe("GET /unit-kerja/:unitKerjaId/assets", () => {
  describe("Autentikasi", () => {
    it("harus mengembalikan 401 tanpa cookie autentikasi", async () => {
      const res = await supertest(app).get(baseUrl());
      expect(res.status).toBe(401);
    });
  });

  describe("Business Logic", () => {
    it("harus mengembalikan 404 jika unit kerja tidak ditemukan", async () => {
      const res = await adminAgent.get(`/unit-kerja/uk-tidak-ada/assets`);
      expect(res.status).toBe(404);
    });
  });

  describe("Sukses", () => {
    it("harus mengembalikan 200 dengan data dan pagination", async () => {
      const res = await adminAgent.get(baseUrl());
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("data");
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty("pagination");
    });

    it("harus mengembalikan 200 dengan filter nama", async () => {
      const res = await adminAgent
        .get(baseUrl())
        .query({ name: "zzz-tidak-ada-sama-sekali" });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });

    it("harus mengembalikan 200 dengan filter status", async () => {
      const res = await adminAgent.get(baseUrl()).query({ status: "ACTIVE" });
      expect(res.status).toBe(200);
      res.body.data.forEach((a) => expect(a.status).toBe("ACTIVE"));
    });

    it("harus mengembalikan 400 jika status tidak valid", async () => {
      const res = await adminAgent
        .get(baseUrl())
        .query({ status: "INVALID_STATUS" });
      expect(res.status).toBe(400);
    });

    it("harus mengembalikan 200 dengan parameter pagination", async () => {
      const res = await adminAgent.get(baseUrl()).query({ page: 1, limit: 5 });
      expect(res.status).toBe(200);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(5);
    });
  });
});

// ─── PATCH /unit-kerja/:unitKerjaId/assets/:id ───────────────────────────────

describe("PATCH /unit-kerja/:unitKerjaId/assets/:id", () => {
  let assetId;

  beforeAll(async () => {
    const asset = await prismaClient.asset.create({
      data: {
        name: "Aset Untuk Update",
        code: "ASSET-UPD-BASE",
        unitKerjaId: testUnitKerjaId,
        categoryId: testCategoryId,
        status: "ACTIVE",
      },
    });
    assetId = asset.id;
    createdAssetIds.push(assetId);
  }, 30000);

  describe("Autentikasi", () => {
    it("harus mengembalikan 401 tanpa cookie autentikasi", async () => {
      const res = await supertest(app)
        .patch(`${baseUrl()}/${assetId}`)
        .send({ name: "Nama Baru" });
      expect(res.status).toBe(401);
    });
  });

  describe("Validasi Input", () => {
    it("harus mengembalikan 400 jika tidak ada field yang dikirim", async () => {
      const res = await adminAgent.patch(`${baseUrl()}/${assetId}`).send({});
      expect(res.status).toBe(400);
    });

    it("harus mengembalikan 400 jika code mengandung huruf kecil", async () => {
      const res = await adminAgent
        .patch(`${baseUrl()}/${assetId}`)
        .send({ code: "lowercase" });
      expect(res.status).toBe(400);
    });
  });

  describe("Business Logic", () => {
    it("harus mengembalikan 404 jika aset tidak ditemukan", async () => {
      const res = await adminAgent
        .patch(`${baseUrl()}/id-tidak-ada`)
        .send({ name: "Nama Baru" });
      expect(res.status).toBe(404);
      expect(res.body.errors).toMatch(/tidak ditemukan/);
    });

    it("harus mengembalikan 409 jika code baru sudah digunakan aset lain di unit kerja yang sama", async () => {
      const other = await prismaClient.asset.create({
        data: {
          name: "Aset Other",
          code: "ASSET-OTHER-CODE",
          unitKerjaId: testUnitKerjaId,
          categoryId: testCategoryId,
          status: "ACTIVE",
        },
      });
      createdAssetIds.push(other.id);

      const res = await adminAgent
        .patch(`${baseUrl()}/${assetId}`)
        .send({ code: "ASSET-OTHER-CODE" });
      expect(res.status).toBe(409);
      expect(res.body.errors).toMatch(/sudah digunakan/);
    });
  });

  describe("Sukses", () => {
    it("harus mengembalikan 200 dan memperbarui nama", async () => {
      const res = await adminAgent
        .patch(`${baseUrl()}/${assetId}`)
        .send({ name: "Aset Nama Baru" });
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/berhasil diperbarui/);
      expect(res.body.data.name).toBe("Aset Nama Baru");
    });

    it("harus memperbarui description saja", async () => {
      const res = await adminAgent
        .patch(`${baseUrl()}/${assetId}`)
        .send({ description: "Deskripsi diperbarui" });
      expect(res.status).toBe(200);
      expect(res.body.data.description).toBe("Deskripsi diperbarui");
    });

    it("harus tersimpan di database", async () => {
      await adminAgent
        .patch(`${baseUrl()}/${assetId}`)
        .send({ owner: "Owner Baru Test" });
      const asset = await prismaClient.asset.findUnique({
        where: { id: assetId },
      });
      expect(asset.owner).toBe("Owner Baru Test");
    });
  });
});

// ─── PATCH /unit-kerja/:unitKerjaId/assets/:id/activate ──────────────────────

describe("PATCH /unit-kerja/:unitKerjaId/assets/:id/activate", () => {
  let assetId;

  beforeEach(async () => {
    const asset = await prismaClient.asset.create({
      data: {
        name: "Aset Untuk Aktivasi",
        code: `ASSET-ACT-${Date.now()}`,
        unitKerjaId: testUnitKerjaId,
        categoryId: testCategoryId,
        status: "INACTIVE",
      },
    });
    assetId = asset.id;
    createdAssetIds.push(assetId);
  }, 30000);

  afterEach(async () => {
    await prismaClient.asset.deleteMany({ where: { id: assetId } });
  }, 30000);

  describe("Autentikasi", () => {
    it("harus mengembalikan 401 tanpa cookie autentikasi", async () => {
      const res = await supertest(app).patch(
        `${baseUrl()}/${assetId}/activate`,
      );
      expect(res.status).toBe(401);
    });
  });

  describe("Business Logic", () => {
    it("harus mengembalikan 404 jika aset tidak ditemukan", async () => {
      const res = await adminAgent.patch(`${baseUrl()}/id-tidak-ada/activate`);
      expect(res.status).toBe(404);
    });

    it("harus mengembalikan 400 jika aset sudah aktif", async () => {
      // Set aset ke ACTIVE dulu
      await prismaClient.asset.update({
        where: { id: assetId },
        data: { status: "ACTIVE" },
      });
      const res = await adminAgent.patch(`${baseUrl()}/${assetId}/activate`);
      expect(res.status).toBe(400);
      expect(res.body.errors).toMatch(/sudah dalam status aktif/);
    });

    it("harus mengembalikan 400 jika aset sudah diarsipkan", async () => {
      await prismaClient.asset.update({
        where: { id: assetId },
        data: { status: "ARCHIVED" },
      });
      const res = await adminAgent.patch(`${baseUrl()}/${assetId}/activate`);
      expect(res.status).toBe(400);
      expect(res.body.errors).toMatch(/diarsipkan/);
    });
  });

  describe("Sukses", () => {
    it("harus mengembalikan 200 dan mengubah status menjadi ACTIVE", async () => {
      const res = await adminAgent.patch(`${baseUrl()}/${assetId}/activate`);
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/berhasil diaktifkan/);
      expect(res.body.data.status).toBe("ACTIVE");
    });

    it("harus menyimpan status ACTIVE ke database", async () => {
      await adminAgent.patch(`${baseUrl()}/${assetId}/activate`);
      const asset = await prismaClient.asset.findUnique({
        where: { id: assetId },
      });
      expect(asset.status).toBe("ACTIVE");
    });
  });
});

// ─── PATCH /unit-kerja/:unitKerjaId/assets/:id/deactivate ────────────────────

describe("PATCH /unit-kerja/:unitKerjaId/assets/:id/deactivate", () => {
  let assetId;

  beforeEach(async () => {
    const asset = await prismaClient.asset.create({
      data: {
        name: "Aset Untuk Deaktivasi",
        code: `ASSET-DEACT-${Date.now()}`,
        unitKerjaId: testUnitKerjaId,
        categoryId: testCategoryId,
        status: "ACTIVE",
      },
    });
    assetId = asset.id;
    createdAssetIds.push(assetId);
  }, 30000);

  afterEach(async () => {
    await prismaClient.asset.deleteMany({ where: { id: assetId } });
  }, 30000);

  describe("Autentikasi", () => {
    it("harus mengembalikan 401 tanpa cookie autentikasi", async () => {
      const res = await supertest(app).patch(
        `${baseUrl()}/${assetId}/deactivate`,
      );
      expect(res.status).toBe(401);
    });
  });

  describe("Business Logic", () => {
    it("harus mengembalikan 404 jika aset tidak ditemukan", async () => {
      const res = await adminAgent.patch(
        `${baseUrl()}/id-tidak-ada/deactivate`,
      );
      expect(res.status).toBe(404);
    });

    it("harus mengembalikan 400 jika aset sudah tidak aktif", async () => {
      await prismaClient.asset.update({
        where: { id: assetId },
        data: { status: "INACTIVE" },
      });
      const res = await adminAgent.patch(`${baseUrl()}/${assetId}/deactivate`);
      expect(res.status).toBe(400);
      expect(res.body.errors).toMatch(/sudah dalam status tidak aktif/);
    });

    it("harus mengembalikan 400 jika aset sudah diarsipkan", async () => {
      await prismaClient.asset.update({
        where: { id: assetId },
        data: { status: "ARCHIVED" },
      });
      const res = await adminAgent.patch(`${baseUrl()}/${assetId}/deactivate`);
      expect(res.status).toBe(400);
      expect(res.body.errors).toMatch(/diarsipkan/);
    });
  });

  describe("Sukses", () => {
    it("harus mengembalikan 200 dan mengubah status menjadi INACTIVE", async () => {
      const res = await adminAgent.patch(`${baseUrl()}/${assetId}/deactivate`);
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/berhasil dinonaktifkan/);
      expect(res.body.data.status).toBe("INACTIVE");
    });

    it("harus menyimpan status INACTIVE ke database", async () => {
      await adminAgent.patch(`${baseUrl()}/${assetId}/deactivate`);
      const asset = await prismaClient.asset.findUnique({
        where: { id: assetId },
      });
      expect(asset.status).toBe("INACTIVE");
    });
  });
});

// ─── DELETE /unit-kerja/:unitKerjaId/assets/:id (archive) ────────────────────

describe("DELETE /unit-kerja/:unitKerjaId/assets/:id", () => {
  let assetId;

  beforeEach(async () => {
    const asset = await prismaClient.asset.create({
      data: {
        name: "Aset Untuk Arsip",
        code: `ASSET-ARC-${Date.now()}`,
        unitKerjaId: testUnitKerjaId,
        categoryId: testCategoryId,
        status: "INACTIVE",
      },
    });
    assetId = asset.id;
    createdAssetIds.push(assetId);
  }, 30000);

  afterEach(async () => {
    await prismaClient.asset.deleteMany({ where: { id: assetId } });
  }, 30000);

  describe("Autentikasi", () => {
    it("harus mengembalikan 401 tanpa cookie autentikasi", async () => {
      const res = await supertest(app).delete(`${baseUrl()}/${assetId}`);
      expect(res.status).toBe(401);
    });
  });

  describe("Business Logic", () => {
    it("harus mengembalikan 404 jika aset tidak ditemukan", async () => {
      const res = await adminAgent.delete(`${baseUrl()}/id-tidak-ada`);
      expect(res.status).toBe(404);
    });

    it("harus mengembalikan 400 jika aset masih ACTIVE (harus dinonaktifkan dulu)", async () => {
      await prismaClient.asset.update({
        where: { id: assetId },
        data: { status: "ACTIVE" },
      });
      const res = await adminAgent.delete(`${baseUrl()}/${assetId}`);
      expect(res.status).toBe(400);
      expect(res.body.errors).toMatch(/masih aktif/);
    });

    it("harus mengembalikan 400 jika aset sudah diarsipkan", async () => {
      await prismaClient.asset.update({
        where: { id: assetId },
        data: { status: "ARCHIVED" },
      });
      const res = await adminAgent.delete(`${baseUrl()}/${assetId}`);
      expect(res.status).toBe(400);
      expect(res.body.errors).toMatch(/sudah diarsipkan/);
    });
  });

  describe("Sukses (soft delete ke ARCHIVED)", () => {
    it("harus mengembalikan 200 dan mengubah status menjadi ARCHIVED", async () => {
      const res = await adminAgent.delete(`${baseUrl()}/${assetId}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/berhasil diarsipkan/);
      expect(res.body.data.status).toBe("ARCHIVED");
    });

    it("harus menyimpan status ARCHIVED ke database (bukan dihapus permanen)", async () => {
      await adminAgent.delete(`${baseUrl()}/${assetId}`);
      const asset = await prismaClient.asset.findUnique({
        where: { id: assetId },
      });
      expect(asset).not.toBeNull();
      expect(asset.status).toBe("ARCHIVED");
    });
  });
});
