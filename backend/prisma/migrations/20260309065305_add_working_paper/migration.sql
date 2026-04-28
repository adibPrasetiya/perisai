-- CreateTable
CREATE TABLE `working_papers` (
    `id` VARCHAR(191) NOT NULL,
    `programId` VARCHAR(191) NOT NULL,
    `unitKerjaId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `status` ENUM('DRAFT', 'SUBMITTED', 'REVISION', 'APPROVED', 'LOCKED') NOT NULL DEFAULT 'DRAFT',
    `submittedAt` DATETIME(3) NULL,
    `submittedBy` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `reviewedBy` VARCHAR(191) NULL,
    `reviewNote` TEXT NULL,
    `approvedAt` DATETIME(3) NULL,
    `approvedBy` VARCHAR(191) NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `working_papers_programId_idx`(`programId`),
    INDEX `working_papers_unitKerjaId_idx`(`unitKerjaId`),
    INDEX `working_papers_status_idx`(`status`),
    UNIQUE INDEX `working_papers_programId_unitKerjaId_key`(`programId`, `unitKerjaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `risk_entries` (
    `id` VARCHAR(191) NOT NULL,
    `workingPaperId` VARCHAR(191) NOT NULL,
    `programFrameworkContextId` VARCHAR(191) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(500) NOT NULL,
    `description` TEXT NULL,
    `riskCategoryId` VARCHAR(191) NULL,
    `cause` TEXT NULL,
    `impactDescription` TEXT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `risk_entries_workingPaperId_idx`(`workingPaperId`),
    INDEX `risk_entries_programFrameworkContextId_idx`(`programFrameworkContextId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `risk_assessments` (
    `id` VARCHAR(191) NOT NULL,
    `inherentEntryId` VARCHAR(191) NULL,
    `residualEntryId` VARCHAR(191) NULL,
    `type` ENUM('INHERENT', 'RESIDUAL') NOT NULL,
    `finalScore` INTEGER NULL,
    `riskLevelId` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `assessedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `assessedBy` VARCHAR(191) NULL,

    UNIQUE INDEX `risk_assessments_inherentEntryId_key`(`inherentEntryId`),
    UNIQUE INDEX `risk_assessments_residualEntryId_key`(`residualEntryId`),
    INDEX `risk_assessments_riskLevelId_idx`(`riskLevelId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `area_scores` (
    `id` VARCHAR(191) NOT NULL,
    `assessmentId` VARCHAR(191) NOT NULL,
    `impactAreaId` VARCHAR(191) NOT NULL,
    `likelihoodLevel` INTEGER NOT NULL,
    `impactLevel` INTEGER NOT NULL,
    `matrixCellId` VARCHAR(191) NULL,
    `score` INTEGER NOT NULL,

    INDEX `area_scores_assessmentId_idx`(`assessmentId`),
    UNIQUE INDEX `area_scores_assessmentId_impactAreaId_key`(`assessmentId`, `impactAreaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `risk_controls` (
    `id` VARCHAR(191) NOT NULL,
    `riskEntryId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(500) NOT NULL,
    `description` TEXT NULL,
    `effectiveness` ENUM('ADEQUATE', 'PARTIAL', 'INADEQUATE') NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `risk_controls_riskEntryId_idx`(`riskEntryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `risk_treatment_plans` (
    `id` VARCHAR(191) NOT NULL,
    `riskEntryId` VARCHAR(191) NOT NULL,
    `treatmentOptionId` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `targetDate` DATETIME(3) NULL,
    `picUserId` VARCHAR(191) NULL,
    `status` ENUM('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PLANNED',
    `completedAt` DATETIME(3) NULL,
    `progressNote` TEXT NULL,
    `evidenceUrl` VARCHAR(1000) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `risk_treatment_plans_riskEntryId_idx`(`riskEntryId`),
    INDEX `risk_treatment_plans_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `treatment_monitoring` (
    `id` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `period` VARCHAR(50) NOT NULL,
    `progress` INTEGER NOT NULL,
    `note` TEXT NULL,
    `evidenceUrl` VARCHAR(1000) NULL,
    `reportedBy` VARCHAR(191) NULL,
    `reportedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `treatment_monitoring_planId_idx`(`planId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `working_papers` ADD CONSTRAINT `working_papers_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `risk_programs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `working_papers` ADD CONSTRAINT `working_papers_unitKerjaId_fkey` FOREIGN KEY (`unitKerjaId`) REFERENCES `unit_kerja`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `risk_entries` ADD CONSTRAINT `risk_entries_workingPaperId_fkey` FOREIGN KEY (`workingPaperId`) REFERENCES `working_papers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `risk_entries` ADD CONSTRAINT `risk_entries_programFrameworkContextId_fkey` FOREIGN KEY (`programFrameworkContextId`) REFERENCES `program_framework_contexts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `risk_entries` ADD CONSTRAINT `risk_entries_riskCategoryId_fkey` FOREIGN KEY (`riskCategoryId`) REFERENCES `risk_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `risk_assessments` ADD CONSTRAINT `risk_assessments_inherentEntryId_fkey` FOREIGN KEY (`inherentEntryId`) REFERENCES `risk_entries`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `risk_assessments` ADD CONSTRAINT `risk_assessments_residualEntryId_fkey` FOREIGN KEY (`residualEntryId`) REFERENCES `risk_entries`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `risk_assessments` ADD CONSTRAINT `risk_assessments_riskLevelId_fkey` FOREIGN KEY (`riskLevelId`) REFERENCES `risk_levels`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `area_scores` ADD CONSTRAINT `area_scores_assessmentId_fkey` FOREIGN KEY (`assessmentId`) REFERENCES `risk_assessments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `area_scores` ADD CONSTRAINT `area_scores_impactAreaId_fkey` FOREIGN KEY (`impactAreaId`) REFERENCES `impact_areas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `area_scores` ADD CONSTRAINT `area_scores_matrixCellId_fkey` FOREIGN KEY (`matrixCellId`) REFERENCES `matrix_cells`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `risk_controls` ADD CONSTRAINT `risk_controls_riskEntryId_fkey` FOREIGN KEY (`riskEntryId`) REFERENCES `risk_entries`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `risk_treatment_plans` ADD CONSTRAINT `risk_treatment_plans_riskEntryId_fkey` FOREIGN KEY (`riskEntryId`) REFERENCES `risk_entries`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `risk_treatment_plans` ADD CONSTRAINT `risk_treatment_plans_treatmentOptionId_fkey` FOREIGN KEY (`treatmentOptionId`) REFERENCES `treatment_options`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `treatment_monitoring` ADD CONSTRAINT `treatment_monitoring_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `risk_treatment_plans`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
