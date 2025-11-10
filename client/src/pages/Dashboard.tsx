import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { 
  Sparkles, 
  Plus, 
  Loader2,
  Code,
  Server,
  Calculator,
  Gamepad2,
  Users,
  Scale,
  Stethoscope,
  Cog,
  Brain,
  GraduationCap,
  Rocket,
  Network,
  MessageSquare
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { APP_LOGO } from "@/const";

const iconMap: Record<string, any> = {
  Code,
  Server,
  Calculator,
  Gamepad2,
  Users,
  Scale,
  Stethoscope,
  Cog,
  Brain,
  GraduationCap,
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const { data: agentTypes, isLoading: loadingTypes } = trpc.agentTypes.list.useQuery();
  const { data: projects, isLoading: loadingProjects } = trpc.projects.list.useQuery();

  if (!user) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      {/* Header */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <img src={APP_LOGO} alt="AYMENOS" className="w-10 h-10 rounded-full ring-2 ring-cyan-400/50" />
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                AYMENOS
              </span>
            </div>
          </Link>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-cyan-300">{user.name}</span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => logout()}
              className="border-slate-700 hover:bg-slate-800"
            >
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-3">
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Welcome to Your Universe
            </span>
          </h1>
          <p className="text-slate-300 text-lg">
            Collaborate with AI agents to augment your capabilities and build extraordinary projects.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Link href="/projects/new">
            <Card className="bg-slate-900/50 border-cyan-500/30 backdrop-blur-xl hover:border-cyan-500/60 transition-all cursor-pointer group">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Rocket className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-cyan-300">New Project</CardTitle>
                <CardDescription>Start a new augmented project</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/agents">
            <Card className="bg-slate-900/50 border-purple-500/30 backdrop-blur-xl hover:border-purple-500/60 transition-all cursor-pointer group">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-purple-300">Browse Agents</CardTitle>
                <CardDescription>Explore all AI agent types</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/governance">
            <Card className="bg-slate-900/50 border-blue-500/30 backdrop-blur-xl hover:border-blue-500/60 transition-all cursor-pointer group">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Network className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-blue-300">Governance</CardTitle>
                <CardDescription>Participate in platform decisions</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Marketing Section */}
        <div className="mb-12">
          <Link href="/marketing">
            <Card className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-purple-500/30 backdrop-blur-xl hover:border-purple-500/60 transition-all cursor-pointer group">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-2xl text-purple-300 mb-2">🚀 AI Marketing Engine</CardTitle>
                  <CardDescription className="text-lg">
                    Generate billions of automated marketing campaigns with AI-powered video prompts
                  </CardDescription>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Recent Projects */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Your Projects</h2>
            <Link href="/projects/new">
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </Link>
          </div>

          {loadingProjects ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            </div>
          ) : projects && projects.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card key={project.id} className="bg-slate-900/50 border-slate-700/50 backdrop-blur-xl hover:border-cyan-500/50 transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge className={`
                        ${project.status === 'completed' ? 'bg-green-500/20 text-green-300 border-green-500/50' : ''}
                        ${project.status === 'in_progress' ? 'bg-blue-500/20 text-blue-300 border-blue-500/50' : ''}
                        ${project.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50' : ''}
                        ${project.status === 'cancelled' ? 'bg-red-500/20 text-red-300 border-red-500/50' : ''}
                      `}>
                        {project.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={`
                        ${project.priority === 'critical' ? 'bg-red-500/20 text-red-300' : ''}
                        ${project.priority === 'high' ? 'bg-orange-500/20 text-orange-300' : ''}
                        ${project.priority === 'medium' ? 'bg-blue-500/20 text-blue-300' : ''}
                        ${project.priority === 'low' ? 'bg-slate-500/20 text-slate-300' : ''}
                      `}>
                        {project.priority}
                      </Badge>
                    </div>
                    <CardTitle className="text-white">{project.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href={`/projects/${project.id}`}>
                      <Button variant="outline" className="w-full border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Open Project
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-xl p-12 text-center">
              <Rocket className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-400 mb-2">No projects yet</h3>
              <p className="text-slate-500 mb-6">Start your first augmented project to collaborate with AI agents</p>
              <Link href="/projects/new">
                <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Project
                </Button>
              </Link>
            </Card>
          )}
        </div>

        {/* Agent Types Overview */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Available AI Agents</h2>
          
          {loadingTypes ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {agentTypes?.map((agentType) => {
                const Icon = iconMap[agentType.icon || 'Sparkles'] || Sparkles;
                return (
                  <Card 
                    key={agentType.id}
                    className="bg-slate-900/50 border-slate-700/50 backdrop-blur-xl hover:border-cyan-500/50 transition-all cursor-pointer group"
                  >
                    <CardHeader className="text-center">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: agentType.color }}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-sm text-white group-hover:text-cyan-300 transition-colors">
                        {agentType.name}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
