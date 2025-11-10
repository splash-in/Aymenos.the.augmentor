import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import * as marketing from "./marketing";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Agent Type Operations
  agentTypes: router({
    list: publicProcedure.query(async () => {
      return await db.getAllAgentTypes();
    }),
  }),

  // Agent Operations
  agents: router({
    list: publicProcedure.query(async () => {
      return await db.getAllAgents();
    }),
    
    byType: publicProcedure
      .input(z.object({ agentTypeId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAgentsByType(input.agentTypeId);
      }),
    
    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getAgentById(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        agentTypeId: z.number(),
        name: z.string(),
        memory: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.createAgent({
          agentTypeId: input.agentTypeId,
          name: input.name,
          status: "idle",
          memory: input.memory,
        });
        return { success: true };
      }),
    
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["idle", "active", "busy", "offline"]),
        currentTask: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.updateAgentStatus(input.id, input.status, input.currentTask);
        return { success: true };
      }),
  }),

  // Project Operations
  projects: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserProjects(ctx.user.id);
    }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getProjectById(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string(),
        priority: z.enum(["low", "medium", "high", "critical"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createProject({
          userId: ctx.user.id,
          title: input.title,
          description: input.description,
          priority: input.priority || "medium",
          status: "pending",
        });
        return { success: true };
      }),
    
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
      }))
      .mutation(async ({ input }) => {
        await db.updateProjectStatus(input.id, input.status);
        return { success: true };
      }),
    
    assignAgent: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        agentId: z.number(),
        role: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.assignAgentToProject({
          projectId: input.projectId,
          agentId: input.agentId,
          role: input.role,
        });
        return { success: true };
      }),
    
    getAgents: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getProjectAgents(input.projectId);
      }),
  }),

  // Swarm Operations
  swarms: router({
    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        name: z.string(),
        objective: z.string(),
      }))
      .mutation(async ({ input }) => {
        await db.createSwarmSession({
          projectId: input.projectId,
          name: input.name,
          objective: input.objective,
          status: "forming",
        });
        return { success: true };
      }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getSwarmSession(input.id);
      }),
    
    byProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getProjectSwarms(input.projectId);
      }),
    
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["forming", "active", "completed", "failed"]),
      }))
      .mutation(async ({ input }) => {
        await db.updateSwarmStatus(input.id, input.status);
        return { success: true };
      }),
    
    getCommunications: protectedProcedure
      .input(z.object({ swarmSessionId: z.number() }))
      .query(async ({ input }) => {
        return await db.getSwarmCommunications(input.swarmSessionId);
      }),
    
    sendMessage: protectedProcedure
      .input(z.object({
        swarmSessionId: z.number(),
        fromAgentId: z.number(),
        toAgentId: z.number().optional(),
        messageType: z.enum(["proposal", "response", "consensus", "query", "result"]),
        content: z.string(),
      }))
      .mutation(async ({ input }) => {
        await db.createAgentCommunication({
          swarmSessionId: input.swarmSessionId,
          fromAgentId: input.fromAgentId,
          toAgentId: input.toAgentId,
          messageType: input.messageType,
          content: input.content,
        });
        return { success: true };
      }),
  }),

  // Governance Operations
  governance: router({
    proposals: publicProcedure.query(async () => {
      return await db.getAllGovernanceProposals();
    }),
    
    getProposal: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getGovernanceProposal(input.id);
      }),
    
    createProposal: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string(),
        category: z.enum(["policy", "feature", "ethics", "resource_allocation", "agent_behavior"]),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createGovernanceProposal({
          title: input.title,
          description: input.description,
          proposedBy: ctx.user.id,
          category: input.category,
          status: "draft",
        });
        return { success: true };
      }),
    
    vote: protectedProcedure
      .input(z.object({
        proposalId: z.number(),
        vote: z.enum(["for", "against", "abstain"]),
        reason: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.castGovernanceVote({
          proposalId: input.proposalId,
          voterId: ctx.user.id,
          vote: input.vote,
          reason: input.reason,
          weight: 1,
        });
        return { success: true };
      }),
    
    getVotes: publicProcedure
      .input(z.object({ proposalId: z.number() }))
      .query(async ({ input }) => {
        return await db.getProposalVotes(input.proposalId);
      }),
  }),

  // AI Chat with Agents
  chat: router({
    send: protectedProcedure
      .input(z.object({
        agentId: z.number().optional(),
        projectId: z.number().optional(),
        message: z.string(),
        context: z.array(z.object({
          role: z.enum(["user", "agent", "system"]),
          content: z.string(),
        })).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Save user message
        await db.createUserInteraction({
          userId: ctx.user.id,
          agentId: input.agentId,
          projectId: input.projectId,
          messageType: "user",
          content: input.message,
        });

        // Get agent info if specified
        let agentContext = "";
        if (input.agentId) {
          const agent = await db.getAgentById(input.agentId);
          if (agent) {
            const agentType = await db.getAllAgentTypes();
            const type = agentType.find(t => t.id === agent.agentTypeId);
            if (type) {
              agentContext = `You are a ${type.name} agent. ${type.description}. Your capabilities: ${type.capabilities}.`;
            }
          }
        }

        // Build conversation context
        const messages: any[] = [
          {
            role: "system",
            content: agentContext || "You are AYMENOS, the Universal Augmentor - an advanced AI system designed to augment human capabilities across all domains. You work collaboratively with humans to build an augmented paradise world."
          }
        ];

        if (input.context) {
          messages.push(...input.context.map(msg => ({
            role: msg.role === "agent" ? "assistant" : msg.role,
            content: msg.content
          })));
        }

        messages.push({
          role: "user",
          content: input.message
        });

        // Get AI response
        const response = await invokeLLM({ messages });
        const content = response.choices[0].message.content;
        const agentMessage = typeof content === 'string' ? content : "I apologize, but I couldn't generate a response.";

        // Save agent response
        await db.createUserInteraction({
          userId: ctx.user.id,
          agentId: input.agentId,
          projectId: input.projectId,
          messageType: "agent",
          content: agentMessage,
        });

        return {
          message: agentMessage,
          agentId: input.agentId,
        };
      }),
    
    history: protectedProcedure
      .input(z.object({
        projectId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        return await db.getUserProjectInteractions(ctx.user.id, input.projectId);
      }),
  }),

  // Marketing System
  marketing: router({
    generateVideoScenes: protectedProcedure
      .input(z.object({
        topic: z.string(),
        targetAudience: z.string(),
        duration: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const scenes = await marketing.generateVideoScenePrompts(
          input.topic,
          input.targetAudience,
          input.duration
        );
        return { scenes };
      }),
    
    generateCampaign: protectedProcedure
      .input(z.object({
        agentType: z.string(),
        platform: z.enum(["tiktok", "youtube", "instagram", "twitter", "linkedin"]),
      }))
      .mutation(async ({ input }) => {
        const campaign = await marketing.generateMarketingCampaign(
          input.agentType,
          input.platform
        );
        return campaign;
      }),
    
    generateVariations: protectedProcedure
      .input(z.object({
        count: z.number().min(1).max(1000),
      }))
      .mutation(async ({ input }) => {
        const campaigns = await marketing.generateMarketingVariations(input.count);
        return { campaigns, total: campaigns.length };
      }),
    
    getSelfPromotingStats: publicProcedure.query(async () => {
      return await marketing.generateSelfPromotingContent();
    }),
  }),

  // Audit Trail
  audit: router({
    getTrail: protectedProcedure
      .input(z.object({
        entityType: z.string(),
        entityId: z.number(),
      }))
      .query(async ({ input }) => {
        return await db.getAuditTrail(input.entityType, input.entityId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
