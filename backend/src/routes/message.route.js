// backend/src/routes/message.route.js
import express from "express";

import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";
import { profanityMiddleware } from "../middleware/profanity.middleware.js"; // 👈 added
import {
  getAllContacts,
  getChatPartners,
  getMessagesByUserId,
  sendMessage,
} from "../controllers/message.controller.js";

const router = express.Router();

router.use(arcjetProtection, protectRoute);

router.get("/contacts", getAllContacts);
router.get("/chats", getChatPartners);
router.get("/:id", getMessagesByUserId);

// 👇 profanityMiddleware sits between protectRoute and sendMessage
// Encrypted messages (ciphertext) are automatically skipped by the middleware
router.post("/send/:id", protectRoute, profanityMiddleware, sendMessage);

export default router;