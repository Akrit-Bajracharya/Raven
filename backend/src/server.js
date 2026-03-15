// backend/src/server.js
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes     from "./routes/auth.route.js";
import messageRoutes  from "./routes/message.route.js";
import matchingRoutes from "./routes/matching.route.js";
import { connectDB }  from "./lib/db.js";
import { ENV }        from "./lib/env.js";
import { app, server } from "./lib/socket.js";
import friendRoutes   from "./routes/friendRequest.route.js";
import groupRoutes    from "./routes/group.route.js";
import filterRoutes   from "./routes/filter.route.js"; // 👈 added
import suggestRoute from "./routes/suggest.route.js";

const PORT = ENV.PORT || 3000;

app.use(cors({ origin: ENV.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());

app.use("/api/auth",     authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/matching", matchingRoutes);
app.use("/api/friends",  friendRoutes);
app.use("/api/groups",   groupRoutes);
app.use("/api/filter",   filterRoutes); // 👈 added
app.use("/api/suggest", suggestRoute);

server.listen(PORT, () => {
  console.log("server running on port:" + PORT);
  connectDB();
});