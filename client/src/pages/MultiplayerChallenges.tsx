import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Users, Clock, Trophy, Zap, Search, Play } from "lucide-react";
import { toast } from "sonner";

export default function MultiplayerChallenges() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");

  const { data: challenges = [], isLoading } = trpc.multiplayer.getChallenges.useQuery();
  const createRoomMutation = trpc.multiplayer.createRoom.useMutation({
    onSuccess: (data) => {
      toast.success("Challenge room created!");
      setLocation(`/multiplayer/room/${data.roomCode}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create room");
    },
  });

  const challengeTypes = [
    { value: "all", label: "All Challenges", icon: "🎯" },
    { value: "coding", label: "Coding", icon: "💻" },
    { value: "math", label: "Math", icon: "🔢" },
    { value: "science", label: "Science", icon: "🔬" },
    { value: "art", label: "Art", icon: "🎨" },
    { value: "story", label: "Story", icon: "📖" },
    { value: "logic", label: "Logic", icon: "🧩" },
  ];

  const filteredChallenges = challenges.filter((challenge) => {
    const matchesSearch = challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      challenge.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "all" || challenge.challengeType === selectedType;
    return matchesSearch && matchesType;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "hard": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "expert": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const handleCreateRoom = (challengeId: number) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    createRoomMutation.mutate({ challengeId, maxParticipants: 4 });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading challenges...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                🎮 Multiplayer Challenges
              </h1>
              <p className="text-purple-200">
                Team up with friends or AI agents to solve problems together!
              </p>
            </div>
            <Button
              onClick={() => setLocation("/")}
              variant="outline"
              className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
            >
              ← Back Home
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-400" />
            <Input
              placeholder="Search challenges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-purple-500/30 text-white placeholder:text-purple-300/50"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {challengeTypes.map((type) => (
              <Button
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                variant={selectedType === type.value ? "default" : "outline"}
                className={
                  selectedType === type.value
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                }
              >
                <span className="mr-2">{type.icon}</span>
                {type.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Challenges Grid */}
        {filteredChallenges.length === 0 ? (
          <Card className="bg-white/5 border-purple-500/30">
            <CardContent className="py-12 text-center">
              <p className="text-purple-200 text-lg">No challenges found. Try a different search or filter.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChallenges.map((challenge) => (
              <Card
                key={challenge.id}
                className="bg-white/5 border-purple-500/30 hover:bg-white/10 transition-all hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20"
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge className={getDifficultyColor(challenge.difficulty)}>
                      {challenge.difficulty}
                    </Badge>
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                      {challenge.challengeType}
                    </Badge>
                  </div>
                  <CardTitle className="text-white text-xl">{challenge.title}</CardTitle>
                  <CardDescription className="text-purple-200">
                    {challenge.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-purple-300">
                      <Users className="h-4 w-4" />
                      <span>{challenge.minTeamSize}-{challenge.maxTeamSize} players</span>
                    </div>
                    <div className="flex items-center gap-2 text-purple-300">
                      <Clock className="h-4 w-4" />
                      <span>~{challenge.estimatedMinutes} min</span>
                    </div>
                    <div className="flex items-center gap-2 text-purple-300">
                      <Trophy className="h-4 w-4" />
                      <span>{challenge.pointsReward} XP</span>
                    </div>
                    <div className="flex items-center gap-2 text-purple-300">
                      <Zap className="h-4 w-4" />
                      <span>{challenge.ageGroup}</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleCreateRoom(challenge.id)}
                    disabled={createRoomMutation.isPending}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {createRoomMutation.isPending ? "Creating..." : "Start Challenge"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Join Room Section */}
        <Card className="mt-8 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-white">Join Existing Room</CardTitle>
            <CardDescription className="text-purple-200">
              Have a room code? Enter it below to join your friends!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter room code (e.g., ABC123)"
                className="bg-white/5 border-purple-500/30 text-white placeholder:text-purple-300/50"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const roomCode = (e.target as HTMLInputElement).value.trim().toUpperCase();
                    if (roomCode) {
                      setLocation(`/multiplayer/room/${roomCode}`);
                    }
                  }
                }}
              />
              <Button
                onClick={() => {
                  const input = document.querySelector('input[placeholder*="room code"]') as HTMLInputElement;
                  const roomCode = input?.value.trim().toUpperCase();
                  if (roomCode) {
                    setLocation(`/multiplayer/room/${roomCode}`);
                  } else {
                    toast.error("Please enter a room code");
                  }
                }}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Join Room
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
