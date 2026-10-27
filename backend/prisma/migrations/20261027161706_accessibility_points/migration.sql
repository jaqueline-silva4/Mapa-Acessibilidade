-- CreateTable
CREATE TABLE `AccessibilityCategory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `icon` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `AccessibilityCategory_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AccessibilityPoint` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `institutionId` INTEGER NOT NULL,
    `categoryId` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT false,
    `reportCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AccessibilityPoint_institutionId_active_categoryId_idx`(`institutionId`, `active`, `categoryId`),
    INDEX `AccessibilityPoint_categoryId_idx`(`categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AccessibilityImage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pointId` INTEGER NOT NULL,
    `imageUrl` VARCHAR(191) NOT NULL,
    `altText` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AccessibilityImage_pointId_idx`(`pointId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AccessibilityPoint` ADD CONSTRAINT `AccessibilityPoint_institutionId_fkey` FOREIGN KEY (`institutionId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AccessibilityPoint` ADD CONSTRAINT `AccessibilityPoint_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `AccessibilityCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AccessibilityImage` ADD CONSTRAINT `AccessibilityImage_pointId_fkey` FOREIGN KEY (`pointId`) REFERENCES `AccessibilityPoint`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
