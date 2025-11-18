CREATE TABLE `dataAccessLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`accessType` enum('view','export','delete','update') NOT NULL,
	`dataCategory` varchar(100) NOT NULL,
	`accessedBy` int,
	`ipAddress` varchar(45),
	`userAgent` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`details` text,
	CONSTRAINT `dataAccessLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailVerifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`verificationToken` varchar(64) NOT NULL,
	`verified` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`verifiedAt` timestamp,
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `emailVerifications_id` PRIMARY KEY(`id`),
	CONSTRAINT `emailVerifications_verificationToken_unique` UNIQUE(`verificationToken`)
);
--> statement-breakpoint
CREATE TABLE `parentalConsentRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`parentEmail` varchar(320) NOT NULL,
	`verificationToken` varchar(64) NOT NULL,
	`status` enum('pending','approved','rejected','expired') NOT NULL DEFAULT 'pending',
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`respondedAt` timestamp,
	`expiresAt` timestamp NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	CONSTRAINT `parentalConsentRequests_id` PRIMARY KEY(`id`),
	CONSTRAINT `parentalConsentRequests_verificationToken_unique` UNIQUE(`verificationToken`)
);
--> statement-breakpoint
CREATE TABLE `privacySettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`dataProcessingConsent` boolean NOT NULL DEFAULT false,
	`marketingConsent` boolean NOT NULL DEFAULT false,
	`analyticsConsent` boolean NOT NULL DEFAULT false,
	`thirdPartySharing` boolean NOT NULL DEFAULT false,
	`consentVersion` varchar(20) NOT NULL,
	`consentDate` timestamp NOT NULL DEFAULT (now()),
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `privacySettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `privacySettings_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `birthdate` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `accountType` enum('adult','minor_with_consent','minor_pending') DEFAULT 'adult';--> statement-breakpoint
ALTER TABLE `users` ADD `parentalConsentGiven` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `parentalConsentDate` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `parentEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerified` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerifiedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `dataProcessingConsent` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `marketingConsent` boolean DEFAULT false;