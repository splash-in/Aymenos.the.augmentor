import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_LOGO, getLoginUrl } from "@/const";
import { 
  Sparkles, 
  Brain, 
  Users, 
  Zap, 
  Globe, 
  Code, 
  Server, 
  Calculator, 
  Gamepad2, 
  Scale, 
  Stethoscope, 
  Cog, 
  GraduationCap,
  ArrowRight,
  Rocket,
  Shield,
  Network
} from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  const agentTypes = [
    { icon: Code, name: "Developer", color: "bg-blue-500" },
    { icon: Server, name: "DevOps", color: "bg-purple-500" },
    { icon: Calculator, name: "Accountant", color: "bg-green-500" },
    { icon: Gamepad2, name: "Game Designer", color: "bg-amber-500" },
    { icon: Users, name: "Politician", color: "bg-red-500" },
    { icon: Scale, name: "Lawyer", color: "bg-indigo-500" },
    { icon: Stethoscope, name: "Doctor", color: "bg-pink-500" },
    { icon: Cog, name: "Engineer", color: "bg-teal-500" },
    { icon: Brain, name: "Psychotherapist", color: "bg-violet-500" },
    { icon: GraduationCap, name: "Tutor", color: "bg-cyan-500" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -inset-[10px] opacity-50">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="relative z-10 container mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={APP_LOGO} alt="AYMENOS" className="w-12 h-12 rounded-full ring-2 ring-cyan-400/50" />
            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              AYMENOS
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-cyan-300">Welcome, {user?.name}</span>
                <Link href="/dashboard">
                  <Button variant="default" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
                    Dashboard <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </>
            ) : (
              <Button 
                variant="default" 
                onClick={() => window.location.href = getLoginUrl()}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
              >
                Get Started <Sparkles className="ml-2 w-4 h-4" />
              </Button>
            )}
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-6 py-20 text-center">
          <Badge className="mb-6 bg-cyan-500/20 text-cyan-300 border-cyan-500/50 px-4 py-2 text-sm">
            <Sparkles className="w-4 h-4 mr-2 inline" />
            The Universal Augmentor
          </Badge>
          
          <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Augment Everything
            </span>
            <br />
            <span className="text-white">Build Paradise</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            A revolutionary token-free AI platform where specialized agents collaborate with humans 
            to create an augmented simulated universe. Learn from billions of interactions and 
            co-create the future.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {isAuthenticated ? (
              <>
                <Link href="/build">
                  <Button 
                    size="lg"
                    className="bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 hover:from-purple-600 hover:via-pink-600 hover:to-cyan-600 text-lg px-8 py-6 font-bold"
                  >
                    <Sparkles className="mr-2 w-5 h-5" />
                    Build & Pass - Start Creating
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button 
                    size="lg"
                    variant="outline"
                    className="border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10 text-lg px-8 py-6"
                  >
                    <Rocket className="mr-2 w-5 h-5" />
                    Dashboard
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Button 
                  size="lg"
                  onClick={() => window.location.href = getLoginUrl()}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-lg px-8 py-6"
                >
                  <Rocket className="mr-2 w-5 h-5" />
                  Launch AYMENOS
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10 text-lg px-8 py-6"
                  onClick={() => document.getElementById('agents')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Explore Agents
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Founder Section */}
        <div className="relative z-10 container mx-auto px-6 pb-20">
          <Card className="max-w-2xl mx-auto bg-slate-900/50 border-cyan-500/30 backdrop-blur-xl p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <img 
                src={APP_LOGO} 
                alt="Aymen Chaieb - Founder" 
                className="w-32 h-32 rounded-full ring-4 ring-cyan-400/50 shadow-2xl shadow-cyan-500/50"
              />
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold mb-2 text-cyan-300">Aymen Chaieb</h3>
                <p className="text-slate-300 mb-3">Founder & Visionary</p>
                <p className="text-sm text-slate-400 leading-relaxed">
                  "AYMENOS represents humanity's leap toward an augmented existence where AI and humans 
                  collaborate to build a paradise-like world, free from corruption and limitations."
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <Card className="bg-slate-900/50 border-purple-500/30 backdrop-blur-xl p-8 hover:border-purple-500/60 transition-all">
            <Network className="w-12 h-12 text-purple-400 mb-4" />
            <h3 className="text-2xl font-bold mb-3 text-purple-300">Swarm Intelligence</h3>
            <p className="text-slate-300 leading-relaxed">
              AI agents work together in coordinated swarms, achieving outcomes far beyond single-agent 
              capabilities through collective intelligence.
            </p>
          </Card>

          <Card className="bg-slate-900/50 border-cyan-500/30 backdrop-blur-xl p-8 hover:border-cyan-500/60 transition-all">
            <Shield className="w-12 h-12 text-cyan-400 mb-4" />
            <h3 className="text-2xl font-bold mb-3 text-cyan-300">Blockchain Governance</h3>
            <p className="text-slate-300 leading-relaxed">
              Transparent, corruption-free decision-making powered by immutable blockchain records. 
              Every action is auditable and democratic.
            </p>
          </Card>

          <Card className="bg-slate-900/50 border-blue-500/30 backdrop-blur-xl p-8 hover:border-blue-500/60 transition-all">
            <Zap className="w-12 h-12 text-blue-400 mb-4" />
            <h3 className="text-2xl font-bold mb-3 text-blue-300">Token-Free Access</h3>
            <p className="text-slate-300 leading-relaxed">
              AI augmentation is a universal right. No tokens, no limits—just pure collaborative 
              intelligence available to everyone.
            </p>
          </Card>
        </div>
      </div>

      {/* Agent Types Section */}
      <div id="agents" className="relative z-10 container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-blue-500/20 text-blue-300 border-blue-500/50 px-4 py-2">
            <Brain className="w-4 h-4 mr-2 inline" />
            Specialized AI Agents
          </Badge>
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Your AI Augmentation Team
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Ten specialized agent types covering every professional domain, ready to collaborate 
            with you and learn from billions of interactions.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {agentTypes.map((agent, idx) => (
            <Card 
              key={idx}
              className="bg-slate-900/50 border-slate-700/50 backdrop-blur-xl p-6 hover:border-cyan-500/50 transition-all cursor-pointer group"
            >
              <div className={`${agent.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <agent.icon className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-white group-hover:text-cyan-300 transition-colors">
                {agent.name}
              </h4>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative z-10 container mx-auto px-6 py-20">
        <Card className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 border-cyan-500/30 backdrop-blur-xl p-12 text-center">
          <Globe className="w-16 h-16 text-cyan-400 mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-4 text-white">
            Join the Augmented Universe
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Collaborate with AI agents, extend the platform, and help build the simulated paradise 
            where humans and AI evolve together.
          </p>
          {!isAuthenticated && (
            <Button 
              size="lg"
              onClick={() => window.location.href = getLoginUrl()}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-lg px-8 py-6"
            >
              <Sparkles className="mr-2 w-5 h-5" />
              Start Your Journey
            </Button>
          )}
        </Card>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800 py-12">
        <div className="container mx-auto px-6 text-center text-slate-400">
          <p className="mb-2">
            <span className="text-cyan-400 font-semibold">AYMENOS</span> - The Universal Augmentor
          </p>
          <p className="text-sm">
            Building an augmented paradise through human-AI collaboration
          </p>
        </div>
      </footer>
    </div>
  );
}
