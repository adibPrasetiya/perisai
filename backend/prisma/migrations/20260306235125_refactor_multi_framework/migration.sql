/*
  Warnings:

  - You are about to drop the column `matrixSize` on the `risk_contexts` table. All the data in the column will be lost.
  - You are about to drop the column `riskProgramId` on the `risk_contexts` table. All the data in the column will be lost.
  - You are about to drop the column `frameworkId` on the `risk_programs` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[programFrameworkId,code]` on the table `risk_contexts` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `programFrameworkId` to the `risk_contexts` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `risk_contexts` DROP FOREIGN KEY `risk_contexts_riskProgramId_fkey`;

-- DropForeignKey
ALTER TABLE `risk_programs` DROP FOREIGN KEY `risk_programs_frameworkId_fkey`;

-- DropIndex
DROP INDEX `risk_contexts_code_key` ON `risk_contexts`;

-- DropIndex
DROP INDEX `risk_contexts_riskProgramId_idx` ON `risk_contexts`;

-- DropIndex
DROP INDEX `risk_programs_frameworkId_idx` ON `risk_programs`;

-- AlterTable
ALTER TABLE `risk_contexts` DROP COLUMN `matrixSize`,
    DROP COLUMN `riskProgramId`,
    ADD COLUMN `matrixCols` INTEGER NULL,
    ADD COLUMN `matrixRows` INTEGER NULL,
    ADD COLUMN `programFrameworkId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `risk_programs` DROP COLUMN `frameworkId`;

-- CreateTable
CREATE TABLE `program_frameworks` (
    `id` VARCHAR(191) NOT NULL,
    `programId` VARCHAR(191) NOT NULL,
    `frameworkId` VARCHAR(191) NOT NULL,
    `matrixRows` INTEGER NOT NULL DEFAULT 5,
    `matrixCols` INTEGER NOT NULL DEFAULT 5,
    `status` ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,

    INDEX `program_frameworks_programId_idx`(`programId`),
    INDEX `program_frameworks_frameworkId_idx`(`frameworkId`),
    INDEX `program_frameworks_status_idx`(`status`),
    UNIQUE INDEX `program_frameworks_programId_frameworkId_key`(`programId`, `frameworkId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `context_assets_contextId_idx` ON `context_assets`(`contextId`);

-- CreateIndex
CREATE INDEX `context_processes_contextId_idx` ON `context_processes`(`contextId`);

-- CreateIndex
CREATE INDEX `frameworks_isActive_idx` ON `frameworks`(`isActive`);

-- CreateIndex
CREATE INDEX `risk_contexts_programFrameworkId_idx` ON `risk_contexts`(`programFrameworkId`);

-- CreateIndex
CREATE INDEX `risk_contexts_contextType_idx` ON `risk_contexts`(`contextType`);

-- CreateIndex
CREATE UNIQUE INDEX `risk_contexts_programFrameworkId_code_key` ON `risk_contexts`(`programFrameworkId`, `code`);

-- CreateIndex
CREATE INDEX `risk_programs_status_idx` ON `risk_programs`(`status`);

-- AddForeignKey
ALTER TABLE `program_frameworks` ADD CONSTRAINT `program_frameworks_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `risk_programs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `program_frameworks` ADD CONSTRAINT `program_frameworks_frameworkId_fkey` FOREIGN KEY (`frameworkId`) REFERENCES `frameworks`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `risk_contexts` ADD CONSTRAINT `risk_contexts_programFrameworkId_fkey` FOREIGN KEY (`programFrameworkId`) REFERENCES `program_frameworks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
