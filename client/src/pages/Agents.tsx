import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { 
  Search, 
  Filter,
  Sparkles,
  Home,
  MessageSquare,
  Zap,
  CheckCircle,
  ArrowRight
} from "lucide-react";
import { Link } from "wouter";
import { APP_LOGO } from "@/const";
import { toast } from "sonner";

export default function Agents() {
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);

  const { data: agentTypes, isLoading } = trpc.agentTypes.list.useQuery();
  const deployAgent = trpc.agents.create.useMutation({
    onSuccess: () => {
      toast.success("Agent deployed successfully!");
    },
    onError: (error: any) => {
      toast.error("Failed to deploy agent: " + error.message);
    },
  });

  // Get unique domains
  const domains = Array.from(new Set(agentTypes?.map((a: any) => a.domain).filter(Boolean)));

  // Filter agents
  const filteredAgents = agentTypes?.filter((agent: any) => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         agent.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDomain = !selectedDomain || agent.domain === selectedDomain;
    return matchesSearch && matchesDomain;
  });

  const handleDeploy = (agentTypeId: number, agentName: string) => {
    if (!isAuthenticated) {
      toast.error("Please log in to deploy agents");
      return;
    }
    deployAgent.mutate({ 
      agentTypeId, 
      name: `${agentName} Instance`,
      memory: JSON.stringify({ deployed: new Date().toISOString() })
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <img src={APP_LOGO} alt="AYMENOS" className="h-12 w-12 rounded-full" />
              <div>
                <h1 className="text-2xl font-bold text-white">AYMENOS</h1>
                <p className="text-sm text-cyan-300">AI Agents Marketplace</p>
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Link href="/swarm/live">
              <Button variant="outline" size="sm">
                <Sparkles className="h-4 w-4 mr-2" />
                Live Swarm
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-cyan-500/20 text-cyan-300 border-cyan-500/50 px-4 py-2">
            <Sparkles className="w-4 h-4 mr-2 inline" />
            60+ Specialized AI Agents
          </Badge>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Your AI Augmentation Team
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Deploy specialized AI agents across every professional domain. From cybersecurity to quantum physics,
            from game design to legal expertise - your perfect AI collaborator awaits.
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="bg-black/40 border-purple-500/30 mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search agents by name or expertise..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                />
              </div>

              {/* Domain Filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="h-4 w-4 text-gray-400" />
                <Button
                  variant={selectedDomain === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDomain(null)}
                  className={selectedDomain === null ? "bg-purple-600" : ""}
                >
                  All Domains
                </Button>
                {domains.slice(0, 5).map((domain: any) => (
                  <Button
                    key={domain}
                    variant={selectedDomain === domain ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDomain(domain)}
                    className={selectedDomain === domain ? "bg-purple-600" : ""}
                  >
                    {domain}
                  </Button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-sm text-gray-300">
                  {filteredAgents?.length || 0} agents available
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-400" />
                <span className="text-sm text-gray-300">
                  Token-free deployment
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agents Grid */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            <p className="text-white mt-4">Loading agents...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAgents?.map((agent: any) => (
              <Card
                key={agent.id}
                className="bg-slate-900/50 border-slate-700/50 backdrop-blur-xl hover:border-cyan-500/50 transition-all cursor-pointer group"
                onClick={() => setSelectedAgent(agent)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div 
                      className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl mb-3 group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: `${agent.color}40` }}
                    >
                      {agent.icon || '🤖'}
                    </div>
                    {agent.domain && (
                      <Badge variant="secondary" className="text-xs">
                        {agent.domain}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-white group-hover:text-cyan-300 transition-colors">
                    {agent.name}
                  </CardTitle>
                  <CardDescription className="text-gray-400 line-clamp-2">
                    {agent.description || 'Specialized AI agent ready to augment your capabilities'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {agent.capabilities && (
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(JSON.parse(agent.capabilities as string) || {})
                          .slice(0, 3)
                          .map(([key, value]: [string, any]) => (
                            <Badge key={key} variant="outline" className="text-xs">
                              {key}: {value}
                            </Badge>
                          ))}
                      </div>
                    )}
                    <Button
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeploy(agent.id, agent.name);
                      }}
                      disabled={deployAgent.isPending}
                    >
                      <Zap className="h-3 w-3 mr-2" />
                      Deploy Agent
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredAgents?.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-white mb-2">No agents found</h3>
            <p className="text-gray-400">Try adjusting your search or filters</p>
          </div>
        )}

        {/* CTA Section */}
        <Card className="mt-12 bg-gradient-to-r from-cyan-900/50 to-purple-900/50 border-cyan-500/30 backdrop-blur-xl">
          <CardContent className="p-12 text-center">
            <Sparkles className="w-16 h-16 text-cyan-400 mx-auto mb-6" />
            <h2 className="text-4xl font-bold mb-4 text-white">
              Build Your AI Swarm
            </h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Deploy multiple agents to work together as a coordinated swarm. 
              Watch them collaborate, learn, and evolve in real-time.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/swarm/live">
                <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
                  <Sparkles className="mr-2 w-5 h-5" />
                  View Live Swarm
                </Button>
              </Link>
              <Link href="/build">
                <Button size="lg" variant="outline" className="border-cyan-500/50 text-cyan-300">
                  Build & Pass
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Details Modal */}
      {selectedAgent && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedAgent(null)}
        >
          <Card 
            className="bg-slate-900 border-cyan-500/50 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <div className="flex items-start gap-4">
                <div 
                  className="w-20 h-20 rounded-lg flex items-center justify-center text-4xl"
                  style={{ backgroundColor: `${selectedAgent.color}40` }}
                >
                  {selectedAgent.icon || '🤖'}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl text-white mb-2">
                        {selectedAgent.name}
                      </CardTitle>
                      {selectedAgent.domain && (
                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/50">
                          {selectedAgent.domain}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedAgent(null)}
                      className="text-gray-400 hover:text-white"
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-white font-semibold mb-2">Description</h3>
                <p className="text-gray-300">
                  {selectedAgent.description || 'A specialized AI agent designed to augment your capabilities in this domain.'}
                </p>
              </div>

              {selectedAgent.capabilities && (
                <div>
                  <h3 className="text-white font-semibold mb-3">Capabilities</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(JSON.parse(selectedAgent.capabilities as string) || {}).map(([key, value]: [string, any]) => (
                      <div key={key} className="bg-white/5 rounded-lg p-3">
                        <div className="text-cyan-300 text-sm font-medium capitalize">{key}</div>
                        <div className="text-white text-lg font-bold">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  onClick={() => handleDeploy(selectedAgent.id, selectedAgent.name)}
                  disabled={deployAgent.isPending}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {deployAgent.isPending ? 'Deploying...' : 'Deploy Agent'}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-cyan-500/50 text-cyan-300"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat with Agent
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
