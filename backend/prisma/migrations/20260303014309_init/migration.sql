-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `passwordChangedAt` DATETIME(3) NULL,
    `mustChangePassword` BOOLEAN NOT NULL DEFAULT false,
    `totpSecret` VARCHAR(500) NULL,
    `totpEnabled` BOOLEAN NOT NULL DEFAULT false,
    `totpVerifiedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_email_idx`(`email`),
    INDEX `users_username_idx`(`username`),
    INDEX `users_isActive_isVerified_idx`(`isActive`, `isVerified`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` VARCHAR(191) NOT NULL,
    `name` ENUM('USER', 'ADMINISTRATOR', 'KOMITE_PUSAT', 'PENGELOLA_RISIKO_UKER') NOT NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `roles_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_roles` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `roleId` VARCHAR(191) NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_roles_userId_idx`(`userId`),
    INDEX `user_roles_roleId_idx`(`roleId`),
    UNIQUE INDEX `user_roles_userId_roleId_key`(`userId`, `roleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `refreshToken` VARCHAR(500) NOT NULL,
    `deviceId` VARCHAR(255) NOT NULL,
    `deviceName` VARCHAR(255) NULL,
    `userAgent` TEXT NULL,
    `ipAddress` VARCHAR(45) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sessions_userId_key`(`userId`),
    UNIQUE INDEX `sessions_refreshToken_key`(`refreshToken`),
    INDEX `sessions_refreshToken_idx`(`refreshToken`),
    INDEX `sessions_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `unit_kerja` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `unit_kerja_code_key`(`code`),
    INDEX `unit_kerja_code_idx`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `profiles` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `jabatan` VARCHAR(255) NOT NULL,
    `unitKerjaId` VARCHAR(191) NOT NULL,
    `nomorHP` VARCHAR(20) NULL,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `verifiedAt` DATETIME(3) NULL,
    `verifiedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `profiles_userId_key`(`userId`),
    INDEX `profiles_userId_idx`(`userId`),
    INDEX `profiles_unitKerjaId_idx`(`unitKerjaId`),
    INDEX `profiles_isVerified_idx`(`isVerified`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `profile_change_requests` (
    `id` VARCHAR(191) NOT NULL,
    `profileId` VARCHAR(191) NOT NULL,
    `requestType` ENUM('INITIAL_VERIFICATION', 'CHANGE') NOT NULL DEFAULT 'CHANGE',
    `jabatan` VARCHAR(255) NULL,
    `unitKerjaId` VARCHAR(191) NULL,
    `nomorHP` VARCHAR(20) NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `rejectionReason` TEXT NULL,
    `requestedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processedAt` DATETIME(3) NULL,
    `processedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `profile_change_requests_profileId_idx`(`profileId`),
    INDEX `profile_change_requests_status_idx`(`status`),
    INDEX `profile_change_requests_requestType_idx`(`requestType`),
    INDEX `profile_change_requests_requestedAt_idx`(`requestedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `konteks` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
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

    UNIQUE INDEX `konteks_code_key`(`code`),
    INDEX `konteks_code_idx`(`code`),
    INDEX `konteks_status_idx`(`status`),
    INDEX `konteks_periodStart_periodEnd_idx`(`periodStart`, `periodEnd`),
    INDEX `konteks_isSystemDefault_idx`(`isSystemDefault`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `risk_categories` (
    `id` VARCHAR(191) NOT NULL,
    `konteksId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `risk_categories_konteksId_idx`(`konteksId`),
    UNIQUE INDEX `risk_categories_konteksId_order_key`(`konteksId`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `likelihood_scales` (
    `id` VARCHAR(191) NOT NULL,
    `riskCategoryId` VARCHAR(191) NOT NULL,
    `level` INTEGER NOT NULL,
    `label` VARCHAR(100) NOT NULL,
    `description` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `likelihood_scales_riskCategoryId_idx`(`riskCategoryId`),
    UNIQUE INDEX `likelihood_scales_riskCategoryId_level_key`(`riskCategoryId`, `level`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `impact_scales` (
    `id` VARCHAR(191) NOT NULL,
    `riskCategoryId` VARCHAR(191) NOT NULL,
    `level` INTEGER NOT NULL,
    `label` VARCHAR(100) NOT NULL,
    `description` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `impact_scales_riskCategoryId_idx`(`riskCategoryId`),
    UNIQUE INDEX `impact_scales_riskCategoryId_level_key`(`riskCategoryId`, `level`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `risk_matrices` (
    `id` VARCHAR(191) NOT NULL,
    `konteksId` VARCHAR(191) NOT NULL,
    `likelihoodLevel` INTEGER NOT NULL,
    `impactLevel` INTEGER NOT NULL,
    `riskLevel` VARCHAR(50) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `risk_matrices_konteksId_idx`(`konteksId`),
    INDEX `risk_matrices_konteksId_riskLevel_idx`(`konteksId`, `riskLevel`),
    UNIQUE INDEX `risk_matrices_konteksId_likelihoodLevel_impactLevel_key`(`konteksId`, `likelihoodLevel`, `impactLevel`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `asset_categories` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `asset_categories_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assets` (
    `id` VARCHAR(191) NOT NULL,
    `unitKerjaId` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `owner` VARCHAR(255) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,

    INDEX `assets_unitKerjaId_idx`(`unitKerjaId`),
    INDEX `assets_categoryId_idx`(`categoryId`),
    INDEX `assets_status_idx`(`status`),
    UNIQUE INDEX `assets_unitKerjaId_code_key`(`unitKerjaId`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `risk_worksheets` (
    `id` VARCHAR(191) NOT NULL,
    `unitKerjaId` VARCHAR(191) NOT NULL,
    `konteksId` VARCHAR(191) NOT NULL,
    `ownerId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `submittedAt` DATETIME(3) NULL,
    `submittedBy` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `approvedBy` VARCHAR(191) NULL,
    `approvalNotes` TEXT NULL,

    INDEX `risk_worksheets_unitKerjaId_idx`(`unitKerjaId`),
    INDEX `risk_worksheets_konteksId_idx`(`konteksId`),
    INDEX `risk_worksheets_ownerId_idx`(`ownerId`),
    INDEX `risk_worksheets_submittedBy_idx`(`submittedBy`),
    INDEX `risk_worksheets_approvedBy_idx`(`approvedBy`),
    INDEX `risk_worksheets_status_idx`(`status`),
    UNIQUE INDEX `risk_worksheets_unitKerjaId_konteksId_name_key`(`unitKerjaId`, `konteksId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `risk_assessment_items` (
    `id` VARCHAR(191) NOT NULL,
    `worksheetId` VARCHAR(191) NOT NULL,
    `riskCode` VARCHAR(50) NOT NULL,
    `riskName` VARCHAR(255) NOT NULL,
    `assetId` VARCHAR(191) NOT NULL,
    `riskCategoryId` VARCHAR(191) NOT NULL,
    `weaknessDescription` TEXT NULL,
    `treatDescription` TEXT NULL,
    `impactDescription` TEXT NULL,
    `inherentLikelihood` INTEGER NOT NULL,
    `inherentImpact` INTEGER NOT NULL,
    `inherentLikelihoodDescription` TEXT NULL,
    `inherentImpactDescription` TEXT NULL,
    `inherentRiskLevel` VARCHAR(50) NOT NULL,
    `existingControls` TEXT NULL,
    `controlEffectiveness` VARCHAR(50) NULL,
    `residualLikelihood` INTEGER NULL,
    `residualImpact` INTEGER NULL,
    `residualLikelihoodDescription` TEXT NULL,
    `residualImpactDescription` TEXT NULL,
    `residualRiskLevel` VARCHAR(50) NULL,
    `additionalControl` VARCHAR(255) NULL,
    `treatmentOption` VARCHAR(50) NULL,
    `treatmentRationale` TEXT NULL,
    `riskPriorityRank` INTEGER NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `metadata` JSON NULL,

    INDEX `risk_assessment_items_worksheetId_idx`(`worksheetId`),
    INDEX `risk_assessment_items_riskCategoryId_idx`(`riskCategoryId`),
    INDEX `risk_assessment_items_assetId_idx`(`assetId`),
    INDEX `risk_assessment_items_inherentRiskLevel_idx`(`inherentRiskLevel`),
    INDEX `risk_assessment_items_residualRiskLevel_idx`(`residualRiskLevel`),
    UNIQUE INDEX `risk_assessment_items_worksheetId_riskCode_key`(`worksheetId`, `riskCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `risk_mitigations` (
    `id` VARCHAR(191) NOT NULL,
    `itemId` VARCHAR(191) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
    `plannedStartDate` DATETIME(3) NULL,
    `plannedEndDate` DATETIME(3) NULL,
    `actualStartDate` DATETIME(3) NULL,
    `actualEndDate` DATETIME(3) NULL,
    `responsiblePerson` VARCHAR(255) NULL,
    `responsibleUnit` VARCHAR(255) NULL,
    `status` ENUM('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PLANNED',
    `progressPercentage` INTEGER NOT NULL DEFAULT 0,
    `progressNotes` TEXT NULL,
    `proposedResidualLikelihood` INTEGER NOT NULL,
    `proposedResidualImpact` INTEGER NOT NULL,
    `proposedResidualLikelihoodDescription` TEXT NULL,
    `proposedResidualImpactDescription` TEXT NULL,
    `proposedResidualRiskLevel` VARCHAR(50) NOT NULL,
    `validationStatus` ENUM('PENDING', 'VALIDATED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `validatedAt` DATETIME(3) NULL,
    `validatedBy` VARCHAR(191) NULL,
    `validationNotes` TEXT NULL,
    `isValidated` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `updatedBy` VARCHAR(191) NULL,
    `metadata` JSON NULL,

    INDEX `risk_mitigations_itemId_idx`(`itemId`),
    INDEX `risk_mitigations_status_idx`(`status`),
    INDEX `risk_mitigations_priority_idx`(`priority`),
    INDEX `risk_mitigations_isValidated_idx`(`isValidated`),
    INDEX `risk_mitigations_validationStatus_idx`(`validationStatus`),
    INDEX `risk_mitigations_validatedBy_idx`(`validatedBy`),
    UNIQUE INDEX `risk_mitigations_itemId_code_key`(`itemId`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_unitKerjaId_fkey` FOREIGN KEY (`unitKerjaId`) REFERENCES `unit_kerja`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profile_change_requests` ADD CONSTRAINT `profile_change_requests_profileId_fkey` FOREIGN KEY (`profileId`) REFERENCES `profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profile_change_requests` ADD CONSTRAINT `profile_change_requests_unitKerjaId_fkey` FOREIGN KEY (`unitKerjaId`) REFERENCES `unit_kerja`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `risk_categories` ADD CONSTRAINT `risk_categories_konteksId_fkey` FOREIGN KEY (`konteksId`) REFERENCES `konteks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `likelihood_scales` ADD CONSTRAINT `likelihood_scales_riskCategoryId_fkey` FOREIGN KEY (`riskCategoryId`) REFERENCES `risk_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `impact_scales` ADD CONSTRAINT `impact_scales_riskCategoryId_fkey` FOREIGN KEY (`riskCategoryId`) REFERENCES `risk_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `risk_matrices` ADD CONSTRAINT `risk_matrices_konteksId_fkey` FOREIGN KEY (`konteksId`) REFERENCES `konteks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assets` ADD CONSTRAINT `assets_unitKerjaId_fkey` FOREIGN KEY (`unitKerjaId`) REFERENCES `unit_kerja`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assets` ADD CONSTRAINT `assets_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `asset_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `risk_worksheets` ADD CONSTRAINT `risk_worksheets_unitKerjaId_fkey` FOREIGN KEY (`unitKerjaId`) REFERENCES `unit_kerja`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `risk_worksheets` ADD CONSTRAINT `risk_worksheets_konteksId_fkey` FOREIGN KEY (`konteksId`) REFERENCES `konteks`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `risk_worksheets` ADD CONSTRAINT `risk_worksheets_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `risk_worksheets` ADD CONSTRAINT `risk_worksheets_submittedBy_fkey` FOREIGN KEY (`submittedBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `risk_worksheets` ADD CONSTRAINT `risk_worksheets_approvedBy_fkey` FOREIGN KEY (`approvedBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `risk_assessment_items` ADD CONSTRAINT `risk_assessment_items_worksheetId_fkey` FOREIGN KEY (`worksheetId`) REFERENCES `risk_worksheets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `risk_assessment_items` ADD CONSTRAINT `risk_assessment_items_assetId_fkey` FOREIGN KEY (`assetId`) REFERENCES `assets`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `risk_assessment_items` ADD CONSTRAINT `risk_assessment_items_riskCategoryId_fkey` FOREIGN KEY (`riskCategoryId`) REFERENCES `risk_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `risk_mitigations` ADD CONSTRAINT `risk_mitigations_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `risk_assessment_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `risk_mitigations` ADD CONSTRAINT `risk_mitigations_validatedBy_fkey` FOREIGN KEY (`validatedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
