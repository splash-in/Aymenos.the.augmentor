/**
 * Standalone Database Schema for AYMENOS
 * 100% Independent - No Manus Platform Dependency
 */

import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  decimal,
  index,
  unique,
} from "drizzle-orm/mysql-core";

/**
 * Users Table - Standalone Authentication
 * No dependency on Manus OAuth
 */
export const users = mysqlTable(
  "users",
  {
    id: int("id").autoincrement().primaryKey(),
    email: varchar("email", { length: 320 }).notNull().unique(),
    password: text("password").notNull(), // Hashed password
    name: text("name"),
    role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
    emailVerified: boolean("emailVerified").default(false).notNull(),
    emailVerificationToken: varchar("emailVerificationToken", { length: 255 }),
    emailVerificationTokenExpiry: timestamp("emailVerificationTokenExpiry"),
    passwordResetToken: varchar("passwordResetToken", { length: 255 }),
    passwordResetTokenExpiry: timestamp("passwordResetTokenExpiry"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index("email_idx").on(table.email),
  })
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Sessions Table - Session Management
 */
export const sessions = mysqlTable(
  "sessions",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    userId: int("userId").notNull(),
    token: text("token").notNull(),
    refreshToken: text("refreshToken"),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("userId_idx").on(table.userId),
  })
);

export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;

/**
 * Distributed Models Table
 */
export const distributedModels = mysqlTable(
  "distributedModels",
  {
    id: int("id").autoincrement().primaryKey(),
    modelId: varchar("modelId", { length: 255 }).notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    domain: varchar("domain", { length: 255 }).notNull(), // e.g., "medical", "climate", "physics"
    version: varchar("version", { length: 50 }).notNull(),
    status: mysqlEnum("status", ["training", "active", "deprecated"]).default("training"),
    accuracy: decimal("accuracy", { precision: 5, scale: 4 }), // 0.0000 to 1.0000
    totalParameters: int("totalParameters"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    domainIdx: index("domain_idx").on(table.domain),
    statusIdx: index("status_idx").on(table.status),
  })
);

export type DistributedModel = typeof distributedModels.$inferSelect;
export type InsertDistributedModel = typeof distributedModels.$inferInsert;

/**
 * Model Versions Table
 */
export const modelVersions = mysqlTable(
  "modelVersions",
  {
    id: int("id").autoincrement().primaryKey(),
    modelId: int("modelId").notNull(),
    versionNumber: varchar("versionNumber", { length: 50 }).notNull(),
    checksum: varchar("checksum", { length: 255 }).notNull(),
    size: int("size"), // in bytes
    downloadUrl: text("downloadUrl"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    modelIdIdx: index("modelId_idx").on(table.modelId),
  })
);

export type ModelVersion = typeof modelVersions.$inferSelect;
export type InsertModelVersion = typeof modelVersions.$inferInsert;

/**
 * Federated Learning Rounds
 */
export const federatedRounds = mysqlTable(
  "federatedRounds",
  {
    id: int("id").autoincrement().primaryKey(),
    modelId: int("modelId").notNull(),
    roundNumber: int("roundNumber").notNull(),
    status: mysqlEnum("status", ["pending", "in_progress", "completed", "failed"]).default("pending"),
    participantCount: int("participantCount").default(0),
    aggregatedAt: timestamp("aggregatedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    modelIdIdx: index("modelId_idx").on(table.modelId),
  })
);

export type FederatedRound = typeof federatedRounds.$inferSelect;
export type InsertFederatedRound = typeof federatedRounds.$inferInsert;

/**
 * Federated Updates from Participants
 */
export const federatedUpdates = mysqlTable(
  "federatedUpdates",
  {
    id: int("id").autoincrement().primaryKey(),
    roundId: int("roundId").notNull(),
    userId: int("userId").notNull(),
    updateHash: varchar("updateHash", { length: 255 }).notNull(),
    dataSize: int("dataSize"), // in bytes
    quality: decimal("quality", { precision: 5, scale: 4 }), // 0.0000 to 1.0000
    submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  },
  (table) => ({
    roundIdIdx: index("roundId_idx").on(table.roundId),
    userIdIdx: index("userId_idx").on(table.userId),
  })
);

export type FederatedUpdate = typeof federatedUpdates.$inferSelect;
export type InsertFederatedUpdate = typeof federatedUpdates.$inferInsert;

/**
 * Governance Proposals
 */
export const governanceProposals = mysqlTable(
  "governanceProposals",
  {
    id: int("id").autoincrement().primaryKey(),
    proposalId: varchar("proposalId", { length: 255 }).notNull().unique(),
    title: text("title").notNull(),
    description: text("description"),
    proposedBy: int("proposedBy").notNull(),
    status: mysqlEnum("status", ["draft", "voting", "approved", "rejected", "executed"]).default("draft"),
    votesFor: int("votesFor").default(0),
    votesAgainst: int("votesAgainst").default(0),
    votesAbstain: int("votesAbstain").default(0),
    votingStartsAt: timestamp("votingStartsAt"),
    votingEndsAt: timestamp("votingEndsAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    statusIdx: index("status_idx").on(table.status),
  })
);

export type GovernanceProposal = typeof governanceProposals.$inferSelect;
export type InsertGovernanceProposal = typeof governanceProposals.$inferInsert;

/**
 * Votes on Proposals
 */
export const votes = mysqlTable(
  "votes",
  {
    id: int("id").autoincrement().primaryKey(),
    proposalId: int("proposalId").notNull(),
    userId: int("userId").notNull(),
    vote: mysqlEnum("vote", ["for", "against", "abstain"]).notNull(),
    votedAt: timestamp("votedAt").defaultNow().notNull(),
  },
  (table) => ({
    proposalIdIdx: index("proposalId_idx").on(table.proposalId),
    userIdIdx: index("userId_idx").on(table.userId),
  })
);

export type Vote = typeof votes.$inferSelect;
export type InsertVote = typeof votes.$inferInsert;

/**
 * Humanity Credits Ledger
 */
export const humanityCreditsLedger = mysqlTable(
  "humanityCreditsLedger",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
    type: mysqlEnum("type", ["earned", "spent", "monthly_allocation", "reward"]).notNull(),
    description: text("description"),
    transactionHash: varchar("transactionHash", { length: 255 }), // For blockchain verification
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("userId_idx").on(table.userId),
  })
);

export type HumanityCreditLedger = typeof humanityCreditsLedger.$inferSelect;
export type InsertHumanityCreditLedger = typeof humanityCreditsLedger.$inferInsert;

/**
 * User Contributions
 */
export const contributions = mysqlTable(
  "contributions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    type: mysqlEnum("type", ["model_training", "data_contribution", "code_contribution", "feedback"]).notNull(),
    description: text("description"),
    creditsEarned: decimal("creditsEarned", { precision: 18, scale: 8 }).notNull(),
    verified: boolean("verified").default(false),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("userId_idx").on(table.userId),
  })
);

export type Contribution = typeof contributions.$inferSelect;
export type InsertContribution = typeof contributions.$inferInsert;

/**
 * Inference Requests
 */
export const inferenceRequests = mysqlTable(
  "inferenceRequests",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    modelId: int("modelId").notNull(),
    input: text("input"),
    output: text("output"),
    latency: int("latency"), // in milliseconds
    status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("userId_idx").on(table.userId),
    modelIdIdx: index("modelId_idx").on(table.modelId),
  })
);

export type InferenceRequest = typeof inferenceRequests.$inferSelect;
export type InsertInferenceRequest = typeof inferenceRequests.$inferInsert;

/**
 * Inference Nodes (Participants)
 */
export const inferenceNodes = mysqlTable(
  "inferenceNodes",
  {
    id: int("id").autoincrement().primaryKey(),
    nodeId: varchar("nodeId", { length: 255 }).notNull().unique(),
    userId: int("userId").notNull(),
    status: mysqlEnum("status", ["online", "offline", "inactive"]).default("offline"),
    gpuCount: int("gpuCount").default(0),
    gpuType: varchar("gpuType", { length: 255 }),
    totalInferences: int("totalInferences").default(0),
    lastHeartbeat: timestamp("lastHeartbeat"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("userId_idx").on(table.userId),
    statusIdx: index("status_idx").on(table.status),
  })
);

export type InferenceNode = typeof inferenceNodes.$inferSelect;
export type InsertInferenceNode = typeof inferenceNodes.$inferInsert;

/**
 * System Metrics
 */
export const systemMetrics = mysqlTable(
  "systemMetrics",
  {
    id: int("id").autoincrement().primaryKey(),
    totalUsers: int("totalUsers").default(0),
    totalModels: int("totalModels").default(0),
    totalInferences: int("totalInferences").default(0),
    averageLatency: decimal("averageLatency", { precision: 10, scale: 2 }), // in ms
    activeNodes: int("activeNodes").default(0),
    totalCreditsDistributed: decimal("totalCreditsDistributed", { precision: 18, scale: 8 }).default(0),
    recordedAt: timestamp("recordedAt").defaultNow().notNull(),
  }
);

export type SystemMetric = typeof systemMetrics.$inferSelect;
export type InsertSystemMetric = typeof systemMetrics.$inferInsert;
