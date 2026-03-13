import { Server} from "socket.io";
import http from "http";
import express from "express";
import { ENV } from "./env.js"
import { socketAuthMiddleware } from "../middleware/socket.auth.middleware.js";

const app = express()
const server = http.createServer(app)

const io = new Server(server,{
    cors: {
       origin: [ENV.CLIENT_URL],
       credentials: true,
    },
});

io.use(socketAuthMiddleware);

export function getReceiverSocketId(userId){
    return userSocketMap[userId];
}

const userSocketMap = {};

io.on("connection", (socket) => {
    console.log("A user connected", socket.user.fullname);
    const userId = socket.userId;
    userSocketMap[userId] = socket.id;
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("joinGroups", (groupIds) => {
        groupIds.forEach((id) => socket.join(id));
    });

    // ─────────────────────────────────────────
    // CALL SIGNALING
    // ─────────────────────────────────────────

    // 1. Caller initiates a call
    socket.on("call:initiate", ({ targetId, offer, callType, callerInfo, isGroup, groupId, groupName }) => {
        if (isGroup) {
            socket.to(groupId).emit("call:incoming", {
                offer, callType, callerInfo, isGroup: true, groupId, groupName, callerId: userId,
            });
        } else {
            const targetSocketId = userSocketMap[targetId];
            if (targetSocketId) {
                io.to(targetSocketId).emit("call:incoming", {
                    offer, callType, callerInfo, isGroup: false, callerId: userId,
                });
            }
        }
    });

    // 2. Receiver accepts the call
    socket.on("call:accepted", ({ callerId, answer }) => {
        const callerSocketId = userSocketMap[callerId];
        if (callerSocketId) {
            io.to(callerSocketId).emit("call:accepted", { answer });
        }
    });

    // 3. Receiver rejects the call
    socket.on("call:rejected", ({ callerId }) => {
        const callerSocketId = userSocketMap[callerId];
        if (callerSocketId) {
            io.to(callerSocketId).emit("call:rejected");
        }
    });

    // 4. Either side ends the call
    socket.on("call:ended", ({ targetId, isGroup, groupId }) => {
        if (isGroup) {
            socket.to(groupId).emit("call:ended");
        } else {
            const targetSocketId = userSocketMap[targetId];
            if (targetSocketId) {
                io.to(targetSocketId).emit("call:ended");
            }
        }
    });

    // 5. ICE candidate exchange
    socket.on("call:ice-candidate", ({ targetId, candidate }) => {
        const targetSocketId = userSocketMap[targetId];
        if (targetSocketId) {
            io.to(targetSocketId).emit("call:ice-candidate", { candidate });
        }
    });

    // 6. Camera toggle — lets other side show avatar placeholder
    socket.on("call:camera-toggle", ({ targetId, isCameraOff, isGroup, groupId }) => {
        if (isGroup) {
            socket.to(groupId).emit("call:camera-toggle", { isCameraOff, fromUserId: userId });
        } else {
            const targetSocketId = userSocketMap[targetId];
            if (targetSocketId) {
                io.to(targetSocketId).emit("call:camera-toggle", { isCameraOff });
            }
        }
    });

    // ─────────────────────────────────────────

    socket.on("disconnect", () => {
        console.log("A user disconnected", socket.user.fullname);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});

export { io, app, server };