import { prismaClient } from "../../src/core/lib/database.lib.js";
import { hash } from "../../src/core/lib/password.lib.js";
import {
  generateTotpSecret,
  encryptTotpSecret,
} from "../../src/utils/totp.utils.js";

const TEST_USERNAME = "testuser_reg";
const TEST_EMAIL = "testuser@test.com";
const TEST_UNIT_KERJA_CODE = "TEST-UNIT";

const TEST_LOGIN_USERNAME = "testuser_login";
const TEST_LOGIN_EMAIL = "testlogin@test.com";
const TEST_LOGIN_PASSWORD = "Test@1234";
const TEST_LOGIN_UNIT_KERJA_CODE = "TEST-LOGIN-UNIT";

const TEST_FORGOT_USERNAME = "testuser_forgot";
const TEST_FORGOT_EMAIL = "testforgot@test.com";
const TEST_FORGOT_PASSWORD = "Test@1234";
const TEST_NO_TOTP_USERNAME = "testuser_nototp";
const TEST_NO_TOTP_EMAIL = "testnototp@test.com";
const TEST_FORGOT_UNIT_KERJA_CODE = "TEST-FORGOT-UNIT";

const TEST_TOTP_SETUP_USERNAME = "testuser_totp";
const TEST_TOTP_SETUP_EMAIL = "testtotp@test.com";
const TEST_TOTP_SETUP_UNIT_KERJA_CODE = "TEST-TOTP-UNIT";

const removeTestUser = async () => {
  await prismaClient.user.deleteMany({
    where: {
      OR: [{ username: TEST_USERNAME }, { email: TEST_EMAIL }],
    },
  });
};

const createTestUnitKerja = async () => {
  return prismaClient.unitKerja.upsert({
    where: { code: TEST_UNIT_KERJA_CODE },
    update: {},
    create: {
      name: "Unit Kerja Test",
      code: TEST_UNIT_KERJA_CODE,
      email: "unitkerja.test@kementerian.go.id",
    },
  });
};

const removeTestUnitKerja = async () => {
  await prismaClient.unitKerja.deleteMany({
    where: { code: TEST_UNIT_KERJA_CODE },
  });
};

const ensureRoleUserExists = async () => {
  await prismaClient.role.upsert({
    where: { name: "USER" },
    update: {},
    create: { name: "USER", description: "Role untuk pengguna biasa" },
  });
};

const createLoginTestUnitKerja = async () => {
  return prismaClient.unitKerja.upsert({
    where: { code: TEST_LOGIN_UNIT_KERJA_CODE },
    update: {},
    create: {
      name: "Unit Kerja Login Test",
      code: TEST_LOGIN_UNIT_KERJA_CODE,
      email: "unitkerja.login@kementerian.go.id",
    },
  });
};

const removeLoginTestUnitKerja = async () => {
  await prismaClient.unitKerja.deleteMany({
    where: { code: TEST_LOGIN_UNIT_KERJA_CODE },
  });
};

const createActiveTestUser = async (unitKerjaId) => {
  const hashedPassword = await hash(TEST_LOGIN_PASSWORD);
  const role = await prismaClient.role.findUnique({ where: { name: "USER" } });

  return prismaClient.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        username: TEST_LOGIN_USERNAME,
        name: "Test User Login",
        email: TEST_LOGIN_EMAIL,
        password: hashedPassword,
        isActive: true,
        passwordChangedAt: new Date(),
      },
    });
    await tx.userRole.create({ data: { userId: user.id, roleId: role.id } });
    await tx.profile.create({
      data: {
        userId: user.id,
        jabatan: "Staf TIK",
        unitKerjaId,
      },
    });
    return user;
  });
};

const removeActiveTestUser = async () => {
  await prismaClient.user.deleteMany({
    where: {
      OR: [{ username: TEST_LOGIN_USERNAME }, { email: TEST_LOGIN_EMAIL }],
    },
  });
};

const createTotpSetupTestUnitKerja = async () => {
  return prismaClient.unitKerja.upsert({
    where: { code: TEST_TOTP_SETUP_UNIT_KERJA_CODE },
    update: {},
    create: {
      name: "Unit Kerja TOTP Setup Test",
      code: TEST_TOTP_SETUP_UNIT_KERJA_CODE,
      email: "unitkerja.totp@kementerian.go.id",
    },
  });
};

const removeTotpSetupTestUnitKerja = async () => {
  await prismaClient.unitKerja.deleteMany({
    where: { code: TEST_TOTP_SETUP_UNIT_KERJA_CODE },
  });
};

const createTotpSetupTestUser = async (unitKerjaId) => {
  const hashedPassword = await hash(TEST_FORGOT_PASSWORD);
  const role = await prismaClient.role.findUnique({ where: { name: "USER" } });

  return prismaClient.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        username: TEST_TOTP_SETUP_USERNAME,
        name: "Test User TOTP Setup",
        email: TEST_TOTP_SETUP_EMAIL,
        password: hashedPassword,
        isActive: true,
        passwordChangedAt: new Date(),
      },
    });
    await tx.userRole.create({ data: { userId: user.id, roleId: role.id } });
    await tx.profile.create({
      data: { userId: user.id, jabatan: "Staf TIK", unitKerjaId },
    });
    return user;
  });
};

const removeTotpSetupTestUser = async () => {
  await prismaClient.user.deleteMany({
    where: {
      OR: [
        { username: TEST_TOTP_SETUP_USERNAME },
        { email: TEST_TOTP_SETUP_EMAIL },
      ],
    },
  });
};

const createForgotTestUnitKerja = async () => {
  return prismaClient.unitKerja.upsert({
    where: { code: TEST_FORGOT_UNIT_KERJA_CODE },
    update: {},
    create: {
      name: "Unit Kerja Forgot Test",
      code: TEST_FORGOT_UNIT_KERJA_CODE,
      email: "unitkerja.forgot@kementerian.go.id",
    },
  });
};

const removeForgotTestUnitKerja = async () => {
  await prismaClient.unitKerja.deleteMany({
    where: { code: TEST_FORGOT_UNIT_KERJA_CODE },
  });
};

const createUserWithTotp = async (unitKerjaId) => {
  const hashedPassword = await hash(TEST_FORGOT_PASSWORD);
  const role = await prismaClient.role.findUnique({ where: { name: "USER" } });
  const totpData = generateTotpSecret(TEST_FORGOT_USERNAME);
  const encryptedSecret = encryptTotpSecret(totpData.base32);

  return prismaClient.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        username: TEST_FORGOT_USERNAME,
        name: "Test User Forgot",
        email: TEST_FORGOT_EMAIL,
        password: hashedPassword,
        isActive: true,
        passwordChangedAt: new Date(),
        totpEnabled: true,
        totpSecret: encryptedSecret,
        totpVerifiedAt: new Date(),
      },
    });
    await tx.userRole.create({ data: { userId: user.id, roleId: role.id } });
    await tx.profile.create({
      data: { userId: user.id, jabatan: "Staf TIK", unitKerjaId },
    });
    return { user, base32Secret: totpData.base32 };
  });
};

const createUserWithoutTotp = async (unitKerjaId) => {
  const hashedPassword = await hash(TEST_FORGOT_PASSWORD);
  const role = await prismaClient.role.findUnique({ where: { name: "USER" } });

  return prismaClient.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        username: TEST_NO_TOTP_USERNAME,
        name: "Test User No TOTP",
        email: TEST_NO_TOTP_EMAIL,
        password: hashedPassword,
        isActive: true,
        passwordChangedAt: new Date(),
      },
    });
    await tx.userRole.create({ data: { userId: user.id, roleId: role.id } });
    await tx.profile.create({
      data: { userId: user.id, jabatan: "Staf TIK", unitKerjaId },
    });
    return user;
  });
};

const removeForgotTestUsers = async () => {
  await prismaClient.user.deleteMany({
    where: {
      OR: [
        { username: TEST_FORGOT_USERNAME },
        { username: TEST_NO_TOTP_USERNAME },
        { email: TEST_FORGOT_EMAIL },
        { email: TEST_NO_TOTP_EMAIL },
      ],
    },
  });
};

// ─── Search User Test Data ───────────────────────────────────────────────────

const TEST_SEARCH_PASSWORD = "Test@1234";
const TEST_SEARCH_UNIT_KERJA_CODE = "TEST-SEARCH-UNIT";

const TEST_SEARCH_ADMIN_USERNAME = "testuser_search_admin";
const TEST_SEARCH_ADMIN_EMAIL = "testsearch.admin@test.com";

const TEST_SEARCH_USER1_USERNAME = "testuser_search_user1";
const TEST_SEARCH_USER1_EMAIL = "testsearch.user1@test.com";

const TEST_SEARCH_USER2_USERNAME = "testuser_search_user2";
const TEST_SEARCH_USER2_EMAIL = "testsearch.user2@test.com";

const ensureRoleAdminExists = async () => {
  await prismaClient.role.upsert({
    where: { name: "ADMINISTRATOR" },
    update: {},
    create: {
      name: "ADMINISTRATOR",
      description: "Administrator sistem dengan akses penuh",
    },
  });
};

const createSearchTestUnitKerja = async () => {
  return prismaClient.unitKerja.upsert({
    where: { code: TEST_SEARCH_UNIT_KERJA_CODE },
    update: {},
    create: {
      name: "Unit Kerja Search Test",
      code: TEST_SEARCH_UNIT_KERJA_CODE,
      email: "unitkerja.search@kementerian.go.id",
    },
  });
};

const removeSearchTestUnitKerja = async () => {
  await prismaClient.unitKerja.deleteMany({
    where: { code: TEST_SEARCH_UNIT_KERJA_CODE },
  });
};

// Admin user: ADMINISTRATOR role, TOTP enabled, active & verified
const createSearchAdminUser = async (unitKerjaId) => {
  const hashedPassword = await hash(TEST_SEARCH_PASSWORD);
  const role = await prismaClient.role.findUnique({
    where: { name: "ADMINISTRATOR" },
  });
  const totpData = generateTotpSecret(TEST_SEARCH_ADMIN_USERNAME);
  const encryptedSecret = encryptTotpSecret(totpData.base32);

  return prismaClient.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        username: TEST_SEARCH_ADMIN_USERNAME,
        name: "Admin Search Test",
        email: TEST_SEARCH_ADMIN_EMAIL,
        password: hashedPassword,
        isActive: true,
        isVerified: true,
        passwordChangedAt: new Date(),
        totpEnabled: true,
        totpSecret: encryptedSecret,
        totpVerifiedAt: new Date(),
      },
    });
    await tx.userRole.create({ data: { userId: user.id, roleId: role.id } });
    await tx.profile.create({
      data: {
        userId: user.id,
        jabatan: "Administrator Sistem",
        unitKerjaId,
        isVerified: true,
        verifiedAt: new Date(),
      },
    });
    return { user, base32Secret: totpData.base32 };
  });
};

// User 1: USER role, TOTP enabled, active & verified
const createSearchUser1 = async (unitKerjaId) => {
  const hashedPassword = await hash(TEST_SEARCH_PASSWORD);
  const role = await prismaClient.role.findUnique({ where: { name: "USER" } });
  const totpData = generateTotpSecret(TEST_SEARCH_USER1_USERNAME);
  const encryptedSecret = encryptTotpSecret(totpData.base32);

  return prismaClient.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        username: TEST_SEARCH_USER1_USERNAME,
        name: "User Satu Search Test",
        email: TEST_SEARCH_USER1_EMAIL,
        password: hashedPassword,
        isActive: true,
        isVerified: true,
        passwordChangedAt: new Date(),
        totpEnabled: true,
        totpSecret: encryptedSecret,
        totpVerifiedAt: new Date(),
      },
    });
    await tx.userRole.create({ data: { userId: user.id, roleId: role.id } });
    await tx.profile.create({
      data: { userId: user.id, jabatan: "Analis Risiko", unitKerjaId },
    });
    return { user, base32Secret: totpData.base32 };
  });
};

// User 2: USER role, no TOTP, inactive & unverified
const createSearchUser2 = async (unitKerjaId) => {
  const hashedPassword = await hash(TEST_SEARCH_PASSWORD);
  const role = await prismaClient.role.findUnique({ where: { name: "USER" } });

  return prismaClient.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        username: TEST_SEARCH_USER2_USERNAME,
        name: "User Dua Search Test",
        email: TEST_SEARCH_USER2_EMAIL,
        password: hashedPassword,
        isActive: false,
        isVerified: false,
        passwordChangedAt: new Date(),
      },
    });
    await tx.userRole.create({ data: { userId: user.id, roleId: role.id } });
    await tx.profile.create({
      data: { userId: user.id, jabatan: "Staf TIK", unitKerjaId },
    });
    return user;
  });
};

const removeSearchTestUsers = async () => {
  await prismaClient.user.deleteMany({
    where: {
      OR: [
        { username: TEST_SEARCH_ADMIN_USERNAME },
        { username: TEST_SEARCH_USER1_USERNAME },
        { username: TEST_SEARCH_USER2_USERNAME },
      ],
    },
  });
};

// ─── Account Management (Verify / Activate / Deactivate) Test Data ──────────

const TEST_MGMT_PASSWORD = "Test@1234";
const TEST_MGMT_UNIT_KERJA_CODE = "TEST-MGMT-UNIT";

const TEST_MGMT_ADMIN_USERNAME = "testuser_mgmt_admin";
const TEST_MGMT_ADMIN_EMAIL = "testmgmt.admin@test.com";

const TEST_MGMT_TARGET_USERNAME = "testuser_mgmt_target";
const TEST_MGMT_TARGET_EMAIL = "testmgmt.target@test.com";

const createMgmtTestUnitKerja = async () => {
  return prismaClient.unitKerja.upsert({
    where: { code: TEST_MGMT_UNIT_KERJA_CODE },
    update: {},
    create: {
      name: "Unit Kerja Management Test",
      code: TEST_MGMT_UNIT_KERJA_CODE,
      email: "unitkerja.mgmt@kementerian.go.id",
    },
  });
};

const removeMgmtTestUnitKerja = async () => {
  await prismaClient.unitKerja.deleteMany({
    where: { code: TEST_MGMT_UNIT_KERJA_CODE },
  });
};

// Admin: ADMINISTRATOR role, TOTP enabled, active & verified
const createMgmtAdminUser = async (unitKerjaId) => {
  const hashedPassword = await hash(TEST_MGMT_PASSWORD);
  const role = await prismaClient.role.findUnique({
    where: { name: "ADMINISTRATOR" },
  });
  const totpData = generateTotpSecret(TEST_MGMT_ADMIN_USERNAME);
  const encryptedSecret = encryptTotpSecret(totpData.base32);

  return prismaClient.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        username: TEST_MGMT_ADMIN_USERNAME,
        name: "Admin Management Test",
        email: TEST_MGMT_ADMIN_EMAIL,
        password: hashedPassword,
        isActive: true,
        isVerified: true,
        passwordChangedAt: new Date(),
        totpEnabled: true,
        totpSecret: encryptedSecret,
        totpVerifiedAt: new Date(),
      },
    });
    await tx.userRole.create({ data: { userId: user.id, roleId: role.id } });
    await tx.profile.create({
      data: {
        userId: user.id,
        jabatan: "Administrator Sistem",
        unitKerjaId,
        isVerified: true,
        verifiedAt: new Date(),
      },
    });
    return { user, base32Secret: totpData.base32 };
  });
};

// Target user: USER role, no TOTP, isActive=false, isVerified=false (pending admin action)
const createMgmtTargetUser = async (unitKerjaId) => {
  const hashedPassword = await hash(TEST_MGMT_PASSWORD);
  const role = await prismaClient.role.findUnique({ where: { name: "USER" } });

  return prismaClient.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        username: TEST_MGMT_TARGET_USERNAME,
        name: "Target User Management Test",
        email: TEST_MGMT_TARGET_EMAIL,
        password: hashedPassword,
        isActive: false,
        isVerified: false,
        passwordChangedAt: new Date(),
      },
    });
    await tx.userRole.create({ data: { userId: user.id, roleId: role.id } });
    await tx.profile.create({
      data: { userId: user.id, jabatan: "Staf TIK", unitKerjaId },
    });
    return user;
  });
};

const removeMgmtTestUsers = async () => {
  await prismaClient.user.deleteMany({
    where: {
      OR: [
        { username: TEST_MGMT_ADMIN_USERNAME },
        { username: TEST_MGMT_TARGET_USERNAME },
      ],
    },
  });
};

// ─── Get User By ID Test Data ─────────────────────────────────────────────────

const TEST_GET_PASSWORD = "Test@1234";
const TEST_GET_UNIT_KERJA_CODE = "TEST-GET-UNIT";

const TEST_GET_ADMIN_USERNAME = "testuser_get_admin";
const TEST_GET_ADMIN_EMAIL = "testget.admin@test.com";

const TEST_GET_TARGET_USERNAME = "testuser_get_target";
const TEST_GET_TARGET_EMAIL = "testget.target@test.com";

const createGetTestUnitKerja = async () => {
  return prismaClient.unitKerja.upsert({
    where: { code: TEST_GET_UNIT_KERJA_CODE },
    update: {},
    create: {
      name: "Unit Kerja Get Test",
      code: TEST_GET_UNIT_KERJA_CODE,
      email: "unitkerja.get@kementerian.go.id",
    },
  });
};

const removeGetTestUnitKerja = async () => {
  await prismaClient.unitKerja.deleteMany({
    where: { code: TEST_GET_UNIT_KERJA_CODE },
  });
};

// Admin: ADMINISTRATOR role, TOTP enabled, active & verified
const createGetAdminUser = async (unitKerjaId) => {
  const hashedPassword = await hash(TEST_GET_PASSWORD);
  const role = await prismaClient.role.findUnique({
    where: { name: "ADMINISTRATOR" },
  });
  const totpData = generateTotpSecret(TEST_GET_ADMIN_USERNAME);
  const encryptedSecret = encryptTotpSecret(totpData.base32);

  return prismaClient.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        username: TEST_GET_ADMIN_USERNAME,
        name: "Admin Get Test",
        email: TEST_GET_ADMIN_EMAIL,
        password: hashedPassword,
        isActive: true,
        isVerified: true,
        passwordChangedAt: new Date(),
        totpEnabled: true,
        totpSecret: encryptedSecret,
        totpVerifiedAt: new Date(),
      },
    });
    await tx.userRole.create({ data: { userId: user.id, roleId: role.id } });
    await tx.profile.create({
      data: {
        userId: user.id,
        jabatan: "Administrator Sistem",
        unitKerjaId,
        isVerified: true,
        verifiedAt: new Date(),
      },
    });
    return { user, base32Secret: totpData.base32 };
  });
};

// User 1: USER role, TOTP enabled, active & verified (for 403 tests)
const TEST_GET_USER1_USERNAME = "testuser_get_user1";
const TEST_GET_USER1_EMAIL = "testget.user1@test.com";

const createGetUser1 = async (unitKerjaId) => {
  const hashedPassword = await hash(TEST_GET_PASSWORD);
  const role = await prismaClient.role.findUnique({ where: { name: "USER" } });
  const totpData = generateTotpSecret(TEST_GET_USER1_USERNAME);
  const encryptedSecret = encryptTotpSecret(totpData.base32);

  return prismaClient.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        username: TEST_GET_USER1_USERNAME,
        name: "User Satu Get Test",
        email: TEST_GET_USER1_EMAIL,
        password: hashedPassword,
        isActive: true,
        isVerified: true,
        passwordChangedAt: new Date(),
        totpEnabled: true,
        totpSecret: encryptedSecret,
        totpVerifiedAt: new Date(),
      },
    });
    await tx.userRole.create({ data: { userId: user.id, roleId: role.id } });
    await tx.profile.create({
      data: { userId: user.id, jabatan: "Analis Risiko", unitKerjaId },
    });
    return { user, base32Secret: totpData.base32 };
  });
};

// Target user: USER role, no TOTP, isActive=false, isVerified=false
const createGetTargetUser = async (unitKerjaId) => {
  const hashedPassword = await hash(TEST_GET_PASSWORD);
  const role = await prismaClient.role.findUnique({ where: { name: "USER" } });

  return prismaClient.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        username: TEST_GET_TARGET_USERNAME,
        name: "Target User Get Test",
        email: TEST_GET_TARGET_EMAIL,
        password: hashedPassword,
        isActive: false,
        isVerified: false,
        passwordChangedAt: new Date(),
      },
    });
    await tx.userRole.create({ data: { userId: user.id, roleId: role.id } });
    await tx.profile.create({
      data: {
        userId: user.id,
        jabatan: "Staf TIK",
        nomorHP: "081234567890",
        unitKerjaId,
      },
    });
    return user;
  });
};

const removeGetTestUsers = async () => {
  await prismaClient.user.deleteMany({
    where: {
      OR: [
        { username: TEST_GET_ADMIN_USERNAME },
        { username: TEST_GET_USER1_USERNAME },
        { username: TEST_GET_TARGET_USERNAME },
      ],
    },
  });
};

// ─── Logout Test Data ─────────────────────────────────────────────────────────

const TEST_LOGOUT_PASSWORD = "Test@1234";
const TEST_LOGOUT_UNIT_KERJA_CODE = "TEST-LOGOUT-UNIT";
const TEST_LOGOUT_USERNAME = "testuser_logout";
const TEST_LOGOUT_EMAIL = "testlogout@test.com";

const createLogoutTestUnitKerja = async () => {
  return prismaClient.unitKerja.upsert({
    where: { code: TEST_LOGOUT_UNIT_KERJA_CODE },
    update: {},
    create: {
      name: "Unit Kerja Logout Test",
      code: TEST_LOGOUT_UNIT_KERJA_CODE,
      email: "unitkerja.logout@kementerian.go.id",
    },
  });
};

const removeLogoutTestUnitKerja = async () => {
  await prismaClient.unitKerja.deleteMany({
    where: { code: TEST_LOGOUT_UNIT_KERJA_CODE },
  });
};

// User dengan TOTP aktif, isActive=true
const createLogoutTestUser = async (unitKerjaId) => {
  const hashedPassword = await hash(TEST_LOGOUT_PASSWORD);
  const role = await prismaClient.role.findUnique({ where: { name: "USER" } });
  const totpData = generateTotpSecret(TEST_LOGOUT_USERNAME);
  const encryptedSecret = encryptTotpSecret(totpData.base32);

  return prismaClient.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        username: TEST_LOGOUT_USERNAME,
        name: "Test User Logout",
        email: TEST_LOGOUT_EMAIL,
        password: hashedPassword,
        isActive: true,
        isVerified: true,
        passwordChangedAt: new Date(),
        totpEnabled: true,
        totpSecret: encryptedSecret,
        totpVerifiedAt: new Date(),
      },
    });
    await tx.userRole.create({ data: { userId: user.id, roleId: role.id } });
    await tx.profile.create({
      data: { userId: user.id, jabatan: "Staf TIK", unitKerjaId },
    });
    return { user, base32Secret: totpData.base32 };
  });
};

const removeLogoutTestUser = async () => {
  await prismaClient.user.deleteMany({
    where: {
      OR: [{ username: TEST_LOGOUT_USERNAME }, { email: TEST_LOGOUT_EMAIL }],
    },
  });
};

// ─── Change Password Test Data ────────────────────────────────────────────────

const TEST_CHANGE_PWD_PASSWORD = "Test@1234";
const TEST_CHANGE_PWD_NEW_PASSWORD = "NewPass@5678";
const TEST_CHANGE_PWD_UNIT_KERJA_CODE = "TEST-CHPWD-UNIT";
const TEST_CHANGE_PWD_USERNAME = "testuser_chpwd";
const TEST_CHANGE_PWD_EMAIL = "testchpwd@test.com";

const createChangePwdTestUnitKerja = async () => {
  return prismaClient.unitKerja.upsert({
    where: { code: TEST_CHANGE_PWD_UNIT_KERJA_CODE },
    update: {},
    create: {
      name: "Unit Kerja Change Password Test",
      code: TEST_CHANGE_PWD_UNIT_KERJA_CODE,
      email: "unitkerja.chpwd@kementerian.go.id",
    },
  });
};

const removeChangePwdTestUnitKerja = async () => {
  await prismaClient.unitKerja.deleteMany({
    where: { code: TEST_CHANGE_PWD_UNIT_KERJA_CODE },
  });
};

const createChangePwdTestUser = async (unitKerjaId) => {
  const hashedPassword = await hash(TEST_CHANGE_PWD_PASSWORD);
  const role = await prismaClient.role.findUnique({ where: { name: "USER" } });
  const totpData = generateTotpSecret(TEST_CHANGE_PWD_USERNAME);
  const encryptedSecret = encryptTotpSecret(totpData.base32);

  return prismaClient.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        username: TEST_CHANGE_PWD_USERNAME,
        name: "Test User Change Password",
        email: TEST_CHANGE_PWD_EMAIL,
        password: hashedPassword,
        isActive: true,
        isVerified: true,
        passwordChangedAt: new Date(),
        totpEnabled: true,
        totpSecret: encryptedSecret,
        totpVerifiedAt: new Date(),
      },
    });
    await tx.userRole.create({ data: { userId: user.id, roleId: role.id } });
    await tx.profile.create({
      data: { userId: user.id, jabatan: "Staf TIK", unitKerjaId },
    });
    return { user, base32Secret: totpData.base32 };
  });
};

const removeChangePwdTestUser = async () => {
  await prismaClient.user.deleteMany({
    where: {
      OR: [
        { username: TEST_CHANGE_PWD_USERNAME },
        { email: TEST_CHANGE_PWD_EMAIL },
      ],
    },
  });
};

// ─── Refresh Token Test Data ──────────────────────────────────────────────────

const TEST_REFRESH_PASSWORD = "Test@1234";
const TEST_REFRESH_UNIT_KERJA_CODE = "TEST-REFRESH-UNIT";
const TEST_REFRESH_USERNAME = "testuser_refresh";
const TEST_REFRESH_EMAIL = "testrefresh@test.com";

const createRefreshTestUnitKerja = async () => {
  return prismaClient.unitKerja.upsert({
    where: { code: TEST_REFRESH_UNIT_KERJA_CODE },
    update: {},
    create: {
      name: "Unit Kerja Refresh Test",
      code: TEST_REFRESH_UNIT_KERJA_CODE,
      email: "unitkerja.refresh@kementerian.go.id",
    },
  });
};

const removeRefreshTestUnitKerja = async () => {
  await prismaClient.unitKerja.deleteMany({
    where: { code: TEST_REFRESH_UNIT_KERJA_CODE },
  });
};

const createRefreshTestUser = async (unitKerjaId) => {
  const hashedPassword = await hash(TEST_REFRESH_PASSWORD);
  const role = await prismaClient.role.findUnique({ where: { name: "USER" } });
  const totpData = generateTotpSecret(TEST_REFRESH_USERNAME);
  const encryptedSecret = encryptTotpSecret(totpData.base32);

  return prismaClient.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        username: TEST_REFRESH_USERNAME,
        name: "Test User Refresh",
        email: TEST_REFRESH_EMAIL,
        password: hashedPassword,
        isActive: true,
        isVerified: true,
        passwordChangedAt: new Date(),
        totpEnabled: true,
        totpSecret: encryptedSecret,
        totpVerifiedAt: new Date(),
      },
    });
    await tx.userRole.create({ data: { userId: user.id, roleId: role.id } });
    await tx.profile.create({
      data: { userId: user.id, jabatan: "Staf TIK", unitKerjaId },
    });
    return { user, base32Secret: totpData.base32 };
  });
};

const removeRefreshTestUser = async () => {
  await prismaClient.user.deleteMany({
    where: {
      OR: [{ username: TEST_REFRESH_USERNAME }, { email: TEST_REFRESH_EMAIL }],
    },
  });
};

// ─── Get My Profile Test Data ─────────────────────────────────────────────────

const TEST_PROFILE_PASSWORD = "Test@1234";
const TEST_PROFILE_UNIT_KERJA_CODE = "TEST-PROFILE-UNIT";
const TEST_PROFILE_USERNAME = "testuser_profile";
const TEST_PROFILE_EMAIL = "testprofile@test.com";
const TEST_PROFILE_JABATAN = "Analis Sistem Informasi";
const TEST_PROFILE_NOMOR_HP = "082345678901";

const createProfileTestUnitKerja = async () => {
  return prismaClient.unitKerja.upsert({
    where: { code: TEST_PROFILE_UNIT_KERJA_CODE },
    update: {},
    create: {
      name: "Unit Kerja Profile Test",
      code: TEST_PROFILE_UNIT_KERJA_CODE,
      email: "unitkerja.profile@kementerian.go.id",
    },
  });
};

const removeProfileTestUnitKerja = async () => {
  await prismaClient.unitKerja.deleteMany({
    where: { code: TEST_PROFILE_UNIT_KERJA_CODE },
  });
};

// User: USER role, TOTP aktif, isActive=true, isVerified=true, profil lengkap
const createProfileTestUser = async (unitKerjaId) => {
  const hashedPassword = await hash(TEST_PROFILE_PASSWORD);
  const role = await prismaClient.role.findUnique({ where: { name: "USER" } });
  const totpData = generateTotpSecret(TEST_PROFILE_USERNAME);
  const encryptedSecret = encryptTotpSecret(totpData.base32);

  return prismaClient.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        username: TEST_PROFILE_USERNAME,
        name: "Test User Profile",
        email: TEST_PROFILE_EMAIL,
        password: hashedPassword,
        isActive: true,
        isVerified: true,
        passwordChangedAt: new Date(),
        totpEnabled: true,
        totpSecret: encryptedSecret,
        totpVerifiedAt: new Date(),
      },
    });
    await tx.userRole.create({ data: { userId: user.id, roleId: role.id } });
    await tx.profile.create({
      data: {
        userId: user.id,
        jabatan: TEST_PROFILE_JABATAN,
        nomorHP: TEST_PROFILE_NOMOR_HP,
        unitKerjaId,
        isVerified: true,
        verifiedAt: new Date(),
      },
    });
    return { user, base32Secret: totpData.base32 };
  });
};

const removeProfileTestUser = async () => {
  await prismaClient.user.deleteMany({
    where: {
      OR: [{ username: TEST_PROFILE_USERNAME }, { email: TEST_PROFILE_EMAIL }],
    },
  });
};

// ─── Reset TOTP Test Data ─────────────────────────────────────────────────────

const TEST_RESET_TOTP_PASSWORD = "Test@1234";
const TEST_RESET_TOTP_UNIT_KERJA_CODE = "TEST-RESET-TOTP-UNIT";

const TEST_RESET_TOTP_ADMIN_USERNAME = "testuser_reset_totp_admin";
const TEST_RESET_TOTP_ADMIN_EMAIL = "testresettotp.admin@test.com";

const TEST_RESET_TOTP_TARGET_USERNAME = "testuser_reset_totp_target";
const TEST_RESET_TOTP_TARGET_EMAIL = "testresettotp.target@test.com";

const createResetTotpTestUnitKerja = async () => {
  return prismaClient.unitKerja.upsert({
    where: { code: TEST_RESET_TOTP_UNIT_KERJA_CODE },
    update: {},
    create: {
      name: "Unit Kerja Reset TOTP Test",
      code: TEST_RESET_TOTP_UNIT_KERJA_CODE,
      email: "unitkerja.resettotp@kementerian.go.id",
    },
  });
};

const removeResetTotpTestUnitKerja = async () => {
  await prismaClient.unitKerja.deleteMany({
    where: { code: TEST_RESET_TOTP_UNIT_KERJA_CODE },
  });
};

// Admin: ADMINISTRATOR role, TOTP enabled, active & verified
const createResetTotpAdminUser = async (unitKerjaId) => {
  const hashedPassword = await hash(TEST_RESET_TOTP_PASSWORD);
  const role = await prismaClient.role.findUnique({
    where: { name: "ADMINISTRATOR" },
  });
  const totpData = generateTotpSecret(TEST_RESET_TOTP_ADMIN_USERNAME);
  const encryptedSecret = encryptTotpSecret(totpData.base32);

  return prismaClient.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        username: TEST_RESET_TOTP_ADMIN_USERNAME,
        name: "Admin Reset TOTP Test",
        email: TEST_RESET_TOTP_ADMIN_EMAIL,
        password: hashedPassword,
        isActive: true,
        isVerified: true,
        passwordChangedAt: new Date(),
        totpEnabled: true,
        totpSecret: encryptedSecret,
        totpVerifiedAt: new Date(),
      },
    });
    await tx.userRole.create({ data: { userId: user.id, roleId: role.id } });
    await tx.profile.create({
      data: {
        userId: user.id,
        jabatan: "Administrator Sistem",
        unitKerjaId,
        isVerified: true,
        verifiedAt: new Date(),
      },
    });
    return { user, base32Secret: totpData.base32 };
  });
};

// Target: USER role, TOTP enabled, active (bisa direset)
const createResetTotpTargetUser = async (unitKerjaId) => {
  const hashedPassword = await hash(TEST_RESET_TOTP_PASSWORD);
  const role = await prismaClient.role.findUnique({ where: { name: "USER" } });
  const totpData = generateTotpSecret(TEST_RESET_TOTP_TARGET_USERNAME);
  const encryptedSecret = encryptTotpSecret(totpData.base32);

  return prismaClient.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        username: TEST_RESET_TOTP_TARGET_USERNAME,
        name: "Target Reset TOTP Test",
        email: TEST_RESET_TOTP_TARGET_EMAIL,
        password: hashedPassword,
        isActive: true,
        isVerified: true,
        passwordChangedAt: new Date(),
        totpEnabled: true,
        totpSecret: encryptedSecret,
        totpVerifiedAt: new Date(),
      },
    });
    await tx.userRole.create({ data: { userId: user.id, roleId: role.id } });
    await tx.profile.create({
      data: { userId: user.id, jabatan: "Staf TIK", unitKerjaId },
    });
    return { user, base32Secret: totpData.base32 };
  });
};

const removeResetTotpTestUsers = async () => {
  await prismaClient.user.deleteMany({
    where: {
      OR: [
        { username: TEST_RESET_TOTP_ADMIN_USERNAME },
        { username: TEST_RESET_TOTP_TARGET_USERNAME },
      ],
    },
  });
};

// ─── Update My Account Test Data ─────────────────────────────────────────────

const TEST_UPD_ACCOUNT_PASSWORD = "Test@1234";
const TEST_UPD_ACCOUNT_UNIT_KERJA_CODE = "TEST-UPD-ACCT-UNIT";
const TEST_UPD_ACCOUNT_USERNAME = "testuser_upd_account";
const TEST_UPD_ACCOUNT_EMAIL = "testupdaccount@test.com";

const createUpdAccountTestUnitKerja = async () => {
  return prismaClient.unitKerja.upsert({
    where: { code: TEST_UPD_ACCOUNT_UNIT_KERJA_CODE },
    update: {},
    create: {
      name: "Unit Kerja Update Account Test",
      code: TEST_UPD_ACCOUNT_UNIT_KERJA_CODE,
      email: "unitkerja.updaccount@kementerian.go.id",
    },
  });
};

const removeUpdAccountTestUnitKerja = async () => {
  await prismaClient.unitKerja.deleteMany({
    where: { code: TEST_UPD_ACCOUNT_UNIT_KERJA_CODE },
  });
};

const createUpdAccountTestUser = async (unitKerjaId) => {
  const hashedPassword = await hash(TEST_UPD_ACCOUNT_PASSWORD);
  const role = await prismaClient.role.findUnique({ where: { name: "USER" } });
  const totpData = generateTotpSecret(TEST_UPD_ACCOUNT_USERNAME);
  const encryptedSecret = encryptTotpSecret(totpData.base32);

  return prismaClient.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        username: TEST_UPD_ACCOUNT_USERNAME,
        name: "Test User Update Account",
        email: TEST_UPD_ACCOUNT_EMAIL,
        password: hashedPassword,
        isActive: true,
        isVerified: true,
        passwordChangedAt: new Date(),
        totpEnabled: true,
        totpSecret: encryptedSecret,
        totpVerifiedAt: new Date(),
      },
    });
    await tx.userRole.create({ data: { userId: user.id, roleId: role.id } });
    await tx.profile.create({
      data: { userId: user.id, jabatan: "Staf TIK", unitKerjaId },
    });
    return { user, base32Secret: totpData.base32 };
  });
};

const removeUpdAccountTestUser = async () => {
  await prismaClient.user.deleteMany({
    where: {
      OR: [
        { username: TEST_UPD_ACCOUNT_USERNAME },
        { email: TEST_UPD_ACCOUNT_EMAIL },
      ],
    },
  });
};

// ─── Update My Profile Test Data ──────────────────────────────────────────────

const TEST_UPD_PROFILE_PASSWORD = "Test@1234";
const TEST_UPD_PROFILE_UNIT_KERJA_CODE = "TEST-UPD-PROF-UNIT";
const TEST_UPD_PROFILE_USERNAME = "testuser_upd_profile";
const TEST_UPD_PROFILE_EMAIL = "testupdprofile@test.com";
const TEST_UPD_PROFILE_JABATAN = "Analis Risiko";
const TEST_UPD_PROFILE_NOMOR_HP = "081234567891";

const createUpdProfileTestUnitKerja = async () => {
  return prismaClient.unitKerja.upsert({
    where: { code: TEST_UPD_PROFILE_UNIT_KERJA_CODE },
    update: {},
    create: {
      name: "Unit Kerja Update Profile Test",
      code: TEST_UPD_PROFILE_UNIT_KERJA_CODE,
      email: "unitkerja.updprofile@kementerian.go.id",
    },
  });
};

const removeUpdProfileTestUnitKerja = async () => {
  await prismaClient.unitKerja.deleteMany({
    where: { code: TEST_UPD_PROFILE_UNIT_KERJA_CODE },
  });
};

const createUpdProfileTestUser = async (unitKerjaId) => {
  const hashedPassword = await hash(TEST_UPD_PROFILE_PASSWORD);
  const role = await prismaClient.role.findUnique({ where: { name: "USER" } });
  const totpData = generateTotpSecret(TEST_UPD_PROFILE_USERNAME);
  const encryptedSecret = encryptTotpSecret(totpData.base32);

  return prismaClient.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        username: TEST_UPD_PROFILE_USERNAME,
        name: "Test User Update Profile",
        email: TEST_UPD_PROFILE_EMAIL,
        password: hashedPassword,
        isActive: true,
        isVerified: true,
        passwordChangedAt: new Date(),
        totpEnabled: true,
        totpSecret: encryptedSecret,
        totpVerifiedAt: new Date(),
      },
    });
    await tx.userRole.create({ data: { userId: user.id, roleId: role.id } });
    await tx.profile.create({
      data: {
        userId: user.id,
        jabatan: TEST_UPD_PROFILE_JABATAN,
        nomorHP: TEST_UPD_PROFILE_NOMOR_HP,
        unitKerjaId,
      },
    });
    return { user, base32Secret: totpData.base32 };
  });
};

const removeUpdProfileTestUser = async () => {
  await prismaClient.user.deleteMany({
    where: {
      OR: [
        { username: TEST_UPD_PROFILE_USERNAME },
        { email: TEST_UPD_PROFILE_EMAIL },
      ],
    },
  });
};

export {
  prismaClient,
  removeTestUser,
  createTestUnitKerja,
  removeTestUnitKerja,
  ensureRoleUserExists,
  ensureRoleAdminExists,
  createLoginTestUnitKerja,
  removeLoginTestUnitKerja,
  createActiveTestUser,
  removeActiveTestUser,
  TEST_USERNAME,
  TEST_EMAIL,
  TEST_UNIT_KERJA_CODE,
  TEST_LOGIN_USERNAME,
  TEST_LOGIN_EMAIL,
  TEST_LOGIN_PASSWORD,
  TEST_LOGIN_UNIT_KERJA_CODE,
  createForgotTestUnitKerja,
  removeForgotTestUnitKerja,
  createUserWithTotp,
  createUserWithoutTotp,
  removeForgotTestUsers,
  TEST_FORGOT_USERNAME,
  TEST_FORGOT_EMAIL,
  TEST_FORGOT_PASSWORD,
  TEST_NO_TOTP_USERNAME,
  TEST_FORGOT_UNIT_KERJA_CODE,
  createTotpSetupTestUnitKerja,
  removeTotpSetupTestUnitKerja,
  createTotpSetupTestUser,
  removeTotpSetupTestUser,
  TEST_TOTP_SETUP_USERNAME,
  TEST_TOTP_SETUP_EMAIL,
  TEST_TOTP_SETUP_UNIT_KERJA_CODE,
  TEST_SEARCH_PASSWORD,
  TEST_SEARCH_UNIT_KERJA_CODE,
  TEST_SEARCH_ADMIN_USERNAME,
  TEST_SEARCH_ADMIN_EMAIL,
  TEST_SEARCH_USER1_USERNAME,
  TEST_SEARCH_USER1_EMAIL,
  TEST_SEARCH_USER2_USERNAME,
  TEST_SEARCH_USER2_EMAIL,
  createSearchTestUnitKerja,
  removeSearchTestUnitKerja,
  createSearchAdminUser,
  createSearchUser1,
  createSearchUser2,
  removeSearchTestUsers,
  TEST_MGMT_PASSWORD,
  TEST_MGMT_UNIT_KERJA_CODE,
  TEST_MGMT_ADMIN_USERNAME,
  TEST_MGMT_ADMIN_EMAIL,
  TEST_MGMT_TARGET_USERNAME,
  TEST_MGMT_TARGET_EMAIL,
  createMgmtTestUnitKerja,
  removeMgmtTestUnitKerja,
  createMgmtAdminUser,
  createMgmtTargetUser,
  removeMgmtTestUsers,
  TEST_GET_PASSWORD,
  TEST_GET_UNIT_KERJA_CODE,
  TEST_GET_ADMIN_USERNAME,
  TEST_GET_ADMIN_EMAIL,
  TEST_GET_USER1_USERNAME,
  TEST_GET_USER1_EMAIL,
  TEST_GET_TARGET_USERNAME,
  TEST_GET_TARGET_EMAIL,
  createGetTestUnitKerja,
  removeGetTestUnitKerja,
  createGetAdminUser,
  createGetUser1,
  createGetTargetUser,
  removeGetTestUsers,
  TEST_LOGOUT_PASSWORD,
  TEST_LOGOUT_UNIT_KERJA_CODE,
  TEST_LOGOUT_USERNAME,
  TEST_LOGOUT_EMAIL,
  createLogoutTestUnitKerja,
  removeLogoutTestUnitKerja,
  createLogoutTestUser,
  removeLogoutTestUser,
  TEST_CHANGE_PWD_PASSWORD,
  TEST_CHANGE_PWD_NEW_PASSWORD,
  TEST_CHANGE_PWD_UNIT_KERJA_CODE,
  TEST_CHANGE_PWD_USERNAME,
  TEST_CHANGE_PWD_EMAIL,
  createChangePwdTestUnitKerja,
  removeChangePwdTestUnitKerja,
  createChangePwdTestUser,
  removeChangePwdTestUser,
  TEST_REFRESH_PASSWORD,
  TEST_REFRESH_UNIT_KERJA_CODE,
  TEST_REFRESH_USERNAME,
  TEST_REFRESH_EMAIL,
  createRefreshTestUnitKerja,
  removeRefreshTestUnitKerja,
  createRefreshTestUser,
  removeRefreshTestUser,
  TEST_PROFILE_PASSWORD,
  TEST_PROFILE_UNIT_KERJA_CODE,
  TEST_PROFILE_USERNAME,
  TEST_PROFILE_EMAIL,
  TEST_PROFILE_JABATAN,
  TEST_PROFILE_NOMOR_HP,
  createProfileTestUnitKerja,
  removeProfileTestUnitKerja,
  createProfileTestUser,
  removeProfileTestUser,
  TEST_RESET_TOTP_PASSWORD,
  TEST_RESET_TOTP_UNIT_KERJA_CODE,
  TEST_RESET_TOTP_ADMIN_USERNAME,
  TEST_RESET_TOTP_ADMIN_EMAIL,
  TEST_RESET_TOTP_TARGET_USERNAME,
  TEST_RESET_TOTP_TARGET_EMAIL,
  createResetTotpTestUnitKerja,
  removeResetTotpTestUnitKerja,
  createResetTotpAdminUser,
  createResetTotpTargetUser,
  removeResetTotpTestUsers,
  TEST_UPD_ACCOUNT_PASSWORD,
  TEST_UPD_ACCOUNT_UNIT_KERJA_CODE,
  TEST_UPD_ACCOUNT_USERNAME,
  TEST_UPD_ACCOUNT_EMAIL,
  createUpdAccountTestUnitKerja,
  removeUpdAccountTestUnitKerja,
  createUpdAccountTestUser,
  removeUpdAccountTestUser,
  TEST_UPD_PROFILE_PASSWORD,
  TEST_UPD_PROFILE_UNIT_KERJA_CODE,
  TEST_UPD_PROFILE_USERNAME,
  TEST_UPD_PROFILE_EMAIL,
  TEST_UPD_PROFILE_JABATAN,
  TEST_UPD_PROFILE_NOMOR_HP,
  createUpdProfileTestUnitKerja,
  removeUpdProfileTestUnitKerja,
  createUpdProfileTestUser,
  removeUpdProfileTestUser,
};
