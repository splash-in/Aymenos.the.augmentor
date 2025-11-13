import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Sparkles, Rocket, Star, Trophy, Book, Gamepad2, Users, Target, Zap } from "lucide-react";
import { Link, useLocation } from "wouter";

/**
 * Kids Mode - Gamified learning environment for children (age 12+)
 * Features: Safe environment, educational content, progress tracking, achievements
 */
export default function KidsMode() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  
  // TODO: Fetch user profile with kids mode status
  // const { data: profile } = trpc.userProfile.get.useQuery();
  
  // TODO: Fetch learning paths
  // const { data: learningPaths } = trpc.learning.paths.useQuery();
  
  // TODO: Fetch daily challenges
  // const { data: dailyChallenge } = trpc.challenges.today.useQuery();
  
  // TODO: Fetch user achievements
  // const { data: achievements } = trpc.achievements.list.useQuery();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-yellow-300" />
            <h1 className="text-2xl font-bold text-white">AYMENOS Kids</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
              <Star className="w-5 h-5 text-yellow-300" />
              <span className="text-white font-bold">Level 1</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
              <Trophy className="w-5 h-5 text-yellow-300" />
              <span className="text-white font-bold">0 XP</span>
            </div>
            <Link href="/">
              <Button variant="outline" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                Exit Kids Mode
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-white mb-4">
            Welcome to Your Learning Adventure! 🚀
          </h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Learn, play, and build amazing things with AI friends. Every task you complete makes you smarter and earns you rewards!
          </p>
        </div>

        {/* Daily Challenge */}
        <Card className="bg-gradient-to-r from-yellow-400 to-orange-400 border-none p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-6 h-6 text-white" />
                <h3 className="text-2xl font-bold text-white">Daily Challenge</h3>
              </div>
              <p className="text-white/90 text-lg mb-4">
                Build a simple calculator with AI help!
              </p>
              <div className="flex items-center gap-4">
                <Button className="bg-white text-orange-500 hover:bg-white/90 font-bold">
                  Start Challenge
                </Button>
                <span className="text-white font-bold">+50 XP</span>
              </div>
            </div>
            <Rocket className="w-32 h-32 text-white/30" />
          </div>
        </Card>

        {/* Learning Paths Grid */}
        <h3 className="text-3xl font-bold text-white mb-6">Choose Your Learning Path</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { title: "Coding Adventures", icon: "💻", color: "from-blue-400 to-blue-600", description: "Learn to code by building games and apps" },
            { title: "Math Magic", icon: "🔢", color: "from-green-400 to-green-600", description: "Make math fun with puzzles and challenges" },
            { title: "Science Explorer", icon: "🔬", color: "from-purple-400 to-purple-600", description: "Discover how the world works" },
            { title: "Art & Design", icon: "🎨", color: "from-pink-400 to-pink-600", description: "Create beautiful digital art" },
            { title: "Music Maker", icon: "🎵", color: "from-indigo-400 to-indigo-600", description: "Compose your own music" },
            { title: "Story Writing", icon: "📖", color: "from-yellow-400 to-yellow-600", description: "Write amazing stories with AI" },
            { title: "Game Design", icon: "🎮", color: "from-red-400 to-red-600", description: "Design your own video games" },
            { title: "Robotics", icon: "🤖", color: "from-cyan-400 to-cyan-600", description: "Build and program robots" },
          ].map((path, index) => (
            <Card key={index} className={`bg-gradient-to-br ${path.color} border-none p-6 cursor-pointer hover:scale-105 transition-transform`}>
              <div className="text-6xl mb-4">{path.icon}</div>
              <h4 className="text-xl font-bold text-white mb-2">{path.title}</h4>
              <p className="text-white/90 text-sm mb-4">{path.description}</p>
              <Button className="w-full bg-white/20 text-white hover:bg-white/30 border-none">
                Start Learning
              </Button>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <h3 className="text-3xl font-bold text-white mb-6">What Do You Want to Do?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 p-8 hover:bg-white/20 transition-colors cursor-pointer">
            <Gamepad2 className="w-16 h-16 text-yellow-300 mb-4" />
            <h4 className="text-2xl font-bold text-white mb-2">Play & Learn</h4>
            <p className="text-white/90">Fun games that teach you new skills</p>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-md border-white/20 p-8 hover:bg-white/20 transition-colors cursor-pointer">
            <Book className="w-16 h-16 text-blue-300 mb-4" />
            <h4 className="text-2xl font-bold text-white mb-2">Learn Something New</h4>
            <p className="text-white/90">Interactive lessons with AI tutors</p>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-md border-white/20 p-8 hover:bg-white/20 transition-colors cursor-pointer">
            <Rocket className="w-16 h-16 text-pink-300 mb-4" />
            <h4 className="text-2xl font-bold text-white mb-2">Build a Project</h4>
            <p className="text-white/90">Create something amazing with AI help</p>
          </Card>
        </div>

        {/* Multiplayer Challenges */}
        <div className="grid grid-cols-1 gap-6 mb-12">
          <Card 
            onClick={() => setLocation("/multiplayer")}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 border-none p-8 hover:scale-[1.02] transition-transform cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Users className="w-10 h-10 text-white" />
                  <h3 className="text-3xl font-bold text-white">Team Up & Solve Challenges!</h3>
                </div>
                <p className="text-white/90 text-lg mb-4">
                  Join friends or AI teammates to solve coding, math, science, and logic puzzles together in real-time!
                </p>
                <div className="flex items-center gap-4">
                  <Button className="bg-white text-blue-600 hover:bg-white/90 font-bold">
                    <Zap className="h-5 w-5 mr-2" />
                    Start Team Challenge
                  </Button>
                  <span className="text-white font-bold">🎮 10+ Multiplayer Challenges Available</span>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="text-8xl">🤝</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Achievements Preview */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-3xl font-bold text-white">Your Achievements</h3>
            <Button variant="outline" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
              View All
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { icon: "🌟", name: "First Step", unlocked: true },
              { icon: "🎯", name: "Quick Learner", unlocked: false },
              { icon: "🚀", name: "Builder", unlocked: false },
              { icon: "🏆", name: "Champion", unlocked: false },
              { icon: "💡", name: "Creative Genius", unlocked: false },
              { icon: "🤝", name: "Team Player", unlocked: false },
            ].map((achievement, index) => (
              <div 
                key={index} 
                className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-2 ${
                  achievement.unlocked 
                    ? 'bg-gradient-to-br from-yellow-400 to-orange-400' 
                    : 'bg-white/10 opacity-50'
                }`}
              >
                <span className="text-4xl">{achievement.icon}</span>
                <span className="text-white text-sm font-bold text-center px-2">{achievement.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Safety Notice */}
        <div className="mt-12 bg-green-500/20 backdrop-blur-md border border-green-300/30 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <Users className="w-12 h-12 text-green-300" />
            <div>
              <h4 className="text-xl font-bold text-white mb-2">Safe Learning Environment</h4>
              <p className="text-white/90">
                All content is kid-friendly and moderated. Your parents can see your progress and help you learn!
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
