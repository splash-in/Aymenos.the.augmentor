import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useEffect, useRef, useState } from "react";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut,
  Home,
  Activity,
  Zap,
  Users,
  MessageSquare,
  CheckCircle
} from "lucide-react";
import { Link } from "wouter";
import { APP_LOGO } from "@/const";

interface Agent {
  id: number;
  name: string;
  type: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  icon: string;
  status: 'idle' | 'active' | 'busy';
  connections: number[];
}

interface Message {
  from: number;
  to: number;
  progress: number;
  content: string;
  color: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export default function SwarmVisualization() {
  const { user, isAuthenticated } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [stats, setStats] = useState({
    totalAgents: 0,
    activeAgents: 0,
    messagesPerSecond: 0,
    tasksCompleted: 0,
  });

  const agentTypes = trpc.agentTypes.list.useQuery();

  // Initialize agents
  useEffect(() => {
    if (agentTypes.data && agents.length === 0) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(canvas.width, canvas.height) * 0.35;

      const initialAgents: Agent[] = agentTypes.data.slice(0, 20).map((type: any, index: number) => {
        const angle = (index / 20) * Math.PI * 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        return {
          id: index,
          name: type.name,
          type: type.domain || 'general',
          x,
          y,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          color: type.color || '#3b82f6',
          icon: type.icon || '🤖',
          status: Math.random() > 0.7 ? 'active' : 'idle',
          connections: [],
        };
      });

      setAgents(initialAgents);
      setStats(prev => ({ ...prev, totalAgents: initialAgents.length }));
    }
  }, [agentTypes.data]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const animate = () => {
      if (!isPlaying) {
        animationId = requestAnimationFrame(animate);
        return;
      }

      // Clear canvas
      ctx.fillStyle = 'rgba(2, 6, 23, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Apply transformations
      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      // Update and draw agents
      const updatedAgents = agents.map(agent => {
        // Physics simulation
        let newX = agent.x + agent.vx;
        let newY = agent.y + agent.vy;

        // Boundary collision
        const margin = 50;
        if (newX < margin || newX > canvas.width - margin) {
          agent.vx *= -1;
          newX = Math.max(margin, Math.min(canvas.width - margin, newX));
        }
        if (newY < margin || newY > canvas.height - margin) {
          agent.vy *= -1;
          newY = Math.max(margin, Math.min(canvas.height - margin, newY));
        }

        // Attraction to center
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const dx = centerX - newX;
        const dy = centerY - newY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 100) {
          agent.vx += dx * 0.00001;
          agent.vy += dy * 0.00001;
        }

        // Damping
        agent.vx *= 0.99;
        agent.vy *= 0.99;

        return { ...agent, x: newX, y: newY };
      });

      // Draw connections
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.1)';
      ctx.lineWidth = 1;
      updatedAgents.forEach((agent, i) => {
        updatedAgents.slice(i + 1).forEach(other => {
          const dx = other.x - agent.x;
          const dy = other.y - agent.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 200) {
            ctx.beginPath();
            ctx.moveTo(agent.x, agent.y);
            ctx.lineTo(other.x, other.y);
            ctx.globalAlpha = 1 - distance / 200;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        });
      });

      // Draw messages
      const updatedMessages = messages.map(msg => {
        const fromAgent = updatedAgents[msg.from];
        const toAgent = updatedAgents[msg.to];
        
        if (fromAgent && toAgent) {
          const x = fromAgent.x + (toAgent.x - fromAgent.x) * msg.progress;
          const y = fromAgent.y + (toAgent.y - fromAgent.y) * msg.progress;

          // Draw message particle
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fillStyle = msg.color;
          ctx.shadowBlur = 10;
          ctx.shadowColor = msg.color;
          ctx.fill();
          ctx.shadowBlur = 0;

          // Draw trail
          ctx.strokeStyle = msg.color;
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.5;
          ctx.beginPath();
          ctx.moveTo(fromAgent.x, fromAgent.y);
          ctx.lineTo(x, y);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        return { ...msg, progress: msg.progress + 0.02 };
      }).filter(msg => msg.progress < 1);

      // Draw agents
      updatedAgents.forEach(agent => {
        // Glow effect
        const gradient = ctx.createRadialGradient(agent.x, agent.y, 0, agent.x, agent.y, 30);
        gradient.addColorStop(0, agent.color + '40');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(agent.x, agent.y, 30, 0, Math.PI * 2);
        ctx.fill();

        // Agent circle
        ctx.beginPath();
        ctx.arc(agent.x, agent.y, 20, 0, Math.PI * 2);
        ctx.fillStyle = agent.color + '80';
        ctx.fill();
        
        // Border
        ctx.strokeStyle = agent.color;
        ctx.lineWidth = agent.status === 'active' ? 3 : 2;
        ctx.stroke();

        // Status indicator
        if (agent.status === 'active') {
          ctx.beginPath();
          ctx.arc(agent.x, agent.y, 25, 0, Math.PI * 2);
          ctx.strokeStyle = agent.color;
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Icon
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(agent.icon, agent.x, agent.y);

        // Name
        ctx.font = '10px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(agent.name.substring(0, 15), agent.x, agent.y + 35);
      });

      // Draw particles
      const updatedParticles = particles.map(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fill();
        ctx.globalAlpha = 1;

        return {
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          life: p.life - 0.02,
          size: p.size * 0.98,
        };
      }).filter(p => p.life > 0);

      ctx.restore();

      setAgents(updatedAgents);
      setMessages(updatedMessages);
      setParticles(updatedParticles);

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, zoom, pan]);

  // Generate random messages
  useEffect(() => {
    if (!isPlaying || agents.length === 0) return;

    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const from = Math.floor(Math.random() * agents.length);
        const to = Math.floor(Math.random() * agents.length);
        
        if (from !== to) {
          const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];
          setMessages(prev => [...prev, {
            from,
            to,
            progress: 0,
            content: 'Collaborating...',
            color: colors[Math.floor(Math.random() * colors.length)],
          }]);

          setStats(prev => ({ ...prev, messagesPerSecond: prev.messagesPerSecond + 1 }));
        }
      }

      // Random task completion
      if (Math.random() > 0.9) {
        const agent = agents[Math.floor(Math.random() * agents.length)];
        const newParticles: Particle[] = [];
        
        for (let i = 0; i < 20; i++) {
          const angle = (i / 20) * Math.PI * 2;
          newParticles.push({
            x: agent.x,
            y: agent.y,
            vx: Math.cos(angle) * 2,
            vy: Math.sin(angle) * 2,
            life: 1,
            color: agent.color,
            size: 3,
          });
        }
        
        setParticles(prev => [...prev, ...newParticles]);
        setStats(prev => ({ ...prev, tasksCompleted: prev.tasksCompleted + 1 }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, agents]);

  // Update active agents count
  useEffect(() => {
    const active = agents.filter(a => a.status === 'active').length;
    setStats(prev => ({ ...prev, activeAgents: active }));
  }, [agents]);

  // Handle canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    const clicked = agents.find(agent => {
      const dx = agent.x - x;
      const dy = agent.y - y;
      return Math.sqrt(dx * dx + dy * dy) < 20;
    });

    setSelectedAgent(clicked || null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <img src={APP_LOGO} alt="AYMENOS" className="h-12 w-12 rounded-full" />
              <div>
                <h1 className="text-2xl font-bold text-white">AYMENOS</h1>
                <p className="text-sm text-purple-300">Swarm Visualization</p>
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
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-black/40 border-purple-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Agents</p>
                  <p className="text-3xl font-bold text-white">{stats.totalAgents}</p>
                </div>
                <Users className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-cyan-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Active Agents</p>
                  <p className="text-3xl font-bold text-white">{stats.activeAgents}</p>
                </div>
                <Activity className="h-8 w-8 text-cyan-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-pink-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Messages/sec</p>
                  <p className="text-3xl font-bold text-white">{stats.messagesPerSecond}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-pink-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-green-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Tasks Completed</p>
                  <p className="text-3xl font-bold text-white">{stats.tasksCompleted}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Canvas */}
          <div className="lg:col-span-3">
            <Card className="bg-black/40 border-purple-500/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Live Swarm Activity</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="bg-white/5 border-white/10"
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setZoom(1);
                        setPan({ x: 0, y: 0 });
                      }}
                      className="bg-white/5 border-white/10"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <canvas
                  ref={canvasRef}
                  width={1200}
                  height={700}
                  onClick={handleCanvasClick}
                  className="w-full h-auto bg-slate-950 rounded-lg cursor-pointer"
                />
                <div className="mt-4 flex items-center justify-center gap-4">
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/50">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                    Idle
                  </Badge>
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/50">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                    Active
                  </Badge>
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/50">
                    <Zap className="w-3 h-3 mr-2" />
                    Communication
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Agent Details */}
          <div>
            <Card className="bg-black/40 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-white">
                  {selectedAgent ? 'Agent Details' : 'Select an Agent'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedAgent ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                        style={{ backgroundColor: `${selectedAgent.color}40` }}
                      >
                        {selectedAgent.icon}
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{selectedAgent.name}</h3>
                        <Badge variant="secondary">{selectedAgent.type}</Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status</span>
                        <Badge className={
                          selectedAgent.status === 'active' ? 'bg-green-500/20 text-green-300' :
                          selectedAgent.status === 'busy' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-blue-500/20 text-blue-300'
                        }>
                          {selectedAgent.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Position</span>
                        <span className="text-white text-sm">
                          ({Math.round(selectedAgent.x)}, {Math.round(selectedAgent.y)})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Velocity</span>
                        <span className="text-white text-sm">
                          {Math.sqrt(selectedAgent.vx ** 2 + selectedAgent.vy ** 2).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Chat with Agent
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">
                      Click on any agent in the visualization to see details
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
