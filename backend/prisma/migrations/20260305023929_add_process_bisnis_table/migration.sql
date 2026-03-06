-- CreateTable
CREATE TABLE `business_processes` (
    `id` VARCHAR(191) NOT NULL,
    `unitKerjaId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `owner` VARCHAR(255) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,

    INDEX `business_processes_unitKerjaId_idx`(`unitKerjaId`),
    INDEX `business_processes_status_idx`(`status`),
    UNIQUE INDEX `business_processes_unitKerjaId_code_key`(`unitKerjaId`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `business_processes` ADD CONSTRAINT `business_processes_unitKerjaId_fkey` FOREIGN KEY (`unitKerjaId`) REFERENCES `unit_kerja`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
