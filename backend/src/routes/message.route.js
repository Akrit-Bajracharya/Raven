// backend/src/routes/message.route.js

import express from "express";

import { protectRoute }        from "../middleware/auth.middleware.js";
import { arcjetProtection }    from "../middleware/arcjet.middleware.js";
import { profanityMiddleware }  from "../middleware/profanity.middleware.js";
import { toxicityMiddleware }   from "../middleware/toxicity.middleware.js";
import {
  getAllContacts,
  getChatPartners,
  getMessagesByUserId,
  sendMessage,
} from "../controllers/message.controller.js";

const router = express.Router();

router.use(arcjetProtection, protectRoute);

router.get("/contacts", getAllContacts);
router.get("/chats",    getChatPartners);
router.get("/:id",      getMessagesByUserId);

// ── NEW: plain-text toxicity check BEFORE encryption ─────────────────────
// Frontend calls this with raw text first.
// If clean  → frontend encrypts and sends to /send/:id
// If toxic  → strike recorded, message blocked, frontend shows warning/ban
// Body: { text: "your message here" }
// ─────────────────────────────────────────────────────────────────────────
router.post(
  "/check-toxicity",
  profanityMiddleware,
  toxicityMiddleware,
  (_req, res) => res.status(200).json({ ok: true })
);

// layer 1: profanityMiddleware — catches explicit bad words
// layer 2: toxicityMiddleware  — catches toxic intent via ML model
router.post("/send/:id", profanityMiddleware, toxicityMiddleware, sendMessage);

export default router;