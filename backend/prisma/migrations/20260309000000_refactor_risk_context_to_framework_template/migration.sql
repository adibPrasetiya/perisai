-- Step 1: Add frameworkId column (nullable first)
ALTER TABLE `risk_contexts` ADD COLUMN `frameworkId` VARCHAR(191) NULL;

-- Step 2: Backfill frameworkId from programFramework
UPDATE `risk_contexts` rc
JOIN `program_frameworks` pf ON rc.`programFrameworkId` = pf.`id`
SET rc.`frameworkId` = pf.`frameworkId`;

-- Step 3: Make frameworkId NOT NULL
ALTER TABLE `risk_contexts` MODIFY `frameworkId` VARCHAR(191) NOT NULL;

-- Step 4: Create program_framework_contexts table
CREATE TABLE `program_framework_contexts` (
  `id` VARCHAR(191) NOT NULL,
  `programFrameworkId` VARCHAR(191) NOT NULL,
  `riskContextId` VARCHAR(191) NOT NULL,
  `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `addedBy` VARCHAR(191) NULL,
  UNIQUE INDEX `program_framework_contexts_programFrameworkId_riskContextId_key`(`programFrameworkId`, `riskContextId`),
  INDEX `program_framework_contexts_programFrameworkId_idx`(`programFrameworkId`),
  INDEX `program_framework_contexts_riskContextId_idx`(`riskContextId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Step 5: Backfill program_framework_contexts from existing risk_contexts
INSERT INTO `program_framework_contexts` (`id`, `programFrameworkId`, `riskContextId`, `addedAt`)
SELECT UUID(), rc.`programFrameworkId`, rc.`id`, rc.`createdAt`
FROM `risk_contexts` rc
WHERE rc.`programFrameworkId` IS NOT NULL;

-- Step 6: Add FK for frameworkId
ALTER TABLE `risk_contexts` ADD CONSTRAINT `risk_contexts_frameworkId_fkey` FOREIGN KEY (`frameworkId`) REFERENCES `frameworks`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 7: Drop old unique constraint and add new one
ALTER TABLE `risk_contexts` DROP INDEX `risk_contexts_programFrameworkId_code_key`;
ALTER TABLE `risk_contexts` ADD UNIQUE INDEX `risk_contexts_frameworkId_code_key`(`frameworkId`, `code`);

-- Step 8: Drop old FK constraint on programFrameworkId
ALTER TABLE `risk_contexts` DROP FOREIGN KEY `risk_contexts_programFrameworkId_fkey`;
ALTER TABLE `risk_contexts` DROP INDEX `risk_contexts_programFrameworkId_idx`;
ALTER TABLE `risk_contexts` DROP COLUMN `programFrameworkId`;

-- Step 9: Drop unitKerjaId FK and column
ALTER TABLE `risk_contexts` DROP FOREIGN KEY `risk_contexts_unitKerjaId_fkey`;
ALTER TABLE `risk_contexts` DROP INDEX `risk_contexts_unitKerjaId_idx`;
ALTER TABLE `risk_contexts` DROP COLUMN `unitKerjaId`;

-- Step 10: Add FKs for program_framework_contexts
ALTER TABLE `program_framework_contexts` ADD CONSTRAINT `program_framework_contexts_programFrameworkId_fkey` FOREIGN KEY (`programFrameworkId`) REFERENCES `program_frameworks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `program_framework_contexts` ADD CONSTRAINT `program_framework_contexts_riskContextId_fkey` FOREIGN KEY (`riskContextId`) REFERENCES `risk_contexts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
