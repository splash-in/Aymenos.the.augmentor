import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Agent Types - Defines the different professional domains
 */
export const agentTypes = mysqlTable("agentTypes", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 50 }),
  capabilities: text("capabilities").notNull(), // JSON array of capabilities
  color: varchar("color", { length: 20 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AgentType = typeof agentTypes.$inferSelect;
export type InsertAgentType = typeof agentTypes.$inferInsert;

/**
 * Agent Instances - Individual AI agents that can be deployed
 */
export const agents = mysqlTable("agents", {
  id: int("id").autoincrement().primaryKey(),
  agentTypeId: int("agentTypeId").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  status: mysqlEnum("status", ["idle", "active", "busy", "offline"]).default("idle").notNull(),
  currentTask: text("currentTask"),
  memory: text("memory"), // JSON object for agent memory
  performanceScore: int("performanceScore").default(100).notNull(),
  tasksCompleted: int("tasksCompleted").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = typeof agents.$inferInsert;

/**
 * Projects - User-created projects that agents work on
 */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description").notNull(),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "cancelled"]).default("pending").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  result: text("result"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Project Agents - Assignment of agents to projects
 */
export const projectAgents = mysqlTable("projectAgents", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  agentId: int("agentId").notNull(),
  role: varchar("role", { length: 100 }),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
});

export type ProjectAgent = typeof projectAgents.$inferSelect;
export type InsertProjectAgent = typeof projectAgents.$inferInsert;

/**
 * Swarm Sessions - Collaborative agent swarms working together
 */
export const swarmSessions = mysqlTable("swarmSessions", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  objective: text("objective").notNull(),
  status: mysqlEnum("status", ["forming", "active", "completed", "failed"]).default("forming").notNull(),
  consensus: text("consensus"), // JSON object for swarm consensus
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type SwarmSession = typeof swarmSessions.$inferSelect;
export type InsertSwarmSession = typeof swarmSessions.$inferInsert;

/**
 * Agent Communications - Messages between agents in a swarm
 */
export const agentCommunications = mysqlTable("agentCommunications", {
  id: int("id").autoincrement().primaryKey(),
  swarmSessionId: int("swarmSessionId").notNull(),
  fromAgentId: int("fromAgentId").notNull(),
  toAgentId: int("toAgentId"),
  messageType: mysqlEnum("messageType", ["proposal", "response", "consensus", "query", "result"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AgentCommunication = typeof agentCommunications.$inferSelect;
export type InsertAgentCommunication = typeof agentCommunications.$inferInsert;

/**
 * Governance Proposals - Blockchain-based governance decisions
 */
export const governanceProposals = mysqlTable("governanceProposals", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description").notNull(),
  proposedBy: int("proposedBy").notNull(), // userId
  category: mysqlEnum("category", ["policy", "feature", "ethics", "resource_allocation", "agent_behavior"]).notNull(),
  status: mysqlEnum("status", ["draft", "voting", "approved", "rejected", "implemented"]).default("draft").notNull(),
  votesFor: int("votesFor").default(0).notNull(),
  votesAgainst: int("votesAgainst").default(0).notNull(),
  blockchainHash: varchar("blockchainHash", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  votingEndsAt: timestamp("votingEndsAt"),
  implementedAt: timestamp("implementedAt"),
});

export type GovernanceProposal = typeof governanceProposals.$inferSelect;
export type InsertGovernanceProposal = typeof governanceProposals.$inferInsert;

/**
 * Governance Votes - Individual votes on proposals
 */
export const governanceVotes = mysqlTable("governanceVotes", {
  id: int("id").autoincrement().primaryKey(),
  proposalId: int("proposalId").notNull(),
  voterId: int("voterId").notNull(), // userId
  vote: mysqlEnum("vote", ["for", "against", "abstain"]).notNull(),
  reason: text("reason"),
  weight: int("weight").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GovernanceVote = typeof governanceVotes.$inferSelect;
export type InsertGovernanceVote = typeof governanceVotes.$inferInsert;

/**
 * Audit Trail - Immutable record of all significant actions
 */
export const auditTrail = mysqlTable("auditTrail", {
  id: int("id").autoincrement().primaryKey(),
  entityType: varchar("entityType", { length: 50 }).notNull(),
  entityId: int("entityId").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  performedBy: int("performedBy"), // userId or agentId
  performerType: mysqlEnum("performerType", ["user", "agent", "system"]).notNull(),
  details: text("details"), // JSON object with action details
  blockchainHash: varchar("blockchainHash", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditTrail = typeof auditTrail.$inferSelect;
export type InsertAuditTrail = typeof auditTrail.$inferInsert;

/**
 * User Interactions - Chat history between users and agents
 */
export const userInteractions = mysqlTable("userInteractions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  agentId: int("agentId"),
  projectId: int("projectId"),
  messageType: mysqlEnum("messageType", ["user", "agent", "system"]).notNull(),
  content: text("content").notNull(),
  metadata: text("metadata"), // JSON object for additional data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserInteraction = typeof userInteractions.$inferSelect;
export type InsertUserInteraction = typeof userInteractions.$inferInsert;