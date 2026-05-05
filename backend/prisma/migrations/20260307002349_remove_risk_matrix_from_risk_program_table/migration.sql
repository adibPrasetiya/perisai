/*
  Warnings:

  - You are about to drop the column `matrixCols` on the `program_frameworks` table. All the data in the column will be lost.
  - You are about to drop the column `matrixRows` on the `program_frameworks` table. All the data in the column will be lost.
  - Made the column `matrixCols` on table `risk_contexts` required. This step will fail if there are existing NULL values in that column.
  - Made the column `matrixRows` on table `risk_contexts` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `program_frameworks` DROP COLUMN `matrixCols`,
    DROP COLUMN `matrixRows`;

-- AlterTable
ALTER TABLE `risk_contexts` MODIFY `matrixCols` INTEGER NOT NULL,
    MODIFY `matrixRows` INTEGER NOT NULL;
