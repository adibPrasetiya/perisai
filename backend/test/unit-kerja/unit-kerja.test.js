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
const ADMIN_USERNAME = "testuk_admin";
const ADMIN_EMAIL = "testuk.admin@test.com";
const UK_CODE_PREFIX = "TEST-UK-";

let adminAgent;
let adminUserId;
let createdUnitKerjaIds = [];

const generateTotpCode = (base32Secret) =>
  new TOTP({
    issuer: "PERISAI WEB APP",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(base32Secret),
  }).generate();

const ensureRoles = async () => {
  await prismaClient.role.upsert({
    where: { name: "USER" },
    update: {},
    create: { name: "USER", description: "User" },
  });
  await prismaClient.role.upsert({
    where: { name: "ADMINISTRATOR" },
    update: {},
    create: { name: "ADMINISTRATOR", description: "Administrator" },
  });
};

const createAdminWithTotp = async () => {
  const hashedPwd = await hash(ADMIN_PASSWORD);
  const role = await prismaClient.role.findUnique({
    where: { name: "ADMINISTRATOR" },
  });
  const totpData = generateTotpSecret(ADMIN_USERNAME);
  const encSecret = encryptTotpSecret(totpData.base32);

  const user = await prismaClient.user.create({
    data: {
      username: ADMIN_USERNAME,
      name: "Admin Unit Kerja Test",
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
      unitKerjaId: (await prismaClient.unitKerja.findFirst()).id,
    },
  });
  return { user, base32Secret: totpData.base32 };
};

const loginAdmin = async (base32Secret) => {
  const agent = supertest.agent(app);
  const loginRes = await agent
    .post("/auth/login")
    .send({ identifier: ADMIN_USERNAME, password: ADMIN_PASSWORD });
  expect(loginRes.status).toBe(200);
  const verifyRes = await agent.post("/auth/totp/verify").send({
    totpToken: loginRes.body.data.totpToken,
    code: generateTotpCode(base32Secret),
  });
  expect(verifyRes.status).toBe(200);
  return agent;
};

// Buat unit kerja dan lacak ID-nya agar bisa dihapus di afterAll
const trackCreate = async (agent, body) => {
  const res = await agent.post("/unit-kerja").send(body);
  if (res.status === 201 && res.body.data?.id) {
    createdUnitKerjaIds.push(res.body.data.id);
  }
  return res;
};

beforeAll(async () => {
  await ensureRoles();
  // Bersihkan user admin lama kalau ada
  await prismaClient.user.deleteMany({
    where: { OR: [{ username: ADMIN_USERNAME }, { email: ADMIN_EMAIL }] },
  });
  const { user, base32Secret } = await createAdminWithTotp();
  adminUserId = user.id;
  adminAgent = await loginAdmin(base32Secret);
}, 30000);

afterAll(async () => {
  // Hapus unit kerja yang dibuat selama test
  await prismaClient.unitKerja.deleteMany({
    where: { id: { in: createdUnitKerjaIds } },
  });
  // Juga bersihkan berdasarkan prefix kode, kalau ada yang lolos
  await prismaClient.unitKerja.deleteMany({
    where: { code: { startsWith: UK_CODE_PREFIX } },
  });
  await prismaClient.session.deleteMany({ where: { userId: adminUserId } });
  await prismaClient.user.deleteMany({
    where: { OR: [{ username: ADMIN_USERNAME }, { email: ADMIN_EMAIL }] },
  });
  await prismaClient.$disconnect();
}, 30000);

// ─── GET /unit-kerja (publik) ─────────────────────────────────────────────────

describe("GET /unit-kerja", () => {
  it("harus mengembalikan 200 tanpa autentikasi", async () => {
    const res = await supertest(app).get("/unit-kerja");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty("pagination");
  });

  it("harus mengembalikan 200 dengan filter nama", async () => {
    const res = await supertest(app)
      .get("/unit-kerja")
      .query({ name: "zzz-tidak-ada" });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.pagination.totalItems).toBe(0);
  });

  it("harus mengembalikan 200 dengan parameter pagination", async () => {
    const res = await supertest(app)
      .get("/unit-kerja")
      .query({ page: 1, limit: 5 });
    expect(res.status).toBe(200);
    expect(res.body.pagination.limit).toBe(5);
    expect(res.body.pagination.page).toBe(1);
  });

  it("harus mengembalikan 400 jika limit melebihi 100", async () => {
    const res = await supertest(app).get("/unit-kerja").query({ limit: 200 });
    expect(res.status).toBe(400);
  });
});

// ─── POST /unit-kerja ─────────────────────────────────────────────────────────

describe("POST /unit-kerja", () => {
  describe("Autentikasi & Otorisasi", () => {
    it("harus mengembalikan 401 tanpa cookie autentikasi", async () => {
      const res = await supertest(app)
        .post("/unit-kerja")
        .send({ name: "Test", code: "TEST-401", email: "test@test.com" });
      expect(res.status).toBe(401);
    });
  });

  describe("Validasi Input", () => {
    it("harus mengembalikan 400 jika name tidak diisi", async () => {
      const res = await adminAgent
        .post("/unit-kerja")
        .send({ code: "TEST-UK-NONAME", email: "noname@test.com" });
      expect(res.status).toBe(400);
    });

    it("harus mengembalikan 400 jika code tidak diisi", async () => {
      const res = await adminAgent
        .post("/unit-kerja")
        .send({ name: "Test No Code", email: "nocode@test.com" });
      expect(res.status).toBe(400);
    });

    it("harus mengembalikan 400 jika email tidak diisi", async () => {
      const res = await adminAgent
        .post("/unit-kerja")
        .send({ name: "Test No Email", code: "TEST-UK-NOEMAIL" });
      expect(res.status).toBe(400);
    });

    it("harus mengembalikan 400 jika format email tidak valid", async () => {
      const res = await adminAgent.post("/unit-kerja").send({
        name: "Test Bad Email",
        code: "TEST-UK-BADEMAIL",
        email: "bukan-email",
      });
      expect(res.status).toBe(400);
    });

    it("harus mengembalikan 400 jika code mengandung huruf kecil", async () => {
      const res = await adminAgent.post("/unit-kerja").send({
        name: "Test Lower Code",
        code: "test-lower",
        email: "lower@test.com",
      });
      expect(res.status).toBe(400);
    });

    it("harus mengembalikan 400 jika name kurang dari 2 karakter", async () => {
      const res = await adminAgent
        .post("/unit-kerja")
        .send({ name: "A", code: "TEST-UK-SHORT", email: "short@test.com" });
      expect(res.status).toBe(400);
    });
  });

  describe("Business Logic", () => {
    it("harus mengembalikan 409 jika kode unit kerja sudah digunakan", async () => {
      const res1 = await trackCreate(adminAgent, {
        name: "Unit Kerja Duplikat",
        code: "TEST-UK-DUP",
        email: "dup1@test.com",
      });
      expect(res1.status).toBe(201);

      const res2 = await adminAgent.post("/unit-kerja").send({
        name: "Unit Kerja Duplikat 2",
        code: "TEST-UK-DUP",
        email: "dup2@test.com",
      });
      expect(res2.status).toBe(409);
      expect(res2.body.errors).toMatch(/sudah digunakan/);
    });
  });

  describe("Sukses", () => {
    it("harus mengembalikan 201 dan data unit kerja yang dibuat", async () => {
      const res = await trackCreate(adminAgent, {
        name: "Unit Kerja Test Baru",
        code: "TEST-UK-NEW01",
        email: "new01@test.com",
      });
      expect(res.status).toBe(201);
      expect(res.body.message).toMatch(/berhasil dibuat/);
      expect(res.body.data).toMatchObject({
        name: "Unit Kerja Test Baru",
        code: "TEST-UK-NEW01",
        email: "new01@test.com",
      });
      expect(res.body.data).toHaveProperty("id");
    });

    it("harus tersimpan di database", async () => {
      const res = await trackCreate(adminAgent, {
        name: "Unit Kerja DB Check",
        code: "TEST-UK-DBCHK",
        email: "dbchk@test.com",
      });
      expect(res.status).toBe(201);
      const uk = await prismaClient.unitKerja.findUnique({
        where: { code: "TEST-UK-DBCHK" },
      });
      expect(uk).not.toBeNull();
      expect(uk.name).toBe("Unit Kerja DB Check");
    });
  });
});

// ─── PATCH /unit-kerja/:unitKerjaId ──────────────────────────────────────────

describe("PATCH /unit-kerja/:unitKerjaId", () => {
  let testUkId;

  beforeAll(async () => {
    const uk = await prismaClient.unitKerja.create({
      data: {
        name: "UK Untuk Update",
        code: "TEST-UK-UPD",
        email: "upd@test.com",
      },
    });
    testUkId = uk.id;
    createdUnitKerjaIds.push(testUkId);
  }, 30000);

  describe("Autentikasi", () => {
    it("harus mengembalikan 401 tanpa cookie autentikasi", async () => {
      const res = await supertest(app)
        .patch(`/unit-kerja/${testUkId}`)
        .send({ name: "Nama Baru" });
      expect(res.status).toBe(401);
    });
  });

  describe("Validasi Input", () => {
    it("harus mengembalikan 400 jika tidak ada field yang dikirim", async () => {
      const res = await adminAgent.patch(`/unit-kerja/${testUkId}`).send({});
      expect(res.status).toBe(400);
    });

    it("harus mengembalikan 400 jika format code tidak valid (huruf kecil)", async () => {
      const res = await adminAgent
        .patch(`/unit-kerja/${testUkId}`)
        .send({ code: "lowercase" });
      expect(res.status).toBe(400);
    });

    it("harus mengembalikan 400 jika format email tidak valid", async () => {
      const res = await adminAgent
        .patch(`/unit-kerja/${testUkId}`)
        .send({ email: "bukan-email" });
      expect(res.status).toBe(400);
    });
  });

  describe("Business Logic", () => {
    it("harus mengembalikan 404 jika ID tidak ditemukan", async () => {
      const res = await adminAgent
        .patch(`/unit-kerja/id-yang-tidak-ada`)
        .send({ name: "Nama Baru" });
      expect(res.status).toBe(404);
      expect(res.body.errors).toMatch(/tidak ditemukan/);
    });

    it("harus mengembalikan 409 jika kode baru sudah digunakan unit kerja lain", async () => {
      const other = await prismaClient.unitKerja.create({
        data: {
          name: "UK Lain",
          code: "TEST-UK-OTHER",
          email: "other@test.com",
        },
      });
      createdUnitKerjaIds.push(other.id);

      const res = await adminAgent
        .patch(`/unit-kerja/${testUkId}`)
        .send({ code: "TEST-UK-OTHER" });
      expect(res.status).toBe(409);
      expect(res.body.errors).toMatch(/sudah digunakan/);
    });
  });

  describe("Sukses", () => {
    it("harus mengembalikan 200 dan memperbarui nama", async () => {
      const res = await adminAgent
        .patch(`/unit-kerja/${testUkId}`)
        .send({ name: "Nama Diperbarui" });
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/berhasil diperbarui/);
      expect(res.body.data.name).toBe("Nama Diperbarui");
    });

    it("harus memperbarui email saja", async () => {
      const res = await adminAgent
        .patch(`/unit-kerja/${testUkId}`)
        .send({ email: "newemail@test.com" });
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe("newemail@test.com");
    });

    it("harus tersimpan di database", async () => {
      await adminAgent
        .patch(`/unit-kerja/${testUkId}`)
        .send({ name: "Nama DB Check" });
      const uk = await prismaClient.unitKerja.findUnique({
        where: { id: testUkId },
      });
      expect(uk.name).toBe("Nama DB Check");
    });
  });
});

// ─── DELETE /unit-kerja/:unitKerjaId ─────────────────────────────────────────

describe("DELETE /unit-kerja/:unitKerjaId", () => {
  let deleteTargetId;

  beforeEach(async () => {
    const uk = await prismaClient.unitKerja.create({
      data: {
        name: "UK Untuk Hapus",
        code: `TEST-UK-DEL-${Date.now()}`,
        email: "del@test.com",
      },
    });
    deleteTargetId = uk.id;
  }, 30000);

  afterEach(async () => {
    // Bersihkan jika test gagal menghapus
    await prismaClient.unitKerja.deleteMany({ where: { id: deleteTargetId } });
  }, 30000);

  describe("Autentikasi", () => {
    it("harus mengembalikan 401 tanpa cookie autentikasi", async () => {
      const res = await supertest(app).delete(`/unit-kerja/${deleteTargetId}`);
      expect(res.status).toBe(401);
    });
  });

  describe("Business Logic", () => {
    it("harus mengembalikan 404 jika ID tidak ditemukan", async () => {
      const res = await adminAgent.delete(`/unit-kerja/id-tidak-ada`);
      expect(res.status).toBe(404);
      expect(res.body.errors).toMatch(/tidak ditemukan/);
    });

    it("harus mengembalikan 409 jika unit kerja masih memiliki profil terkait", async () => {
      // Buat user dan profil yang terikat ke unit kerja ini
      const hashedPwd = await hash("Test@1234");
      const roleUser = await prismaClient.role.findUnique({
        where: { name: "USER" },
      });
      const user = await prismaClient.user.create({
        data: {
          username: `tmp_profile_user_${Date.now()}`,
          name: "Tmp",
          email: `tmp${Date.now()}@test.com`,
          password: hashedPwd,
          isActive: true,
        },
      });
      await prismaClient.userRole.create({
        data: { userId: user.id, roleId: roleUser.id },
      });
      await prismaClient.profile.create({
        data: { userId: user.id, jabatan: "Staf", unitKerjaId: deleteTargetId },
      });

      const res = await adminAgent.delete(`/unit-kerja/${deleteTargetId}`);
      expect(res.status).toBe(409);
      expect(res.body.errors).toMatch(/profil/);

      // Cleanup profil dan user
      await prismaClient.user.delete({ where: { id: user.id } });
    });
  });

  describe("Sukses", () => {
    it("harus mengembalikan 200 dan menghapus unit kerja", async () => {
      const res = await adminAgent.delete(`/unit-kerja/${deleteTargetId}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/berhasil dihapus/);
    });

    it("harus benar-benar menghapus dari database", async () => {
      await adminAgent.delete(`/unit-kerja/${deleteTargetId}`);
      const uk = await prismaClient.unitKerja.findUnique({
        where: { id: deleteTargetId },
      });
      expect(uk).toBeNull();
    });
  });
});
