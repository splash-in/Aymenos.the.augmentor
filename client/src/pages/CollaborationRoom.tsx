import { useEffect, useState, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { io, Socket } from "socket.io-client";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Users,
  Send,
  Code,
  Trophy,
  Clock,
  Lightbulb,
  CheckCircle2,
  ArrowLeft,
  Smile,
} from "lucide-react";
import { toast } from "sonner";

interface ChatMessage {
  id: number;
  participantId: number;
  displayName: string;
  avatarColor: string;
  content: string;
  messageType: string;
  createdAt: Date;
}

interface Participant {
  id: number;
  displayName: string;
  avatarColor: string;
  isOnline: boolean;
  role: string;
  contributionScore: number;
}

export default function CollaborationRoom() {
  const [match, params] = useRoute("/multiplayer/room/:roomCode");
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const roomCode = params?.roomCode?.toUpperCase();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [participantId, setParticipantId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [solution, setSolution] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [progress, setProgress] = useState(0);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const { data: roomData, isLoading } = trpc.multiplayer.getRoom.useQuery(
    { roomCode: roomCode || "" },
    { enabled: !!roomCode }
  );

  const joinRoomMutation = trpc.multiplayer.joinRoom.useMutation({
    onSuccess: (data) => {
      setParticipantId(data.participantId);
      toast.success("Joined room successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to join room");
      setLocation("/multiplayer");
    },
  });

  // Initialize WebSocket connection
  useEffect(() => {
    if (!roomCode || !participantId) return;

    const newSocket = io({
      path: "/api/collaboration",
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      console.log("Connected to collaboration server");
      newSocket.emit("join_room", { roomCode, participantId });
    });

    newSocket.on("room_joined", (data) => {
      setParticipants(data.participants);
      setSolution(data.solution?.content || "");
      setMessages(data.chatHistory || []);
      setProgress(data.progress?.[0]?.progressPercent || 0);
    });

    newSocket.on("participant_joined", (data) => {
      setParticipants(data.participants);
      toast.info("A new participant joined!");
    });

    newSocket.on("participant_left", (data) => {
      setParticipants((prev) => prev.filter((p) => p.id !== data.participantId));
      toast.info("A participant left");
    });

    newSocket.on("new_message", (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
    });

    newSocket.on("solution_updated", (data) => {
      setSolution(data.content);
    });

    newSocket.on("progress_updated", (data) => {
      setProgress(data.progressPercent);
      toast.success(`Milestone reached: ${data.milestone}`);
    });

    newSocket.on("participant_typing", (data) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (data.isTyping) {
          next.add(data.participantId);
        } else {
          next.delete(data.participantId);
        }
        return next;
      });
    });

    newSocket.on("error", (error) => {
      toast.error(error.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit("leave_room", { roomCode, participantId });
      newSocket.disconnect();
    };
  }, [roomCode, participantId]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Join room on mount
  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }

    if (roomCode && !participantId && !joinRoomMutation.isPending) {
      joinRoomMutation.mutate({ roomCode });
    }
  }, [roomCode, isAuthenticated, participantId, joinRoomMutation.isPending]);

  const sendMessage = () => {
    if (!messageInput.trim() || !socket || !participantId) return;

    socket.emit("send_message", {
      roomCode,
      participantId,
      content: messageInput,
      messageType: "text",
    });

    setMessageInput("");
    socket.emit("typing", { roomCode, participantId, isTyping: false });
  };

  const updateSolution = (newContent: string) => {
    setSolution(newContent);
    if (socket && participantId) {
      socket.emit("update_solution", {
        roomCode,
        participantId,
        content: newContent,
        solutionType: "code",
      });
    }
  };

  const handleTyping = () => {
    if (!socket || !participantId) return;

    socket.emit("typing", { roomCode, participantId, isTyping: true });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing", { roomCode, participantId, isTyping: false });
    }, 2000);
  };

  if (!match || !roomCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Invalid room code</div>
      </div>
    );
  }

  if (isLoading || !roomData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading room...</div>
      </div>
    );
  }

  const { room, challenge } = roomData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setLocation("/multiplayer")}
                variant="ghost"
                size="sm"
                className="text-purple-300 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Leave Room
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">{challenge?.title}</h1>
                <p className="text-sm text-purple-300">Room Code: <span className="font-mono bg-purple-500/20 px-2 py-1 rounded">{roomCode}</span></p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                <Users className="h-3 w-3 mr-1" />
                {participants.filter(p => p.isOnline).length}/{room.maxParticipants}
              </Badge>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <Trophy className="h-3 w-3 mr-1" />
                {challenge?.pointsReward} XP
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Workspace */}
          <div className="lg:col-span-2 space-y-6">
            {/* Challenge Description */}
            <Card className="bg-white/5 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-400" />
                  Challenge
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-purple-200 mb-4">{challenge?.problemStatement}</p>
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-purple-300 mt-2">{progress}% Complete</p>
              </CardContent>
            </Card>

            {/* Collaborative Solution Workspace */}
            <Card className="bg-white/5 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Code className="h-5 w-5 text-blue-400" />
                  Team Solution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={solution}
                  onChange={(e) => updateSolution(e.target.value)}
                  placeholder="Start working on your solution here... Your team can see changes in real-time!"
                  className="min-h-[300px] bg-black/30 border-purple-500/30 text-white font-mono text-sm"
                />
                <div className="mt-4 flex justify-between items-center">
                  <p className="text-sm text-purple-300">
                    {typingUsers.size > 0 && `${typingUsers.size} teammate(s) typing...`}
                  </p>
                  <Button
                    onClick={() => {
                      if (progress >= 100) {
                        toast.success("Challenge completed! 🎉");
                      } else {
                        toast.info("Keep working on your solution!");
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Submit Solution
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Team Members */}
            <Card className="bg-white/5 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white text-lg">Team Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-white/5"
                    >
                      <Avatar>
                        <AvatarFallback style={{ backgroundColor: participant.avatarColor }}>
                          {participant.displayName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-white font-medium">{participant.displayName}</p>
                        <p className="text-xs text-purple-300">
                          {participant.role} • {participant.contributionScore} pts
                        </p>
                      </div>
                      {participant.isOnline && (
                        <div className="h-2 w-2 bg-green-400 rounded-full" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Team Chat */}
            <Card className="bg-white/5 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white text-lg">Team Chat</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-3">
                    {messages.map((message) => (
                      <div key={message.id} className="flex gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback style={{ backgroundColor: message.avatarColor }}>
                            {message.displayName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">{message.displayName}</p>
                          <p className="text-sm text-purple-200">{message.content}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                <div className="mt-4 flex gap-2">
                  <Input
                    value={messageInput}
                    onChange={(e) => {
                      setMessageInput(e.target.value);
                      handleTyping();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    className="bg-white/5 border-purple-500/30 text-white"
                  />
                  <Button onClick={sendMessage} size="icon" className="bg-purple-600 hover:bg-purple-700">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
