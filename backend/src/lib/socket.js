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
    }

);

//suthentication middleware
io.use(socketAuthMiddleware);

export function getReceiverSocketId(userId){
    return userSocketMap[userId];
}

const userSocketMap ={};

io.on("connection", (socket)=>{
    console.log ("A user connected", socket.user.fullname);
    const userId = socket.userId;
    userSocketMap[userId]= socket.id; 
      //to send event to all connected clien
    io.emit("getOnlineUsers",Object.keys(userSocketMap));

    socket.on("disconnect", ()=>{
        console.log("A user disconnected",socket.user.fullname);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers",Object.keys(userSocketMap));
    });
});

export {io, app, server};

