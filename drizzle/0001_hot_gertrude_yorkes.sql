CREATE TABLE `agentCommunications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`swarmSessionId` int NOT NULL,
	`fromAgentId` int NOT NULL,
	`toAgentId` int,
	`messageType` enum('proposal','response','consensus','query','result') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agentCommunications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agentTypes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`icon` varchar(50),
	`capabilities` text NOT NULL,
	`color` varchar(20) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agentTypes_id` PRIMARY KEY(`id`),
	CONSTRAINT `agentTypes_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `agents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentTypeId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`status` enum('idle','active','busy','offline') NOT NULL DEFAULT 'idle',
	`currentTask` text,
	`memory` text,
	`performanceScore` int NOT NULL DEFAULT 100,
	`tasksCompleted` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditTrail` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entityType` varchar(50) NOT NULL,
	`entityId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`performedBy` int,
	`performerType` enum('user','agent','system') NOT NULL,
	`details` text,
	`blockchainHash` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditTrail_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `governanceProposals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(300) NOT NULL,
	`description` text NOT NULL,
	`proposedBy` int NOT NULL,
	`category` enum('policy','feature','ethics','resource_allocation','agent_behavior') NOT NULL,
	`status` enum('draft','voting','approved','rejected','implemented') NOT NULL DEFAULT 'draft',
	`votesFor` int NOT NULL DEFAULT 0,
	`votesAgainst` int NOT NULL DEFAULT 0,
	`blockchainHash` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`votingEndsAt` timestamp,
	`implementedAt` timestamp,
	CONSTRAINT `governanceProposals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `governanceVotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`proposalId` int NOT NULL,
	`voterId` int NOT NULL,
	`vote` enum('for','against','abstain') NOT NULL,
	`reason` text,
	`weight` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `governanceVotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projectAgents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`agentId` int NOT NULL,
	`role` varchar(100),
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `projectAgents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(300) NOT NULL,
	`description` text NOT NULL,
	`status` enum('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
	`priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`result` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `swarmSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`objective` text NOT NULL,
	`status` enum('forming','active','completed','failed') NOT NULL DEFAULT 'forming',
	`consensus` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `swarmSessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userInteractions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`agentId` int,
	`projectId` int,
	`messageType` enum('user','agent','system') NOT NULL,
	`content` text NOT NULL,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userInteractions_id` PRIMARY KEY(`id`)
);
