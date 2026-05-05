-- CreateTable
CREATE TABLE `activity_logs` (
    `id` VARCHAR(191) NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `actionType` ENUM('CREATE', 'UPDATE', 'DELETE', 'AUTH') NOT NULL,
    `level` VARCHAR(20) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `username` VARCHAR(255) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `activity_logs_action_idx`(`action`),
    INDEX `activity_logs_actionType_idx`(`actionType`),
    INDEX `activity_logs_userId_idx`(`userId`),
    INDEX `activity_logs_level_idx`(`level`),
    INDEX `activity_logs_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
