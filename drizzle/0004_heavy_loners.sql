CREATE TABLE `achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`icon` varchar(100),
	`category` varchar(100),
	`points` int NOT NULL DEFAULT 0,
	`requirement` text,
	`isKidsFriendly` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `achievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `communityPosts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255),
	`content` text NOT NULL,
	`category` varchar(100),
	`isKidsFriendly` int NOT NULL DEFAULT 1,
	`isModerated` int NOT NULL DEFAULT 0,
	`likes` int NOT NULL DEFAULT 0,
	`replies` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `communityPosts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dailyChallenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`taskType` varchar(100),
	`difficulty` varchar(50),
	`pointsReward` int NOT NULL DEFAULT 0,
	`date` timestamp NOT NULL,
	`isKidsFriendly` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dailyChallenges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learningModules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pathId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`content` text,
	`orderIndex` int NOT NULL,
	`pointsReward` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learningModules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learningPaths` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100),
	`difficulty` varchar(50),
	`ageGroup` varchar(50),
	`estimatedHours` int,
	`icon` varchar(100),
	`color` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learningPaths_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `parentalControls` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parentUserId` int NOT NULL,
	`childUserId` int NOT NULL,
	`dailyTimeLimit` int,
	`allowedCategories` text,
	`contentFilterLevel` varchar(50) NOT NULL DEFAULT 'strict',
	`requireApprovalForProjects` int NOT NULL DEFAULT 1,
	`allowCommunityAccess` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `parentalControls_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projectShowcase` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`thumbnailUrl` varchar(500),
	`isKidsFriendly` int NOT NULL DEFAULT 1,
	`likes` int NOT NULL DEFAULT 0,
	`views` int NOT NULL DEFAULT 0,
	`featured` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `projectShowcase_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userAchievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`achievementId` int NOT NULL,
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userAchievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userChallenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`challengeId` int NOT NULL,
	`status` varchar(50) NOT NULL DEFAULT 'active',
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userChallenges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userProgress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`moduleId` int NOT NULL,
	`status` varchar(50) NOT NULL DEFAULT 'not_started',
	`progressPercent` int NOT NULL DEFAULT 0,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userProgress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `userProfiles` ADD `age` int;--> statement-breakpoint
ALTER TABLE `userProfiles` ADD `isKidsMode` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `userProfiles` ADD `parentUserId` int;--> statement-breakpoint
ALTER TABLE `userProfiles` ADD `experiencePoints` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `userProfiles` ADD `level` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `communityPosts` ADD CONSTRAINT `communityPosts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `learningModules` ADD CONSTRAINT `learningModules_pathId_learningPaths_id_fk` FOREIGN KEY (`pathId`) REFERENCES `learningPaths`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `parentalControls` ADD CONSTRAINT `parentalControls_parentUserId_users_id_fk` FOREIGN KEY (`parentUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `parentalControls` ADD CONSTRAINT `parentalControls_childUserId_users_id_fk` FOREIGN KEY (`childUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projectShowcase` ADD CONSTRAINT `projectShowcase_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projectShowcase` ADD CONSTRAINT `projectShowcase_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userAchievements` ADD CONSTRAINT `userAchievements_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userAchievements` ADD CONSTRAINT `userAchievements_achievementId_achievements_id_fk` FOREIGN KEY (`achievementId`) REFERENCES `achievements`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userChallenges` ADD CONSTRAINT `userChallenges_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userChallenges` ADD CONSTRAINT `userChallenges_challengeId_dailyChallenges_id_fk` FOREIGN KEY (`challengeId`) REFERENCES `dailyChallenges`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userProgress` ADD CONSTRAINT `userProgress_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userProgress` ADD CONSTRAINT `userProgress_moduleId_learningModules_id_fk` FOREIGN KEY (`moduleId`) REFERENCES `learningModules`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userProfiles` ADD CONSTRAINT `userProfiles_parentUserId_users_id_fk` FOREIGN KEY (`parentUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;