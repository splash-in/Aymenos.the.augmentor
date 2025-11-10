import { getDb } from "./db";
import { connectedDevices, taskAssignments, tasks, auditTrail } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import * as crypto from "crypto";

/**
 * Distributed Computing Network
 * Blockchain-based system for utilizing any connected smart device globally
 */

export interface DeviceCapabilities {
  cpu: number; // 1-100
  memory: number; // GB
  storage: number; // GB
  gpu: boolean;
  network: "slow" | "medium" | "fast";
  battery: boolean;
  sensors: string[];
}

export interface BlockchainBlock {
  index: number;
  timestamp: number;
  data: any;
  previousHash: string;
  hash: string;
  nonce: number;
}

export interface TaskDistributionRecord {
  taskId: number;
  deviceId: string;
  assignedAt: number;
  completedAt?: number;
  verified: boolean;
  contributionScore: number;
}

/**
 * Register a new device in the network
 */
export async function registerDevice(
  userId: number,
  deviceId: string,
  deviceType: string,
  capabilities: DeviceCapabilities
): Promise<{
  registered: boolean;
  deviceId: string;
  computePower: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Calculate compute power score
  const computePower = calculateComputePower(capabilities);

  // Check if device already exists
  const existing = await db
    .select()
    .from(connectedDevices)
    .where(eq(connectedDevices.deviceId, deviceId))
    .limit(1);

  if (existing.length > 0) {
    // Update existing device
    await db
      .update(connectedDevices)
      .set({
        status: "online",
        capabilities: JSON.stringify(capabilities),
        computePower,
        lastSeenAt: new Date(),
      })
      .where(eq(connectedDevices.deviceId, deviceId));
  } else {
    // Register new device
    await db.insert(connectedDevices).values({
      userId,
      deviceId,
      deviceType,
      capabilities: JSON.stringify(capabilities),
      computePower,
      status: "online",
      tasksCompleted: 0,
      contributionScore: 0,
    });
  }

  // Log to audit trail
  await logToBlockchain({
    action: "device_registered",
    entityType: "device",
    entityId: deviceId,
    userId,
    details: JSON.stringify({ deviceType, computePower }),
  });

  return {
    registered: true,
    deviceId,
    computePower,
  };
}

/**
 * Calculate device compute power score
 */
function calculateComputePower(capabilities: DeviceCapabilities): number {
  let score = 0;

  // CPU contribution (40%)
  score += capabilities.cpu * 0.4;

  // Memory contribution (20%)
  score += Math.min(100, (capabilities.memory / 16) * 100) * 0.2;

  // GPU contribution (20%)
  score += capabilities.gpu ? 20 : 0;

  // Network contribution (15%)
  const networkScores = { slow: 5, medium: 10, fast: 15 };
  score += networkScores[capabilities.network];

  // Battery bonus (5%)
  score += capabilities.battery ? 5 : 0;

  return Math.min(100, Math.floor(score));
}

/**
 * Find best device for a task
 */
export async function findBestDevice(
  taskId: number
): Promise<{
  deviceId: string;
  computePower: number;
  matchScore: number;
} | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get task requirements
  const [task] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1);

  if (!task) return null;

  // Get available devices
  const availableDevices = await db
    .select()
    .from(connectedDevices)
    .where(eq(connectedDevices.status, "online"));

  if (availableDevices.length === 0) return null;

  // Find best match
  let bestDevice = null;
  let bestScore = 0;

  for (const device of availableDevices) {
    const capabilities: DeviceCapabilities = JSON.parse(device.capabilities || "{}");
    const matchScore = calculateTaskDeviceMatch(task.complexity, capabilities, device.computePower || 50);

    if (matchScore > bestScore) {
      bestScore = matchScore;
      bestDevice = {
        deviceId: device.deviceId,
        computePower: device.computePower || 50,
        matchScore,
      };
    }
  }

  return bestDevice;
}

/**
 * Calculate how well a device matches a task
 */
function calculateTaskDeviceMatch(
  taskComplexity: number,
  capabilities: DeviceCapabilities,
  computePower: number
): number {
  // Simple matching: higher compute power for higher complexity
  const powerMatch = 100 - Math.abs(taskComplexity - computePower);

  // Network speed bonus for collaborative tasks
  const networkBonus = capabilities.network === "fast" ? 10 : 0;

  return Math.min(100, powerMatch + networkBonus);
}

/**
 * Assign task to device
 */
export async function assignTaskToDevice(
  taskId: number,
  deviceId: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get device
  const [device] = await db
    .select()
    .from(connectedDevices)
    .where(eq(connectedDevices.deviceId, deviceId))
    .limit(1);

  if (!device) return false;

  // Create assignment
  await db.insert(taskAssignments).values({
    taskId,
    assigneeType: "device",
    assigneeId: device.id,
  });

  // Update device status
  await db
    .update(connectedDevices)
    .set({ status: "busy" })
    .where(eq(connectedDevices.deviceId, deviceId));

  // Update task status
  await db
    .update(tasks)
    .set({ status: "assigned" })
    .where(eq(tasks.id, taskId));

  // Log to blockchain
  await logToBlockchain({
    action: "task_assigned",
    entityType: "task",
    entityId: taskId,
    userId: device.userId || 0,
    details: JSON.stringify({ deviceId, taskId }),
  });

  return true;
}

/**
 * Verify task completion using consensus
 */
export async function verifyTaskCompletion(
  taskId: number,
  result: string
): Promise<{
  verified: boolean;
  consensusScore: number;
}> {
  // In a real blockchain system, this would involve:
  // 1. Multiple nodes verifying the result
  // 2. Consensus algorithm (e.g., proof of work, proof of stake)
  // 3. Block creation and chain validation

  // Simplified verification for MVP
  const consensusScore = 100; // Assume verified for now

  // Log verification to blockchain
  await logToBlockchain({
    action: "task_verified",
    entityType: "task",
    entityId: taskId,
    userId: 0,
    details: JSON.stringify({ result, consensusScore }),
  });

  return {
    verified: true,
    consensusScore,
  };
}

/**
 * Complete task on device and update contribution
 */
export async function completeTaskOnDevice(
  taskId: number,
  deviceId: string,
  result: string
): Promise<{
  completed: boolean;
  contributionScore: number;
  blockchainHash: string;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verify completion
  const verification = await verifyTaskCompletion(taskId, result);

  if (!verification.verified) {
    return {
      completed: false,
      contributionScore: 0,
      blockchainHash: "",
    };
  }

  // Get device
  const [device] = await db
    .select()
    .from(connectedDevices)
    .where(eq(connectedDevices.deviceId, deviceId))
    .limit(1);

  if (!device) throw new Error("Device not found");

  // Calculate contribution score
  const [task] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1);

  const contributionScore = task ? Math.floor(task.complexity * 1.5) : 50;

  // Update task
  await db
    .update(tasks)
    .set({
      status: "completed",
      result,
    })
    .where(eq(tasks.id, taskId));

  // Update assignment
  await db
    .update(taskAssignments)
    .set({
      completedAt: new Date(),
      contributionScore,
    })
    .where(and(
      eq(taskAssignments.taskId, taskId),
      eq(taskAssignments.assigneeId, device.id)
    ));

  // Update device
  await db
    .update(connectedDevices)
    .set({
      status: "online",
      tasksCompleted: (device.tasksCompleted || 0) + 1,
      contributionScore: (device.contributionScore || 0) + contributionScore,
    })
    .where(eq(connectedDevices.deviceId, deviceId));

  // Create blockchain record
  const blockchainHash = await logToBlockchain({
    action: "task_completed",
    entityType: "task",
    entityId: taskId,
    userId: device.userId || 0,
    details: JSON.stringify({
      deviceId,
      result,
      contributionScore,
      verified: true,
    }),
  });

  return {
    completed: true,
    contributionScore,
    blockchainHash,
  };
}

/**
 * Log action to blockchain (audit trail)
 */
async function logToBlockchain(data: {
  action: string;
  entityType: string;
  entityId: number | string;
  userId: number;
  details: string;
}): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Create hash of the data
  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify(data) + Date.now())
    .digest("hex");

  // Store in audit trail (our blockchain)
  await db.insert(auditTrail).values({
    action: data.action,
    entityType: data.entityType,
    entityId: typeof data.entityId === 'number' ? data.entityId : 0,
    performedBy: data.userId,
    performerType: "system",
    details: data.details,
    blockchainHash: hash,
  });

  return hash;
}

/**
 * Get device contribution leaderboard
 */
export async function getDeviceLeaderboard(limit: number = 100): Promise<Array<{
  deviceId: string;
  deviceType: string;
  contributionScore: number;
  tasksCompleted: number;
  rank: number;
}>> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const devices = await db
    .select()
    .from(connectedDevices)
    .orderBy(connectedDevices.contributionScore)
    .limit(limit);

  return devices.map((device, index) => ({
    deviceId: device.deviceId,
    deviceType: device.deviceType,
    contributionScore: device.contributionScore || 0,
    tasksCompleted: device.tasksCompleted || 0,
    rank: index + 1,
  }));
}

/**
 * Get network statistics
 */
export async function getNetworkStats(): Promise<{
  totalDevices: number;
  onlineDevices: number;
  totalComputePower: number;
  tasksCompleted: number;
  totalContribution: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const allDevices = await db.select().from(connectedDevices);

  const totalDevices = allDevices.length;
  const onlineDevices = allDevices.filter(d => d.status === "online").length;
  const totalComputePower = allDevices.reduce((sum, d) => sum + (d.computePower || 0), 0);
  const tasksCompleted = allDevices.reduce((sum, d) => sum + (d.tasksCompleted || 0), 0);
  const totalContribution = allDevices.reduce((sum, d) => sum + (d.contributionScore || 0), 0);

  return {
    totalDevices,
    onlineDevices,
    totalComputePower,
    tasksCompleted,
    totalContribution,
  };
}

/**
 * Distribute tasks across available devices
 */
export async function distributeTasksToNetwork(projectId: number): Promise<{
  distributed: number;
  pending: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get pending tasks for project
  const pendingTasks = await db
    .select()
    .from(tasks)
    .where(and(
      eq(tasks.projectId, projectId),
      eq(tasks.status, "pending")
    ));

  let distributed = 0;

  for (const task of pendingTasks) {
    const bestDevice = await findBestDevice(task.id);
    if (bestDevice) {
      const assigned = await assignTaskToDevice(task.id, bestDevice.deviceId);
      if (assigned) distributed++;
    }
  }

  return {
    distributed,
    pending: pendingTasks.length - distributed,
  };
}
