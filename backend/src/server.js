import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors"

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { connectDB } from "./lib/db.js";
import { ENV } from "./lib/env.js";
import { app, server } from "./lib/socket.js";



const PORT = ENV.PORT || 3000;

app.use(cors({origin: ENV.CLIENT_URL, credentials: true}));

// ADD THE LIMIT HERE - This fixes the "Payload Too Large" error
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

server.listen(PORT, () => {
    console.log("server running on port:" + PORT);
    connectDB();
});