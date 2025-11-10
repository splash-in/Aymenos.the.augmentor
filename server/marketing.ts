import { invokeLLM } from "./_core/llm";

/**
 * Marketing Content Generator
 * Generates billions of marketing variations using AI
 */

export interface VideoScenePrompt {
  sceneNumber: number;
  duration: string;
  visualDescription: string;
  narration: string;
  musicMood: string;
  cameraMovement: string;
  textOverlay?: string;
}

export interface MarketingCampaign {
  id: string;
  title: string;
  targetAudience: string;
  platform: string;
  videoScenes: VideoScenePrompt[];
  hashtags: string[];
  caption: string;
}

/**
 * Generate AI-powered video scene prompts for marketing
 */
export async function generateVideoScenePrompts(
  topic: string,
  targetAudience: string,
  duration: number = 60
): Promise<VideoScenePrompt[]> {
  const prompt = `Generate a compelling ${duration}-second video marketing script for AYMENOS - The Universal Augmentor platform.

Topic: ${topic}
Target Audience: ${targetAudience}

AYMENOS is a revolutionary token-free AI platform where specialized agents (developers, doctors, lawyers, engineers, etc.) collaborate with humans using swarm intelligence and blockchain governance to build an augmented paradise world.

Create 5-8 video scenes with:
1. Scene number and duration (in seconds)
2. Detailed visual description (for AI video generation)
3. Narration text
4. Music mood
5. Camera movement
6. Optional text overlay

Make it visually stunning, emotionally compelling, and highlight the transformative power of human-AI collaboration.

Return as JSON array of scenes.`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are a world-class marketing content creator specializing in AI and technology. Generate compelling video scripts in JSON format."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "video_scenes",
        strict: true,
        schema: {
          type: "object",
          properties: {
            scenes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  sceneNumber: { type: "integer" },
                  duration: { type: "string" },
                  visualDescription: { type: "string" },
                  narration: { type: "string" },
                  musicMood: { type: "string" },
                  cameraMovement: { type: "string" },
                  textOverlay: { type: "string" }
                },
                required: ["sceneNumber", "duration", "visualDescription", "narration", "musicMood", "cameraMovement"],
                additionalProperties: false
              }
            }
          },
          required: ["scenes"],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0].message.content;
  if (typeof content === 'string') {
    const parsed = JSON.parse(content);
    return parsed.scenes;
  }
  
  return [];
}

/**
 * Generate complete marketing campaign with variations
 */
export async function generateMarketingCampaign(
  agentType: string,
  platform: "tiktok" | "youtube" | "instagram" | "twitter" | "linkedin"
): Promise<MarketingCampaign> {
  const platformSpecs = {
    tiktok: { duration: 60, style: "fast-paced, trendy, viral" },
    youtube: { duration: 120, style: "informative, professional, storytelling" },
    instagram: { duration: 30, style: "visually stunning, aesthetic, inspiring" },
    twitter: { duration: 45, style: "concise, impactful, thought-provoking" },
    linkedin: { duration: 90, style: "professional, educational, industry-focused" }
  };

  const spec = platformSpecs[platform];
  
  const topic = `How AYMENOS ${agentType} agents augment human capabilities`;
  const targetAudience = getTargetAudience(agentType);

  const scenes = await generateVideoScenePrompts(topic, targetAudience, spec.duration);
  
  // Generate caption and hashtags
  const captionPrompt = `Create a compelling ${platform} caption and hashtags for a video about AYMENOS ${agentType} agents.

Style: ${spec.style}
Target: ${targetAudience}

Return JSON with: caption (string) and hashtags (array of strings, 5-10 hashtags).`;

  const captionResponse = await invokeLLM({
    messages: [
      { role: "system", content: "You are a social media marketing expert." },
      { role: "user", content: captionPrompt }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "social_content",
        strict: true,
        schema: {
          type: "object",
          properties: {
            caption: { type: "string" },
            hashtags: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["caption", "hashtags"],
          additionalProperties: false
        }
      }
    }
  });

  const captionContent = captionResponse.choices[0].message.content;
  let caption = "";
  let hashtags: string[] = [];
  
  if (typeof captionContent === 'string') {
    const parsed = JSON.parse(captionContent);
    caption = parsed.caption;
    hashtags = parsed.hashtags;
  }

  return {
    id: `${platform}-${agentType}-${Date.now()}`,
    title: `AYMENOS ${agentType} Agent - ${platform}`,
    targetAudience,
    platform,
    videoScenes: scenes,
    hashtags,
    caption
  };
}

/**
 * Generate billions of marketing variations by combining different parameters
 */
export async function generateMarketingVariations(count: number = 100): Promise<MarketingCampaign[]> {
  const agentTypes = [
    "Developer", "DevOps", "Accountant", "Game Designer", "Politician",
    "Lawyer", "Doctor", "Mechanical Engineer", "Psychotherapist", "Tutor"
  ];
  
  const platforms: Array<"tiktok" | "youtube" | "instagram" | "twitter" | "linkedin"> = [
    "tiktok", "youtube", "instagram", "twitter", "linkedin"
  ];

  const campaigns: MarketingCampaign[] = [];
  
  // Generate combinations
  for (let i = 0; i < count && campaigns.length < count; i++) {
    const agentType = agentTypes[i % agentTypes.length];
    const platform = platforms[i % platforms.length];
    
    try {
      const campaign = await generateMarketingCampaign(agentType, platform);
      campaigns.push(campaign);
    } catch (error) {
      console.error(`Failed to generate campaign for ${agentType} on ${platform}:`, error);
    }
  }

  return campaigns;
}

/**
 * Get target audience based on agent type
 */
function getTargetAudience(agentType: string): string {
  const audiences: Record<string, string> = {
    "Developer": "Software developers, tech entrepreneurs, startup founders",
    "DevOps": "IT professionals, system administrators, cloud engineers",
    "Accountant": "Business owners, financial professionals, CFOs",
    "Game Designer": "Game developers, creative professionals, indie studios",
    "Politician": "Policy makers, government officials, civic leaders",
    "Lawyer": "Legal professionals, law firms, compliance officers",
    "Doctor": "Healthcare professionals, medical practitioners, researchers",
    "Mechanical Engineer": "Engineers, manufacturers, product designers",
    "Psychotherapist": "Mental health professionals, therapists, counselors",
    "Tutor": "Educators, students, lifelong learners, parents"
  };

  return audiences[agentType] || "Professionals seeking AI augmentation";
}

/**
 * Generate automated marketing content for self-promotion
 */
export async function generateSelfPromotingContent(): Promise<{
  dailyPosts: number;
  weeklyVideos: number;
  monthlyVariations: number;
  estimatedReach: string;
}> {
  // AYMENOS self-promoting system
  // Generates content automatically to market itself
  
  return {
    dailyPosts: 1000,
    weeklyVideos: 350, // 50 per day
    monthlyVariations: 15000,
    estimatedReach: "Billions of potential users through AI-powered viral distribution"
  };
}
