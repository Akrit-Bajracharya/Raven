import express from "express";
import { getInterests, onboard, getMatchedUsers } from "../controllers/matching.contoller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/interests", getInterests);
router.post("/onboard", protectRoute, onboard);
router.get("/matches", protectRoute, getMatchedUsers);

export default router;