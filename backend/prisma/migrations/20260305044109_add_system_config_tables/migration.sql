-- CreateTable
CREATE TABLE `system_configs` (
    `key` VARCHAR(100) NOT NULL,
    `value` VARCHAR(1000) NOT NULL,
    `dataType` ENUM('STRING', 'INTEGER', 'BOOLEAN') NOT NULL DEFAULT 'STRING',
    `group` VARCHAR(50) NOT NULL,
    `label` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `isEditable` BOOLEAN NOT NULL DEFAULT true,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` VARCHAR(191) NULL,

    INDEX `system_configs_group_idx`(`group`),
    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
