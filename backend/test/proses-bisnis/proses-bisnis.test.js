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
const ADMIN_USERNAME = "testpb_admin";
const ADMIN_EMAIL = "testpb.admin@test.com";

let adminAgent;
let adminUserId;
let testUnitKerjaId;
let createdIds = [];

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

  const uk = await prismaClient.unitKerja.upsert({
    where: { code: "TEST-PB-UK" },
    update: {},
    create: {
      name: "Unit Kerja Proses Bisnis Test",
      code: "TEST-PB-UK",
      email: "pbuk@test.com",
    },
  });
  testUnitKerjaId = uk.id;

  const hashedPwd = await hash(ADMIN_PASSWORD);
  const role = await prismaClient.role.findUnique({
    where: { name: "ADMINISTRATOR" },
  });
  const totpData = generateTotpSecret(ADMIN_USERNAME);
  const encSecret = encryptTotpSecret(totpData.base32);

  const user = await prismaClient.user.create({
    data: {
      username: ADMIN_USERNAME,
      name: "Admin Proses Bisnis Test",
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
  await prismaClient.businessProcess.deleteMany({
    where: { unitKerjaId: testUnitKerjaId },
  });
  await prismaClient.session.deleteMany({ where: { userId: adminUserId } });
  await prismaClient.user.deleteMany({
    where: { OR: [{ username: ADMIN_USERNAME }, { email: ADMIN_EMAIL }] },
  });
  await prismaClient.unitKerja.deleteMany({ where: { code: "TEST-PB-UK" } });
  await prismaClient.$disconnect();
}, 30000);

const baseUrl = () => `/unit-kerja/${testUnitKerjaId}/proses-bisnis`;

const trackCreate = async (body) => {
  const res = await adminAgent.post(baseUrl()).send(body);
  if (res.status === 201 && res.body.data?.id) {
    createdIds.push(res.body.data.id);
  }
  return res;
};

const defaultBody = (suffix = Date.now()) => ({
  name: `Proses Bisnis Test ${suffix}`,
  code: `PB-T-${String(suffix)
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "-")}`,
});

// ─── POST /unit-kerja/:unitKerjaId/proses-bisnis ──────────────────────────────

describe("POST /unit-kerja/:unitKerjaId/proses-bisnis", () => {
  describe("Autentikasi", () => {
    it("harus mengembalikan 401 tanpa cookie autentikasi", async () => {
      const res = await supertest(app).post(baseUrl()).send(defaultBody());
      expect(res.status).toBe(401);
    });
  });

  describe("Validasi Input", () => {
    it("harus mengembalikan 400 jika name tidak diisi", async () => {
      const res = await adminAgent.post(baseUrl()).send({ code: "PB-NONAME" });
      expect(res.status).toBe(400);
    });

    it("harus mengembalikan 400 jika code tidak diisi", async () => {
      const res = await adminAgent
        .post(baseUrl())
        .send({ name: "Proses Tanpa Kode" });
      expect(res.status).toBe(400);
    });

    it("harus mengembalikan 400 jika code mengandung huruf kecil", async () => {
      const res = await adminAgent.post(baseUrl()).send({
        name: "Proses Kode Kecil",
        code: "pb-lowercase",
      });
      expect(res.status).toBe(400);
    });

    it("harus mengembalikan 400 jika code mengandung spasi", async () => {
      const res = await adminAgent.post(baseUrl()).send({
        name: "Proses Kode Spasi",
        code: "PB SPASI",
      });
      expect(res.status).toBe(400);
    });

    it("harus mengembalikan 400 jika name kurang dari 2 karakter", async () => {
      const res = await adminAgent.post(baseUrl()).send({
        name: "A",
        code: "PB-SHORTNAME",
      });
      expect(res.status).toBe(400);
    });
  });

  describe("Business Logic", () => {
    it("harus mengembalikan 404 jika unit kerja tidak ditemukan", async () => {
      const res = await adminAgent
        .post(`/unit-kerja/uk-tidak-ada/proses-bisnis`)
        .send(defaultBody());
      expect(res.status).toBe(404);
      expect(res.body.errors).toMatch(/tidak ditemukan/);
    });

    it("harus mengembalikan 409 jika code sudah digunakan dalam unit kerja yang sama", async () => {
      const res1 = await trackCreate({
        name: "Proses Duplikat Pertama",
        code: "PB-DUP-CODE",
      });
      expect(res1.status).toBe(201);

      const res2 = await adminAgent.post(baseUrl()).send({
        name: "Proses Duplikat Kedua",
        code: "PB-DUP-CODE",
      });
      expect(res2.status).toBe(409);
      expect(res2.body.errors).toMatch(/sudah digunakan/);
    });
  });

  describe("Sukses", () => {
    it("harus mengembalikan 201 dan data proses bisnis yang dibuat", async () => {
      const res = await trackCreate({
        name: "Proses Pengadaan Barang",
        code: "PB-PENGADAAN-01",
        description: "Proses pengadaan barang operasional",
        owner: "Divisi Logistik",
      });
      expect(res.status).toBe(201);
      expect(res.body.message).toMatch(/berhasil dibuat/);
      expect(res.body.data).toMatchObject({
        name: "Proses Pengadaan Barang",
        code: "PB-PENGADAAN-01",
        status: "ACTIVE",
      });
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data).toHaveProperty("unitKerja");
      expect(res.body.data.unitKerja).toHaveProperty("id");
    });

    it("harus berhasil dibuat dengan status default ACTIVE", async () => {
      const res = await trackCreate(defaultBody("defaultstatus"));
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe("ACTIVE");
    });

    it("harus berhasil dibuat dengan status INACTIVE jika ditentukan", async () => {
      const res = await trackCreate({
        ...defaultBody("inactive-init"),
        status: "INACTIVE",
      });
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe("INACTIVE");
    });

    it("harus tersimpan di database", async () => {
      const res = await trackCreate({
        name: "Proses DB Check",
        code: "PB-DBCHK-01",
      });
      expect(res.status).toBe(201);
      const record = await prismaClient.businessProcess.findUnique({
        where: { id: res.body.data.id },
      });
      expect(record).not.toBeNull();
      expect(record.code).toBe("PB-DBCHK-01");
    });
  });
});

// ─── GET /unit-kerja/:unitKerjaId/proses-bisnis ───────────────────────────────

describe("GET /unit-kerja/:unitKerjaId/proses-bisnis", () => {
  describe("Autentikasi", () => {
    it("harus mengembalikan 401 tanpa cookie autentikasi", async () => {
      const res = await supertest(app).get(baseUrl());
      expect(res.status).toBe(401);
    });
  });

  describe("Business Logic", () => {
    it("harus mengembalikan 404 jika unit kerja tidak ditemukan", async () => {
      const res = await adminAgent.get(
        `/unit-kerja/uk-tidak-ada/proses-bisnis`,
      );
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
      expect(res.body.pagination).toHaveProperty("totalItems");
      expect(res.body.pagination).toHaveProperty("totalPages");
    });

    it("harus mengembalikan 200 dengan filter nama", async () => {
      const res = await adminAgent
        .get(baseUrl())
        .query({ name: "zzz-tidak-ada-sama-sekali" });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });

    it("harus mengembalikan 200 dengan filter status ACTIVE", async () => {
      const res = await adminAgent.get(baseUrl()).query({ status: "ACTIVE" });
      expect(res.status).toBe(200);
      res.body.data.forEach((item) => expect(item.status).toBe("ACTIVE"));
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

    it("harus mengembalikan 400 jika limit melebihi 100", async () => {
      const res = await adminAgent.get(baseUrl()).query({ limit: 200 });
      expect(res.status).toBe(400);
    });
  });
});

// ─── PATCH /unit-kerja/:unitKerjaId/proses-bisnis/:id ────────────────────────

describe("PATCH /unit-kerja/:unitKerjaId/proses-bisnis/:id", () => {
  let pbId;

  beforeAll(async () => {
    const record = await prismaClient.businessProcess.create({
      data: {
        name: "Proses Untuk Update",
        code: "PB-UPD-BASE",
        unitKerjaId: testUnitKerjaId,
        status: "ACTIVE",
      },
    });
    pbId = record.id;
    createdIds.push(pbId);
  }, 30000);

  describe("Autentikasi", () => {
    it("harus mengembalikan 401 tanpa cookie autentikasi", async () => {
      const res = await supertest(app)
        .patch(`${baseUrl()}/${pbId}`)
        .send({ name: "Nama Baru" });
      expect(res.status).toBe(401);
    });
  });

  describe("Validasi Input", () => {
    it("harus mengembalikan 400 jika tidak ada field yang dikirim", async () => {
      const res = await adminAgent.patch(`${baseUrl()}/${pbId}`).send({});
      expect(res.status).toBe(400);
    });

    it("harus mengembalikan 400 jika code mengandung huruf kecil", async () => {
      const res = await adminAgent
        .patch(`${baseUrl()}/${pbId}`)
        .send({ code: "pb-lowercase" });
      expect(res.status).toBe(400);
    });
  });

  describe("Business Logic", () => {
    it("harus mengembalikan 404 jika proses bisnis tidak ditemukan", async () => {
      const res = await adminAgent
        .patch(`${baseUrl()}/id-tidak-ada`)
        .send({ name: "Nama Baru" });
      expect(res.status).toBe(404);
      expect(res.body.errors).toMatch(/tidak ditemukan/);
    });

    it("harus mengembalikan 403 jika proses bisnis sudah diarsipkan", async () => {
      const archived = await prismaClient.businessProcess.create({
        data: {
          name: "Proses Archived Update",
          code: "PB-ARC-UPD",
          unitKerjaId: testUnitKerjaId,
          status: "ARCHIVED",
        },
      });
      createdIds.push(archived.id);

      const res = await adminAgent
        .patch(`${baseUrl()}/${archived.id}`)
        .send({ name: "Nama Baru" });
      expect(res.status).toBe(403);
      expect(res.body.errors).toMatch(/arsipkan/i);
    });

    it("harus mengembalikan 409 jika code baru sudah digunakan proses lain", async () => {
      const other = await prismaClient.businessProcess.create({
        data: {
          name: "Proses Other",
          code: "PB-OTHER-CODE",
          unitKerjaId: testUnitKerjaId,
          status: "ACTIVE",
        },
      });
      createdIds.push(other.id);

      const res = await adminAgent
        .patch(`${baseUrl()}/${pbId}`)
        .send({ code: "PB-OTHER-CODE" });
      expect(res.status).toBe(409);
      expect(res.body.errors).toMatch(/sudah digunakan/);
    });
  });

  describe("Sukses", () => {
    it("harus mengembalikan 200 dan memperbarui nama", async () => {
      const res = await adminAgent
        .patch(`${baseUrl()}/${pbId}`)
        .send({ name: "Proses Nama Baru" });
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/berhasil diperbarui/);
      expect(res.body.data.name).toBe("Proses Nama Baru");
    });

    it("harus memperbarui description saja", async () => {
      const res = await adminAgent
        .patch(`${baseUrl()}/${pbId}`)
        .send({ description: "Deskripsi diperbarui" });
      expect(res.status).toBe(200);
      expect(res.body.data.description).toBe("Deskripsi diperbarui");
    });

    it("harus memperbarui owner saja", async () => {
      const res = await adminAgent
        .patch(`${baseUrl()}/${pbId}`)
        .send({ owner: "Owner Baru Test" });
      expect(res.status).toBe(200);
      expect(res.body.data.owner).toBe("Owner Baru Test");
    });

    it("harus tersimpan di database", async () => {
      await adminAgent
        .patch(`${baseUrl()}/${pbId}`)
        .send({ owner: "Owner DB Check" });
      const record = await prismaClient.businessProcess.findUnique({
        where: { id: pbId },
      });
      expect(record.owner).toBe("Owner DB Check");
    });
  });
});

// ─── PATCH /unit-kerja/:unitKerjaId/proses-bisnis/:id/activate ───────────────

describe("PATCH /unit-kerja/:unitKerjaId/proses-bisnis/:id/activate", () => {
  let pbId;

  beforeEach(async () => {
    const record = await prismaClient.businessProcess.create({
      data: {
        name: "Proses Untuk Aktivasi",
        code: `PB-ACT-${Date.now()}`,
        unitKerjaId: testUnitKerjaId,
        status: "INACTIVE",
      },
    });
    pbId = record.id;
    createdIds.push(pbId);
  }, 30000);

  afterEach(async () => {
    await prismaClient.businessProcess.deleteMany({ where: { id: pbId } });
  }, 30000);

  describe("Autentikasi", () => {
    it("harus mengembalikan 401 tanpa cookie autentikasi", async () => {
      const res = await supertest(app).patch(
        `${baseUrl()}/${pbId}/activate`,
      );
      expect(res.status).toBe(401);
    });
  });

  describe("Business Logic", () => {
    it("harus mengembalikan 404 jika proses bisnis tidak ditemukan", async () => {
      const res = await adminAgent.patch(
        `${baseUrl()}/id-tidak-ada/activate`,
      );
      expect(res.status).toBe(404);
    });

    it("harus mengembalikan 400 jika proses bisnis sudah aktif", async () => {
      await prismaClient.businessProcess.update({
        where: { id: pbId },
        data: { status: "ACTIVE" },
      });
      const res = await adminAgent.patch(`${baseUrl()}/${pbId}/activate`);
      expect(res.status).toBe(400);
      expect(res.body.errors).toMatch(/sudah dalam status aktif/);
    });

    it("harus mengembalikan 400 jika proses bisnis sudah diarsipkan", async () => {
      await prismaClient.businessProcess.update({
        where: { id: pbId },
        data: { status: "ARCHIVED" },
      });
      const res = await adminAgent.patch(`${baseUrl()}/${pbId}/activate`);
      expect(res.status).toBe(400);
      expect(res.body.errors).toMatch(/diarsipkan/);
    });
  });

  describe("Sukses", () => {
    it("harus mengembalikan 200 dan mengubah status menjadi ACTIVE", async () => {
      const res = await adminAgent.patch(`${baseUrl()}/${pbId}/activate`);
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/berhasil diaktifkan/);
      expect(res.body.data.status).toBe("ACTIVE");
    });

    it("harus menyimpan status ACTIVE ke database", async () => {
      await adminAgent.patch(`${baseUrl()}/${pbId}/activate`);
      const record = await prismaClient.businessProcess.findUnique({
        where: { id: pbId },
      });
      expect(record.status).toBe("ACTIVE");
    });
  });
});

// ─── PATCH /unit-kerja/:unitKerjaId/proses-bisnis/:id/deactivate ─────────────

describe("PATCH /unit-kerja/:unitKerjaId/proses-bisnis/:id/deactivate", () => {
  let pbId;

  beforeEach(async () => {
    const record = await prismaClient.businessProcess.create({
      data: {
        name: "Proses Untuk Deaktivasi",
        code: `PB-DEACT-${Date.now()}`,
        unitKerjaId: testUnitKerjaId,
        status: "ACTIVE",
      },
    });
    pbId = record.id;
    createdIds.push(pbId);
  }, 30000);

  afterEach(async () => {
    await prismaClient.businessProcess.deleteMany({ where: { id: pbId } });
  }, 30000);

  describe("Autentikasi", () => {
    it("harus mengembalikan 401 tanpa cookie autentikasi", async () => {
      const res = await supertest(app).patch(
        `${baseUrl()}/${pbId}/deactivate`,
      );
      expect(res.status).toBe(401);
    });
  });

  describe("Business Logic", () => {
    it("harus mengembalikan 404 jika proses bisnis tidak ditemukan", async () => {
      const res = await adminAgent.patch(
        `${baseUrl()}/id-tidak-ada/deactivate`,
      );
      expect(res.status).toBe(404);
    });

    it("harus mengembalikan 400 jika proses bisnis sudah tidak aktif", async () => {
      await prismaClient.businessProcess.update({
        where: { id: pbId },
        data: { status: "INACTIVE" },
      });
      const res = await adminAgent.patch(`${baseUrl()}/${pbId}/deactivate`);
      expect(res.status).toBe(400);
      expect(res.body.errors).toMatch(/sudah dalam status tidak aktif/);
    });

    it("harus mengembalikan 400 jika proses bisnis sudah diarsipkan", async () => {
      await prismaClient.businessProcess.update({
        where: { id: pbId },
        data: { status: "ARCHIVED" },
      });
      const res = await adminAgent.patch(`${baseUrl()}/${pbId}/deactivate`);
      expect(res.status).toBe(400);
      expect(res.body.errors).toMatch(/diarsipkan/);
    });
  });

  describe("Sukses", () => {
    it("harus mengembalikan 200 dan mengubah status menjadi INACTIVE", async () => {
      const res = await adminAgent.patch(`${baseUrl()}/${pbId}/deactivate`);
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/berhasil dinonaktifkan/);
      expect(res.body.data.status).toBe("INACTIVE");
    });

    it("harus menyimpan status INACTIVE ke database", async () => {
      await adminAgent.patch(`${baseUrl()}/${pbId}/deactivate`);
      const record = await prismaClient.businessProcess.findUnique({
        where: { id: pbId },
      });
      expect(record.status).toBe("INACTIVE");
    });
  });
});

// ─── DELETE /unit-kerja/:unitKerjaId/proses-bisnis/:id (archive) ──────────────

describe("DELETE /unit-kerja/:unitKerjaId/proses-bisnis/:id", () => {
  let pbId;

  beforeEach(async () => {
    const record = await prismaClient.businessProcess.create({
      data: {
        name: "Proses Untuk Arsip",
        code: `PB-ARC-${Date.now()}`,
        unitKerjaId: testUnitKerjaId,
        status: "INACTIVE",
      },
    });
    pbId = record.id;
    createdIds.push(pbId);
  }, 30000);

  afterEach(async () => {
    await prismaClient.businessProcess.deleteMany({ where: { id: pbId } });
  }, 30000);

  describe("Autentikasi", () => {
    it("harus mengembalikan 401 tanpa cookie autentikasi", async () => {
      const res = await supertest(app).delete(`${baseUrl()}/${pbId}`);
      expect(res.status).toBe(401);
    });
  });

  describe("Business Logic", () => {
    it("harus mengembalikan 404 jika proses bisnis tidak ditemukan", async () => {
      const res = await adminAgent.delete(`${baseUrl()}/id-tidak-ada`);
      expect(res.status).toBe(404);
    });

    it("harus mengembalikan 400 jika proses bisnis masih ACTIVE", async () => {
      await prismaClient.businessProcess.update({
        where: { id: pbId },
        data: { status: "ACTIVE" },
      });
      const res = await adminAgent.delete(`${baseUrl()}/${pbId}`);
      expect(res.status).toBe(400);
      expect(res.body.errors).toMatch(/masih aktif/);
    });

    it("harus mengembalikan 400 jika proses bisnis sudah diarsipkan", async () => {
      await prismaClient.businessProcess.update({
        where: { id: pbId },
        data: { status: "ARCHIVED" },
      });
      const res = await adminAgent.delete(`${baseUrl()}/${pbId}`);
      expect(res.status).toBe(400);
      expect(res.body.errors).toMatch(/sudah diarsipkan/);
    });
  });

  describe("Sukses (soft delete ke ARCHIVED)", () => {
    it("harus mengembalikan 200 dan mengubah status menjadi ARCHIVED", async () => {
      const res = await adminAgent.delete(`${baseUrl()}/${pbId}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/berhasil diarsipkan/);
      expect(res.body.data.status).toBe("ARCHIVED");
    });

    it("harus menyimpan status ARCHIVED ke database (bukan dihapus permanen)", async () => {
      await adminAgent.delete(`${baseUrl()}/${pbId}`);
      const record = await prismaClient.businessProcess.findUnique({
        where: { id: pbId },
      });
      expect(record).not.toBeNull();
      expect(record.status).toBe("ARCHIVED");
    });
  });
});
