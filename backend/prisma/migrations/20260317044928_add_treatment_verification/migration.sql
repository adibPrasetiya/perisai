/*
  Warnings:

  - You are about to drop the column `cause` on the `risk_entries` table. All the data in the column will be lost.
  - You are about to drop the column `impactDescription` on the `risk_entries` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `area_scores` ADD COLUMN `impactDescription` TEXT NULL,
    ADD COLUMN `likelihoodDescription` TEXT NULL;

-- AlterTable
ALTER TABLE `risk_entries` DROP COLUMN `cause`,
    DROP COLUMN `impactDescription`;

-- AlterTable
ALTER TABLE `risk_treatment_plans` ADD COLUMN `needsKomiteReview` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `status` ENUM('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'SUBMITTED_FOR_REVIEW', 'VERIFIED') NOT NULL DEFAULT 'PLANNED';
