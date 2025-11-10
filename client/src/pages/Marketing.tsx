import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { 
  Video, 
  Sparkles, 
  TrendingUp, 
  Globe, 
  Loader2,
  Play,
  Download,
  Share2,
  Zap
} from "lucide-react";
import { Link } from "wouter";
import { APP_LOGO } from "@/const";
import { Streamdown } from "streamdown";

export default function Marketing() {
  const [agentType, setAgentType] = useState("Developer");
  const [platform, setPlatform] = useState<"tiktok" | "youtube" | "instagram" | "twitter" | "linkedin">("tiktok");
  const [generatedCampaign, setGeneratedCampaign] = useState<any>(null);

  const { data: stats } = trpc.marketing.getSelfPromotingStats.useQuery();
  const generateCampaign = trpc.marketing.generateCampaign.useMutation();

  const handleGenerate = async () => {
    const result = await generateCampaign.mutateAsync({
      agentType,
      platform,
    });
    setGeneratedCampaign(result);
  };

  const agentTypes = [
    "Developer", "DevOps", "Accountant", "Game Designer", "Politician",
    "Lawyer", "Doctor", "Mechanical Engineer", "Psychotherapist", "Tutor"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      {/* Header */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <img src={APP_LOGO} alt="AYMENOS" className="w-10 h-10 rounded-full ring-2 ring-cyan-400/50" />
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                AYMENOS Marketing
              </span>
            </div>
          </Link>
          
          <Link href="/dashboard">
            <Button variant="outline" className="border-slate-700 hover:bg-slate-800">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-purple-500/20 text-purple-300 border-purple-500/50 px-4 py-2">
            <Zap className="w-4 h-4 mr-2 inline" />
            Automated Marketing System
          </Badge>
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              AI-Powered Marketing Engine
            </span>
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Generate billions of marketing variations automatically. AYMENOS markets itself through 
            AI-generated video prompts, social content, and viral campaigns.
          </p>
        </div>

        {/* Stats Section */}
        {stats && (
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <Card className="bg-slate-900/50 border-cyan-500/30 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-cyan-300 text-3xl">{stats.dailyPosts.toLocaleString()}</CardTitle>
                <CardDescription>Daily Posts Generated</CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-900/50 border-purple-500/30 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-purple-300 text-3xl">{stats.weeklyVideos.toLocaleString()}</CardTitle>
                <CardDescription>Weekly Videos Created</CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-900/50 border-pink-500/30 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-pink-300 text-3xl">{stats.monthlyVariations.toLocaleString()}</CardTitle>
                <CardDescription>Monthly Variations</CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-900/50 border-blue-500/30 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-blue-300 flex items-center gap-2">
                  <Globe className="w-6 h-6" />
                  Billions
                </CardTitle>
                <CardDescription>Estimated Reach</CardDescription>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Campaign Generator */}
        <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-xl mb-12">
          <CardHeader>
            <CardTitle className="text-2xl text-white flex items-center gap-2">
              <Video className="w-6 h-6 text-purple-400" />
              Generate Marketing Campaign
            </CardTitle>
            <CardDescription>
              Create AI-powered video scene prompts and social media content for any agent type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <Label className="text-slate-300 mb-2 block">Agent Type</Label>
                <Select value={agentType} onValueChange={setAgentType}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {agentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-300 mb-2 block">Platform</Label>
                <Select value={platform} onValueChange={(val: any) => setPlatform(val)}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tiktok">TikTok (60s)</SelectItem>
                    <SelectItem value="youtube">YouTube (120s)</SelectItem>
                    <SelectItem value="instagram">Instagram (30s)</SelectItem>
                    <SelectItem value="twitter">Twitter (45s)</SelectItem>
                    <SelectItem value="linkedin">LinkedIn (90s)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleGenerate}
              disabled={generateCampaign.isPending}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              size="lg"
            >
              {generateCampaign.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating Campaign...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Campaign
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Campaign Display */}
        {generatedCampaign && (
          <div className="space-y-6">
            <Card className="bg-slate-900/50 border-cyan-500/30 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-cyan-300">{generatedCampaign.title}</CardTitle>
                <CardDescription>
                  Target: {generatedCampaign.targetAudience} • Platform: {generatedCampaign.platform}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h4 className="text-white font-semibold mb-2">Caption:</h4>
                  <p className="text-slate-300">{generatedCampaign.caption}</p>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-white font-semibold mb-2">Hashtags:</h4>
                  <div className="flex flex-wrap gap-2">
                    {generatedCampaign.hashtags.map((tag: string, idx: number) => (
                      <Badge key={idx} className="bg-blue-500/20 text-blue-300 border-blue-500/50">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button variant="outline" className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Video Scenes */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Play className="w-6 h-6 text-purple-400" />
                Video Scene Prompts
              </h3>
              <div className="grid gap-6">
                {generatedCampaign.videoScenes.map((scene: any, idx: number) => (
                  <Card key={idx} className="bg-slate-900/50 border-slate-700/50 backdrop-blur-xl">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-white">Scene {scene.sceneNumber}</CardTitle>
                          <CardDescription>Duration: {scene.duration}</CardDescription>
                        </div>
                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/50">
                          {scene.musicMood}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h5 className="text-cyan-300 font-semibold mb-2">Visual Description:</h5>
                        <p className="text-slate-300 leading-relaxed">{scene.visualDescription}</p>
                      </div>
                      
                      <div>
                        <h5 className="text-blue-300 font-semibold mb-2">Narration:</h5>
                        <p className="text-slate-300 italic leading-relaxed">"{scene.narration}"</p>
                      </div>
                      
                      <div className="flex gap-4 text-sm">
                        <div>
                          <span className="text-slate-400">Camera: </span>
                          <span className="text-slate-300">{scene.cameraMovement}</span>
                        </div>
                        {scene.textOverlay && (
                          <div>
                            <span className="text-slate-400">Text Overlay: </span>
                            <span className="text-slate-300">{scene.textOverlay}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Self-Promoting Info */}
        <Card className="mt-12 bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-purple-500/30 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-white flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-purple-400" />
              Self-Promoting AI System
            </CardTitle>
            <CardDescription>
              AYMENOS autonomously generates and distributes marketing content across all platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300 leading-relaxed">
              The platform uses its own AI agents to create billions of marketing variations, 
              automatically adapting to trends, audiences, and platforms. Each agent type generates 
              specialized content showcasing how it augments human capabilities, creating a 
              self-sustaining viral marketing ecosystem.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
