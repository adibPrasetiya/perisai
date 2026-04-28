-- AlterTable
ALTER TABLE `risk_entries` ADD COLUMN `assetId` VARCHAR(191) NULL,
    ADD COLUMN `businessProcessId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `risk_entries_assetId_idx` ON `risk_entries`(`assetId`);

-- CreateIndex
CREATE INDEX `risk_entries_businessProcessId_idx` ON `risk_entries`(`businessProcessId`);

-- AddForeignKey
ALTER TABLE `risk_entries` ADD CONSTRAINT `risk_entries_assetId_fkey` FOREIGN KEY (`assetId`) REFERENCES `assets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `risk_entries` ADD CONSTRAINT `risk_entries_businessProcessId_fkey` FOREIGN KEY (`businessProcessId`) REFERENCES `business_processes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
