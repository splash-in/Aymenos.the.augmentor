import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users,
  agentTypes,
  agents,
  projects,
  projectAgents,
  swarmSessions,
  agentCommunications,
  governanceProposals,
  governanceVotes,
  auditTrail,
  userInteractions,
  InsertAgentType,
  InsertAgent,
  InsertProject,
  InsertProjectAgent,
  InsertSwarmSession,
  InsertAgentCommunication,
  InsertGovernanceProposal,
  InsertGovernanceVote,
  InsertAuditTrail,
  InsertUserInteraction
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Agent Type Operations
export async function getAllAgentTypes() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(agentTypes).orderBy(agentTypes.name);
}

export async function createAgentType(data: InsertAgentType) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(agentTypes).values(data);
  return result;
}

// Agent Operations
export async function getAllAgents() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(agents).orderBy(desc(agents.createdAt));
}

export async function getAgentsByType(agentTypeId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(agents).where(eq(agents.agentTypeId, agentTypeId));
}

export async function getAgentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(agents).where(eq(agents.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createAgent(data: InsertAgent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(agents).values(data);
  return result;
}

export async function updateAgentStatus(id: number, status: "idle" | "active" | "busy" | "offline", currentTask?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(agents).set({ status, currentTask, updatedAt: new Date() }).where(eq(agents.id, id));
}

// Project Operations
export async function getUserProjects(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.createdAt));
}

export async function getProjectById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createProject(data: InsertProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(projects).values(data);
  return result;
}

export async function updateProjectStatus(id: number, status: "pending" | "in_progress" | "completed" | "cancelled") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: any = { status, updatedAt: new Date() };
  if (status === "completed") {
    updateData.completedAt = new Date();
  }
  return await db.update(projects).set(updateData).where(eq(projects.id, id));
}

// Project Agent Assignment
export async function assignAgentToProject(data: InsertProjectAgent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(projectAgents).values(data);
}

export async function getProjectAgents(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(projectAgents).where(eq(projectAgents.projectId, projectId));
}

// Swarm Operations
export async function createSwarmSession(data: InsertSwarmSession) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(swarmSessions).values(data);
  return result;
}

export async function getSwarmSession(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(swarmSessions).where(eq(swarmSessions.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getProjectSwarms(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(swarmSessions).where(eq(swarmSessions.projectId, projectId)).orderBy(desc(swarmSessions.createdAt));
}

export async function updateSwarmStatus(id: number, status: "forming" | "active" | "completed" | "failed") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: any = { status };
  if (status === "completed" || status === "failed") {
    updateData.completedAt = new Date();
  }
  return await db.update(swarmSessions).set(updateData).where(eq(swarmSessions.id, id));
}

// Agent Communication
export async function createAgentCommunication(data: InsertAgentCommunication) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(agentCommunications).values(data);
}

export async function getSwarmCommunications(swarmSessionId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(agentCommunications)
    .where(eq(agentCommunications.swarmSessionId, swarmSessionId))
    .orderBy(agentCommunications.createdAt);
}

// Governance Operations
export async function getAllGovernanceProposals() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(governanceProposals).orderBy(desc(governanceProposals.createdAt));
}

export async function getGovernanceProposal(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(governanceProposals).where(eq(governanceProposals.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createGovernanceProposal(data: InsertGovernanceProposal) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(governanceProposals).values(data);
}

export async function castGovernanceVote(data: InsertGovernanceVote) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Insert vote
  await db.insert(governanceVotes).values(data);
  
  // Update proposal vote counts
  const proposal = await getGovernanceProposal(data.proposalId);
  if (proposal) {
    const updateData: any = {};
    const weight = data.weight ?? 1;
    if (data.vote === "for") {
      updateData.votesFor = proposal.votesFor + weight;
    } else if (data.vote === "against") {
      updateData.votesAgainst = proposal.votesAgainst + weight;
    }
    if (Object.keys(updateData).length > 0) {
      await db.update(governanceProposals).set(updateData).where(eq(governanceProposals.id, data.proposalId));
    }
  }
}

export async function getProposalVotes(proposalId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(governanceVotes).where(eq(governanceVotes.proposalId, proposalId));
}

// Audit Trail
export async function createAuditEntry(data: InsertAuditTrail) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(auditTrail).values(data);
}

export async function getAuditTrail(entityType: string, entityId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(auditTrail)
    .where(and(eq(auditTrail.entityType, entityType), eq(auditTrail.entityId, entityId)))
    .orderBy(desc(auditTrail.createdAt));
}

// User Interactions
export async function createUserInteraction(data: InsertUserInteraction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(userInteractions).values(data);
}

export async function getUserProjectInteractions(userId: number, projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(userInteractions)
    .where(and(eq(userInteractions.userId, userId), eq(userInteractions.projectId, projectId)))
    .orderBy(userInteractions.createdAt);
}
