-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `connected_accounts` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `provider` ENUM('google', 'microsoft') NOT NULL,
    `providerAccountId` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NULL,
    `accessToken` TEXT NOT NULL,
    `refreshToken` TEXT NULL,
    `tokenExpiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `connected_accounts_userId_provider_providerAccountId_key`(`userId`, `provider`, `providerAccountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `calendars` (
    `id` VARCHAR(191) NOT NULL,
    `connectedAccountId` VARCHAR(191) NOT NULL,
    `externalCalendarId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `timezone` VARCHAR(191) NULL,
    `defaultColor` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `calendars_connectedAccountId_externalCalendarId_key`(`connectedAccountId`, `externalCalendarId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `events` (
    `id` VARCHAR(191) NOT NULL,
    `calendarId` VARCHAR(191) NOT NULL,
    `externalId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `location` VARCHAR(191) NULL,
    `startTime` DATETIME(3) NOT NULL,
    `endTime` DATETIME(3) NOT NULL,
    `allDay` BOOLEAN NOT NULL DEFAULT false,
    `status` VARCHAR(191) NULL,
    `recurrence` TEXT NULL,
    `htmlLink` TEXT NULL,
    `syncedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `events_calendarId_externalId_key`(`calendarId`, `externalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `calendar_boards` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `maskEvents` BOOLEAN NOT NULL DEFAULT false,
    `maskLabel` VARCHAR(191) NULL DEFAULT 'Busy',
    `showPastEvents` BOOLEAN NOT NULL DEFAULT true,
    `pastDaysLimit` INTEGER NULL,
    `futureDaysLimit` INTEGER NULL,
    `onlyCurrentWeek` BOOLEAN NOT NULL DEFAULT false,
    `twoWeeksAhead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `board_calendars` (
    `id` VARCHAR(191) NOT NULL,
    `boardId` VARCHAR(191) NOT NULL,
    `calendarId` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `board_calendars_boardId_calendarId_key`(`boardId`, `calendarId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shared_links` (
    `id` VARCHAR(191) NOT NULL,
    `boardId` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `viewCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `shared_links_boardId_key`(`boardId`),
    UNIQUE INDEX `shared_links_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `connected_accounts` ADD CONSTRAINT `connected_accounts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `calendars` ADD CONSTRAINT `calendars_connectedAccountId_fkey` FOREIGN KEY (`connectedAccountId`) REFERENCES `connected_accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `events` ADD CONSTRAINT `events_calendarId_fkey` FOREIGN KEY (`calendarId`) REFERENCES `calendars`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `calendar_boards` ADD CONSTRAINT `calendar_boards_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `board_calendars` ADD CONSTRAINT `board_calendars_boardId_fkey` FOREIGN KEY (`boardId`) REFERENCES `calendar_boards`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `board_calendars` ADD CONSTRAINT `board_calendars_calendarId_fkey` FOREIGN KEY (`calendarId`) REFERENCES `calendars`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shared_links` ADD CONSTRAINT `shared_links_boardId_fkey` FOREIGN KEY (`boardId`) REFERENCES `calendar_boards`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
