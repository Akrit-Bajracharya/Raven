import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js ";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";
import {
  createGroup,
  getUserGroups,
  getGroupMessages,
  sendGroupMessage,
} from "../controllers/group.controller.js";

const router = express.Router();

router.use(arcjetProtection, protectRoute);

router.post("/", createGroup);
router.get("/", getUserGroups);
router.get("/:groupId/messages", getGroupMessages);
router.post("/:groupId/messages", sendGroupMessage);

export default router;