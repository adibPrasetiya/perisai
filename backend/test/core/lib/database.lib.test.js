// Mock harus dideklarasikan sebelum import agar Jest bisa hoist-nya
jest.mock("../../../src/generated/prisma/index.js", () => {
  const mockInstance = {
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  };

  const MockPrismaClient = jest.fn(() => mockInstance);

  return { PrismaClient: MockPrismaClient };
});

jest.mock("../../../src/core/config/database.config.js", () => ({
  adapter: { name: "mock-adapter" },
}));

describe("database.lib.js", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe("Instansiasi PrismaClient", () => {
    it("harus memanggil PrismaClient constructor tepat satu kali", () => {
      const { PrismaClient } = require("../../../src/generated/prisma/index.js");

      require("../../../src/core/lib/database.lib.js");

      expect(PrismaClient).toHaveBeenCalledTimes(1);
    });

    it("harus memanggil PrismaClient constructor dengan adapter dari database.config", () => {
      const { PrismaClient } = require("../../../src/generated/prisma/index.js");
      const { adapter } = require("../../../src/core/config/database.config.js");

      require("../../../src/core/lib/database.lib.js");

      expect(PrismaClient).toHaveBeenCalledWith({ adapter });
    });

    it("tidak boleh membuat instance baru saat modul diimport berulang kali (singleton)", () => {
      const { PrismaClient } = require("../../../src/generated/prisma/index.js");

      require("../../../src/core/lib/database.lib.js");
      require("../../../src/core/lib/database.lib.js");
      require("../../../src/core/lib/database.lib.js");

      // Modul di-cache oleh Node.js — constructor hanya dipanggil sekali
      expect(PrismaClient).toHaveBeenCalledTimes(1);
    });
  });

  describe("Export prismaClient", () => {
    it("harus mengekspor prismaClient sebagai named export", () => {
      const mod = require("../../../src/core/lib/database.lib.js");

      expect(mod.prismaClient).toBeDefined();
    });

    it("prismaClient yang diekspor harus merupakan instance yang dibuat oleh constructor", () => {
      const { PrismaClient } = require("../../../src/generated/prisma/index.js");
      const { prismaClient } = require("../../../src/core/lib/database.lib.js");

      const mockInstance = PrismaClient.mock.results[0].value;
      expect(prismaClient).toBe(mockInstance);
    });

    it("harus mengembalikan referensi instance yang sama pada setiap import", () => {
      const { prismaClient: instance1 } = require("../../../src/core/lib/database.lib.js");
      const { prismaClient: instance2 } = require("../../../src/core/lib/database.lib.js");

      expect(instance1).toBe(instance2);
    });
  });

  describe("Method standar Prisma Client", () => {
    it("instance harus memiliki method $connect", () => {
      const { prismaClient } = require("../../../src/core/lib/database.lib.js");

      expect(typeof prismaClient.$connect).toBe("function");
    });

    it("instance harus memiliki method $disconnect", () => {
      const { prismaClient } = require("../../../src/core/lib/database.lib.js");

      expect(typeof prismaClient.$disconnect).toBe("function");
    });

    it("instance harus memiliki method $transaction", () => {
      const { prismaClient } = require("../../../src/core/lib/database.lib.js");

      expect(typeof prismaClient.$transaction).toBe("function");
    });

    it("instance harus memiliki method $queryRaw", () => {
      const { prismaClient } = require("../../../src/core/lib/database.lib.js");

      expect(typeof prismaClient.$queryRaw).toBe("function");
    });

    it("$connect harus mengembalikan Promise", () => {
      const { prismaClient } = require("../../../src/core/lib/database.lib.js");

      const result = prismaClient.$connect();

      expect(result).toBeInstanceOf(Promise);
    });

    it("$disconnect harus mengembalikan Promise", () => {
      const { prismaClient } = require("../../../src/core/lib/database.lib.js");

      const result = prismaClient.$disconnect();

      expect(result).toBeInstanceOf(Promise);
    });
  });
});
