import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { Activity, Cpu, Network, Zap, Users, Brain, TrendingUp } from "lucide-react";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";

export default function SwarmViz() {
  const { user, loading, isAuthenticated } = useAuth();
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  // Get network stats
  const networkStats = trpc.distributedNetwork.getNetworkStats.useQuery();
  const leaderboard = trpc.distributedNetwork.getLeaderboard.useQuery({ limit: 10 });

  // Deploy swarm mutation
  const deploySwarm = trpc.agentSwarm.deploySwarm.useMutation({
    onSuccess: () => {
      alert("Swarm deployed successfully!");
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to access the Swarm Visualization</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>Log In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const domains = ["Developer", "DevOps", "Accountant", "Game Designer", "Politician", "Lawyer", "Doctor", "Mechanical Engineer", "Psychotherapist", "Tutor"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={APP_LOGO} alt="AYMENOS" className="h-12 w-12 rounded-full" />
            <div>
              <h1 className="text-2xl font-bold text-white">{APP_TITLE}</h1>
              <p className="text-sm text-purple-300">Swarm Orchestration</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-white">{user?.name}</span>
            <Button variant="outline" size="sm" asChild>
              <a href="/">Home</a>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Network Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-200 flex items-center gap-2">
                <Network className="h-4 w-4" />
                Total Devices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {networkStats.data?.totalDevices || 0}
              </div>
              <p className="text-xs text-blue-300 mt-1">
                {networkStats.data?.onlineDevices || 0} online
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-200 flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                Compute Power
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {networkStats.data?.totalComputePower || 0}
              </div>
              <p className="text-xs text-purple-300 mt-1">Total capacity</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-200 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Tasks Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {networkStats.data?.tasksCompleted || 0}
              </div>
              <p className="text-xs text-green-300 mt-1">Across all devices</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-orange-200 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Contribution Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {networkStats.data?.totalContribution || 0}
              </div>
              <p className="text-xs text-orange-300 mt-1">Global total</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Deploy Swarm */}
          <Card className="bg-black/40 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-400" />
                Deploy Agent Swarm
              </CardTitle>
              <CardDescription className="text-gray-400">
                Launch thousands of specialized AI agents for any domain
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {domains.map((domain) => (
                  <Button
                    key={domain}
                    variant={selectedDomain === domain ? "default" : "outline"}
                    className={selectedDomain === domain ? "bg-purple-600 hover:bg-purple-700" : ""}
                    onClick={() => setSelectedDomain(domain)}
                  >
                    {domain}
                  </Button>
                ))}
              </div>

              {selectedDomain && (
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-white">Swarm Size:</span>
                    <Badge variant="secondary">100 agents</Badge>
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    onClick={() => {
                      if (selectedDomain) {
                        deploySwarm.mutate({ domain: selectedDomain, swarmSize: 100 });
                      }
                    }}
                    disabled={deploySwarm.isPending}
                  >
                    {deploySwarm.isPending ? (
                      <>
                        <Activity className="h-4 w-4 mr-2 animate-spin" />
                        Deploying...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Deploy Swarm
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Leaderboard */}
          <Card className="bg-black/40 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-cyan-400" />
                Device Leaderboard
              </CardTitle>
              <CardDescription className="text-gray-400">
                Top contributing devices in the network
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.data?.map((device, index) => (
                  <div
                    key={device.deviceId}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center font-bold
                        ${index === 0 ? 'bg-yellow-500 text-black' : ''}
                        ${index === 1 ? 'bg-gray-400 text-black' : ''}
                        ${index === 2 ? 'bg-orange-600 text-white' : ''}
                        ${index > 2 ? 'bg-gray-700 text-white' : ''}
                      `}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-white font-medium">{device.deviceType}</div>
                        <div className="text-xs text-gray-400">{device.tasksCompleted} tasks</div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-300">
                      {device.contributionScore}
                    </Badge>
                  </div>
                ))}

                {(!leaderboard.data || leaderboard.data.length === 0) && (
                  <div className="text-center py-8 text-gray-400">
                    No devices registered yet. Be the first to contribute!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Real-time Visualization Placeholder */}
        <Card className="mt-8 bg-black/40 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-400" />
              Real-Time Swarm Activity
            </CardTitle>
            <CardDescription className="text-gray-400">
              Live visualization of agent collaboration and task distribution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-96 rounded-lg bg-gradient-to-br from-purple-950/50 to-blue-950/50 border border-purple-500/20 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="relative w-32 h-32 mx-auto">
                  <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping"></div>
                  <div className="absolute inset-4 rounded-full bg-purple-500/40 animate-pulse"></div>
                  <div className="absolute inset-8 rounded-full bg-purple-500 flex items-center justify-center">
                    <Brain className="h-12 w-12 text-white" />
                  </div>
                </div>
                <p className="text-white text-lg font-semibold">Swarm Intelligence Active</p>
                <p className="text-gray-400 text-sm max-w-md">
                  Agents are collaborating across the network, processing tasks and learning from each other
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
