import { getDb } from "./db";
import { tasks, taskAssignments, skillChains, agents, userProfiles } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";

/**
 * Hierarchical Task Engine
 * Decomposes complex tasks into micro-tasks and creates gamified interfaces
 */

export interface TaskDecomposition {
  parentTask: string;
  microTasks: MicroTask[];
  skillChain: SkillChainLink[];
}

export interface MicroTask {
  title: string;
  description: string;
  complexity: number; // 1-100
  requiredSkills: string[];
  gamifiedInterface: GameInterface;
  estimatedTime: number; // minutes
}

export interface GameInterface {
  gameType: "puzzle" | "matching" | "building" | "sorting" | "strategy" | "creative";
  theme: string;
  instructions: string;
  visualElements: string[];
  rewardMechanism: string;
  difficultyLevel: number; // 1-10
}

export interface SkillChainLink {
  sourceTask: string;
  targetTask: string;
  dataType: string;
  transformation: string;
}

/**
 * Decompose a complex task into micro-tasks using AI
 */
export async function decomposeTask(
  taskDescription: string,
  targetComplexity: number = 30,
  maxMicroTasks: number = 50
): Promise<TaskDecomposition> {
  const prompt = `You are the AYMENOS task decomposition engine. Break down this complex task into ${maxMicroTasks} micro-tasks that can be completed by humans through gamified interfaces.

Task: ${taskDescription}

Target complexity per micro-task: ${targetComplexity}/100 (lower is simpler)

For each micro-task, create:
1. Title (concise, action-oriented)
2. Description (what needs to be done)
3. Complexity score (1-100)
4. Required skills (array of skill tags)
5. Gamified interface config:
   - gameType: puzzle/matching/building/sorting/strategy/creative
   - theme: visual theme for the game
   - instructions: how to play
   - visualElements: what the user sees
   - rewardMechanism: how they get feedback
   - difficultyLevel: 1-10
6. Estimated time in minutes

Also create a skill chain showing how outputs from simpler tasks become inputs for more complex ones.

Return as JSON.`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are a master task decomposition AI. You break complex work into simple, engaging micro-tasks that feel like games."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "task_decomposition",
        strict: true,
        schema: {
          type: "object",
          properties: {
            parentTask: { type: "string" },
            microTasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  complexity: { type: "integer" },
                  requiredSkills: {
                    type: "array",
                    items: { type: "string" }
                  },
                  gamifiedInterface: {
                    type: "object",
                    properties: {
                      gameType: { type: "string" },
                      theme: { type: "string" },
                      instructions: { type: "string" },
                      visualElements: {
                        type: "array",
                        items: { type: "string" }
                      },
                      rewardMechanism: { type: "string" },
                      difficultyLevel: { type: "integer" }
                    },
                    required: ["gameType", "theme", "instructions", "visualElements", "rewardMechanism", "difficultyLevel"],
                    additionalProperties: false
                  },
                  estimatedTime: { type: "integer" }
                },
                required: ["title", "description", "complexity", "requiredSkills", "gamifiedInterface", "estimatedTime"],
                additionalProperties: false
              }
            },
            skillChain: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  sourceTask: { type: "string" },
                  targetTask: { type: "string" },
                  dataType: { type: "string" },
                  transformation: { type: "string" }
                },
                required: ["sourceTask", "targetTask", "dataType", "transformation"],
                additionalProperties: false
              }
            }
          },
          required: ["parentTask", "microTasks", "skillChain"],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0].message.content;
  if (typeof content === 'string') {
    return JSON.parse(content);
  }

  throw new Error("Failed to decompose task");
}

/**
 * Create tasks in database from decomposition
 */
export async function createTaskHierarchy(
  projectId: number,
  decomposition: TaskDecomposition
): Promise<number[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Create parent task
  const [parentResult] = await db.insert(tasks).values({
    projectId,
    title: decomposition.parentTask,
    description: "Parent task - automatically decomposed",
    taskType: "epic",
    complexity: 100,
    requiredSkills: JSON.stringify([]),
    status: "pending",
  });

  const parentTaskId = Number(parentResult.insertId);
  const createdTaskIds: number[] = [parentTaskId];

  // Create micro-tasks
  for (const microTask of decomposition.microTasks) {
    const [result] = await db.insert(tasks).values({
      parentTaskId,
      projectId,
      title: microTask.title,
      description: microTask.description,
      taskType: microTask.complexity < 20 ? "micro" : microTask.complexity < 40 ? "small" : "medium",
      complexity: microTask.complexity,
      requiredSkills: JSON.stringify(microTask.requiredSkills),
      status: "pending",
      gamifiedInterface: JSON.stringify(microTask.gamifiedInterface),
    });

    createdTaskIds.push(Number(result.insertId));
  }

  // Create skill chains
  for (const link of decomposition.skillChain) {
    // Find task IDs by title (simplified - in production use better matching)
    const sourceTaskIndex = decomposition.microTasks.findIndex(t => t.title === link.sourceTask);
    const targetTaskIndex = decomposition.microTasks.findIndex(t => t.title === link.targetTask);

    if (sourceTaskIndex >= 0 && targetTaskIndex >= 0) {
      await db.insert(skillChains).values({
        sourceTaskId: createdTaskIds[sourceTaskIndex + 1], // +1 because parent is at index 0
        targetTaskId: createdTaskIds[targetTaskIndex + 1],
        dataFlow: JSON.stringify({
          dataType: link.dataType,
          transformation: link.transformation,
        }),
      });
    }
  }

  return createdTaskIds;
}

/**
 * Match a task to the best assignee (agent, user, or device)
 */
export async function matchTaskToAssignee(taskId: number): Promise<{
  assigneeType: "agent" | "user" | "device";
  assigneeId: number;
  matchScore: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get task
  const [task] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1);

  if (!task) throw new Error("Task not found");

  const requiredSkills: string[] = JSON.parse(task.requiredSkills || "[]");

  // Find best matching agent
  const availableAgents = await db
    .select()
    .from(agents)
    .where(eq(agents.status, "idle"));

  let bestMatch = {
    assigneeType: "agent" as const,
    assigneeId: 0,
    matchScore: 0,
  };

  for (const agent of availableAgents) {
    const agentCapabilities: string[] = JSON.parse(agent.memory || "[]");
    const matchScore = calculateSkillMatch(requiredSkills, agentCapabilities);

    if (matchScore > bestMatch.matchScore) {
      bestMatch = {
        assigneeType: "agent",
        assigneeId: agent.id,
        matchScore,
      };
    }
  }

  return bestMatch;
}

/**
 * Calculate skill match score
 */
function calculateSkillMatch(required: string[], available: string[]): number {
  if (required.length === 0) return 50;

  let matches = 0;
  for (const skill of required) {
    if (available.some(a => a.toLowerCase().includes(skill.toLowerCase()))) {
      matches++;
    }
  }

  return Math.floor((matches / required.length) * 100);
}

/**
 * Assign a task to an assignee
 */
export async function assignTask(
  taskId: number,
  assigneeType: "agent" | "user" | "device",
  assigneeId: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Create assignment
  await db.insert(taskAssignments).values({
    taskId,
    assigneeType,
    assigneeId,
  });

  // Update task status
  await db
    .update(tasks)
    .set({ status: "assigned" })
    .where(eq(tasks.id, taskId));

  // Update assignee status
  if (assigneeType === "agent") {
    await db
      .update(agents)
      .set({ status: "busy", currentTask: `Task ${taskId}` })
      .where(eq(agents.id, assigneeId));
  }
}

/**
 * Complete a task and trigger skill chain
 */
export async function completeTask(
  taskId: number,
  result: string
): Promise<{
  completed: boolean;
  nextTasks: number[];
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Update task
  await db
    .update(tasks)
    .set({
      status: "completed",
      result,
    })
    .where(eq(tasks.id, taskId));

  // Update assignment
  const [assignment] = await db
    .select()
    .from(taskAssignments)
    .where(eq(taskAssignments.taskId, taskId))
    .limit(1);

  if (assignment) {
    await db
      .update(taskAssignments)
      .set({
        completedAt: new Date(),
        contributionScore: 100,
      })
      .where(eq(taskAssignments.id, assignment.id));

    // Update assignee
    if (assignment.assigneeType === "agent") {
      const [agent] = await db
        .select()
        .from(agents)
        .where(eq(agents.id, assignment.assigneeId))
        .limit(1);

      if (agent) {
        await db
          .update(agents)
          .set({
            status: "idle",
            currentTask: null,
            tasksCompleted: (agent.tasksCompleted || 0) + 1,
            intelligenceLevel: Math.min(100, (agent.intelligenceLevel || 50) + 1),
          })
          .where(eq(agents.id, assignment.assigneeId));
      }
    }
  }

  // Find dependent tasks in skill chain
  const dependentChains = await db
    .select()
    .from(skillChains)
    .where(eq(skillChains.sourceTaskId, taskId));

  const nextTaskIds = dependentChains.map(chain => chain.targetTaskId);

  // Auto-assign next tasks
  for (const nextTaskId of nextTaskIds) {
    const match = await matchTaskToAssignee(nextTaskId);
    if (match.assigneeId > 0) {
      await assignTask(nextTaskId, match.assigneeType, match.assigneeId);
    }
  }

  return {
    completed: true,
    nextTasks: nextTaskIds,
  };
}

/**
 * Get task progress for a project
 */
export async function getProjectTaskProgress(projectId: number): Promise<{
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  percentage: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const projectTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, projectId));

  const total = projectTasks.length;
  const completed = projectTasks.filter(t => t.status === "completed").length;
  const inProgress = projectTasks.filter(t => t.status === "in_progress" || t.status === "assigned").length;
  const pending = projectTasks.filter(t => t.status === "pending").length;

  return {
    total,
    completed,
    inProgress,
    pending,
    percentage: total > 0 ? Math.floor((completed / total) * 100) : 0,
  };
}
