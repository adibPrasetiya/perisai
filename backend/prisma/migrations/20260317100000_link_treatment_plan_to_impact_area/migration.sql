-- AlterTable: add impactAreaId to risk_treatment_plans
ALTER TABLE `risk_treatment_plans` ADD COLUMN `impactAreaId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `risk_treatment_plans_impactAreaId_idx` ON `risk_treatment_plans`(`impactAreaId`);

-- AddForeignKey
ALTER TABLE `risk_treatment_plans` ADD CONSTRAINT `risk_treatment_plans_impactAreaId_fkey` FOREIGN KEY (`impactAreaId`) REFERENCES `impact_areas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
