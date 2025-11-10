import { getDb } from "./db";
import {
  buildChains,
  chainLinks,
  skillAssessments,
  handoffRequests,
  contributionCredits,
  agents,
  userProfiles,
} from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";
import * as agentMultiplication from "./agentMultiplication";

/**
 * Build & Pass Engine
 * Revolutionary system where anyone can start building and work passes to more skilled contributors
 */

export interface BuildChainStart {
  userId: number;
  title: string;
  description: string;
  projectType: string;
  initialIdea: string;
}

export interface ContributionSubmission {
  chainId: number;
  userId: number;
  workDescription: string;
  workOutput: string;
  timeSpent: number;
}

export interface SkillGapAnalysis {
  userCanDo: string[];
  userCantDo: string[];
  suggestedHandoff: boolean;
  nextSkillLevel: number;
  recommendedContributor: {
    type: "user" | "agent";
    id: number;
    name: string;
    matchScore: number;
  } | null;
}

/**
 * Start a new build chain - anyone can start anything
 */
export async function startBuildChain(input: BuildChainStart): Promise<{
  chainId: number;
  initialTasks: any[];
  yourTasks: any[];
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Create the build chain
  const [result] = await db.insert(buildChains).values({
    originalCreatorId: input.userId,
    title: input.title,
    description: input.description,
    projectType: input.projectType,
    currentOwnerId: input.userId,
    status: "in_progress",
    totalContributors: 1,
    completionPercentage: 0,
  });

  const chainId = Number(result.insertId);

  // Use AI to decompose into tasks and identify what user CAN do
  const decomposition = await analyzeAndDecompose(input.initialIdea, input.userId);

  // Create initial chain link for user
  await db.insert(chainLinks).values({
    chainId,
    contributorId: input.userId,
    contributorType: "user",
    linkOrder: 1,
    contributionType: "ideation",
    skillLevelRequired: 10, // Starting point
    workDescription: "Project initiation and initial concept",
    workOutput: input.description,
    completionPercentage: 5,
    status: "in_progress",
  });

  return {
    chainId,
    initialTasks: decomposition.allTasks,
    yourTasks: decomposition.userTasks,
  };
}

/**
 * Analyze project and decompose into tasks matched to user skill
 */
async function analyzeAndDecompose(
  projectIdea: string,
  userId: number
): Promise<{
  allTasks: any[];
  userTasks: any[];
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get user's skill profile
  const userSkills = await db
    .select()
    .from(skillAssessments)
    .where(eq(skillAssessments.userId, userId));

  const skillLevels = userSkills.reduce((acc, skill) => {
    acc[skill.skillCategory] = skill.proficiencyLevel;
    return acc;
  }, {} as Record<string, number>);

  // Use AI to decompose and match tasks
  const prompt = `Analyze this project idea and break it into progressive tasks, from simple to complex.
For each task, identify:
1. What needs to be done
2. Skill level required (1-100)
3. Skill category (design, coding, research, writing, etc.)
4. Estimated time
5. Dependencies

Project: ${projectIdea}

User's current skills: ${JSON.stringify(skillLevels)}

Return tasks that match user's level AND tasks that require higher skills (for handoff).`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are the AYMENOS Build & Pass analyzer. Break projects into progressive skill-matched tasks."
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
            allTasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  skillLevel: { type: "integer" },
                  skillCategory: { type: "string" },
                  estimatedMinutes: { type: "integer" },
                  userCanDo: { type: "boolean" }
                },
                required: ["title", "description", "skillLevel", "skillCategory", "estimatedMinutes", "userCanDo"],
                additionalProperties: false
              }
            }
          },
          required: ["allTasks"],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0].message.content;
  const decomposition = typeof content === 'string' ? JSON.parse(content) : { allTasks: [] };

  const userTasks = decomposition.allTasks.filter((t: any) => t.userCanDo);

  return {
    allTasks: decomposition.allTasks,
    userTasks,
  };
}

/**
 * Submit work contribution and analyze if handoff is needed
 */
export async function submitContribution(input: ContributionSubmission): Promise<{
  accepted: boolean;
  skillGapAnalysis: SkillGapAnalysis;
  shouldHandoff: boolean;
  nextSteps: string;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get current chain link
  const [currentLink] = await db
    .select()
    .from(chainLinks)
    .where(and(
      eq(chainLinks.chainId, input.chainId),
      eq(chainLinks.contributorId, input.userId),
      eq(chainLinks.status, "in_progress")
    ))
    .limit(1);

  if (!currentLink) {
    throw new Error("No active contribution found");
  }

  // Analyze the work quality and skill demonstration
  const skillGapAnalysis = await analyzeContributionSkills(
    input.workOutput,
    input.workDescription,
    input.userId
  );

  // Update chain link
  await db
    .update(chainLinks)
    .set({
      workOutput: input.workOutput,
      timeSpent: input.timeSpent,
      status: skillGapAnalysis.suggestedHandoff ? "handed_off" : "completed",
      completedAt: new Date(),
    })
    .where(eq(chainLinks.id, currentLink.id));

  // Update skill assessments based on observed work
  await updateSkillAssessments(input.userId, skillGapAnalysis.userCanDo);

  // If handoff suggested, create handoff request
  if (skillGapAnalysis.suggestedHandoff && skillGapAnalysis.recommendedContributor) {
    await createHandoffRequest({
      chainId: input.chainId,
      fromUserId: input.userId,
      toContributor: skillGapAnalysis.recommendedContributor,
      requiredSkills: skillGapAnalysis.userCantDo,
      workContext: input.workOutput,
    });
  }

  return {
    accepted: true,
    skillGapAnalysis,
    shouldHandoff: skillGapAnalysis.suggestedHandoff,
    nextSteps: skillGapAnalysis.suggestedHandoff
      ? `Great work! Your contribution is complete. We're passing the next phase to ${skillGapAnalysis.recommendedContributor?.name || 'a more experienced contributor'}.`
      : "Excellent! You can continue with the next task.",
  };
}

/**
 * Analyze contribution to detect skills and gaps
 */
async function analyzeContributionSkills(
  workOutput: string,
  workDescription: string,
  userId: number
): Promise<SkillGapAnalysis> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Use AI to analyze the work
  const prompt = `Analyze this work contribution and identify:
1. What skills the user demonstrated (userCanDo)
2. What skills are needed next but user likely can't do (userCantDo)
3. Whether handoff is recommended
4. Next skill level required

Work description: ${workDescription}
Work output: ${workOutput}

Be encouraging but realistic about skill gaps.`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are an expert skill assessor for the Build & Pass system. Identify demonstrated skills and gaps."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "skill_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            userCanDo: {
              type: "array",
              items: { type: "string" }
            },
            userCantDo: {
              type: "array",
              items: { type: "string" }
            },
            suggestedHandoff: { type: "boolean" },
            nextSkillLevel: { type: "integer" }
          },
          required: ["userCanDo", "userCantDo", "suggestedHandoff", "nextSkillLevel"],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0].message.content;
  const analysis = typeof content === 'string' ? JSON.parse(content) : {
    userCanDo: [],
    userCantDo: [],
    suggestedHandoff: false,
    nextSkillLevel: 50
  };

  // Find next contributor if handoff needed
  let recommendedContributor = null;
  if (analysis.suggestedHandoff) {
    recommendedContributor = await findNextContributor(
      analysis.userCantDo,
      analysis.nextSkillLevel
    );
  }

  return {
    ...analysis,
    recommendedContributor,
  };
}

/**
 * Find the best next contributor (human or AI agent)
 */
async function findNextContributor(
  requiredSkills: string[],
  skillLevel: number
): Promise<{
  type: "user" | "agent";
  id: number;
  name: string;
  matchScore: number;
} | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // First try to find a human contributor
  const potentialUsers = await db
    .select()
    .from(userProfiles)
    .limit(100);

  let bestMatch: any = null;
  let bestScore = 0;

  for (const profile of potentialUsers) {
    const userSkills: string[] = JSON.parse(profile.skillTags || "[]");
    let matchCount = 0;

    for (const required of requiredSkills) {
      if (userSkills.some(s => s.toLowerCase().includes(required.toLowerCase()))) {
        matchCount++;
      }
    }

    const matchScore = (matchCount / requiredSkills.length) * 100;

    // Check if skill level is appropriate
    const avgScore = (
      (profile.cognitiveScore || 50) +
      (profile.technicalScore || 50)
    ) / 2;

    if (matchScore > bestScore && avgScore >= skillLevel - 20) {
      bestScore = matchScore;
      bestMatch = {
        type: "user" as const,
        id: profile.userId,
        name: `User ${profile.userId}`,
        matchScore: Math.floor(matchScore),
      };
    }
  }

  // If no good human match, use AI agent
  if (bestScore < 60) {
    // Find appropriate agent type
    const availableAgents = await db
      .select()
      .from(agents)
      .where(eq(agents.status, "idle"))
      .limit(10);

    for (const agent of availableAgents) {
      const agentCapabilities = JSON.parse(agent.memory || "[]");
      let matchCount = 0;

      for (const required of requiredSkills) {
        if (agentCapabilities.some((c: any) => 
          c.name?.toLowerCase().includes(required.toLowerCase())
        )) {
          matchCount++;
        }
      }

      const matchScore = (matchCount / requiredSkills.length) * 100;

      if (matchScore > bestScore) {
        bestScore = matchScore;
        bestMatch = {
          type: "agent" as const,
          id: agent.id,
          name: agent.name,
          matchScore: Math.floor(matchScore),
        };
      }
    }
  }

  return bestMatch;
}

/**
 * Create handoff request
 */
async function createHandoffRequest(input: {
  chainId: number;
  fromUserId: number;
  toContributor: { type: "user" | "agent"; id: number };
  requiredSkills: string[];
  workContext: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(handoffRequests).values({
    chainId: input.chainId,
    fromUserId: input.fromUserId,
    toUserId: input.toContributor.type === "user" ? input.toContributor.id : null,
    toAgentId: input.toContributor.type === "agent" ? input.toContributor.id : null,
    requiredSkills: JSON.stringify(input.requiredSkills),
    workContext: input.workContext,
    urgency: "medium",
    status: input.toContributor.type === "agent" ? "auto_assigned" : "pending",
  });

  // If agent, automatically accept and create next link
  if (input.toContributor.type === "agent") {
    await acceptHandoff({
      chainId: input.chainId,
      contributorType: "agent",
      contributorId: input.toContributor.id,
    });
  }
}

/**
 * Accept a handoff and create next chain link
 */
export async function acceptHandoff(input: {
  chainId: number;
  contributorType: "user" | "agent";
  contributorId: number;
}): Promise<{
  linkId: number;
  workDescription: string;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get chain info
  const [chain] = await db
    .select()
    .from(buildChains)
    .where(eq(buildChains.id, input.chainId))
    .limit(1);

  if (!chain) throw new Error("Chain not found");

  // Get previous link
  const previousLinks = await db
    .select()
    .from(chainLinks)
    .where(eq(chainLinks.chainId, input.chainId))
    .orderBy(desc(chainLinks.linkOrder))
    .limit(1);

  const nextOrder = previousLinks.length > 0 ? previousLinks[0].linkOrder + 1 : 1;

  // Create new link
  const [result] = await db.insert(chainLinks).values({
    chainId: input.chainId,
    contributorId: input.contributorId,
    contributorType: input.contributorType,
    linkOrder: nextOrder,
    contributionType: "development",
    skillLevelRequired: 60,
    workDescription: "Continue building from previous contribution",
    completionPercentage: 20,
    status: "in_progress",
  });

  // Update chain
  await db
    .update(buildChains)
    .set({
      currentOwnerId: input.contributorType === "user" ? input.contributorId : null,
      totalContributors: chain.totalContributors + 1,
    })
    .where(eq(buildChains.id, input.chainId));

  return {
    linkId: Number(result.insertId),
    workDescription: "Continue building from previous contribution",
  };
}

/**
 * Update skill assessments based on observed work
 */
async function updateSkillAssessments(
  userId: number,
  demonstratedSkills: string[]
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  for (const skill of demonstratedSkills) {
    // Check if assessment exists
    const existing = await db
      .select()
      .from(skillAssessments)
      .where(and(
        eq(skillAssessments.userId, userId),
        eq(skillAssessments.skillCategory, skill)
      ))
      .limit(1);

    if (existing.length > 0) {
      // Increase proficiency
      const newLevel = Math.min(100, (existing[0].proficiencyLevel || 50) + 5);
      await db
        .update(skillAssessments)
        .set({
          proficiencyLevel: newLevel,
          confidenceScore: Math.min(100, (existing[0].confidenceScore || 50) + 10),
          lastAssessedAt: new Date(),
        })
        .where(eq(skillAssessments.id, existing[0].id));
    } else {
      // Create new assessment
      await db.insert(skillAssessments).values({
        userId,
        skillCategory: skill,
        proficiencyLevel: 40,
        confidenceScore: 70,
        assessmentMethod: "observed",
        evidence: JSON.stringify(["Build & Pass contribution"]),
      });
    }
  }
}

/**
 * Get full chain history
 */
export async function getChainHistory(chainId: number): Promise<{
  chain: any;
  links: any[];
  contributors: any[];
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [chain] = await db
    .select()
    .from(buildChains)
    .where(eq(buildChains.id, chainId))
    .limit(1);

  const links = await db
    .select()
    .from(chainLinks)
    .where(eq(chainLinks.chainId, chainId))
    .orderBy(chainLinks.linkOrder);

  const contributorIds = Array.from(new Set(links.map(l => l.contributorId)));
  const contributors = contributorIds.map(id => ({
    id,
    type: links.find(l => l.contributorId === id)?.contributorType,
  }));

  return {
    chain,
    links,
    contributors,
  };
}

/**
 * Calculate contribution credits for completed chain
 */
export async function calculateCredits(chainId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const links = await db
    .select()
    .from(chainLinks)
    .where(eq(chainLinks.chainId, chainId));

  const totalCompletion = links.reduce((sum, link) => sum + link.completionPercentage, 0);

  for (const link of links) {
    const creditPercentage = Math.floor((link.completionPercentage / totalCompletion) * 100);

    await db.insert(contributionCredits).values({
      chainId,
      contributorId: link.contributorId,
      contributorType: link.contributorType,
      creditPercentage,
      contributionValue: creditPercentage * 10,
      badges: JSON.stringify(["Collaborator"]),
      portfolioEligible: 1,
    });
  }
}
