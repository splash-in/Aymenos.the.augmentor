import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { getDb } from "./db";
import { challengeRooms, roomParticipants, challengeChat, collaborativeSolutions, teamProgress } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

interface RoomParticipant {
  id: number;
  userId?: number;
  agentId?: number;
  displayName: string;
  avatarColor: string;
  isOnline: boolean;
  role: string;
}

interface ChatMessage {
  id: number;
  participantId: number;
  displayName: string;
  avatarColor: string;
  content: string;
  messageType: string;
  createdAt: Date;
}

interface CollaborationUpdate {
  type: "cursor" | "edit" | "selection";
  participantId: number;
  data: any;
}

export function initializeCollaborationServer(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    path: "/api/collaboration",
  });

  console.log("[Collaboration] WebSocket server initialized at /api/collaboration");

  io.on("connection", (socket: Socket) => {
    console.log(`[Collaboration] Client connected: ${socket.id}`);

    // Join a challenge room
    socket.on("join_room", async (data: { roomCode: string; participantId: number }) => {
      try {
        const { roomCode, participantId } = data;
        const db = await getDb();
        if (!db) {
          socket.emit("error", { message: "Database not available" });
          return;
        }

        // Get room details
        const room = await db
          .select()
          .from(challengeRooms)
          .where(eq(challengeRooms.roomCode, roomCode))
          .limit(1);

        if (room.length === 0) {
          socket.emit("error", { message: "Room not found" });
          return;
        }

        const roomId = room[0].id;
        socket.join(`room_${roomCode}`);

        // Update participant online status
        await db
          .update(roomParticipants)
          .set({ isOnline: 1 })
          .where(eq(roomParticipants.id, participantId));

        // Get all participants
        const participants = await db
          .select()
          .from(roomParticipants)
          .where(eq(roomParticipants.roomId, roomId));

        // Get current solution
        const solutions = await db
          .select()
          .from(collaborativeSolutions)
          .where(eq(collaborativeSolutions.roomId, roomId))
          .limit(1);

        // Get chat history
        const chatHistory = await db
          .select()
          .from(challengeChat)
          .where(eq(challengeChat.roomId, roomId))
          .orderBy(challengeChat.createdAt);

        // Get progress
        const progress = await db
          .select()
          .from(teamProgress)
          .where(eq(teamProgress.roomId, roomId));

        socket.emit("room_joined", {
          roomId,
          roomCode,
          participants,
          solution: solutions[0] || null,
          chatHistory,
          progress,
        });

        // Notify others
        socket.to(`room_${roomCode}`).emit("participant_joined", {
          participantId,
          participants,
        });

        console.log(`[Collaboration] Participant ${participantId} joined room ${roomCode}`);
      } catch (error) {
        console.error("[Collaboration] Error joining room:", error);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    // Leave room
    socket.on("leave_room", async (data: { roomCode: string; participantId: number }) => {
      try {
        const { roomCode, participantId } = data;
        const db = await getDb();
        if (!db) return;

        socket.leave(`room_${roomCode}`);

        // Update participant online status
        await db
          .update(roomParticipants)
          .set({ isOnline: 0 })
          .where(eq(roomParticipants.id, participantId));

        // Notify others
        socket.to(`room_${roomCode}`).emit("participant_left", { participantId });

        console.log(`[Collaboration] Participant ${participantId} left room ${roomCode}`);
      } catch (error) {
        console.error("[Collaboration] Error leaving room:", error);
      }
    });

    // Send chat message
    socket.on("send_message", async (data: {
      roomCode: string;
      participantId: number;
      content: string;
      messageType?: string;
    }) => {
      try {
        const { roomCode, participantId, content, messageType = "text" } = data;
        const db = await getDb();
        if (!db) {
          socket.emit("error", { message: "Database not available" });
          return;
        }

        // Get room
        const room = await db
          .select()
          .from(challengeRooms)
          .where(eq(challengeRooms.roomCode, roomCode))
          .limit(1);

        if (room.length === 0) return;

        // Save message
        const result = await db.insert(challengeChat).values({
          roomId: room[0].id,
          participantId,
          content,
          messageType,
          isFiltered: 0,
        });

        // Get participant info
        const participant = await db
          .select()
          .from(roomParticipants)
          .where(eq(roomParticipants.id, participantId))
          .limit(1);

        const message = {
          id: Number((result as any).insertId),
          participantId,
          displayName: participant[0]?.displayName || "Unknown",
          avatarColor: participant[0]?.avatarColor || "#888",
          content,
          messageType,
          createdAt: new Date(),
        };

        // Broadcast to room
        io.to(`room_${roomCode}`).emit("new_message", message);

        console.log(`[Collaboration] Message sent in room ${roomCode}`);
      } catch (error) {
        console.error("[Collaboration] Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Update solution (collaborative editing)
    socket.on("update_solution", async (data: {
      roomCode: string;
      participantId: number;
      content: string;
      solutionType: string;
    }) => {
      try {
        const { roomCode, participantId, content, solutionType } = data;
        const db = await getDb();
        if (!db) return;

        // Get room
        const room = await db
          .select()
          .from(challengeRooms)
          .where(eq(challengeRooms.roomCode, roomCode))
          .limit(1);

        if (room.length === 0) return;

        // Check if solution exists
        const existingSolution = await db
          .select()
          .from(collaborativeSolutions)
          .where(eq(collaborativeSolutions.roomId, room[0].id))
          .limit(1);

        if (existingSolution.length > 0) {
          // Update existing solution
          await db
            .update(collaborativeSolutions)
            .set({
              content,
              lastEditedBy: participantId,
              version: existingSolution[0].version + 1,
            })
            .where(eq(collaborativeSolutions.id, existingSolution[0].id));
        } else {
          // Create new solution
          await db.insert(collaborativeSolutions).values({
            roomId: room[0].id,
            solutionType,
            content,
            lastEditedBy: participantId,
            version: 1,
            isComplete: 0,
          });
        }

        // Broadcast update to room (except sender)
        socket.to(`room_${roomCode}`).emit("solution_updated", {
          participantId,
          content,
          solutionType,
        });

        console.log(`[Collaboration] Solution updated in room ${roomCode}`);
      } catch (error) {
        console.error("[Collaboration] Error updating solution:", error);
      }
    });

    // Update progress
    socket.on("update_progress", async (data: {
      roomCode: string;
      participantId: number;
      milestone: string;
      progressPercent: number;
    }) => {
      try {
        const { roomCode, participantId, milestone, progressPercent } = data;
        const db = await getDb();
        if (!db) return;

        // Get room
        const room = await db
          .select()
          .from(challengeRooms)
          .where(eq(challengeRooms.roomCode, roomCode))
          .limit(1);

        if (room.length === 0) return;

        // Save progress
        await db.insert(teamProgress).values({
          roomId: room[0].id,
          milestone,
          progressPercent,
          completedBy: participantId,
          pointsEarned: Math.floor(progressPercent / 10) * 10,
        });

        // Broadcast to room
        io.to(`room_${roomCode}`).emit("progress_updated", {
          milestone,
          progressPercent,
          participantId,
        });

        console.log(`[Collaboration] Progress updated in room ${roomCode}: ${milestone}`);
      } catch (error) {
        console.error("[Collaboration] Error updating progress:", error);
      }
    });

    // Typing indicator
    socket.on("typing", (data: { roomCode: string; participantId: number; isTyping: boolean }) => {
      const { roomCode, participantId, isTyping } = data;
      socket.to(`room_${roomCode}`).emit("participant_typing", { participantId, isTyping });
    });

    // Cursor position (for collaborative editing)
    socket.on("cursor_move", (data: { roomCode: string; participantId: number; position: any }) => {
      const { roomCode, participantId, position } = data;
      socket.to(`room_${roomCode}`).emit("cursor_moved", { participantId, position });
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log(`[Collaboration] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}
