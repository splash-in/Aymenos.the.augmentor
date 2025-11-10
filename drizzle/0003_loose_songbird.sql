CREATE TABLE `buildChains` (
	`id` int AUTO_INCREMENT NOT NULL,
	`originalCreatorId` int NOT NULL,
	`title` varchar(300) NOT NULL,
	`description` text NOT NULL,
	`projectType` varchar(100) NOT NULL,
	`status` enum('in_progress','completed','abandoned') NOT NULL DEFAULT 'in_progress',
	`currentOwnerId` int,
	`finalProductUrl` text,
	`totalContributors` int NOT NULL DEFAULT 1,
	`completionPercentage` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `buildChains_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chainLinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chainId` int NOT NULL,
	`contributorId` int NOT NULL,
	`contributorType` enum('user','agent') NOT NULL,
	`linkOrder` int NOT NULL,
	`contributionType` varchar(100) NOT NULL,
	`skillLevelRequired` int NOT NULL,
	`workDescription` text NOT NULL,
	`workOutput` text,
	`timeSpent` int,
	`completionPercentage` int NOT NULL,
	`qualityScore` int,
	`status` enum('in_progress','completed','handed_off') NOT NULL DEFAULT 'in_progress',
	`handoffReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `chainLinks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contributionCredits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chainId` int NOT NULL,
	`contributorId` int NOT NULL,
	`contributorType` enum('user','agent') NOT NULL,
	`creditPercentage` int NOT NULL,
	`contributionValue` int NOT NULL,
	`badges` text,
	`portfolioEligible` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contributionCredits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `handoffRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chainId` int NOT NULL,
	`fromUserId` int NOT NULL,
	`toUserId` int,
	`toAgentId` int,
	`requiredSkills` text,
	`workContext` text NOT NULL,
	`urgency` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`status` enum('pending','accepted','rejected','auto_assigned') NOT NULL DEFAULT 'pending',
	`acceptedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`respondedAt` timestamp,
	CONSTRAINT `handoffRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `skillAssessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`skillCategory` varchar(100) NOT NULL,
	`proficiencyLevel` int NOT NULL,
	`confidenceScore` int NOT NULL,
	`assessmentMethod` varchar(100) NOT NULL,
	`evidence` text,
	`lastAssessedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `skillAssessments_id` PRIMARY KEY(`id`)
);
