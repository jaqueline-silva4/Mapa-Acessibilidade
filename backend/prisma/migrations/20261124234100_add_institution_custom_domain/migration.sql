-- AlterTable
ALTER TABLE `Institution` ADD COLUMN `customDomain` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Institution_customDomain_key` ON `Institution`(`customDomain`);
