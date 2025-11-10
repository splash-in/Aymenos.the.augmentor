import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Sparkles, ArrowRight, Users, Zap, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { toast } from "sonner";

export default function BuildPass() {
  const { user, loading, isAuthenticated } = useAuth();
  const [step, setStep] = useState<"idea" | "tasks" | "building" | "complete">("idea");
  const [chainId, setChainId] = useState<number | null>(null);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectType, setProjectType] = useState("app");
  const [initialIdea, setInitialIdea] = useState("");
  
  // Task state
  const [yourTasks, setYourTasks] = useState<any[]>([]);
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [workOutput, setWorkOutput] = useState("");
  const [timeSpent, setTimeSpent] = useState(0);

  // Mutations
  const startChain = trpc.buildPass.startChain.useMutation({
    onSuccess: (data) => {
      setChainId(data.chainId);
      setYourTasks(data.yourTasks);
      setAllTasks(data.initialTasks);
      setStep("tasks");
      toast.success("Project created! Here are tasks matched to your skills.");
    },
    onError: () => {
      toast.error("Failed to start project. Please try again.");
    },
  });

  const submitContribution = trpc.buildPass.submitContribution.useMutation({
    onSuccess: (data) => {
      if (data.shouldHandoff) {
        toast.success(data.nextSteps);
        setStep("complete");
      } else {
        toast.success("Great work! Continue to the next task.");
        setCurrentTaskIndex(prev => prev + 1);
        setWorkOutput("");
        setTimeSpent(0);
      }
    },
  });

  const chainHistory = trpc.buildPass.getChainHistory.useQuery(
    { chainId: chainId! },
    { enabled: !!chainId && step === "complete" }
  );

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
            <CardDescription>Please log in to use Build & Pass</CardDescription>
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

  const projectTypes = [
    { value: "app", label: "Mobile/Web App", icon: "📱" },
    { value: "website", label: "Website", icon: "🌐" },
    { value: "design", label: "Design Project", icon: "🎨" },
    { value: "research", label: "Research", icon: "🔬" },
    { value: "content", label: "Content Creation", icon: "✍️" },
    { value: "other", label: "Other", icon: "✨" },
  ];

  const handleStartProject = () => {
    if (!title || !description || !initialIdea) {
      toast.error("Please fill in all fields");
      return;
    }

    startChain.mutate({
      title,
      description,
      projectType,
      initialIdea,
    });
  };

  const handleSubmitWork = () => {
    if (!chainId || !workOutput) {
      toast.error("Please describe what you've done");
      return;
    }

    const currentTask = yourTasks[currentTaskIndex];
    submitContribution.mutate({
      chainId,
      workDescription: currentTask.description,
      workOutput,
      timeSpent: timeSpent || 15,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={APP_LOGO} alt="AYMENOS" className="h-12 w-12 rounded-full" />
            <div>
              <h1 className="text-2xl font-bold text-white">{APP_TITLE}</h1>
              <p className="text-sm text-purple-300">Build & Pass - Anyone Can Build Anything</p>
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
        {/* Hero Section */}
        {step === "idea" && (
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30">
                <Sparkles className="h-4 w-4 text-purple-300" />
                <span className="text-purple-200 text-sm font-medium">Revolutionary Build & Pass System</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white">
                Start Building <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Anything</span>
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                No skills required. Just describe what you want to build. We'll break it down, you do what you CAN, 
                and we pass the rest to experts and AI agents. <span className="text-purple-300 font-semibold">Completely token-free.</span>
              </p>
            </div>

            {/* How It Works */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-black/40 border-purple-500/30">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="h-6 w-6 text-purple-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">1. Share Your Idea</h3>
                  <p className="text-gray-400 text-sm">Describe what you want in plain language</p>
                </CardContent>
              </Card>

              <Card className="bg-black/40 border-cyan-500/30">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-3">
                    <Users className="h-6 w-6 text-cyan-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">2. Do What You Can</h3>
                  <p className="text-gray-400 text-sm">Contribute at your skill level, no pressure</p>
                </CardContent>
              </Card>

              <Card className="bg-black/40 border-pink-500/30">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center mx-auto mb-3">
                    <Zap className="h-6 w-6 text-pink-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">3. AI Completes It</h3>
                  <p className="text-gray-400 text-sm">Swarms handle what you can't, token-free</p>
                </CardContent>
              </Card>
            </div>

            {/* Project Creation Form */}
            <Card className="bg-black/40 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white">Start Your Project</CardTitle>
                <CardDescription className="text-gray-400">
                  Tell us what you want to build - we'll handle the rest
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">Project Title</label>
                  <Input
                    placeholder="e.g., Personal Finance Tracker"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="text-white text-sm font-medium mb-2 block">Project Type</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {projectTypes.map((type) => (
                      <Button
                        key={type.value}
                        variant={projectType === type.value ? "default" : "outline"}
                        className={projectType === type.value ? "bg-purple-600" : "bg-white/5 border-white/10 text-white hover:bg-white/10"}
                        onClick={() => setProjectType(type.value)}
                      >
                        <span className="mr-2">{type.icon}</span>
                        {type.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-white text-sm font-medium mb-2 block">Short Description</label>
                  <Input
                    placeholder="One sentence about your project"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="text-white text-sm font-medium mb-2 block">Your Idea (The More Detail, The Better)</label>
                  <Textarea
                    placeholder="Describe your vision... What should it do? Who is it for? What problems does it solve? Don't worry about technical details - just explain your idea!"
                    value={initialIdea}
                    onChange={(e) => setInitialIdea(e.target.value)}
                    className="bg-white/5 border-white/10 text-white min-h-32"
                  />
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  onClick={handleStartProject}
                  disabled={startChain.isPending}
                >
                  {startChain.isPending ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing Your Idea...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Start Building
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tasks View */}
        {step === "tasks" && yourTasks.length > 0 && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-white">Your Contribution Tasks</h2>
              <p className="text-gray-300">
                We've matched these tasks to your skill level. Do what you can - we'll pass the rest!
              </p>
              <div className="flex items-center justify-center gap-4">
                <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                  Task {currentTaskIndex + 1} of {yourTasks.length}
                </Badge>
                <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-300">
                  {allTasks.length - yourTasks.length} tasks for others/AI
                </Badge>
              </div>
            </div>

            {currentTaskIndex < yourTasks.length ? (
              <Card className="bg-black/40 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-purple-400" />
                    {yourTasks[currentTaskIndex].title}
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    {yourTasks[currentTaskIndex].description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm">
                    <Badge variant="outline" className="border-purple-500/30 text-purple-300">
                      Skill Level: {yourTasks[currentTaskIndex].skillLevel}/100
                    </Badge>
                    <Badge variant="outline" className="border-cyan-500/30 text-cyan-300">
                      ~{yourTasks[currentTaskIndex].estimatedMinutes} minutes
                    </Badge>
                  </div>

                  <div>
                    <label className="text-white text-sm font-medium mb-2 block">What Did You Do?</label>
                    <Textarea
                      placeholder="Describe your work, share links, explain your approach... anything you've accomplished for this task!"
                      value={workOutput}
                      onChange={(e) => setWorkOutput(e.target.value)}
                      className="bg-white/5 border-white/10 text-white min-h-32"
                    />
                  </div>

                  <div>
                    <label className="text-white text-sm font-medium mb-2 block">Time Spent (minutes)</label>
                    <Input
                      type="number"
                      placeholder="15"
                      value={timeSpent || ""}
                      onChange={(e) => setTimeSpent(parseInt(e.target.value) || 0)}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    onClick={handleSubmitWork}
                    disabled={submitContribution.isPending}
                  >
                    {submitContribution.isPending ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing Your Work...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Submit & Continue
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-black/40 border-green-500/30">
                <CardContent className="pt-6 text-center">
                  <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">All Your Tasks Complete!</h3>
                  <p className="text-gray-300">
                    Amazing work! The rest will be handled by our expert community and AI swarms.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Completion View */}
        {step === "complete" && chainHistory.data && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-4xl font-bold text-white">Your Contribution is Complete!</h2>
              <p className="text-xl text-gray-300">
                You've done your part. The chain continues with more skilled contributors and AI agents.
              </p>
            </div>

            <Card className="bg-black/40 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white">Collaboration Chain</CardTitle>
                <CardDescription className="text-gray-400">
                  See how your work fits into the bigger picture
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {chainHistory.data.links.map((link: any, index: number) => (
                  <div key={link.id} className="flex items-start gap-4 p-4 rounded-lg bg-white/5">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      {link.contributorType === "user" ? (
                        <Users className="h-5 w-5 text-purple-400" />
                      ) : (
                        <Zap className="h-5 w-5 text-cyan-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium">
                          {link.contributorType === "user" ? `Contributor ${link.contributorId}` : `AI Agent ${link.contributorId}`}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {link.completionPercentage}% of project
                        </Badge>
                      </div>
                      <p className="text-gray-400 text-sm">{link.workDescription}</p>
                      {link.status === "completed" && (
                        <Badge variant="outline" className="mt-2 border-green-500/30 text-green-300">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                onClick={() => {
                  setStep("idea");
                  setChainId(null);
                  setTitle("");
                  setDescription("");
                  setInitialIdea("");
                  setWorkOutput("");
                  setCurrentTaskIndex(0);
                }}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Start Another Project
              </Button>
              <Button variant="outline" asChild>
                <a href="/dashboard">View All Projects</a>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
