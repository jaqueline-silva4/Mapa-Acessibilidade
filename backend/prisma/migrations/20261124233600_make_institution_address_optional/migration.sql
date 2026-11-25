-- AlterTable
ALTER TABLE `Institution` MODIFY `street` VARCHAR(191) NULL,
    MODIFY `number` VARCHAR(191) NULL,
    MODIFY `neighborhood` VARCHAR(191) NULL,
    MODIFY `city` VARCHAR(191) NULL,
    MODIFY `state` VARCHAR(191) NULL,
    MODIFY `zipCode` VARCHAR(191) NULL,
    MODIFY `latitude` DOUBLE NULL,
    MODIFY `longitude` DOUBLE NULL;
