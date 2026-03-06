/*
  Warnings:

  - You are about to drop the `impact_scales` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `likelihood_scales` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `profile_change_requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `risk_assessment_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `risk_categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `risk_matrices` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `risk_mitigations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `risk_worksheets` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `impact_scales` DROP FOREIGN KEY `impact_scales_riskCategoryId_fkey`;

-- DropForeignKey
ALTER TABLE `likelihood_scales` DROP FOREIGN KEY `likelihood_scales_riskCategoryId_fkey`;

-- DropForeignKey
ALTER TABLE `profile_change_requests` DROP FOREIGN KEY `profile_change_requests_profileId_fkey`;

-- DropForeignKey
ALTER TABLE `profile_change_requests` DROP FOREIGN KEY `profile_change_requests_unitKerjaId_fkey`;

-- DropForeignKey
ALTER TABLE `risk_assessment_items` DROP FOREIGN KEY `risk_assessment_items_assetId_fkey`;

-- DropForeignKey
ALTER TABLE `risk_assessment_items` DROP FOREIGN KEY `risk_assessment_items_riskCategoryId_fkey`;

-- DropForeignKey
ALTER TABLE `risk_assessment_items` DROP FOREIGN KEY `risk_assessment_items_worksheetId_fkey`;

-- DropForeignKey
ALTER TABLE `risk_categories` DROP FOREIGN KEY `risk_categories_konteksId_fkey`;

-- DropForeignKey
ALTER TABLE `risk_matrices` DROP FOREIGN KEY `risk_matrices_konteksId_fkey`;

-- DropForeignKey
ALTER TABLE `risk_mitigations` DROP FOREIGN KEY `risk_mitigations_itemId_fkey`;

-- DropForeignKey
ALTER TABLE `risk_mitigations` DROP FOREIGN KEY `risk_mitigations_validatedBy_fkey`;

-- DropForeignKey
ALTER TABLE `risk_worksheets` DROP FOREIGN KEY `risk_worksheets_approvedBy_fkey`;

-- DropForeignKey
ALTER TABLE `risk_worksheets` DROP FOREIGN KEY `risk_worksheets_konteksId_fkey`;

-- DropForeignKey
ALTER TABLE `risk_worksheets` DROP FOREIGN KEY `risk_worksheets_ownerId_fkey`;

-- DropForeignKey
ALTER TABLE `risk_worksheets` DROP FOREIGN KEY `risk_worksheets_submittedBy_fkey`;

-- DropForeignKey
ALTER TABLE `risk_worksheets` DROP FOREIGN KEY `risk_worksheets_unitKerjaId_fkey`;

-- DropTable
DROP TABLE `impact_scales`;

-- DropTable
DROP TABLE `likelihood_scales`;

-- DropTable
DROP TABLE `profile_change_requests`;

-- DropTable
DROP TABLE `risk_assessment_items`;

-- DropTable
DROP TABLE `risk_categories`;

-- DropTable
DROP TABLE `risk_matrices`;

-- DropTable
DROP TABLE `risk_mitigations`;

-- DropTable
DROP TABLE `risk_worksheets`;
