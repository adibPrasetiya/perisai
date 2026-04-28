-- CreateTable
CREATE TABLE `risk_categories` (
    `id` VARCHAR(191) NOT NULL,
    `contextId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `color` VARCHAR(7) NULL,
    `code` VARCHAR(50) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `risk_categories_contextId_idx`(`contextId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `impact_areas` (
    `id` VARCHAR(191) NOT NULL,
    `contextId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `impact_areas_contextId_idx`(`contextId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `impact_criteria` (
    `id` VARCHAR(191) NOT NULL,
    `impactAreaId` VARCHAR(191) NOT NULL,
    `level` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `score` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `impact_criteria_impactAreaId_idx`(`impactAreaId`),
    UNIQUE INDEX `impact_criteria_impactAreaId_level_key`(`impactAreaId`, `level`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `likelihood_criteria` (
    `id` VARCHAR(191) NOT NULL,
    `contextId` VARCHAR(191) NOT NULL,
    `level` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `score` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `likelihood_criteria_contextId_idx`(`contextId`),
    UNIQUE INDEX `likelihood_criteria_contextId_level_key`(`contextId`, `level`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `treatment_options` (
    `id` VARCHAR(191) NOT NULL,
    `contextId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `treatment_options_contextId_idx`(`contextId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `risk_levels` (
    `id` VARCHAR(191) NOT NULL,
    `contextId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `minScore` INTEGER NOT NULL,
    `maxScore` INTEGER NOT NULL,
    `color` VARCHAR(7) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `risk_levels_contextId_idx`(`contextId`),
    UNIQUE INDEX `risk_levels_contextId_order_key`(`contextId`, `order`),
    UNIQUE INDEX `risk_levels_contextId_name_key`(`contextId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `matrix_cells` (
    `id` VARCHAR(191) NOT NULL,
    `contextId` VARCHAR(191) NOT NULL,
    `row` INTEGER NOT NULL,
    `col` INTEGER NOT NULL,
    `value` INTEGER NOT NULL,
    `label` VARCHAR(100) NULL,
    `color` VARCHAR(7) NULL,

    INDEX `matrix_cells_contextId_idx`(`contextId`),
    UNIQUE INDEX `matrix_cells_contextId_row_col_key`(`contextId`, `row`, `col`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `risk_categories` ADD CONSTRAINT `risk_categories_contextId_fkey` FOREIGN KEY (`contextId`) REFERENCES `risk_contexts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `impact_areas` ADD CONSTRAINT `impact_areas_contextId_fkey` FOREIGN KEY (`contextId`) REFERENCES `risk_contexts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `impact_criteria` ADD CONSTRAINT `impact_criteria_impactAreaId_fkey` FOREIGN KEY (`impactAreaId`) REFERENCES `impact_areas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `likelihood_criteria` ADD CONSTRAINT `likelihood_criteria_contextId_fkey` FOREIGN KEY (`contextId`) REFERENCES `risk_contexts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `treatment_options` ADD CONSTRAINT `treatment_options_contextId_fkey` FOREIGN KEY (`contextId`) REFERENCES `risk_contexts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `risk_levels` ADD CONSTRAINT `risk_levels_contextId_fkey` FOREIGN KEY (`contextId`) REFERENCES `risk_contexts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matrix_cells` ADD CONSTRAINT `matrix_cells_contextId_fkey` FOREIGN KEY (`contextId`) REFERENCES `risk_contexts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
