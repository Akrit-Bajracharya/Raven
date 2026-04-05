// backend/src/middleware/toxicity.middleware.js

import path from "path";
import { fileURLToPath } from "url";
import { classifier } from "../lib/naiveBayes.js";
import { io, getReceiverSocketId } from "../lib/socket.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const MODEL_PATH = path.join(__dirname, "../data/trainedModel.json");

classifier.load(MODEL_PATH);

// ── Strike store (in-memory) ──────────────────────────────────────────────────
// { userId: { strikes: number, bannedUntil: Date | null } }
// Resets on server restart. Good enough for now — persist to MongoDB later
// by adding strikes + bannedUntil fields to your User model if needed.
// ─────────────────────────────────────────────────────────────────────────────
const strikeMap = new Map();

const MAX_STRIKES  = 3;
const BAN_DURATION = 60 * 60 * 1000; // 1 hour in ms

function getRecord(userId) {
  if (!strikeMap.has(userId)) {
    strikeMap.set(userId, { strikes: 0, bannedUntil: null });
  }
  return strikeMap.get(userId);
}

function minsLeft(bannedUntil) {
  const ms = bannedUntil - Date.now();
  const m  = Math.ceil(ms / 60000);
  return m <= 1 ? "less than a minute" : `${m} minutes`;
}

// ── Middleware ────────────────────────────────────────────────────────────────
export function toxicityMiddleware(req, res, next) {
  const text   = req.body?.text || req.body?.message || req.body?.content;
  const userId = req.user?._id?.toString();

  // skip if no text or no authenticated user
  if (!text || !userId) return next();

  const record = getRecord(userId);

  // ── 1. Check active ban ───────────────────────────────────────────────────
  if (record.bannedUntil && Date.now() < record.bannedUntil) {
    const timeLeft       = minsLeft(record.bannedUntil);
    const senderSocketId = getReceiverSocketId(userId);

    if (senderSocketId) {
      io.to(senderSocketId).emit("moderation:banned", {
        message:     `You are muted for ${timeLeft}. Sending messages is disabled.`,
        bannedUntil: record.bannedUntil,
        timeLeft,
      });
    }

    return res.status(403).json({
      error:       "banned",
      message:     `You are muted for ${timeLeft}.`,
      bannedUntil: record.bannedUntil,
      timeLeft,
    });
  }

  // lift expired ban
  if (record.bannedUntil && Date.now() >= record.bannedUntil) {
    record.strikes     = 0;
    record.bannedUntil = null;
    console.log(`[Moderation] Ban expired for user ${userId}`);
  }

  // ── 2. Run the classifier ─────────────────────────────────────────────────
  const result = classifier.predict(text);
  console.log(`[Moderation] "${text}" → ${result.label} (${result.confidence})`);

  if (!result.isToxic) return next(); // clean — allow through

  // ── 3. Toxic: increment strike ────────────────────────────────────────────
  record.strikes += 1;
  console.log(`[Moderation] Strike ${record.strikes}/${MAX_STRIKES} for user ${userId}`);

  const senderSocketId = getReceiverSocketId(userId);

  // ── 4. Strike 3 → ban for 1 hour ─────────────────────────────────────────
  if (record.strikes >= MAX_STRIKES) {
    record.bannedUntil = new Date(Date.now() + BAN_DURATION);
    record.strikes     = 0; // reset so next session starts fresh after ban

    console.log(`[Moderation] User ${userId} banned until ${record.bannedUntil}`);

    if (senderSocketId) {
      io.to(senderSocketId).emit("moderation:banned", {
        message:     "You have been muted for 1 hour due to repeated violations.",
        bannedUntil: record.bannedUntil,
        timeLeft:    "60 minutes",
      });
    }

    return res.status(403).json({
      error:       "banned",
      message:     "You have been muted for 1 hour due to repeated violations.",
      bannedUntil: record.bannedUntil,
      timeLeft:    "60 minutes",
    });
  }

  // ── 5. Strike 1 or 2 → warn ───────────────────────────────────────────────
  const strikesLeft = MAX_STRIKES - record.strikes;
  const warnMsg     = `⚠️ Warning ${record.strikes}/${MAX_STRIKES}: Inappropriate language detected. ${strikesLeft} warning${strikesLeft > 1 ? "s" : ""} left before a 1-hour mute.`;

  if (senderSocketId) {
    io.to(senderSocketId).emit("moderation:warning", {
      message:     warnMsg,
      strikes:     record.strikes,
      strikesLeft,
      confidence:  result.confidence,
    });
  }

  return res.status(400).json({
    error:       "toxic",
    message:     warnMsg,
    strikes:     record.strikes,
    strikesLeft,
    confidence:  result.confidence,
  });
}