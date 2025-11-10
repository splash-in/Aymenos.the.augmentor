import { getDb } from "./db";
import { userProfiles, users, taskAssignments, tasks } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";

/**
 * SWOT Analysis System
 * Analyzes user capabilities and matches them to optimal tasks
 */

export interface SWOTProfile {
  userId: number;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  scores: {
    cognitive: number; // 1-100
    creativity: number;
    technical: number;
    social: number;
  };
  potentialQuotient: number; // Gap between current and max potential
  recommendedTasks: string[];
}

export interface UserBehaviorData {
  tasksCompleted: number;
  averageCompletionTime: number;
  successRate: number;
  preferredTaskTypes: string[];
  skillDemonstrated: string[];
  interactionPatterns: any;
}

/**
 * Generate comprehensive SWOT profile for a user
 */
export async function generateSWOTProfile(userId: number): Promise<SWOTProfile> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get user data
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) throw new Error("User not found");

  // Get user's task history
  const userTasks = await db
    .select()
    .from(taskAssignments)
    .where(eq(taskAssignments.assigneeId, userId));

  // Collect behavior data
  const behaviorData = await collectUserBehaviorData(userId);

  // Use AI to analyze and generate SWOT
  const swotAnalysis = await analyzeUserWithAI(user, behaviorData);

  // Calculate scores
  const scores = calculateUserScores(behaviorData);

  // Calculate potential quotient
  const potentialQuotient = calculatePotentialQuotient(scores, swotAnalysis);

  // Save to database
  const existing = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  const profileData = {
    userId,
    strengths: JSON.stringify(swotAnalysis.strengths),
    weaknesses: JSON.stringify(swotAnalysis.weaknesses),
    opportunities: JSON.stringify(swotAnalysis.opportunities),
    threats: JSON.stringify(swotAnalysis.threats),
    cognitiveScore: scores.cognitive,
    creativityScore: scores.creativity,
    technicalScore: scores.technical,
    socialScore: scores.social,
    potentialQuotient,
    preferredTaskTypes: JSON.stringify(behaviorData.preferredTaskTypes),
    skillTags: JSON.stringify(swotAnalysis.skills),
    contributionScore: behaviorData.tasksCompleted * 10,
    tasksCompleted: behaviorData.tasksCompleted,
  };

  if (existing.length > 0) {
    await db
      .update(userProfiles)
      .set(profileData)
      .where(eq(userProfiles.userId, userId));
  } else {
    await db.insert(userProfiles).values(profileData);
  }

  return {
    userId,
    strengths: swotAnalysis.strengths,
    weaknesses: swotAnalysis.weaknesses,
    opportunities: swotAnalysis.opportunities,
    threats: swotAnalysis.threats,
    scores,
    potentialQuotient,
    recommendedTasks: swotAnalysis.recommendedTasks,
  };
}

/**
 * Collect user behavior data from various sources
 */
async function collectUserBehaviorData(userId: number): Promise<UserBehaviorData> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get task assignments
  const assignments = await db
    .select()
    .from(taskAssignments)
    .where(eq(taskAssignments.assigneeId, userId));

  const completedAssignments = assignments.filter(a => a.completedAt);

  // Calculate metrics
  const tasksCompleted = completedAssignments.length;
  
  let totalTime = 0;
  for (const assignment of completedAssignments) {
    if (assignment.assignedAt && assignment.completedAt) {
      const time = assignment.completedAt.getTime() - assignment.assignedAt.getTime();
      totalTime += time;
    }
  }
  const averageCompletionTime = tasksCompleted > 0 ? totalTime / tasksCompleted / 1000 / 60 : 0; // minutes

  const successRate = tasksCompleted > 0 ? (completedAssignments.length / assignments.length) * 100 : 100;

  // Get task types
  const taskIds = assignments.map(a => a.taskId);
  const userTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, taskIds[0] || 0)); // Simplified - would need proper IN query

  const preferredTaskTypes = Array.from(new Set(userTasks.map(t => t.taskType)));

  return {
    tasksCompleted,
    averageCompletionTime,
    successRate,
    preferredTaskTypes,
    skillDemonstrated: [], // Would be extracted from task results
    interactionPatterns: {},
  };
}

/**
 * Use AI to analyze user and generate SWOT
 */
async function analyzeUserWithAI(
  user: any,
  behaviorData: UserBehaviorData
): Promise<{
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  skills: string[];
  recommendedTasks: string[];
}> {
  const prompt = `Analyze this user and generate a comprehensive SWOT profile:

User: ${user.name}
Tasks Completed: ${behaviorData.tasksCompleted}
Success Rate: ${behaviorData.successRate.toFixed(1)}%
Average Completion Time: ${behaviorData.averageCompletionTime.toFixed(1)} minutes
Preferred Task Types: ${behaviorData.preferredTaskTypes.join(", ")}

Generate:
1. Strengths (5-7 items): What this user excels at
2. Weaknesses (3-5 items): Areas for improvement
3. Opportunities (5-7 items): Growth potential and paths
4. Threats (3-5 items): Potential blockers or challenges
5. Skills (10-15 items): Specific skills demonstrated or inferred
6. Recommended Tasks (5-7 items): Task types that would maximize their potential

Return as JSON.`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are an expert psychometric analyst specializing in human potential assessment."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "swot_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            strengths: {
              type: "array",
              items: { type: "string" }
            },
            weaknesses: {
              type: "array",
              items: { type: "string" }
            },
            opportunities: {
              type: "array",
              items: { type: "string" }
            },
            threats: {
              type: "array",
              items: { type: "string" }
            },
            skills: {
              type: "array",
              items: { type: "string" }
            },
            recommendedTasks: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["strengths", "weaknesses", "opportunities", "threats", "skills", "recommendedTasks"],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0].message.content;
  if (typeof content === 'string') {
    return JSON.parse(content);
  }

  // Fallback
  return {
    strengths: ["Quick learner", "Consistent performer"],
    weaknesses: ["Limited experience"],
    opportunities: ["Skill development", "Advanced tasks"],
    threats: ["Burnout risk"],
    skills: ["Problem solving", "Pattern recognition"],
    recommendedTasks: ["Micro tasks", "Puzzle games"],
  };
}

/**
 * Calculate user capability scores
 */
function calculateUserScores(behaviorData: UserBehaviorData): {
  cognitive: number;
  creativity: number;
  technical: number;
  social: number;
} {
  // Base scores on behavior patterns
  const cognitive = Math.min(100, 50 + Math.floor(behaviorData.successRate / 2));
  
  const creativity = Math.min(100, 50 + Math.floor(
    (behaviorData.preferredTaskTypes.includes("creative") ? 30 : 0) +
    (behaviorData.tasksCompleted > 10 ? 20 : 10)
  ));

  const technical = Math.min(100, 50 + Math.floor(
    (behaviorData.preferredTaskTypes.includes("puzzle") ? 20 : 0) +
    (behaviorData.averageCompletionTime < 30 ? 30 : 10)
  ));

  const social = Math.min(100, 50 + Math.floor(
    (behaviorData.tasksCompleted > 5 ? 20 : 0) +
    (behaviorData.successRate > 80 ? 30 : 10)
  ));

  return { cognitive, creativity, technical, social };
}

/**
 * Calculate potential quotient (gap between current and max potential)
 */
function calculatePotentialQuotient(
  scores: { cognitive: number; creativity: number; technical: number; social: number },
  swotAnalysis: any
): number {
  // Average current scores
  const currentLevel = (scores.cognitive + scores.creativity + scores.technical + scores.social) / 4;

  // Estimate max potential based on opportunities
  const opportunityCount = swotAnalysis.opportunities.length;
  const maxPotential = Math.min(100, currentLevel + (opportunityCount * 5));

  // Gap is the potential quotient
  return Math.floor(maxPotential - currentLevel);
}

/**
 * Find optimal task for a user based on their SWOT profile
 */
export async function findOptimalTaskForUser(userId: number): Promise<{
  taskId: number;
  matchScore: number;
  reason: string;
} | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get user profile
  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  if (!profile) {
    // Generate profile if doesn't exist
    await generateSWOTProfile(userId);
    return findOptimalTaskForUser(userId); // Retry
  }

  // Get available tasks
  const availableTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.status, "pending"))
    .limit(100);

  if (availableTasks.length === 0) return null;

  // Find best match
  let bestMatch = null;
  let bestScore = 0;

  const userSkills: string[] = JSON.parse(profile.skillTags || "[]");

  for (const task of availableTasks) {
    const requiredSkills: string[] = JSON.parse(task.requiredSkills || "[]");
    
    // Calculate match score
    const skillMatch = calculateSkillMatchScore(userSkills, requiredSkills);
    const complexityMatch = calculateComplexityMatch(
      task.complexity,
      profile.cognitiveScore || 50
    );

    const totalScore = (skillMatch * 0.6) + (complexityMatch * 0.4);

    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestMatch = {
        taskId: task.id,
        matchScore: Math.floor(totalScore),
        reason: generateMatchReason(skillMatch, complexityMatch, task),
      };
    }
  }

  return bestMatch;
}

/**
 * Calculate skill match score
 */
function calculateSkillMatchScore(userSkills: string[], requiredSkills: string[]): number {
  if (requiredSkills.length === 0) return 50;

  let matches = 0;
  for (const required of requiredSkills) {
    if (userSkills.some(skill => 
      skill.toLowerCase().includes(required.toLowerCase()) ||
      required.toLowerCase().includes(skill.toLowerCase())
    )) {
      matches++;
    }
  }

  return Math.floor((matches / requiredSkills.length) * 100);
}

/**
 * Calculate complexity match
 */
function calculateComplexityMatch(taskComplexity: number, userCognitive: number): number {
  // Ideal match is when task complexity is slightly above user level (growth zone)
  const ideal = userCognitive + 10;
  const difference = Math.abs(taskComplexity - ideal);

  return Math.max(0, 100 - difference);
}

/**
 * Generate human-readable match reason
 */
function generateMatchReason(
  skillMatch: number,
  complexityMatch: number,
  task: any
): string {
  if (skillMatch > 80 && complexityMatch > 80) {
    return "Perfect match: Your skills align excellently with this task's requirements, and the complexity is ideal for growth.";
  } else if (skillMatch > 70) {
    return "Strong skill match: You have most of the required capabilities for this task.";
  } else if (complexityMatch > 70) {
    return "Good complexity level: This task is at the right difficulty for your current level.";
  } else {
    return "Potential growth opportunity: This task will help you develop new skills.";
  }
}

/**
 * Get user's growth trajectory
 */
export async function getUserGrowthTrajectory(userId: number): Promise<{
  currentLevel: number;
  potentialLevel: number;
  growthPath: string[];
  estimatedTimeToMax: number; // days
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  if (!profile) {
    return {
      currentLevel: 50,
      potentialLevel: 75,
      growthPath: ["Complete initial assessment", "Start with micro tasks"],
      estimatedTimeToMax: 90,
    };
  }

  const currentLevel = (
    (profile.cognitiveScore || 50) +
    (profile.creativityScore || 50) +
    (profile.technicalScore || 50) +
    (profile.socialScore || 50)
  ) / 4;

  const potentialLevel = Math.min(100, currentLevel + (profile.potentialQuotient || 20));

  const opportunities: string[] = JSON.parse(profile.opportunities || "[]");
  const growthPath = opportunities.slice(0, 5);

  // Estimate time based on current progress rate
  const tasksPerDay = (profile.tasksCompleted || 1) / 30; // Assume 30 days
  const tasksNeeded = (potentialLevel - currentLevel) * 2; // 2 tasks per level
  const estimatedTimeToMax = Math.ceil(tasksNeeded / Math.max(1, tasksPerDay));

  return {
    currentLevel: Math.floor(currentLevel),
    potentialLevel: Math.floor(potentialLevel),
    growthPath,
    estimatedTimeToMax,
  };
}
