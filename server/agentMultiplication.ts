import { getDb } from "./db";
import { agents, agentTypes, agentSpawns } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Agent Multiplication System
 * Spawns thousands of specialized agents through inheritance and evolution
 */

interface AgentCapability {
  name: string;
  level: number; // 1-100
  description: string;
}

interface SpawnConfig {
  parentAgentId: number;
  specializationFocus: string;
  mutationRate: number; // 0-100, how much to vary from parent
  targetIntelligence: number;
}

/**
 * Spawn a new agent from a parent agent
 */
export async function spawnAgent(config: SpawnConfig): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get parent agent
  const [parentAgent] = await db
    .select()
    .from(agents)
    .where(eq(agents.id, config.parentAgentId))
    .limit(1);

  if (!parentAgent) throw new Error("Parent agent not found");

  // Get parent agent type
  const [parentType] = await db
    .select()
    .from(agentTypes)
    .where(eq(agentTypes.id, parentAgent.agentTypeId))
    .limit(1);

  if (!parentType) throw new Error("Parent agent type not found");

  // Parse parent capabilities
  const parentCapabilities: AgentCapability[] = JSON.parse(parentAgent.memory || "[]");

  // Mutate capabilities based on specialization
  const childCapabilities = mutateCapabilities(
    parentCapabilities,
    config.specializationFocus,
    config.mutationRate
  );

  // Calculate child intelligence (inherit + evolve)
  const parentIntelligence = parentAgent.intelligenceLevel || 50;
  const childIntelligence = Math.min(
    100,
    Math.max(
      1,
      parentIntelligence + Math.floor((config.targetIntelligence - parentIntelligence) * 0.3)
    )
  );

  // Create child agent
  const [childAgent] = await db.insert(agents).values({
    agentTypeId: parentAgent.agentTypeId,
    name: `${parentType.name} Specialist ${Date.now()}`,
    status: "idle",
    memory: JSON.stringify(childCapabilities),
    intelligenceLevel: childIntelligence,
    learningRate: Math.min(100, (parentAgent.learningRate || 50) + Math.floor(Math.random() * 20) - 10),
    successRate: 100,
    parentAgentId: config.parentAgentId,
    generation: (parentAgent.generation || 1) + 1,
    performanceScore: 100,
    tasksCompleted: 0,
  });

  const childId = Number(childAgent.insertId);

  // Log the spawn
  await db.insert(agentSpawns).values({
    parentAgentId: config.parentAgentId,
    childAgentId: childId,
    spawnReason: `Specialized for: ${config.specializationFocus}`,
    inheritedCapabilities: parentAgent.memory || "[]",
    mutations: JSON.stringify({
      focus: config.specializationFocus,
      mutationRate: config.mutationRate,
      intelligenceDelta: childIntelligence - parentIntelligence,
    }),
  });

  return childId;
}

/**
 * Mutate capabilities based on specialization focus
 */
function mutateCapabilities(
  parentCapabilities: AgentCapability[],
  focus: string,
  mutationRate: number
): AgentCapability[] {
  const mutated = [...parentCapabilities];

  // Enhance capabilities related to focus
  mutated.forEach((cap) => {
    if (cap.name.toLowerCase().includes(focus.toLowerCase())) {
      cap.level = Math.min(100, cap.level + Math.floor((mutationRate / 100) * 30));
    } else {
      // Slightly reduce unrelated capabilities
      cap.level = Math.max(1, cap.level - Math.floor((mutationRate / 100) * 10));
    }
  });

  // Add new specialized capability
  mutated.push({
    name: `${focus} Specialization`,
    level: Math.floor(50 + (mutationRate / 100) * 50),
    description: `Advanced capability in ${focus}`,
  });

  return mutated;
}

/**
 * Mass spawn agents to reach target population
 */
export async function massSpawnAgents(
  baseAgentId: number,
  targetCount: number,
  specializations: string[]
): Promise<number[]> {
  const spawnedIds: number[] = [];

  for (let i = 0; i < targetCount; i++) {
    const specialization = specializations[i % specializations.length];
    const mutationRate = 30 + Math.floor(Math.random() * 40); // 30-70%
    const targetIntelligence = 60 + Math.floor(Math.random() * 40); // 60-100

    try {
      const childId = await spawnAgent({
        parentAgentId: baseAgentId,
        specializationFocus: specialization,
        mutationRate,
        targetIntelligence,
      });
      spawnedIds.push(childId);
    } catch (error) {
      console.error(`Failed to spawn agent ${i + 1}:`, error);
    }
  }

  return spawnedIds;
}

/**
 * Create specialized agent types from base types
 */
export async function createSpecializedAgentTypes(
  baseTypeId: number,
  specializations: string[]
): Promise<number[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get base type
  const [baseType] = await db
    .select()
    .from(agentTypes)
    .where(eq(agentTypes.id, baseTypeId))
    .limit(1);

  if (!baseType) throw new Error("Base agent type not found");

  const createdIds: number[] = [];

  for (const specialization of specializations) {
    // Parse base capabilities
    const baseCapabilities = JSON.parse(baseType.capabilities);
    
    // Create specialized capabilities
    const specializedCapabilities = [
      ...baseCapabilities,
      `Advanced ${specialization}`,
      `${specialization} Optimization`,
    ];

    // Create specialized type
    const [result] = await db.insert(agentTypes).values({
      name: `${baseType.name} - ${specialization}`,
      description: `Specialized ${baseType.name} focusing on ${specialization}`,
      icon: baseType.icon,
      capabilities: JSON.stringify(specializedCapabilities),
      color: baseType.color,
      parentTypeId: baseTypeId,
      specializationLevel: 1,
      domain: baseType.domain || baseType.name,
      skillTags: JSON.stringify([specialization, baseType.name]),
    });

    createdIds.push(Number(result.insertId));
  }

  return createdIds;
}

/**
 * Deploy a swarm of agents for a specific domain
 */
export async function deployAgentSwarm(
  domain: string,
  swarmSize: number
): Promise<{
  swarmId: string;
  agentIds: number[];
  capabilities: string[];
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Find base agent type for domain
  const baseTypes = await db
    .select()
    .from(agentTypes)
    .where(eq(agentTypes.domain, domain))
    .limit(1);

  if (baseTypes.length === 0) {
    throw new Error(`No base agent type found for domain: ${domain}`);
  }

  const baseType = baseTypes[0];

  // Create base agent
  const [baseAgent] = await db.insert(agents).values({
    agentTypeId: baseType.id,
    name: `${domain} Swarm Leader`,
    status: "active",
    memory: baseType.capabilities,
    intelligenceLevel: 80,
    learningRate: 70,
    successRate: 100,
    generation: 1,
    performanceScore: 100,
    tasksCompleted: 0,
  });

  const baseAgentId = Number(baseAgent.insertId);

  // Define specializations for this domain
  const specializations = generateSpecializations(domain, swarmSize);

  // Mass spawn specialized agents
  const spawnedIds = await massSpawnAgents(baseAgentId, swarmSize - 1, specializations);

  const allAgentIds = [baseAgentId, ...spawnedIds];

  return {
    swarmId: `${domain}-swarm-${Date.now()}`,
    agentIds: allAgentIds,
    capabilities: specializations,
  };
}

/**
 * Generate specializations for a domain
 */
function generateSpecializations(domain: string, count: number): string[] {
  const specializationMap: Record<string, string[]> = {
    Developer: [
      "Frontend", "Backend", "Full-Stack", "Mobile", "DevOps", "Database",
      "API Design", "Security", "Testing", "Performance", "Cloud", "Microservices",
      "UI/UX", "Data Structures", "Algorithms", "System Design", "Architecture",
      "Code Review", "Debugging", "Refactoring", "Documentation"
    ],
    DevOps: [
      "CI/CD", "Kubernetes", "Docker", "AWS", "Azure", "GCP", "Terraform",
      "Ansible", "Jenkins", "Monitoring", "Logging", "Security", "Networking",
      "Load Balancing", "Auto-scaling", "Disaster Recovery", "Backup"
    ],
    Accountant: [
      "Tax", "Audit", "Payroll", "Budgeting", "Forecasting", "Analysis",
      "Compliance", "Reporting", "Cost Control", "Investment", "Risk Management"
    ],
    "Game Designer": [
      "Mechanics", "Narrative", "Level Design", "Character Design", "UI/UX",
      "Monetization", "Balance", "Progression", "Economy", "Social Features"
    ],
    Politician: [
      "Policy", "Legislation", "Diplomacy", "Public Relations", "Campaign",
      "Governance", "Ethics", "Economics", "Social Issues", "Environment"
    ],
    Lawyer: [
      "Corporate", "Criminal", "Civil", "IP", "Contract", "Litigation",
      "Compliance", "Regulatory", "International", "Tax Law"
    ],
    Doctor: [
      "Diagnosis", "Treatment", "Surgery", "Pediatrics", "Cardiology",
      "Neurology", "Oncology", "Emergency", "Preventive", "Research"
    ],
    "Mechanical Engineer": [
      "CAD", "FEA", "CFD", "Manufacturing", "Materials", "Thermodynamics",
      "Robotics", "Automation", "HVAC", "Automotive", "Aerospace"
    ],
    Psychotherapist: [
      "CBT", "Trauma", "Anxiety", "Depression", "Relationships", "Addiction",
      "Child Psychology", "Group Therapy", "Crisis Intervention"
    ],
    Tutor: [
      "Math", "Science", "Language", "History", "Programming", "Music",
      "Art", "Test Prep", "Study Skills", "Special Needs"
    ],
  };

  const specializations = specializationMap[domain] || ["General", "Advanced", "Expert"];
  
  // Repeat specializations if needed to reach count
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(specializations[i % specializations.length]);
  }

  return result;
}

/**
 * Get agent lineage (family tree)
 */
export async function getAgentLineage(agentId: number): Promise<any> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [agent] = await db
    .select()
    .from(agents)
    .where(eq(agents.id, agentId))
    .limit(1);

  if (!agent) return null;

  // Get children
  const children = await db
    .select()
    .from(agents)
    .where(eq(agents.parentAgentId, agentId));

  // Get spawn history
  const spawns = await db
    .select()
    .from(agentSpawns)
    .where(eq(agentSpawns.parentAgentId, agentId));

  return {
    agent,
    generation: agent.generation,
    childCount: children.length,
    children: children.map((c) => ({ id: c.id, name: c.name, generation: c.generation })),
    spawnHistory: spawns,
  };
}
