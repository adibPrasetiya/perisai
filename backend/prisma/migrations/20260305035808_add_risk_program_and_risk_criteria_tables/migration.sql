-- CreateTable
CREATE TABLE `frameworks` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `version` VARCHAR(50) NULL,
    `description` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `frameworks_code_key`(`code`),
    INDEX `frameworks_code_idx`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `risk_programs` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `year` INTEGER NOT NULL,
    `frameworkId` VARCHAR(191) NOT NULL,
    `status` ENUM('DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,

    INDEX `risk_programs_frameworkId_idx`(`frameworkId`),
    INDEX `risk_programs_year_idx`(`year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `risk_contexts` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `riskProgramId` VARCHAR(191) NOT NULL,
    `unitKerjaId` VARCHAR(191) NULL,
    `contextType` ENUM('ASSET', 'PROCESS') NOT NULL,
    `periodStart` INTEGER NOT NULL,
    `periodEnd` INTEGER NOT NULL,
    `matrixSize` INTEGER NOT NULL DEFAULT 5,
    `isSystemDefault` BOOLEAN NOT NULL DEFAULT false,
    `riskAppetiteLevel` VARCHAR(100) NULL,
    `riskAppetiteDescription` TEXT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'INACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,

    UNIQUE INDEX `risk_contexts_code_key`(`code`),
    INDEX `risk_contexts_riskProgramId_idx`(`riskProgramId`),
    INDEX `risk_contexts_unitKerjaId_idx`(`unitKerjaId`),
    INDEX `risk_contexts_status_idx`(`status`),
    INDEX `risk_contexts_periodStart_periodEnd_idx`(`periodStart`, `periodEnd`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `context_assets` (
    `id` VARCHAR(191) NOT NULL,
    `contextId` VARCHAR(191) NOT NULL,
    `assetId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `context_assets_assetId_idx`(`assetId`),
    UNIQUE INDEX `context_assets_contextId_assetId_key`(`contextId`, `assetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `context_processes` (
    `id` VARCHAR(191) NOT NULL,
    `contextId` VARCHAR(191) NOT NULL,
    `processId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `context_processes_processId_idx`(`processId`),
    UNIQUE INDEX `context_processes_contextId_processId_key`(`contextId`, `processId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `risk_programs` ADD CONSTRAINT `risk_programs_frameworkId_fkey` FOREIGN KEY (`frameworkId`) REFERENCES `frameworks`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `risk_contexts` ADD CONSTRAINT `risk_contexts_riskProgramId_fkey` FOREIGN KEY (`riskProgramId`) REFERENCES `risk_programs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `risk_contexts` ADD CONSTRAINT `risk_contexts_unitKerjaId_fkey` FOREIGN KEY (`unitKerjaId`) REFERENCES `unit_kerja`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `context_assets` ADD CONSTRAINT `context_assets_contextId_fkey` FOREIGN KEY (`contextId`) REFERENCES `risk_contexts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `context_assets` ADD CONSTRAINT `context_assets_assetId_fkey` FOREIGN KEY (`assetId`) REFERENCES `assets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `context_processes` ADD CONSTRAINT `context_processes_contextId_fkey` FOREIGN KEY (`contextId`) REFERENCES `risk_contexts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `context_processes` ADD CONSTRAINT `context_processes_processId_fkey` FOREIGN KEY (`processId`) REFERENCES `business_processes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
