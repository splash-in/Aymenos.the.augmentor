CREATE TABLE `agentSpawns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parentAgentId` int NOT NULL,
	`childAgentId` int NOT NULL,
	`spawnReason` text,
	`inheritedCapabilities` text,
	`mutations` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agentSpawns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `connectedDevices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`deviceId` varchar(200) NOT NULL,
	`deviceType` varchar(100) NOT NULL,
	`capabilities` text,
	`computePower` int DEFAULT 50,
	`status` enum('online','offline','busy') NOT NULL DEFAULT 'offline',
	`tasksCompleted` int NOT NULL DEFAULT 0,
	`contributionScore` int NOT NULL DEFAULT 0,
	`lastSeenAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `connectedDevices_id` PRIMARY KEY(`id`),
	CONSTRAINT `connectedDevices_deviceId_unique` UNIQUE(`deviceId`)
);
--> statement-breakpoint
CREATE TABLE `skillChains` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceTaskId` int NOT NULL,
	`targetTaskId` int NOT NULL,
	`dataFlow` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `skillChains_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `taskAssignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`assigneeType` enum('agent','user','device') NOT NULL,
	`assigneeId` int NOT NULL,
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	`startedAt` timestamp,
	`completedAt` timestamp,
	`contributionScore` int DEFAULT 0,
	CONSTRAINT `taskAssignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parentTaskId` int,
	`projectId` int,
	`title` varchar(300) NOT NULL,
	`description` text NOT NULL,
	`taskType` enum('micro','small','medium','large','epic') NOT NULL DEFAULT 'medium',
	`complexity` int NOT NULL DEFAULT 50,
	`requiredSkills` text,
	`status` enum('pending','assigned','in_progress','completed','failed') NOT NULL DEFAULT 'pending',
	`result` text,
	`gamifiedInterface` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`strengths` text,
	`weaknesses` text,
	`opportunities` text,
	`threats` text,
	`cognitiveScore` int DEFAULT 50,
	`creativityScore` int DEFAULT 50,
	`technicalScore` int DEFAULT 50,
	`socialScore` int DEFAULT 50,
	`potentialQuotient` int DEFAULT 50,
	`preferredTaskTypes` text,
	`skillTags` text,
	`contributionScore` int NOT NULL DEFAULT 0,
	`tasksCompleted` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `userProfiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `agentTypes` ADD `parentTypeId` int;--> statement-breakpoint
ALTER TABLE `agentTypes` ADD `specializationLevel` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `agentTypes` ADD `domain` varchar(100);--> statement-breakpoint
ALTER TABLE `agentTypes` ADD `skillTags` text;--> statement-breakpoint
ALTER TABLE `agents` ADD `intelligenceLevel` int DEFAULT 50;--> statement-breakpoint
ALTER TABLE `agents` ADD `learningRate` int DEFAULT 50;--> statement-breakpoint
ALTER TABLE `agents` ADD `successRate` int DEFAULT 100;--> statement-breakpoint
ALTER TABLE `agents` ADD `parentAgentId` int;--> statement-breakpoint
ALTER TABLE `agents` ADD `generation` int DEFAULT 1;