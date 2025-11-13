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
  parentTypeId: int("parentTypeId"), // For agent inheritance/specialization
  specializationLevel: int("specializationLevel").default(0), // 0=base, 1=specialized, 2=expert
  domain: varchar("domain", { length: 100 }), // Professional domain
  skillTags: text("skillTags"), // JSON array of skill tags
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
  intelligenceLevel: int("intelligenceLevel").default(50), // 1-100 scale
  learningRate: int("learningRate").default(50), // How fast agent evolves
  successRate: int("successRate").default(100), // Percentage
  parentAgentId: int("parentAgentId"), // For agent spawning/replication
  generation: int("generation").default(1), // Agent generation number
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

/**
 * Tasks - Hierarchical task system for distributed work
 */
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  parentTaskId: int("parentTaskId"), // For task hierarchy
  projectId: int("projectId"),
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description").notNull(),
  taskType: mysqlEnum("taskType", ["micro", "small", "medium", "large", "epic"]).default("medium").notNull(),
  complexity: int("complexity").default(50).notNull(), // 1-100 scale
  requiredSkills: text("requiredSkills"), // JSON array of required skills
  status: mysqlEnum("status", ["pending", "assigned", "in_progress", "completed", "failed"]).default("pending").notNull(),
  result: text("result"),
  gamifiedInterface: text("gamifiedInterface"), // JSON config for game-like presentation
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

/**
 * Task Assignments - Links tasks to agents or users
 */
export const taskAssignments = mysqlTable("taskAssignments", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull(),
  assigneeType: mysqlEnum("assigneeType", ["agent", "user", "device"]).notNull(),
  assigneeId: int("assigneeId").notNull(),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  contributionScore: int("contributionScore").default(0),
});

export type TaskAssignment = typeof taskAssignments.$inferSelect;
export type InsertTaskAssignment = typeof taskAssignments.$inferInsert;

/**
 * Connected Devices - Smart devices in the distributed network
 */
export const connectedDevices = mysqlTable("connectedDevices", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  deviceId: varchar("deviceId", { length: 200 }).notNull().unique(),
  deviceType: varchar("deviceType", { length: 100 }).notNull(), // phone, tablet, computer, iot, etc.
  capabilities: text("capabilities"), // JSON array of device capabilities
  computePower: int("computePower").default(50), // 1-100 scale
  status: mysqlEnum("status", ["online", "offline", "busy"]).default("offline").notNull(),
  tasksCompleted: int("tasksCompleted").default(0).notNull(),
  contributionScore: int("contributionScore").default(0).notNull(),
  lastSeenAt: timestamp("lastSeenAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ConnectedDevice = typeof connectedDevices.$inferSelect;
export type InsertConnectedDevice = typeof connectedDevices.$inferInsert;

/**
 * User Profiles - SWOT analysis and capability tracking
 */
export const userProfiles = mysqlTable("userProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  strengths: text("strengths"), // JSON array of identified strengths
  weaknesses: text("weaknesses"), // JSON array of weaknesses
  opportunities: text("opportunities"), // JSON array of growth opportunities
  threats: text("threats"), // JSON array of potential blockers
  cognitiveScore: int("cognitiveScore").default(50), // 1-100 scale
  creativityScore: int("creativityScore").default(50),
  technicalScore: int("technicalScore").default(50),
  socialScore: int("socialScore").default(50),
  potentialQuotient: int("potentialQuotient").default(50), // Gap between current and max potential
  preferredTaskTypes: text("preferredTaskTypes"), // JSON array
  skillTags: text("skillTags"), // JSON array of user skills
  contributionScore: int("contributionScore").default(0).notNull(),
  tasksCompleted: int("tasksCompleted").default(0).notNull(),
  // Kids Mode & Universal Empowerment fields
  age: int("age"),
  isKidsMode: int("isKidsMode").default(0).notNull(), // 0 = adult, 1 = kids mode
  parentUserId: int("parentUserId").references(() => users.id),
  experiencePoints: int("experiencePoints").default(0).notNull(),
  level: int("level").default(1).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

/**
 * Agent Spawning Log - Track agent replication and evolution
 */
export const agentSpawns = mysqlTable("agentSpawns", {
  id: int("id").autoincrement().primaryKey(),
  parentAgentId: int("parentAgentId").notNull(),
  childAgentId: int("childAgentId").notNull(),
  spawnReason: text("spawnReason"), // Why this agent was spawned
  inheritedCapabilities: text("inheritedCapabilities"), // JSON array
  mutations: text("mutations"), // JSON array of capability changes
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AgentSpawn = typeof agentSpawns.$inferSelect;
export type InsertAgentSpawn = typeof agentSpawns.$inferInsert;

/**
 * Skill Chains - Track how task outputs connect to inputs
 */
export const skillChains = mysqlTable("skillChains", {
  id: int("id").autoincrement().primaryKey(),
  sourceTaskId: int("sourceTaskId").notNull(),
  targetTaskId: int("targetTaskId").notNull(),
  dataFlow: text("dataFlow"), // JSON describing what data flows between tasks
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SkillChain = typeof skillChains.$inferSelect;
export type InsertSkillChain = typeof skillChains.$inferInsert;


/**
 * Build Chains - Collaborative creation chains where work passes between contributors
 */
export const buildChains = mysqlTable("buildChains", {
  id: int("id").autoincrement().primaryKey(),
  originalCreatorId: int("originalCreatorId").notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description").notNull(),
  projectType: varchar("projectType", { length: 100 }).notNull(), // app, website, research, design, etc.
  status: mysqlEnum("status", ["in_progress", "completed", "abandoned"]).default("in_progress").notNull(),
  currentOwnerId: int("currentOwnerId"), // Who currently has the work
  finalProductUrl: text("finalProductUrl"),
  totalContributors: int("totalContributors").default(1).notNull(),
  completionPercentage: int("completionPercentage").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type BuildChain = typeof buildChains.$inferSelect;
export type InsertBuildChain = typeof buildChains.$inferInsert;

/**
 * Chain Links - Individual contributions in a build chain
 */
export const chainLinks = mysqlTable("chainLinks", {
  id: int("id").autoincrement().primaryKey(),
  chainId: int("chainId").notNull(),
  contributorId: int("contributorId").notNull(),
  contributorType: mysqlEnum("contributorType", ["user", "agent"]).notNull(),
  linkOrder: int("linkOrder").notNull(), // Position in chain (1, 2, 3...)
  contributionType: varchar("contributionType", { length: 100 }).notNull(), // design, code, research, etc.
  skillLevelRequired: int("skillLevelRequired").notNull(), // 1-100
  workDescription: text("workDescription").notNull(),
  workOutput: text("workOutput"), // What was produced
  timeSpent: int("timeSpent"), // Minutes
  completionPercentage: int("completionPercentage").notNull(), // How much of total project
  qualityScore: int("qualityScore"), // 1-100
  status: mysqlEnum("status", ["in_progress", "completed", "handed_off"]).default("in_progress").notNull(),
  handoffReason: text("handoffReason"), // Why work was passed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type ChainLink = typeof chainLinks.$inferSelect;
export type InsertChainLink = typeof chainLinks.$inferInsert;

/**
 * Skill Assessments - Real-time skill proficiency tracking
 */
export const skillAssessments = mysqlTable("skillAssessments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  skillCategory: varchar("skillCategory", { length: 100 }).notNull(),
  proficiencyLevel: int("proficiencyLevel").notNull(), // 1-100
  confidenceScore: int("confidenceScore").notNull(), // How confident AI is in assessment
  assessmentMethod: varchar("assessmentMethod", { length: 100 }).notNull(), // observed, tested, self-reported
  evidence: text("evidence"), // JSON array of supporting data
  lastAssessedAt: timestamp("lastAssessedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SkillAssessment = typeof skillAssessments.$inferSelect;
export type InsertSkillAssessment = typeof skillAssessments.$inferInsert;

/**
 * Handoff Requests - When work needs to be passed to next contributor
 */
export const handoffRequests = mysqlTable("handoffRequests", {
  id: int("id").autoincrement().primaryKey(),
  chainId: int("chainId").notNull(),
  fromUserId: int("fromUserId").notNull(),
  toUserId: int("toUserId"), // Null if open to anyone
  toAgentId: int("toAgentId"), // If passing to AI agent
  requiredSkills: text("requiredSkills"), // JSON array
  workContext: text("workContext").notNull(), // What's been done, what's needed
  urgency: mysqlEnum("urgency", ["low", "medium", "high"]).default("medium").notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "rejected", "auto_assigned"]).default("pending").notNull(),
  acceptedBy: int("acceptedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  respondedAt: timestamp("respondedAt"),
});

export type HandoffRequest = typeof handoffRequests.$inferSelect;
export type InsertHandoffRequest = typeof handoffRequests.$inferInsert;

/**
 * Contribution Credits - Fair attribution system
 */
export const contributionCredits = mysqlTable("contributionCredits", {
  id: int("id").autoincrement().primaryKey(),
  chainId: int("chainId").notNull(),
  contributorId: int("contributorId").notNull(),
  contributorType: mysqlEnum("contributorType", ["user", "agent"]).notNull(),
  creditPercentage: int("creditPercentage").notNull(), // % of total project
  contributionValue: int("contributionValue").notNull(), // Calculated value score
  badges: text("badges"), // JSON array of earned badges
  portfolioEligible: int("portfolioEligible").default(1).notNull(), // Can show in portfolio
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContributionCredit = typeof contributionCredits.$inferSelect;
export type InsertContributionCredit = typeof contributionCredits.$inferInsert;


// Kids Mode & Universal Empowerment Tables (userProfiles merged above)

export const achievements = mysqlTable("achievements", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 100 }),
  category: varchar("category", { length: 100 }), // learning, building, collaboration, etc.
  points: int("points").default(0).notNull(),
  requirement: text("requirement"), // JSON describing unlock conditions
  isKidsFriendly: int("isKidsFriendly").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const userAchievements = mysqlTable("userAchievements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  achievementId: int("achievementId").notNull().references(() => achievements.id),
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
});

export const learningPaths = mysqlTable("learningPaths", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }), // math, science, coding, art, etc.
  difficulty: varchar("difficulty", { length: 50 }), // beginner, intermediate, advanced
  ageGroup: varchar("ageGroup", { length: 50 }), // 12-14, 15-17, 18+, all
  estimatedHours: int("estimatedHours"),
  icon: varchar("icon", { length: 100 }),
  color: varchar("color", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const learningModules = mysqlTable("learningModules", {
  id: int("id").autoincrement().primaryKey(),
  pathId: int("pathId").notNull().references(() => learningPaths.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  content: text("content"), // JSON with lessons, quizzes, activities
  orderIndex: int("orderIndex").notNull(),
  pointsReward: int("pointsReward").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const userProgress = mysqlTable("userProgress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  moduleId: int("moduleId").notNull().references(() => learningModules.id),
  status: varchar("status", { length: 50 }).default("not_started").notNull(), // not_started, in_progress, completed
  progressPercent: int("progressPercent").default(0).notNull(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const dailyChallenges = mysqlTable("dailyChallenges", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  taskType: varchar("taskType", { length: 100 }), // build, learn, collaborate, create
  difficulty: varchar("difficulty", { length: 50 }),
  pointsReward: int("pointsReward").default(0).notNull(),
  date: timestamp("date").notNull(),
  isKidsFriendly: int("isKidsFriendly").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const userChallenges = mysqlTable("userChallenges", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  challengeId: int("challengeId").notNull().references(() => dailyChallenges.id),
  status: varchar("status", { length: 50 }).default("active").notNull(), // active, completed, expired
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const projectShowcase = mysqlTable("projectShowcase", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id),
  userId: int("userId").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  thumbnailUrl: varchar("thumbnailUrl", { length: 500 }),
  isKidsFriendly: int("isKidsFriendly").default(1).notNull(),
  likes: int("likes").default(0).notNull(),
  views: int("views").default(0).notNull(),
  featured: int("featured").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const communityPosts = mysqlTable("communityPosts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }),
  content: text("content").notNull(),
  category: varchar("category", { length: 100 }),
  isKidsFriendly: int("isKidsFriendly").default(1).notNull(),
  isModerated: int("isModerated").default(0).notNull(),
  likes: int("likes").default(0).notNull(),
  replies: int("replies").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const parentalControls = mysqlTable("parentalControls", {
  id: int("id").autoincrement().primaryKey(),
  parentUserId: int("parentUserId").notNull().references(() => users.id),
  childUserId: int("childUserId").notNull().references(() => users.id),
  dailyTimeLimit: int("dailyTimeLimit"), // minutes per day
  allowedCategories: text("allowedCategories"), // JSON array
  contentFilterLevel: varchar("contentFilterLevel", { length: 50 }).default("strict").notNull(),
  requireApprovalForProjects: int("requireApprovalForProjects").default(1).notNull(),
  allowCommunityAccess: int("allowCommunityAccess").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
