import { prismaClient } from "../src/core/lib/database.lib.js";
import { hash } from "../src/core/lib/password.lib.js";

async function main() {
  console.log("🌱 Memulai seeding database...\n");

  // ─── 1. Hapus semua data (urutan FK: paling dependen dulu) ──────────────────

  console.log("🗑️  Menghapus semua data lama...");
  await prismaClient.businessProcess.deleteMany();
  await prismaClient.asset.deleteMany();
  await prismaClient.assetCategory.deleteMany();
  await prismaClient.profile.deleteMany();
  await prismaClient.session.deleteMany();
  await prismaClient.userRole.deleteMany();
  await prismaClient.user.deleteMany();
  await prismaClient.unitKerja.deleteMany();
  await prismaClient.role.deleteMany();

  console.log("✅ Semua data berhasil dihapus\n");

  // ─── 2. Roles ────────────────────────────────────────────────────────────────

  console.log("📝 Seeding Roles...");

  const rolesData = [
    {
      name: "USER",
      description: "Pengguna biasa yang dapat mengisi worksheet risiko",
    },
    {
      name: "ADMINISTRATOR",
      description: "Administrator sistem dengan akses penuh",
    },
    {
      name: "KOMITE_PUSAT",
      description: "Komite Pusat yang dapat mengelola konteks manajemen risiko",
    },
    {
      name: "PENGELOLA_RISIKO_UKER",
      description: "Pengelola Risiko Unit Kerja",
    },
  ];

  const roleMap = {};
  for (const data of rolesData) {
    const role = await prismaClient.role.create({ data });
    roleMap[role.name] = role;
    console.log(`   ✓ ${role.name}`);
  }
  console.log("✅ Roles berhasil di-seed\n");

  // ─── 3. Unit Kerja ───────────────────────────────────────────────────────────

  console.log("🏢 Seeding Unit Kerja...");

  const unitKerjaData = [
    {
      name: "Sekretariat Jenderal",
      code: "SETJEN",
      email: "setjen@kementerian.go.id",
    },
    {
      name: "Inspektorat Jenderal",
      code: "ITJEN",
      email: "itjen@kementerian.go.id",
    },
    {
      name: "Direktorat Jenderal Anggaran",
      code: "DJA",
      email: "dja@kementerian.go.id",
    },
    {
      name: "Direktorat Jenderal Pajak",
      code: "DJP",
      email: "djp@kementerian.go.id",
    },
    {
      name: "Direktorat Jenderal Bea dan Cukai",
      code: "DJBC",
      email: "djbc@kementerian.go.id",
    },
    {
      name: "Direktorat Jenderal Perbendaharaan",
      code: "DJPb",
      email: "djpb@kementerian.go.id",
    },
    {
      name: "Direktorat Jenderal Kekayaan Negara",
      code: "DJKN",
      email: "djkn@kementerian.go.id",
    },
    {
      name: "Direktorat Jenderal Perimbangan Keuangan",
      code: "DJPK",
      email: "djpk@kementerian.go.id",
    },
    {
      name: "Direktorat Jenderal Pengelolaan Pembiayaan dan Risiko",
      code: "DJPPR",
      email: "djppr@kementerian.go.id",
    },
    {
      name: "Badan Kebijakan Fiskal",
      code: "BKF",
      email: "bkf@kementerian.go.id",
    },
    {
      name: "Badan Pendidikan dan Pelatihan Keuangan",
      code: "BPPK",
      email: "bppk@kementerian.go.id",
    },
    {
      name: "Pusat Sistem Informasi dan Teknologi Keuangan",
      code: "PUSINTEK",
      email: "pusintek@kementerian.go.id",
    },
    {
      name: "Pusat Analisis dan Harmonisasi Kebijakan",
      code: "PUSHAKA",
      email: "pushaka@kementerian.go.id",
    },
  ];

  const unitKerjaMap = {};
  for (const data of unitKerjaData) {
    const uk = await prismaClient.unitKerja.create({ data });
    unitKerjaMap[uk.code] = uk;
    console.log(`   ✓ [${uk.code}] ${uk.name}`);
  }
  console.log("✅ Unit Kerja berhasil di-seed\n");

  // ─── 4. Akun Administrator ───────────────────────────────────────────────────

  console.log("👤 Seeding Akun Administrator...");

  // CATATAN: Ganti password ini setelah pertama kali login!
  const hashedPassword = await hash("Admin@12345");
  const now = new Date();

  const adminUser = await prismaClient.user.create({
    data: {
      username: "admin",
      name: "Administrator Sistem",
      email: "admin@kementerian.go.id",
      password: hashedPassword,
      passwordChangedAt: now,
      isActive: true,
      isVerified: true,
      userRoles: {
        create: { roleId: roleMap["ADMINISTRATOR"].id },
      },
      profile: {
        create: {
          jabatan: "Administrator Sistem",
          unitKerjaId: unitKerjaMap["SETJEN"].id,
          isVerified: true,
          verifiedAt: now,
        },
      },
    },
  });

  console.log(`   ✓ ${adminUser.name} (${adminUser.username})`);
  console.log(`   ✓ Email    : ${adminUser.email}`);
  console.log(`   ✓ Password : Admin@12345  ← Segera ganti setelah login!`);
  console.log("✅ Akun Administrator berhasil di-seed\n");

  console.log("🎉 Seeding selesai!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding gagal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
