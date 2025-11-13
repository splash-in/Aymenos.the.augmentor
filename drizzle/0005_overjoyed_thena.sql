CREATE TABLE `challengeChat` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`participantId` int NOT NULL,
	`messageType` varchar(50) NOT NULL DEFAULT 'text',
	`content` text NOT NULL,
	`isFiltered` int NOT NULL DEFAULT 0,
	`replyToId` int,
	`reactions` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `challengeChat_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `challengeCompletions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`challengeId` int NOT NULL,
	`teamScore` int NOT NULL,
	`completionTime` int NOT NULL,
	`hintsUsed` int NOT NULL DEFAULT 0,
	`perfectSolution` int NOT NULL DEFAULT 0,
	`teamworkRating` int,
	`funRating` int,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `challengeCompletions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `challengeRooms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`challengeId` int NOT NULL,
	`roomCode` varchar(20) NOT NULL,
	`hostUserId` int NOT NULL,
	`status` varchar(50) NOT NULL DEFAULT 'waiting',
	`currentParticipants` int NOT NULL DEFAULT 0,
	`maxParticipants` int NOT NULL DEFAULT 4,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`totalScore` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `challengeRooms_id` PRIMARY KEY(`id`),
	CONSTRAINT `challengeRooms_roomCode_unique` UNIQUE(`roomCode`)
);
--> statement-breakpoint
CREATE TABLE `collaborativeSolutions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`solutionType` varchar(100) NOT NULL,
	`content` text NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`lastEditedBy` int,
	`isComplete` int NOT NULL DEFAULT 0,
	`qualityScore` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `collaborativeSolutions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `multiplayerChallenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`challengeType` varchar(100) NOT NULL,
	`difficulty` varchar(50) NOT NULL DEFAULT 'medium',
	`minTeamSize` int NOT NULL DEFAULT 2,
	`maxTeamSize` int NOT NULL DEFAULT 4,
	`estimatedMinutes` int NOT NULL DEFAULT 30,
	`pointsReward` int NOT NULL DEFAULT 100,
	`problemStatement` text NOT NULL,
	`successCriteria` text,
	`hints` text,
	`isKidsFriendly` int NOT NULL DEFAULT 1,
	`ageGroup` varchar(50) NOT NULL DEFAULT '12+',
	`tags` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `multiplayerChallenges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `roomParticipants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`userId` int,
	`agentId` int,
	`participantType` varchar(50) NOT NULL,
	`role` varchar(50) NOT NULL DEFAULT 'member',
	`displayName` varchar(100) NOT NULL,
	`avatarColor` varchar(20),
	`isOnline` int NOT NULL DEFAULT 1,
	`contributionScore` int NOT NULL DEFAULT 0,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	`leftAt` timestamp,
	CONSTRAINT `roomParticipants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teamProgress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`milestone` varchar(255) NOT NULL,
	`description` text,
	`completedBy` int,
	`progressPercent` int NOT NULL DEFAULT 0,
	`pointsEarned` int NOT NULL DEFAULT 0,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `teamProgress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `challengeChat` ADD CONSTRAINT `challengeChat_roomId_challengeRooms_id_fk` FOREIGN KEY (`roomId`) REFERENCES `challengeRooms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `challengeChat` ADD CONSTRAINT `challengeChat_participantId_roomParticipants_id_fk` FOREIGN KEY (`participantId`) REFERENCES `roomParticipants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `challengeCompletions` ADD CONSTRAINT `challengeCompletions_roomId_challengeRooms_id_fk` FOREIGN KEY (`roomId`) REFERENCES `challengeRooms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `challengeCompletions` ADD CONSTRAINT `challengeCompletions_challengeId_multiplayerChallenges_id_fk` FOREIGN KEY (`challengeId`) REFERENCES `multiplayerChallenges`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `challengeRooms` ADD CONSTRAINT `challengeRooms_challengeId_multiplayerChallenges_id_fk` FOREIGN KEY (`challengeId`) REFERENCES `multiplayerChallenges`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `challengeRooms` ADD CONSTRAINT `challengeRooms_hostUserId_users_id_fk` FOREIGN KEY (`hostUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `collaborativeSolutions` ADD CONSTRAINT `collaborativeSolutions_roomId_challengeRooms_id_fk` FOREIGN KEY (`roomId`) REFERENCES `challengeRooms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `roomParticipants` ADD CONSTRAINT `roomParticipants_roomId_challengeRooms_id_fk` FOREIGN KEY (`roomId`) REFERENCES `challengeRooms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `roomParticipants` ADD CONSTRAINT `roomParticipants_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `roomParticipants` ADD CONSTRAINT `roomParticipants_agentId_agents_id_fk` FOREIGN KEY (`agentId`) REFERENCES `agents`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teamProgress` ADD CONSTRAINT `teamProgress_roomId_challengeRooms_id_fk` FOREIGN KEY (`roomId`) REFERENCES `challengeRooms`(`id`) ON DELETE no action ON UPDATE no action;