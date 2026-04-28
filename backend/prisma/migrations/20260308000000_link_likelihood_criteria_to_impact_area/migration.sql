-- Link LikelihoodCriteria to ImpactArea
-- Setiap area dampak kini memiliki kriteria kemungkinannya sendiri

-- Hapus data lama jika ada (tabel kosong di dev, FK baru NOT NULL tidak bisa ada baris tanpa impactAreaId)
-- DELETE FROM `likelihood_criteria`;

-- Tambah kolom impactAreaId (NOT NULL, tabel harus kosong)
ALTER TABLE `likelihood_criteria` ADD COLUMN `impactAreaId` VARCHAR(191) NOT NULL;

-- Tambah index untuk impactAreaId
CREATE INDEX `likelihood_criteria_impactAreaId_idx` ON `likelihood_criteria`(`impactAreaId`);

-- Hapus unique constraint lama (contextId, level)
DROP INDEX `likelihood_criteria_contextId_level_key` ON `likelihood_criteria`;

-- Tambah unique constraint baru (impactAreaId, level)
ALTER TABLE `likelihood_criteria` ADD UNIQUE INDEX `likelihood_criteria_impactAreaId_level_key`(`impactAreaId`, `level`);

-- Tambah FK constraint ke impact_areas
ALTER TABLE `likelihood_criteria` ADD CONSTRAINT `likelihood_criteria_impactAreaId_fkey` FOREIGN KEY (`impactAreaId`) REFERENCES `impact_areas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
